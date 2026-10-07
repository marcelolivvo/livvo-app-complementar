import React, { useMemo, useState } from 'react';
import { AtSign, MessageCircle, X } from 'lucide-react';
import type { Show } from './data/catalog';
import { PESSOAS_EXEMPLO, type PessoaExemplo } from './data/demo';
import { buddiesExemplo, pessoaAceitaMarcacao, pessoaPorUsuario, type Buddy } from './data/social';
import { normalizar } from './format';
import { Link } from './router';
import { livvo, useLivvo, type Marcacao, type Memoria } from './store';
import { Avatar, Linha, TagExemplo, avisar } from './ui';

/**
 * Concert Buddies (decisões de 07/10/2026): no "Foi com alguém?" a pessoa marca o @ de quem foi com ela.
 * A marcação vira um convite; o show só entra na história do amigo se ele aceitar. Cada pessoa escolhe
 * quem pode marcá-la (todos, só quem ela segue, ninguém). O WhatsApp continua para quem não tem conta.
 */

const ROTULO_STATUS: Record<Marcacao['status'], string> = {
  pendente: 'Aguardando aceite',
  aceita: 'Aceitou',
  recusada: 'Recusou',
};

const plural = (n: number) => (n === 1 ? '1 show juntos' : `${n} shows juntos`);

export const MarcarBuddies: React.FC<{
  show: Show;
  memoria: Memoria;
  pessoasDoShow: PessoaExemplo[];
  juntos: Map<string, number>;
  textoWhats: string;
}> = ({ show, memoria, pessoasDoShow, juntos, textoWhats }) => {
  const lv = useLivvo();
  const [termo, setTermo] = useState('');
  const [focado, setFocado] = useState(false);
  const marcados = memoria.buddies || [];
  const deExemplo = lv.exemplos ? buddiesExemplo(show).filter((u) => !marcados.some((m) => m.usuario === u)) : [];
  const ja = new Set([...marcados.map((m) => m.usuario), ...deExemplo, lv.perfil.usuario]);

  const sugestoes = useMemo(() => {
    if (!lv.exemplos) return [];
    const doShow = new Set(pessoasDoShow.map((p) => p.usuario));
    const sigo = new Set(lv.seguindo);
    const t = normalizar(termo.replace(/^@/, ''));
    return PESSOAS_EXEMPLO.filter((p) => !ja.has(p.usuario))
      .filter((p) => !t || normalizar(p.nome).includes(t) || normalizar(p.usuario).includes(t))
      .map((p) => ({ p, doShow: doShow.has(p.usuario), sigo: sigo.has(p.usuario) }))
      .sort((a, b) => Number(b.doShow) - Number(a.doShow) || Number(b.sigo) - Number(a.sigo) || a.p.nome.localeCompare(b.p.nome, 'pt-BR'))
      .slice(0, 6);
  }, [lv.exemplos, lv.seguindo, pessoasDoShow, termo, ja]);

  const marcar = (p: PessoaExemplo) => {
    if (!pessoaAceitaMarcacao(p.usuario)) return avisar(`@${p.usuario} não aceita marcações`);
    livvo.marcarBuddy(memoria.id, p.usuario, () => avisar(`${p.nome.split(' ')[0]} aceitou: o show entrou na história dela`));
    avisar(`Convite enviado para @${p.usuario}`);
    setTermo('');
    setFocado(false);
  };

  return (
    <div>
      <p className="lv-sub mt-3">
        Marque o @ de quem foi com você. A pessoa recebe um convite e o show só entra na história dela se ela aceitar.
      </p>

      {(marcados.length > 0 || deExemplo.length > 0) && (
        <div className="mt-2">
          {deExemplo.map((u) => {
            const p = pessoaPorUsuario(u);
            return (
              <Linha
                key={u}
                avatar
                inicio={<Avatar nome={p.nome} tamanho={36} />}
                titulo={p.nome}
                sub={`@${u} · ${plural(juntos.get(u) || 1)}`}
                fim={
                  <>
                    <span className="lv-tag lv-tag--teal">Aceitou</span>
                    <TagExemplo />
                  </>
                }
              />
            );
          })}
          {marcados.map((m) => {
            const p = pessoaPorUsuario(m.usuario);
            const n = juntos.get(m.usuario);
            return (
              <Linha
                key={m.usuario}
                avatar
                inicio={<Avatar nome={p.nome} tamanho={36} />}
                titulo={p.nome}
                sub={`@${m.usuario}${m.status === 'aceita' && n ? ` · ${plural(n)}` : ''}`}
                fim={
                  <>
                    <span className={`lv-tag ${m.status === 'aceita' ? 'lv-tag--teal' : 'lv-tag--next'}`}>{ROTULO_STATUS[m.status]}</span>
                    <button
                      type="button"
                      className="lv-iconbtn !w-8 !h-8"
                      aria-label={`Desmarcar @${m.usuario}`}
                      onClick={() => {
                        livvo.desmarcarBuddy(memoria.id, m.usuario);
                        avisar(`@${m.usuario} desmarcado`);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <div className="relative mt-4">
        <label className="lv-campo">
          <span className="lv-label">Marcar quem foi com você</span>
          <span className="lv-busca">
            <AtSign />
            <input
              className="lv-input"
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => window.setTimeout(() => setFocado(false), 150)}
              placeholder="nome ou usuário"
              autoComplete="off"
            />
          </span>
        </label>
        {focado && (
          <div className="lv-sugestoes" role="listbox" aria-label="Pessoas para marcar">
            {!lv.exemplos ? (
              <p className="lv-meta p-3">Na prévia, as pessoas para marcar são de exemplo. Ligue a “Comunidade de exemplo” no menu da conta.</p>
            ) : sugestoes.length === 0 ? (
              <p className="lv-meta p-3">Ninguém com esse nome no Livvo. Chame pelo WhatsApp.</p>
            ) : (
              sugestoes.map(({ p, doShow, sigo }) => {
                const aceita = pessoaAceitaMarcacao(p.usuario);
                return (
                  <button
                    key={p.usuario}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="lv-sugestao"
                    data-off={!aceita || undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => marcar(p)}
                  >
                    <Avatar nome={p.nome} tamanho={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-[13.5px] truncate">{p.nome}</span>
                      <span className="block lv-meta truncate">
                        @{p.usuario}
                        {!aceita ? ' · não aceita marcações' : doShow ? ' · foi a este show' : sigo ? ' · você segue' : ''}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a className="lv-ghost" href={`https://wa.me/?text=${encodeURIComponent(textoWhats)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="w-4 h-4" /> Chamar no WhatsApp
        </a>
        <span className="lv-meta">Para quem ainda não está no Livvo.</span>
      </div>
      {lv.exemplos && <p className="lv-meta mt-3">Prévia: as pessoas são de exemplo e aceitam o convite sozinhas em alguns segundos.</p>}
    </div>
  );
};

/** Lista "Mais shows juntos" (Minha História e Comunidade). */
export const ListaBuddies: React.FC<{ buddies: Buddy[]; limite?: number; vazio?: React.ReactNode }> = ({ buddies, limite, vazio }) => {
  const lista = limite ? buddies.slice(0, limite) : buddies;
  if (!lista.length) return <>{vazio}</>;
  return (
    <div>
      {lista.map((b) => {
        const ultimo = b.shows.slice().sort((x, y) => y.ts - x.ts)[0]!;
        return (
          <Linha
            key={b.pessoa.usuario}
            avatar
            to={`/show/${ultimo.id}`}
            inicio={<Avatar nome={b.pessoa.nome} tamanho={38} />}
            titulo={b.pessoa.nome}
            sub={`@${b.pessoa.usuario} · último: ${ultimo.artista}`}
            nota={plural(b.shows.length)}
            fim={b.exemplo ? <TagExemplo /> : undefined}
          />
        );
      })}
      {limite && buddies.length > limite && (
        <Link to="/comunidade?aba=buddies" className="lv-link mt-3">
          Ver todos os Concert Buddies
        </Link>
      )}
    </div>
  );
};
