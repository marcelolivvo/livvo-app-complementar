import React, { useMemo, useState } from 'react';
import { ArrowRight, AtSign, MessageCircle, Star, X } from 'lucide-react';
import { Modal } from './AtualizarFoto';
import type { Show } from './data/catalog';
import { PESSOAS_EXEMPLO, type PessoaExemplo } from './data/demo';
import { buddiesExemplo, pessoaAceitaMarcacao, pessoaPorUsuario, type Buddy } from './data/social';
import { dataCartao, nota as fmtNota, normalizar } from './format';
import { Link, navigate } from './router';
import { livvo, personalizacaoDe, useLivvo, type Marcacao, type Memoria } from './store';
import { Avatar, Bilhete, Discos, IngressoContorno, Linha, Poster, TagExemplo, avisar } from './ui';

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
const pluralComum = (n: number) => (n === 1 ? '1 show em comum' : `${n} shows em comum`);

export const MarcarBuddies: React.FC<{
  show: Show;
  memoria: Memoria;
  pessoasDoShow: PessoaExemplo[];
  juntos: Map<string, Buddy>;
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
                sub={`@${u}`}
                nota={<BotaoJuntos buddy={juntos.get(u)} />}
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
            const b = juntos.get(m.usuario);
            return (
              <Linha
                key={m.usuario}
                avatar
                inicio={<Avatar nome={p.nome} tamanho={36} />}
                titulo={p.nome}
                sub={`@${m.usuario}`}
                nota={m.status === 'aceita' && b ? <BotaoJuntos buddy={b} /> : undefined}
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

/**
 * Janela "Shows juntos" (revisão 6): ao tocar em "N shows juntos", abre a lista com os ingressos virtuais de todos os
 * shows que vocês viram juntos. O que ainda não tem a sua nota aparece com "Falta a sua nota" e o botão Avaliar.
 */
export const JanelaShowsJuntos: React.FC<{ buddy: Buddy; fechar: () => void; modo?: 'juntos' | 'comum' }> = ({ buddy, fechar, modo = 'juntos' }) => {
  const lv = useLivvo();
  // Os que ainda não têm a sua nota vêm primeiro, para o convite a avaliar aparecer logo no alto
  const semNotaDe = (id: string) => lv.memoriaDoShow(id)?.notaShow === undefined;
  const shows = buddy.shows.slice().sort((a, b) => Number(semNotaDe(b.id)) - Number(semNotaDe(a.id)) || b.ts - a.ts);
  const faltam = shows.filter((s) => semNotaDe(s.id)).length;
  const ir = (rota: string) => {
    fechar();
    navigate(rota);
  };
  return (
    <Modal rotulo={`Shows com ${buddy.pessoa.nome}`} fechar={fechar}>
      <Bilhete
        esquerda={
          <>
            Livvo · <b>Concert Buddies</b>
          </>
        }
        direita={
          <button type="button" className="lv-iconbtn !w-8 !h-8 -my-2 -mr-2" aria-label="Fechar" onClick={fechar}>
            <X className="w-4 h-4" />
          </button>
        }
      >
        <div className="lv-pad">
          <div className="flex items-center gap-3">
            <Avatar nome={buddy.pessoa.nome} tamanho={46} />
            <div className="min-w-0 flex-1">
              <h2 className="lv-display text-[24px] leading-tight">Você e {buddy.pessoa.nome.split(' ')[0]}</h2>
              <p className="lv-meta">
                @{buddy.pessoa.usuario} · {modo === 'comum' ? pluralComum(shows.length) : plural(shows.length)}
              </p>
            </div>
            {buddy.exemplo && <TagExemplo />}
          </div>

          {faltam > 0 ? (
            <div className="lv-aviso-nota mt-5">
              <Star className="w-5 h-5 shrink-0" />
              <p>
                <b>{faltam === 1 ? 'Falta a sua nota em 1 show.' : `Falta a sua nota em ${faltam} shows.`}</b> Avalie e deixe a história de vocês completa: leva um toque em cada um.
              </p>
            </div>
          ) : (
            <p className="lv-meta mt-4">Todos os shows de vocês já têm a sua nota.</p>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {shows.map((show) => {
              const m = lv.memoriaDoShow(show.id);
              const d = dataCartao(show.ts);
              const semNota = m?.notaShow === undefined;
              return (
                <IngressoContorno
                  key={show.id}
                  ativo={semNota}
                  rotulo={`${show.artista}, ${show.casa}`}
                  canhoto={
                    <button type="button" tabIndex={-1} aria-hidden="true" className="block w-full" onClick={() => ir(`/show/${show.id}`)}>
                      <Poster
                        show={show}
                        usuario={lv.perfil.usuario}
                        perso={m ? personalizacaoDe(m) : undefined}
                        detalhes={m ? { setor: m.setor } : undefined}
                      />
                    </button>
                  }
                >
                  <button type="button" className="block text-left group w-full" onClick={() => ir(`/show/${show.id}`)}>
                    <h3 className="lv-display text-[20px] leading-tight lv-clamp-2 group-hover:text-white">{show.artista}</h3>
                    <p className="mt-1.5 text-[13px] font-bold text-[#ECE5D1]">
                      {d.dia} {d.mes.toLowerCase()} {d.ano}
                    </p>
                    <p className="lv-meta truncate">
                      {show.casa} · {show.cidade}
                    </p>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    {semNota ? (
                      <>
                        <span className="lv-tag lv-tag--next">Falta a sua nota</span>
                        <button type="button" className="lv-btn lv-btn--cyan !py-2 !px-3 !text-[12.5px]" onClick={() => ir(`/show/${show.id}?avaliar=show`)}>
                          Avaliar <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Discos valor={m!.notaShow} tamanho={15} rotulo="Nota do show" />
                        <span className="lv-nota-num text-[15px]">{fmtNota(m!.notaShow!)}</span>
                        {m!.notaOrganizacao === undefined && (
                          <button type="button" className="lv-link !text-[12.5px]" onClick={() => ir(`/show/${show.id}?avaliar=org`)}>
                            Falta a organização
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </IngressoContorno>
              );
            })}
          </div>
        </div>
      </Bilhete>
    </Modal>
  );
};

/** "N shows juntos" clicável: abre a janela com os ingressos de vocês. */
export const BotaoJuntos: React.FC<{ buddy?: Buddy; className?: string; modo?: 'juntos' | 'comum'; children?: React.ReactNode }> = ({
  buddy,
  className = '',
  modo = 'juntos',
  children,
}) => {
  const [aberta, setAberta] = useState(false);
  if (!buddy) return <span className={className}>{children || plural(1)}</span>;
  return (
    <>
      <button
        type="button"
        className={className || 'lv-juntos'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAberta(true);
        }}
      >
        {children || (modo === 'comum' ? pluralComum(buddy.shows.length) : plural(buddy.shows.length))}
      </button>
      {aberta && <JanelaShowsJuntos buddy={buddy} modo={modo} fechar={() => setAberta(false)} />}
    </>
  );
};

/** Lista "Mais shows juntos" (Comunidade): cada linha abre a janela com os shows de vocês. */
export const ListaBuddies: React.FC<{ buddies: Buddy[]; limite?: number; vazio?: React.ReactNode }> = ({ buddies, limite, vazio }) => {
  const [aberto, setAberto] = useState<Buddy | null>(null);
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
            onClick={() => setAberto(b)}
            inicio={<Avatar nome={b.pessoa.nome} tamanho={38} />}
            titulo={b.pessoa.nome}
            sub={`@${b.pessoa.usuario} · último: ${ultimo.artista}`}
            nota={<span className="lv-juntos">{plural(b.shows.length)}</span>}
            fim={b.exemplo ? <TagExemplo /> : undefined}
            rotulo={`${b.pessoa.nome}: ${plural(b.shows.length)}. Ver os ingressos`}
          />
        );
      })}
      {limite && buddies.length > limite && (
        <Link to="/comunidade?aba=buddies" className="lv-link mt-3">
          Ver todos os Concert Buddies
        </Link>
      )}
      {aberto && <JanelaShowsJuntos buddy={aberto} fechar={() => setAberto(null)} />}
    </div>
  );
};

/** Concert Buddies em caixas lado a lado (Minha História): foto, nome e shows juntos; os 5 com mais shows. */
export const CaixasBuddies: React.FC<{ buddies: Buddy[]; limite?: number }> = ({ buddies, limite = 5 }) => {
  const [aberto, setAberto] = useState<Buddy | null>(null);
  return (
    <>
      <div className="lv-buddies-caixas">
        {buddies.slice(0, limite).map((b) => (
          <button
            key={b.pessoa.usuario}
            type="button"
            className="lv-buddy-caixa"
            onClick={() => setAberto(b)}
            aria-label={`${b.pessoa.nome}: ${plural(b.shows.length)}. Ver os ingressos`}
          >
            <Avatar nome={b.pessoa.nome} tamanho={56} />
            <span className="lv-buddy-nome">{b.pessoa.nome}</span>
            <span className="lv-buddy-n">
              <b>{b.shows.length}</b> {b.shows.length === 1 ? 'show junto' : 'shows juntos'}
            </span>
          </button>
        ))}
      </div>
      {aberto && <JanelaShowsJuntos buddy={aberto} fechar={() => setAberto(null)} />}
    </>
  );
};
