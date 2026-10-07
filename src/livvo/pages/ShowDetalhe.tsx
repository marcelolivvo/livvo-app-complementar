import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  ListMusic,
  MapPin,
  MessageCircle,
  Share2,
  Ticket,
  UserCheck,
  UserPlus,
  Lock,
  Users,
  Check,
} from 'lucide-react';
import { ehFuturo, useCatalogo, type Show } from '../data/catalog';
import { MIN_AMOSTRA_NOTAS, socialDoShow, type ResenhaExemplo } from '../data/social';
import { dataCurta, dataLonga, diasAte, nota, plural, quando } from '../format';
import { Link, navigate, useRoute } from '../router';
import { livvo, nivelVerificacao, ROTULO_VERIFICACAO, useLivvo, type Interesse, type Memoria } from '../store';
import { Avatar, CardShow, CarimboFui, Discos, Poster, TagExemplo, TagProxima, avisar, compartilharLink } from '../ui';

const ROTULO_VISIBILIDADE = { privado: 'Só você vê', seguidores: 'Visível para quem te segue', publico: 'Visível para todos' };

const Bloco: React.FC<{ titulo: string; extra?: React.ReactNode; children: React.ReactNode; id?: string }> = ({ titulo, extra, children, id }) => (
  <section className="lv-section" id={id} aria-label={titulo}>
    <div className="lv-section-head">
      <h2 className="lv-h2">{titulo}</h2>
      {extra}
    </div>
    {children}
  </section>
);

/** A memória do usuário, como canhoto de ingresso: notas em 1 toque e escada de verificação. */
const MinhaMemoria: React.FC<{ memoria: Memoria; show: Show; recem: boolean; focarOrg: boolean }> = ({ memoria, show, recem, focarOrg }) => {
  const orgRef = useRef<HTMLDivElement>(null);
  const nivel = nivelVerificacao(memoria);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => {
    if (!confirmar) return;
    const t = window.setTimeout(() => setConfirmar(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmar]);
  useEffect(() => {
    if (!focarOrg || !orgRef.current) return;
    orgRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (orgRef.current.querySelector('[role="slider"]') as HTMLElement | null)?.focus({ preventScroll: true });
  }, [focarOrg]);

  const salvarNota = (campo: 'notaShow' | 'notaOrganizacao', v: number) => {
    livvo.atualizar(memoria.id, { [campo]: v });
    avisar(campo === 'notaShow' ? `Nota do show: ${nota(v)}` : `Nota da organização: ${nota(v)}`);
  };

  return (
    <div className="lv-tix lv-tix--h mt-6" id="minha-memoria">
      <div className="lv-tix-body lv-stage">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="lv-kicker lv-kicker--cyan">Sua memória</div>
            <p className="lv-meta mt-1">
              Registrada em {dataCurta(memoria.criadaEm)} · {ROTULO_VISIBILIDADE[memoria.visibilidade]}
            </p>
          </div>
          <CarimboFui animar={recem} />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="lv-kicker">Nota do show</div>
            <div className="mt-2 flex items-center gap-3">
              <Discos valor={memoria.notaShow} onChange={(v) => salvarNota('notaShow', v)} tamanho={30} rotulo="Nota do show" />
              {memoria.notaShow !== undefined && <span className="lv-nota-num text-[22px]">{nota(memoria.notaShow)}</span>}
            </div>
          </div>
          <div ref={orgRef}>
            <div className="lv-kicker">Nota da organização</div>
            <div className="mt-2 flex items-center gap-3">
              <Discos
                valor={memoria.notaOrganizacao}
                onChange={(v) => salvarNota('notaOrganizacao', v)}
                tamanho={30}
                rotulo="Nota da organização"
              />
              {memoria.notaOrganizacao !== undefined && <span className="lv-nota-num text-[22px]">{nota(memoria.notaOrganizacao)}</span>}
            </div>
          </div>
        </div>
        <p className="lv-meta mt-4">Duas notas para o artista não pagar pela fila do bar. Toque no disco: metade esquerda vale meio ponto.</p>
      </div>

      <div className="lv-tix-stub">
        <div className="lv-kicker">Verificação</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="lv-tag lv-tag--teal">{ROTULO_VERIFICACAO[nivel]}</span>
        </div>
        <p className="lv-meta mt-2 leading-snug">Suba o selo com foto, ingresso ou um amigo que confirme que você estava lá.</p>
        <div className="mt-3 flex flex-col items-start gap-2">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#B3AE9F]">
            <Ticket className="w-4 h-4 text-[#2FB8BA]" /> Ingresso de Memória <TagProxima parte={2} />
          </span>
          <button
            type="button"
            className={`lv-link ${confirmar ? '' : 'text-[#8A8577]'}`}
            onClick={() => {
              if (!confirmar) return setConfirmar(true);
              livvo.remover(memoria.id);
              avisar(`${show.artista} saiu da sua história`);
            }}
          >
            {confirmar ? 'Toque de novo para tirar da sua história' : 'Desfazer registro'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CardResenha: React.FC<{ r: ResenhaExemplo; exemplo: boolean }> = ({ r, exemplo }) => (
  <article className="lv-card p-4">
    <header className="flex items-center gap-3">
      <Avatar nome={r.pessoa.nome} tamanho={38} />
      <div className="min-w-0 flex-1">
        <div className="font-extrabold text-[14px] truncate">{r.pessoa.nome}</div>
        <div className="lv-meta truncate">
          @{r.pessoa.usuario}
          {r.setor ? ` · ${r.setor}` : ''}
        </div>
      </div>
      {exemplo && <TagExemplo />}
    </header>
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="inline-flex items-center gap-2">
        <span className="lv-kicker">Show</span>
        <Discos valor={r.notaShow} tamanho={15} rotulo="Nota do show" />
        <span className="lv-nota-num text-[14px]">{nota(r.notaShow)}</span>
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="lv-kicker">Organização</span>
        <Discos valor={r.notaOrganizacao} tamanho={15} rotulo="Nota da organização" />
        <span className="lv-nota-num text-[14px]">{nota(r.notaOrganizacao)}</span>
      </span>
    </div>
    <p className="mt-3 text-[14px] leading-relaxed text-[#ECE5D1] lv-clamp-3">{r.texto}</p>
    {r.dimensoes.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {r.dimensoes.map((d) => (
          <span key={d.id} className={`lv-tag ${d.positiva ? 'lv-tag--teal' : 'lv-tag--next'}`}>
            {d.positiva ? '+' : '−'} {d.rotulo}
          </span>
        ))}
      </div>
    )}
  </article>
);

const BotaoSeguir: React.FC<{ usuario: string }> = ({ usuario }) => {
  const { seguindo } = useLivvo();
  const sigo = seguindo.includes(usuario);
  return (
    <button
      type="button"
      className="lv-ghost !py-1.5 !px-2.5"
      aria-pressed={sigo}
      onClick={() => {
        livvo.alternarSeguir(usuario);
      }}
    >
      {sigo ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {sigo ? 'Seguindo' : 'Seguir'}
    </button>
  );
};

export const ShowDetalhe: React.FC<{ id: string }> = ({ id }) => {
  const { query } = useRoute();
  const { catalogo, erro, tentarDeNovo } = useCatalogo();
  const lv = useLivvo();
  const [recem, setRecem] = useState(false);
  useEffect(() => setRecem(false), [id]);

  const show = catalogo?.porId.get(id);
  const minha = lv.memoriaDoShow(id);
  useEffect(() => {
    if (show) document.title = `${show.artista} · ${show.casa} · ${dataCurta(show.ts)} · Livvo`;
  }, [show]);
  const soc = useMemo(() => (show ? socialDoShow(show, lv.exemplos, minha) : null), [show, lv.exemplos, minha]);

  const outrosDoArtista = useMemo(() => {
    if (!show || !catalogo) return [];
    return (catalogo.artistas.get(show.artistaId)?.shows || []).filter((s) => s.id !== show.id).slice(0, 10);
  }, [show, catalogo]);
  const outrosNaCasa = useMemo(() => {
    if (!show || !catalogo) return [];
    return catalogo.shows.filter((s) => s.casa === show.casa && s.cidade === show.cidade && s.id !== show.id).slice(0, 10);
  }, [show, catalogo]);

  if (erro) {
    return (
      <div className="lv-card p-6 text-center">
        <p className="font-bold">Não conseguimos abrir este show agora.</p>
        <button type="button" className="lv-ghost mt-4" onClick={tentarDeNovo}>
          Tentar de novo
        </button>
      </div>
    );
  }
  if (!catalogo) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]" aria-busy="true">
        <div className="lv-skel" style={{ aspectRatio: '4 / 5' }} />
        <div>
          <div className="lv-skel" style={{ height: 14, width: 120 }} />
          <div className="lv-skel mt-3" style={{ height: 40, width: '70%' }} />
          <div className="lv-skel mt-4" style={{ height: 14, width: '50%' }} />
          <div className="lv-skel mt-8" style={{ height: 52, width: 240 }} />
        </div>
      </div>
    );
  }
  if (!show || !soc) {
    return (
      <div className="lv-card p-8 text-center">
        <p className="lv-h2">Não encontramos este show.</p>
        <p className="lv-sub mt-2">O link pode estar incompleto, ou o show ainda não está no catálogo.</p>
        <Link to="/explorar" className="lv-btn lv-btn--cyan mt-6">
          Explorar shows
        </Link>
      </div>
    );
  }

  const futuro = ehFuturo(show);
  const interesse = lv.interesses[show.id];
  const url = `${window.location.origin}/show/${show.id}`;
  const dias = diasAte(show.ts);
  const outrasPessoas = soc.registros - (minha ? 1 : 0);

  const euFui = () => {
    const m = livvo.registrar(show.id);
    if (m) {
      setRecem(true);
      avisar('Show guardado na sua história');
    }
  };

  const marcar = (v: Interesse) => {
    const novo = interesse === v ? null : v;
    livvo.definirInteresse(show.id, novo);
    if (lv.logado) avisar(novo ? (novo === 'tenho_ingresso' ? 'Guardado: você tem ingresso' : 'Guardado na sua agenda') : 'Tirado da sua agenda');
  };

  const textoWhats = futuro
    ? `Bora? ${show.artista} · ${show.casa}, ${show.cidade} · ${dataCurta(show.ts)}. ${url}`
    : `Lembra deste show? ${show.artista} · ${show.casa} · ${dataCurta(show.ts)}. Guardei no Livvo: ${url}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 -mt-1 mb-4">
        <button
          type="button"
          className="lv-link text-[#B3AE9F]"
          onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/explorar'))}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          type="button"
          className="lv-ghost"
          onClick={() => compartilharLink(url, `${show.artista} · ${show.casa}`, `${show.artista} · ${show.casa} · ${dataCurta(show.ts)}`)}
        >
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>

      <div className="lv-showpage">
        <div className="lv-showpage-poster">
          <Poster show={show}>
            {minha && (
              <span className="lv-poster-flag max-lg:hidden">
                <CarimboFui animar={recem} />
              </span>
            )}
          </Poster>
          <p className="lv-meta mt-2 text-center hidden lg:block">Pôster gerado pelos dados do show</p>
        </div>

        <div className="lv-showpage-head">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lv-kicker lv-kicker--cyan">{show.turne || (futuro ? 'Show que vem aí' : 'Show ao vivo')}</span>
            {show.exemplo && <TagExemplo texto="Show de exemplo" title="O catálogo real ainda não tem shows futuros. Este show e a data são fictícios." />}
          </div>
          <h1 className="lv-h1 mt-2 break-words">{show.artista}</h1>
          <div className="mt-3 sm:mt-4 space-y-1.5 text-[14px] sm:text-[14.5px] text-[#B3AE9F]">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#2FB8BA]" />
              <span className="min-w-0">
                <Link to={`/explorar?casa=${encodeURIComponent(show.casa)}&cidade=${encodeURIComponent(show.cidade)}`} className="text-[#ECE5D1] font-bold hover:underline">
                  {show.casa}
                </Link>{' '}
                · {show.cidade}, {show.uf}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 mt-0.5 shrink-0 text-[#2FB8BA]" />
              <span>
                <span className="first-letter:uppercase inline-block">{dataLonga(show.ts)}</span> · {quando(show.ts)}
              </span>
            </p>
          </div>
        </div>

        <div className="lv-showpage-body">
          {/* Ação principal ------------------------------------------------------- */}
          {futuro ? (
            <div className="mt-7">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={interesse === 'quero_ir' ? 'lv-btn lv-btn--cream' : interesse ? 'lv-ghost !py-[14px]' : 'lv-btn lv-btn--cyan'}
                  aria-pressed={interesse === 'quero_ir'}
                  onClick={() => marcar('quero_ir')}
                >
                  {interesse === 'quero_ir' && <Check className="w-4 h-4" strokeWidth={3} />}
                  Quero ir
                </button>
                <button
                  type="button"
                  className={interesse === 'tenho_ingresso' ? 'lv-btn lv-btn--cream' : 'lv-ghost !py-[14px]'}
                  aria-pressed={interesse === 'tenho_ingresso'}
                  onClick={() => marcar('tenho_ingresso')}
                >
                  {interesse === 'tenho_ingresso' ? <Check className="w-4 h-4" strokeWidth={3} /> : <Ticket className="w-4 h-4" />}
                  Tenho ingresso
                </button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="lv-num text-[40px] text-[#ECE5D1]">{dias}</span>
                  <span className="lv-kicker">{dias === 1 ? 'dia para o show' : 'dias para o show'}</span>
                </div>
                <span className="lv-meta max-w-xs">
                  Quem marca Quero ir recebe lembrete na véspera e o “Como foi?” na manhã seguinte.
                </span>
              </div>
              <p className="lv-meta mt-4 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> O link da ticketeira aparece aqui quando o show vem de uma fonte oficial.
              </p>
            </div>
          ) : minha ? (
            <MinhaMemoria memoria={minha} show={show} recem={recem} focarOrg={query.get('avaliar') === 'org'} />
          ) : (
            <div className="mt-7">
              <button type="button" className="lv-btn lv-btn--cyan lv-btn-block" onClick={euFui}>
                Eu fui
              </button>
              <p className="lv-meta mt-3">Guarde este show na sua história. Leva um toque; as notas você dá logo depois.</p>
            </div>
          )}

          {/* Prova social -------------------------------------------------------- */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {outrasPessoas > 0 ? (
              <>
                <span className="lv-av-stack">
                  {soc.pessoas.slice(0, 4).map((p) => (
                    <Avatar key={p.usuario} nome={p.nome} tamanho={30} />
                  ))}
                </span>
                <span className="text-[14px] font-bold">
                  {futuro
                    ? plural(soc.registros, 'pessoa quer ir', 'pessoas querem ir')
                    : `${plural(soc.registros, 'pessoa registrou', 'pessoas registraram')} este show${minha ? ', com você' : ''}`}
                </span>
                {lv.exemplos && <TagExemplo />}
              </>
            ) : (
              !futuro &&
              !minha && <span className="lv-meta">Ninguém registrou este show ainda. Seja a primeira pessoa.</span>
            )}
          </div>

          {/* Notas da comunidade ------------------------------------------------- */}
          {!futuro && soc.media && (
            <Bloco titulo="Como foi, para quem estava lá" extra={lv.exemplos ? <TagExemplo /> : undefined}>
              <div className="lv-card p-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <div className="lv-kicker">Show</div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="lv-nota-num text-[38px]">{nota(soc.media.show)}</span>
                      <Discos valor={Math.round(soc.media.show * 2) / 2} tamanho={20} rotulo="Média do show" />
                    </div>
                  </div>
                  <div>
                    <div className="lv-kicker">Organização</div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="lv-nota-num text-[38px]">{nota(soc.media.organizacao)}</span>
                      <Discos valor={Math.round(soc.media.organizacao * 2) / 2} tamanho={20} rotulo="Média da organização" />
                    </div>
                  </div>
                </div>
                {soc.dimensoesMaisCitadas.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {soc.dimensoesMaisCitadas.map((d) => (
                      <span key={d.rotulo} className={`lv-tag ${d.positiva ? 'lv-tag--teal' : 'lv-tag--next'}`}>
                        {d.positiva ? '+' : '−'} {d.rotulo}
                      </span>
                    ))}
                  </div>
                )}
                <p className="lv-meta mt-4">
                  Média de {plural(soc.media.amostra, 'avaliação', 'avaliações')}. As médias só aparecem a partir de {MIN_AMOSTRA_NOTAS}.
                </p>
              </div>
            </Bloco>
          )}

          {/* Setlist --------------------------------------------------------------- */}
          {!futuro && (
            <Bloco titulo="Setlist">
              <div className="lv-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <ListMusic className="w-7 h-7 text-[#2FB8BA] shrink-0" />
                <p className="lv-sub flex-1">
                  {show.setlistUrl
                    ? 'A lista de músicas deste show está no setlist.fm, a base que alimenta o catálogo do Livvo.'
                    : 'Ainda sem setlist para este show.'}
                </p>
                {show.setlistUrl && (
                  <a href={show.setlistUrl} target="_blank" rel="noopener noreferrer" className="lv-ghost shrink-0">
                    Ver setlist <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </Bloco>
          )}

          {/* Resenhas -------------------------------------------------------------- */}
          {!futuro && soc.resenhas.length > 0 && (
            <Bloco titulo="Resenhas de quem foi" extra={<span className="lv-meta">{soc.resenhas.length}</span>}>
              <div className="grid gap-3">
                {soc.resenhas.map((r) => (
                  <CardResenha key={r.pessoa.usuario} r={r} exemplo={lv.exemplos} />
                ))}
              </div>
            </Bloco>
          )}

          {/* Quem foi / quem vai --------------------------------------------------- */}
          {soc.pessoas.length > 0 && (
            <Bloco titulo={futuro ? 'Quem vai' : 'Quem foi'} extra={lv.exemplos ? <TagExemplo /> : undefined}>
              <ul className="lv-card divide-y divide-[#282141]">
                {soc.pessoas.map((p) => (
                  <li key={p.usuario} className="flex items-center gap-3 px-4 py-3">
                    <Avatar nome={p.nome} tamanho={36} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[14px] truncate">{p.nome}</div>
                      <div className="lv-meta truncate">
                        @{p.usuario} · {p.cidade}
                      </div>
                    </div>
                    <BotaoSeguir usuario={p.usuario} />
                  </li>
                ))}
              </ul>
              <p className="lv-meta mt-2">Só aparece quem deixou a memória pública.</p>
            </Bloco>
          )}

          {/* Com quem ------------------------------------------------------------- */}
          <Bloco titulo={futuro ? 'Vai com alguém?' : 'Foi com alguém?'}>
            <div className="lv-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <Users className="w-7 h-7 text-[#2FB8BA] shrink-0" />
              <p className="lv-sub flex-1">
                {futuro
                  ? 'Chame quem vai com você. Depois do show, vocês guardam a mesma memória.'
                  : 'Mande para quem estava com você: cada um guarda o show na própria história.'}
              </p>
              <a
                className="lv-ghost shrink-0"
                href={`https://wa.me/?text=${encodeURIComponent(textoWhats)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-4 h-4" /> Chamar no WhatsApp
              </a>
            </div>
          </Bloco>

          {/* Mais shows ------------------------------------------------------------ */}
          {outrosDoArtista.length > 0 && (
            <Bloco
              titulo={`Mais shows de ${show.artista}`}
              extra={
                <Link to={`/explorar?q=${encodeURIComponent(show.artista)}`} className="lv-link shrink-0">
                  Ver todos
                </Link>
              }
            >
              <div className="lv-scroller">
                {outrosDoArtista.map((s) => (
                  <CardShow key={s.id} show={s} fui={Boolean(lv.memoriaDoShow(s.id))} />
                ))}
              </div>
            </Bloco>
          )}
          {outrosNaCasa.length > 0 && (
            <Bloco
              titulo="Mais shows nesta casa"
              extra={
                <Link
                  to={`/explorar?casa=${encodeURIComponent(show.casa)}&cidade=${encodeURIComponent(show.cidade)}`}
                  className="lv-link shrink-0"
                >
                  Ver todos
                </Link>
              }
            >
              <div className="lv-scroller">
                {outrosNaCasa.map((s) => (
                  <CardShow key={s.id} show={s} fui={Boolean(lv.memoriaDoShow(s.id))} />
                ))}
              </div>
            </Bloco>
          )}
        </div>
      </div>
    </div>
  );
};
