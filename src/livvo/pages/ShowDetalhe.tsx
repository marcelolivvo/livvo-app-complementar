import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink, MessageCircle, Share2, SlidersHorizontal, Ticket, UserCheck, UserPlus } from 'lucide-react';
import { ehFuturo, useCatalogo, type Show } from '../data/catalog';
import { MIN_AMOSTRA_NOTAS, concertBuddies, socialDoShow, type ResenhaExemplo } from '../data/social';
import { dataCartao, dataCurta, dataLonga, diasAte, nota, plural, quando } from '../format';
import { Link, navigate, useRoute } from '../router';
import { livvo, nivelVerificacao, personalizacaoDe, ROTULO_VERIFICACAO, useLivvo, type Interesse, type Memoria } from '../store';
import { BotaoAtualizarFoto } from '../AtualizarFoto';
import { BotaoCompartilhar } from '../Compartilhar';
import { MarcarBuddies } from '../ConcertBuddies';
import { IngressoMemoria } from '../Ingresso';
import { PainelPersonalizar, type RascunhoPersonalizacao } from '../Personalizar';
import { RetroTicketStage } from '../../components/RetroTicket';
import { calcularPassaporte } from '../stats';
import { useImagemDoPoster } from '../ui';
import { Avatar, Bilhete, CaixaData, CarimboFui, Discos, Grupo, Linha, Poster, Stub, TagExemplo, TagProxima, avisar, compartilharLink } from '../ui';

const ROTULO_VISIBILIDADE = { privado: 'Só você vê', seguidores: 'Visível para quem te segue', publico: 'Visível para todos' };

const Bloco: React.FC<{ titulo: string; extra?: React.ReactNode; children: React.ReactNode; id?: string }> = ({ titulo, extra, children, id }) => (
  <section id={id} aria-label={titulo}>
    <Grupo titulo={titulo} extra={extra} />
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
    <div className="lv-passport" id="minha-memoria">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="lv-eyebrow !text-[#4FDCDE]">Sua memória</div>
          <p className="lv-meta mt-1">
            Registrada em {dataCurta(memoria.criadaEm)} · {ROTULO_VISIBILIDADE[memoria.visibilidade]}
          </p>
        </div>
        <CarimboFui animar={recem} />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <div className="lv-label">Nota do show</div>
          <div className="mt-2 flex items-center gap-3">
            <Discos valor={memoria.notaShow} onChange={(v) => salvarNota('notaShow', v)} tamanho={28} rotulo="Nota do show" />
            {memoria.notaShow !== undefined && <span className="lv-nota-num text-[22px]">{nota(memoria.notaShow)}</span>}
          </div>
        </div>
        <div ref={orgRef}>
          <div className="lv-label">Nota da organização</div>
          <div className="mt-2 flex items-center gap-3">
            <Discos valor={memoria.notaOrganizacao} onChange={(v) => salvarNota('notaOrganizacao', v)} tamanho={28} rotulo="Nota da organização" />
            {memoria.notaOrganizacao !== undefined && <span className="lv-nota-num text-[22px]">{nota(memoria.notaOrganizacao)}</span>}
          </div>
        </div>
      </div>
      <p className="lv-meta mt-4">Duas notas para o artista não pagar pela fila do bar. Toque no ingresso: a metade esquerda vale meio ponto.</p>

      <div className="mt-4 pt-4 border-t border-dashed border-[#3A3159]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="lv-label">Verificação</span>
          <span className="lv-tag lv-tag--teal">{ROTULO_VERIFICACAO[nivel]}</span>
        </div>
        <p className="lv-meta mt-2 leading-snug">Suba o selo com uma foto sua do show, o ingresso ou um amigo que confirme que você estava lá.</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <BotaoAtualizarFoto show={show} memoria={memoria} fotoCatalogo={show.foto} />
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#B3AE9F]">
            <Ticket className="w-4 h-4 text-[#2FB8BA]" /> Ingresso de Memória <TagProxima parte={2} />
          </span>
          <button
            type="button"
            className={`lv-link ${confirmar ? '' : '!text-[#8A8577]'}`}
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

/** Legenda do pôster: de onde vem a imagem. */
const LegendaPoster: React.FC<{ show: Show }> = ({ show }) => {
  const img = useImagemDoPoster(show);
  // Só o tipo da foto, sem a fonte (07/10/2026: "manter apenas Foto automática").
  const texto = !img ? 'Pôster gerado pelos dados do show' : img.origem === 'memoria' ? 'Sua foto no padrão Livvo' : img.origem === 'admin' ? 'Foto do artista' : 'Foto automática';
  return <p className="lv-eyebrow mt-3 text-center hidden lg:block">{texto}</p>;
};

const CardResenha: React.FC<{ r: ResenhaExemplo; exemplo: boolean }> = ({ r, exemplo }) => (
  <article className="py-4 border-b border-dashed border-[#282141]">
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
        <span className="lv-label">Show</span>
        <Discos valor={r.notaShow} tamanho={15} rotulo="Nota do show" />
        <span className="lv-nota-num text-[14px]">{nota(r.notaShow)}</span>
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="lv-label">Organização</span>
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
  const [rascunho, setRascunho] = useState<RascunhoPersonalizacao | null>(null);
  useEffect(() => {
    setRecem(false);
    setRascunho(null);
  }, [id]);

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
  const juntos = useMemo(() => {
    const m = new Map<string, number>();
    concertBuddies(calcularPassaporte(lv.memorias, catalogo).memoriasComShow, lv.exemplos).forEach((b) => m.set(b.pessoa.usuario, b.shows.length));
    return m;
  }, [lv.memorias, catalogo, lv.exemplos]);
  const outrosNaCasa = useMemo(() => {
    if (!show || !catalogo) return [];
    return catalogo.shows.filter((s) => s.casa === show.casa && s.cidade === show.cidade && s.id !== show.id).slice(0, 10);
  }, [show, catalogo]);

  if (erro) {
    return (
      <div className="lv-empty">
        <p className="font-bold">Não conseguimos abrir este show agora.</p>
        <button type="button" className="lv-ghost" onClick={tentarDeNovo}>
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
      <div className="lv-empty">
        <p className="lv-h2">Não encontramos este show.</p>
        <p className="lv-sub">O link pode estar incompleto, ou o show ainda não está no catálogo.</p>
        <Link to="/explorar" className="lv-btn lv-btn--cyan">
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

  // Personalizar: prévia ao vivo do rascunho; sem rascunho, o que está salvo na memória
  const salva = personalizacaoDe(minha);
  const perso = rascunho?.perso || salva;
  const comQuem = [...(minha?.buddies || []).filter((b) => b.status === 'aceita').map((b) => b.usuario), ...(minha?.comQuem || [])];
  const detalhes = { setor: rascunho ? rascunho.setor : minha?.setor, comQuem };
  const ingresso = Boolean(minha) && perso.formato === 'ingresso';
  const alterado = Boolean(rascunho) && (JSON.stringify(rascunho!.perso) !== JSON.stringify(salva) || (rascunho!.setor || '') !== (minha?.setor || ''));
  const abrirPersonalizar = () => {
    if (!minha) return;
    if (rascunho) return setRascunho(null);
    setRascunho({ perso: { ...salva }, setor: minha.setor || '' });
    window.setTimeout(() => document.getElementById('painel-personalizar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };
  const salvarPersonalizacao = () => {
    if (!minha || !rascunho) return;
    livvo.atualizar(minha.id, { personalizacao: rascunho.perso, setor: rascunho.setor || undefined });
    setRascunho(null);
    avisar('Personalização salva');
  };

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

  const cabecalho = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="lv-kicker lv-kicker--cyan">{show.turne || (futuro ? 'Show que vem aí' : 'Show ao vivo')}</span>
        {show.exemplo && <TagExemplo texto="Show de exemplo" title="O catálogo real ainda não tem shows futuros. Este show e a data são fictícios." />}
      </div>
      <h1 className="lv-h1 mt-2">{show.artista}</h1>
      <div className="mt-3 space-y-1 text-[14px] sm:text-[14.5px] text-[#B3AE9F]">
        <p>
          <Link to={`/explorar?casa=${encodeURIComponent(show.casa)}&cidade=${encodeURIComponent(show.cidade)}`} className="text-[#ECE5D1] font-bold hover:underline">
            {show.casa}
          </Link>{' '}
          · {show.cidade}, {show.uf}
        </p>
        <p>
          <span className="first-letter:uppercase inline-block">{dataLonga(show.ts)}</span> · {quando(show.ts)}
        </p>
      </div>
    </>
  );

  const linhaOutroShow = (s: Show, titulo: 'casa' | 'artista') => {
    const fui = Boolean(lv.memoriaDoShow(s.id));
    const d = dataCartao(s.ts);
    return (
      <Linha
        key={s.id}
        to={`/show/${s.id}`}
        inicio={<CaixaData ts={s.ts} comAno />}
        titulo={titulo === 'casa' ? s.casa : s.artista}
        sub={titulo === 'casa' ? `${s.cidade} · ${d.semana}` : `${s.casa} · ${d.semana}`}
        fim={fui ? <CarimboFui /> : <ArrowRight className="w-4 h-4 lv-show-go" />}
        rotulo={`${s.artista}, ${s.casa}, ${d.dia} ${d.mes} ${d.ano}${fui ? ', você foi' : ''}`}
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 -mt-1 mb-4">
        <button
          type="button"
          className="lv-link !text-[#B3AE9F]"
          onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/explorar'))}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        {/* Com memória, o Compartilhar fica sob o pôster (07/10/2026) */}
        {!minha && (
          <button
            type="button"
            className="lv-ghost"
            onClick={() => compartilharLink(url, `${show.artista} · ${show.casa}`, `${show.artista} · ${show.casa} · ${dataCurta(show.ts)}`)}
          >
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
        )}
      </div>

      <Bilhete
        rotulo={show.artista}
        esquerda={
          <>
            Livvo · <b>Shows</b>
          </>
        }
        direita={dataCurta(show.ts)}
      >
        <div className="lv-split lv-split--palco-esq" style={ingresso ? ({ '--lv-split-esq': '540px' } as React.CSSProperties) : undefined}>
          <div className="lv-stage p-4 sm:p-6 lg:p-8">
            <div
              className={
                ingresso || rascunho
                  ? 'grid grid-cols-1 gap-4 sm:gap-6 lg:block'
                  : 'grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:gap-6 lg:block'
              }
            >
              <div className={rascunho && !ingresso ? 'w-full max-w-[340px] mx-auto lg:max-w-none' : ''}>
                {ingresso && minha ? (
                  <RetroTicketStage>
                    <IngressoMemoria show={show} memoria={minha} usuario={lv.perfil.usuario} perso={perso} detalhes={detalhes} />
                  </RetroTicketStage>
                ) : (
                  <Poster show={show} usuario={minha ? lv.perfil.usuario : undefined} perso={minha ? perso : undefined} detalhes={detalhes} />
                )}
              </div>
              <div className={`min-w-0 lg:hidden ${rascunho ? 'hidden' : ''}`}>{cabecalho}</div>
              {/* Botões sob o pôster (07/10/2026): Atualizar foto, Compartilhar e Personalizar */}
              {minha && (
                <div className={`${ingresso || rascunho ? '' : 'col-span-2'} lg:mt-4 grid gap-2.5 sm:max-w-[420px] lg:max-w-none`}>
                  <BotaoAtualizarFoto show={show} memoria={minha} fotoCatalogo={show.foto} botao />
                  <BotaoCompartilhar show={show} memoria={minha} usuario={lv.perfil.usuario} perso={perso} detalhes={detalhes} botao />
                  <button type="button" className="lv-btn-perso" aria-expanded={Boolean(rascunho)} aria-controls="painel-personalizar" onClick={abrirPersonalizar}>
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Personalizar</span>
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${rascunho ? 'rotate-180 lg:-rotate-90' : 'lg:-rotate-90'}`} />
                  </button>
                </div>
              )}
              <div className={minha && !ingresso && !rascunho ? 'col-span-2 lg:col-span-1' : ''}>
                <LegendaPoster show={show} />
              </div>
            </div>
          </div>
          <div className="lv-perf" aria-hidden="true" />
          <div className="p-4 sm:p-6 lg:p-8 min-w-0" id="painel-personalizar">
            {rascunho && minha ? (
              <PainelPersonalizar
                show={show}
                rascunho={rascunho}
                mudar={setRascunho}
                salvar={salvarPersonalizacao}
                fechar={() => setRascunho(null)}
                alterado={alterado}
                comQuem={comQuem}
              />
            ) : (
            <>
            <div className="hidden lg:block">{cabecalho}</div>

            {/* Ação principal: uma por estado ------------------------------------- */}
            {futuro ? (
              <div className="lg:mt-7">
                <div className="flex flex-wrap gap-3">
                  {interesse === 'quero_ir' ? (
                    <Stub icone={Check} cor="cream" aria-pressed onClick={() => marcar('quero_ir')}>
                      Quero ir
                    </Stub>
                  ) : (
                    <button
                      type="button"
                      className={interesse ? 'lv-ghost !py-[14px]' : 'lv-btn lv-btn--stub lv-btn--cyan'}
                      aria-pressed={false}
                      onClick={() => marcar('quero_ir')}
                    >
                      {!interesse && <Check className="w-4 h-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />}
                      <span>Quero ir</span>
                    </button>
                  )}
                  {interesse === 'tenho_ingresso' ? (
                    <Stub icone={Check} cor="cream" aria-pressed onClick={() => marcar('tenho_ingresso')}>
                      Tenho ingresso
                    </Stub>
                  ) : (
                    <button type="button" className="lv-ghost !py-[14px]" aria-pressed={false} onClick={() => marcar('tenho_ingresso')}>
                      <Ticket className="w-4 h-4" /> Tenho ingresso
                    </button>
                  )}
                </div>
                <dl className="lv-fields mt-6" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                  <div>
                    <dt>{dias === 1 ? 'Dia para o show' : 'Dias para o show'}</dt>
                    <dd className="lv-num">{dias}</dd>
                    <span>Quem marca Quero ir recebe lembrete na véspera</span>
                  </div>
                </dl>
                <p className="lv-meta mt-4">O link da ticketeira aparece aqui quando o show vem de uma fonte oficial.</p>
              </div>
            ) : minha ? (
              <div className="lg:mt-7">
                <MinhaMemoria memoria={minha} show={show} recem={recem} focarOrg={query.get('avaliar') === 'org'} />
              </div>
            ) : (
              <div className="lg:mt-7">
                <Stub icone={Check} onClick={euFui} className="w-full sm:w-auto sm:min-w-[240px]">
                  Eu fui
                </Stub>
                <p className="lv-meta mt-3">Guarde este show na sua história. Leva um toque; as notas você dá logo depois.</p>
              </div>
            )}

            {/* Prova social ------------------------------------------------------- */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {outrasPessoas > 0 ? (
                <>
                  <span className="lv-av-stack">
                    {soc.pessoas.slice(0, 4).map((p) => (
                      <Avatar key={p.usuario} nome={p.nome} tamanho={28} />
                    ))}
                  </span>
                  <span className="text-[13.5px] font-bold">
                    {futuro
                      ? plural(soc.registros, 'pessoa quer ir', 'pessoas querem ir')
                      : `${plural(soc.registros, 'pessoa registrou', 'pessoas registraram')} este show${minha ? ', com você' : ''}`}
                  </span>
                  {lv.exemplos && <TagExemplo />}
                </>
              ) : (
                !futuro && !minha && <span className="lv-meta">Ninguém registrou este show ainda. Seja a primeira pessoa.</span>
              )}
            </div>
            </>
            )}
          </div>
        </div>
      </Bilhete>

      <div className="grid gap-x-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="min-w-0">
          {/* Notas da comunidade ------------------------------------------------- */}
          {!futuro && soc.media && (
            <Bloco titulo="Como foi, para quem estava lá" extra={lv.exemplos ? <TagExemplo /> : undefined}>
              <dl className="lv-fields lv-fields--notas mt-4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div>
                  <dt>Show</dt>
                  <dd className="lv-nota-num">{nota(soc.media.show)}</dd>
                  <Discos valor={Math.round(soc.media.show * 2) / 2} tamanho={16} rotulo="Média do show" />
                </div>
                <div>
                  <dt>Organização</dt>
                  <dd className="lv-nota-num">{nota(soc.media.organizacao)}</dd>
                  <Discos valor={Math.round(soc.media.organizacao * 2) / 2} tamanho={16} rotulo="Média da organização" />
                </div>
              </dl>
              {soc.dimensoesMaisCitadas.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {soc.dimensoesMaisCitadas.map((d) => (
                    <span key={d.rotulo} className={`lv-tag ${d.positiva ? 'lv-tag--teal' : 'lv-tag--next'}`}>
                      {d.positiva ? '+' : '−'} {d.rotulo}
                    </span>
                  ))}
                </div>
              )}
              <p className="lv-meta mt-3">
                Média de {plural(soc.media.amostra, 'avaliação', 'avaliações')}. As médias só aparecem a partir de {MIN_AMOSTRA_NOTAS}.
              </p>
            </Bloco>
          )}

          {/* Resenhas -------------------------------------------------------------- */}
          {!futuro && soc.resenhas.length > 0 && (
            <Bloco titulo={`Resenhas de quem foi · ${soc.resenhas.length}`}>
              {soc.resenhas.map((r) => (
                <CardResenha key={r.pessoa.usuario} r={r} exemplo={lv.exemplos} />
              ))}
            </Bloco>
          )}

          {/* Quem foi / quem vai --------------------------------------------------- */}
          {soc.pessoas.length > 0 && (
            <Bloco titulo={futuro ? 'Quem vai' : 'Quem foi'} extra={lv.exemplos ? <TagExemplo /> : undefined}>
              {soc.pessoas.map((p) => (
                <Linha
                  key={p.usuario}
                  avatar
                  inicio={<Avatar nome={p.nome} tamanho={36} />}
                  titulo={p.nome}
                  sub={`@${p.usuario} · ${p.cidade}`}
                  fim={<BotaoSeguir usuario={p.usuario} />}
                />
              ))}
              <p className="lv-meta mt-2">Só aparece quem deixou a memória pública.</p>
            </Bloco>
          )}
        </div>

        <div className="min-w-0">
          {/* Setlist --------------------------------------------------------------- */}
          {!futuro && (
            <Bloco titulo="Setlist">
              <div className="py-4 border-b border-dashed border-[#282141] flex flex-wrap items-center gap-3">
                <p className="lv-sub flex-1 min-w-[200px]">
                  {show.setlistUrl ? 'A lista de músicas deste show está no setlist.fm, a base do catálogo do Livvo.' : 'Ainda sem setlist para este show.'}
                </p>
                {show.setlistUrl && (
                  <a href={show.setlistUrl} target="_blank" rel="noopener noreferrer" className="lv-ghost shrink-0">
                    Ver setlist <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </Bloco>
          )}

          {/* Com quem / Concert Buddies -------------------------------------------- */}
          <Bloco titulo={futuro ? 'Vai com alguém?' : 'Foi com alguém? · Concert Buddies'}>
            {!futuro && minha ? (
              <MarcarBuddies show={show} memoria={minha} pessoasDoShow={soc.pessoas} juntos={juntos} textoWhats={textoWhats} />
            ) : (
              <div className="py-4 border-b border-dashed border-[#282141] flex flex-wrap items-center gap-3">
                <p className="lv-sub flex-1 min-w-[200px]">
                  {futuro
                    ? 'Chame quem vai com você. Depois do show, vocês marcam um ao outro e guardam a mesma memória.'
                    : 'Registre que você foi para marcar o @ de quem estava com você (Concert Buddies).'}
                </p>
                <a className="lv-ghost shrink-0" href={`https://wa.me/?text=${encodeURIComponent(textoWhats)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> Chamar no WhatsApp
                </a>
              </div>
            )}
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
              {outrosDoArtista.slice(0, 6).map((s) => linhaOutroShow(s, 'casa'))}
            </Bloco>
          )}
          {outrosNaCasa.length > 0 && (
            <Bloco
              titulo="Mais shows nesta casa"
              extra={
                <Link to={`/explorar?casa=${encodeURIComponent(show.casa)}&cidade=${encodeURIComponent(show.cidade)}`} className="lv-link shrink-0">
                  Ver todos
                </Link>
              }
            >
              {outrosNaCasa.slice(0, 6).map((s) => linhaOutroShow(s, 'artista'))}
            </Bloco>
          )}
        </div>
      </div>
    </div>
  );
};
