import React, { useMemo } from 'react';
import { ArrowRight, Check, UserCheck, UserPlus, X } from 'lucide-react';
import { useCatalogo } from '../data/catalog';
import { PESSOAS_EXEMPLO } from '../data/demo';
import { concertBuddies, pessoaPorUsuario, showsEmComum } from '../data/social';
import { haQuanto, useAtividade } from '../Novidades';
import { dataCurta, plural } from '../format';
import { Link, setQuery, useRoute } from '../router';
import { calcularPassaporte } from '../stats';
import { livvo, useLivvo, type QuemPodeMarcar } from '../store';
import { BotaoJuntos, CaixasBuddies } from '../ConcertBuddies';
import { Bilhete, CaixaFoto, Discos, FotoArtista, FotoPessoa, Grupo, Linha, Stub, TagExemplo, avisar } from '../ui';

/**
 * Comunidade (adiantada da parte 4 em 07/10/2026): Seguindo, Concert Buddies, Convites "Fomos juntos",
 * Shows em comum e Pessoas. Pessoas e atividade são de exemplo (marcadas) e somem quando a
 * "Comunidade de exemplo" é desligada no menu da conta, mostrando os estados vazios reais.
 * Sem ranking geral: a lista de Concert Buddies é pessoal.
 */

type Aba = 'seguindo' | 'buddies' | 'convites' | 'comum' | 'pessoas';
const ABAS: Array<{ id: Aba; rotulo: string }> = [
  { id: 'seguindo', rotulo: 'Seguindo' },
  { id: 'buddies', rotulo: 'Concert Buddies' },
  { id: 'convites', rotulo: 'Convites' },
  { id: 'comum', rotulo: 'Shows em comum' },
  { id: 'pessoas', rotulo: 'Pessoas' },
];

const BotaoSeguir: React.FC<{ usuario: string }> = ({ usuario }) => {
  const { seguindo } = useLivvo();
  const sigo = seguindo.includes(usuario);
  return (
    <button type="button" className="lv-ghost !py-1.5 !px-2.5" aria-pressed={sigo} onClick={() => livvo.alternarSeguir(usuario)}>
      {sigo ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {sigo ? 'Seguindo' : 'Seguir'}
    </button>
  );
};

const Vazio: React.FC<{ titulo: string; texto: string; children?: React.ReactNode }> = ({ titulo, texto, children }) => (
  <div className="lv-empty mt-5">
    <p className="lv-h2">{titulo}</p>
    <p className="lv-sub">{texto}</p>
    {children}
  </div>
);

const OPCOES_MARCACAO: Array<{ id: QuemPodeMarcar; rotulo: string }> = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'seguindo', rotulo: 'Quem eu sigo' },
  { id: 'ninguem', rotulo: 'Ninguém' },
];

export const Comunidade: React.FC = () => {
  const { query } = useRoute();
  const { catalogo } = useCatalogo();
  const lv = useLivvo();
  const abaUrl = query.get('aba') as Aba | null;
  const aba: Aba = ABAS.some((a) => a.id === abaUrl) ? abaUrl! : 'seguindo';

  const pass = useMemo(() => calcularPassaporte(lv.memorias, catalogo), [lv.memorias, catalogo]);
  const buddies = useMemo(() => concertBuddies(pass.memoriasComShow, lv.exemplos), [pass, lv.exemplos]);
  const emComum = useMemo(() => showsEmComum(pass.memoriasComShow, lv.exemplos), [pass, lv.exemplos]);
  // Mesma atividade do sino e do Início (revisão 11)
  const atividade = useAtividade(9);
  const pendentes = lv.convites.filter((c) => c.status === 'pendente');
  const respondidos = lv.convites.filter((c) => c.status !== 'pendente');

  const contagem: Record<Aba, number | undefined> = {
    seguindo: lv.seguindo.length,
    buddies: buddies.length,
    convites: pendentes.length,
    comum: emComum.length,
    pessoas: undefined,
  };

  if (!lv.logado) {
    return (
      <div className="lv-empty max-w-xl mx-auto">
        <h1 className="lv-h2">A comunidade nasce do show.</h1>
        <p className="lv-sub">Entre para ver quem foi aos mesmos shows que você, seguir pessoas e marcar seus Concert Buddies.</p>
        <Stub icone={UserPlus} onClick={() => livvo.entrar()}>
          Entrar no Livvo
        </Stub>
      </div>
    );
  }

  return (
    <div>
      <Bilhete
        rotulo="Comunidade"
        esquerda={
          <>
            Livvo · <b>Comunidade</b>
          </>
        }
        direita={
          <>
            Seguindo <b>{lv.seguindo.length}</b>
          </>
        }
      >
        <div className="lv-pad">
          <h1 className="lv-h1">Quem viveu os mesmos shows que você</h1>
          <p className="lv-sub mt-2 max-w-2xl">
            Siga quem foi aos seus shows, marque seus Concert Buddies e guarde com eles a mesma memória. Sem ranking geral: aqui o que conta é a sua história.
          </p>
          {lv.exemplos ? (
            <p className="lv-meta mt-2 flex flex-wrap items-center gap-2">
              Pessoas, atividade e convites de exemplo <TagExemplo />
            </p>
          ) : (
            <p className="lv-meta mt-2">Comunidade de exemplo desligada: você está vendo os estados vazios reais.</p>
          )}
          <div className="lv-tabs mt-6" role="tablist" aria-label="Comunidade">
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={aba === a.id}
                data-on={aba === a.id}
                onClick={() => setQuery({ aba: a.id === 'seguindo' ? null : a.id })}
              >
                {a.rotulo}
                {contagem[a.id] !== undefined && contagem[a.id]! > 0 && <span className="lv-mono">{contagem[a.id]}</span>}
              </button>
            ))}
          </div>
        </div>
      </Bilhete>

      {/* Seguindo e Convites em lista; Concert Buddies, Shows em comum e Pessoas em caixas na largura da página (revisão 7) */}
      <div className={aba === 'seguindo' || aba === 'convites' ? 'max-w-[880px]' : ''}>
        {aba === 'seguindo' &&
          (!lv.exemplos ? (
            <Vazio titulo="Ainda não há atividade." texto="Quando as pessoas que você segue registrarem shows, eles aparecem aqui.">
              <Link to="/comunidade?aba=comum" className="lv-link">
                Ver quem foi aos seus shows <ArrowRight className="w-4 h-4" />
              </Link>
            </Vazio>
          ) : lv.seguindo.length === 0 ? (
            <Vazio titulo="Você ainda não segue ninguém." texto="Comece por quem foi aos mesmos shows que você.">
              <Link to="/comunidade?aba=comum" className="lv-link">
                Ver shows em comum <ArrowRight className="w-4 h-4" />
              </Link>
            </Vazio>
          ) : (
            <section>
              <Grupo titulo="O que quem você segue está vivendo" extra={<TagExemplo />} />
              {atividade.map(({ pessoa, show, notaShow, em }) => (
                <Linha
                  key={`${pessoa.usuario}-${show.id}`}
                  to={`/show/${show.id}`}
                  foto
                  inicio={<FotoArtista nome={show.artista} artistaId={show.artistaId} />}
                  titulo={
                    <>
                      {pessoa.nome} <span className="font-semibold text-[#B3AE9F]">registrou</span> {show.artista}
                    </>
                  }
                  sub={`${show.casa} · ${show.cidade} · ${haQuanto(em)}`}
                  nota={<Discos valor={notaShow} tamanho={13} rotulo="Nota do show" />}
                />
              ))}
            </section>
          ))}

        {aba === 'buddies' && (
          <section>
            <Grupo titulo="Mais shows juntos" extra={lv.exemplos && buddies.some((b) => b.exemplo) ? <TagExemplo /> : undefined} />
            {buddies.length ? (
              <CaixasBuddies buddies={buddies} limite={0} quebra />
            ) : (
              <Vazio
                titulo="Nenhum Concert Buddy ainda."
                texto="Na página de um show que você foi, use “Foi com alguém?” para marcar o @ de quem estava com você."
              >
                <Link to="/minha-historia" className="lv-link">
                  Escolher um show da sua história <ArrowRight className="w-4 h-4" />
                </Link>
              </Vazio>
            )}
          </section>
        )}

        {aba === 'convites' && (
          <section>
            <Grupo titulo="Quem pode marcar você" />
            <div className="py-4 flex flex-wrap items-center gap-4 border-b border-dashed border-[#282141]">
              <div className="lv-seg" role="radiogroup" aria-label="Quem pode marcar você">
                {OPCOES_MARCACAO.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={lv.quemPodeMarcar === o.id}
                    data-on={lv.quemPodeMarcar === o.id}
                    onClick={() => {
                      livvo.definirQuemPodeMarcar(o.id);
                      avisar(`Marcações: ${o.rotulo.toLowerCase()}`);
                    }}
                  >
                    {o.rotulo}
                  </button>
                ))}
              </div>
              <p className="lv-meta flex-1 min-w-[220px]">Mesmo marcado, o show só entra na sua história se você aceitar.</p>
            </div>

            <Grupo titulo="Fomos juntos · convites" extra={pendentes.some((c) => c.exemplo) ? <TagExemplo /> : undefined} />
            {!catalogo ? (
              <div className="lv-skel mt-4" style={{ height: 120 }} />
            ) : pendentes.length === 0 ? (
              <p className="lv-sub py-4">Nenhum convite agora. Quando alguém marcar você num show, ele aparece aqui.</p>
            ) : (
              pendentes.map((c) => {
                const show = catalogo.porId.get(c.showId);
                const p = pessoaPorUsuario(c.de);
                if (!show) return null;
                const jaFui = Boolean(lv.memoriaDoShow(show.id));
                // Shows em comum com quem convidou (revisão 6): juntos (Concert Buddies) + mesmos shows registrados
                const juntosCom = buddies.find((b) => b.pessoa.usuario === c.de)?.shows || [];
                const comunsCom = emComum.find((x) => x.pessoa.usuario === c.de)?.shows || [];
                const comuns = [...new Map([...juntosCom, ...comunsCom].map((sh) => [sh.id, sh])).values()];
                return (
                  <div key={c.id} className="py-4 border-b border-dashed border-[#282141] flex flex-wrap items-center gap-3 sm:gap-4">
                    <FotoArtista nome={show.artista} artistaId={show.artistaId} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] leading-snug">
                        <b>{p.nome}</b> marcou você em{' '}
                        <Link to={`/show/${show.id}`} className="font-bold hover:underline">
                          {show.artista}
                        </Link>
                      </p>
                      <p className="lv-meta">
                        {show.casa} · {show.cidade} · {dataCurta(show.ts)}
                        {jaFui ? ' · já está na sua história' : ''}
                      </p>
                      <p className="mt-1.5">
                        {comuns.length > 0 ? (
                          <BotaoJuntos modo="comum" buddy={{ pessoa: p, shows: comuns, exemplo: Boolean(c.exemplo) }} className="lv-tag lv-tag--teal !cursor-pointer" />
                        ) : (
                          <span className="lv-tag lv-tag--next">Primeiro show juntos</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="lv-btn lv-btn--cyan !py-2.5 !px-4"
                        onClick={() => {
                          livvo.responderConvite(c.id, true);
                          avisar(jaFui ? `${p.nome.split(' ')[0]} entrou como Concert Buddy` : `${show.artista} entrou na sua história`);
                        }}
                      >
                        <Check className="w-4 h-4" strokeWidth={3} /> Aceitar
                      </button>
                      <button type="button" className="lv-ghost !py-2.5" onClick={() => livvo.responderConvite(c.id, false)}>
                        <X className="w-4 h-4" /> Recusar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {catalogo && respondidos.length > 0 && (
              <>
                <Grupo titulo="Respondidos" />
                {respondidos.map((c) => {
                  const show = catalogo.porId.get(c.showId);
                  const p = pessoaPorUsuario(c.de);
                  if (!show) return null;
                  return (
                    <Linha
                      key={c.id}
                      to={`/show/${show.id}`}
                      foto
                      inicio={<FotoArtista nome={show.artista} artistaId={show.artistaId} />}
                      titulo={`${show.artista} · com ${p.nome}`}
                      sub={`${show.casa} · ${dataCurta(show.ts)}`}
                      fim={<span className={`lv-tag ${c.status === 'aceito' ? 'lv-tag--teal' : 'lv-tag--next'}`}>{c.status === 'aceito' ? 'Aceito' : 'Recusado'}</span>}
                    />
                  );
                })}
              </>
            )}
          </section>
        )}

        {aba === 'comum' &&
          (emComum.length === 0 ? (
            <Vazio
              titulo="Ninguém em comum por enquanto."
              texto="Quando outras pessoas registrarem os mesmos shows que você, elas aparecem aqui."
            />
          ) : (
            <section>
              <Grupo titulo="Foram aos mesmos shows que você" extra={<TagExemplo />} />
              <CaixasBuddies
                buddies={emComum.slice(0, 20).map((x) => ({ ...x, exemplo: true }))}
                limite={0}
                quebra
                modo="comum"
                extra={(b) => <BotaoSeguir usuario={b.pessoa.usuario} />}
              />
            </section>
          ))}

        {aba === 'pessoas' &&
          (!lv.exemplos ? (
            <Vazio titulo="Sem sugestões por enquanto." texto="Conforme mais pessoas entrarem no Livvo, sugerimos quem tem a ver com a sua história." />
          ) : (
            <section>
              <Grupo titulo="Pessoas para seguir" extra={<TagExemplo />} />
              <div className="lv-buddies-caixas lv-buddies-caixas--quebra">
                {PESSOAS_EXEMPLO.map((p) => (
                  <CaixaFoto
                    key={p.usuario}
                    foto={<FotoPessoa nome={p.nome} tamanho="caixa" />}
                    titulo={p.nome}
                    linha={`@${p.usuario} · ${p.cidade}`}
                    extra={<BotaoSeguir usuario={p.usuario} />}
                  />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
};
