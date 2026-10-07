import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ImagePlus, RefreshCw, Upload, X } from 'lucide-react';
import type { Catalogo, Show } from './data/catalog';
import {
  buscarFotosDoArtista,
  contarFotos,
  melhorFotoDoArtista,
  padronizar,
  removerFoto,
  removerFotosDeArtista,
  salvarFoto,
  temFoto,
  useFoto,
  type OpcaoFoto,
} from './fotos';
import { livvo, useLivvo, type Memoria } from './store';
import { Bilhete, Grupo, Picotes, Poster, Stub, avisar } from './ui';

/** Marca na memória de que a foto foi enviada pela pessoa (sobe a escada de verificação para "Com foto"). */
const marcaUpload = (showId: string) => `livvo-foto:show:${showId}`;

export const Modal: React.FC<{ rotulo: string; fechar: () => void; children: React.ReactNode }> = ({ rotulo, fechar, children }) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    document.addEventListener('keydown', esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = antes;
    };
  }, [fechar]);
  return (
    <div className="lv-modal-fundo" role="dialog" aria-modal="true" aria-label={rotulo} onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="lv-modal">{children}</div>
    </div>
  );
};

/* Atualizar foto de uma memória ---------------------------------------------------------- */

export const AtualizarFoto: React.FC<{ show: Show; memoria: Memoria; fotoCatalogo?: string; fechar: () => void }> = ({
  show,
  memoria,
  fotoCatalogo,
  fechar,
}) => {
  const lv = useLivvo();
  const atual = useFoto(`show:${show.id}`);
  const doArtista = useFoto(show.artistaId ? `artista:${show.artistaId}` : undefined);
  const [opcoes, setOpcoes] = useState<OpcaoFoto[] | null>(null);
  const [previa, setPrevia] = useState<{ url: string; origem: 'upload' | 'busca'; fonte: string } | null>(null);
  const [tratando, setTratando] = useState<string | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    buscarFotosDoArtista(show.artista, fotoCatalogo).then((l) => vivo && setOpcoes(l));
    return () => {
      vivo = false;
    };
  }, [show.artista, fotoCatalogo]);

  const tratar = async (origem: Blob | string, tipo: 'upload' | 'busca', fonte: string, id: string) => {
    setErro(null);
    setTratando(id);
    try {
      setPrevia({ url: await padronizar(origem), origem: tipo, fonte });
      setEscolhida(id);
    } catch {
      setErro(
        tipo === 'upload'
          ? 'Não deu para abrir esta foto. Envie em JPG ou PNG (HEIC do iPhone não abre em todos os navegadores).'
          : 'Esta fonte não liberou a foto agora. Tente outra.',
      );
    } finally {
      setTratando(null);
    }
  };

  const salvar = async () => {
    if (!previa) return;
    await salvarFoto(`show:${show.id}`, { url: previa.url, origem: previa.origem, fonte: previa.fonte, em: Date.now() });
    // Só a foto da própria pessoa conta como prova de presença
    livvo.atualizar(memoria.id, { fotoUrl: previa.origem === 'upload' ? marcaUpload(show.id) : undefined });
    avisar('Foto atualizada no pôster e no ingresso');
    fechar();
  };

  const voltarAoGerado = async () => {
    await removerFoto(`show:${show.id}`);
    livvo.atualizar(memoria.id, { fotoUrl: undefined });
    avisar(doArtista ? 'Voltou para a foto do artista' : 'Voltou para a foto automática do artista');
    fechar();
  };

  const mostrada = previa?.url || atual?.url;

  return (
    <Modal rotulo={`Atualizar foto de ${show.artista}`} fechar={fechar}>
      <Bilhete
        esquerda={
          <>
            Livvo · <b>Atualizar foto</b>
          </>
        }
        direita={
          <button type="button" className="lv-iconbtn !w-8 !h-8 -my-2 -mr-2" aria-label="Fechar" onClick={fechar}>
            <X className="w-4 h-4" />
          </button>
        }
      >
        <div className="grid md:grid-cols-[260px_28px_minmax(0,1fr)]">
          <div className="lv-stage p-5 sm:p-6">
            <div className="max-w-[220px] mx-auto md:max-w-none">
              <Poster show={show} fotosSalvas={false} fotoUsuario={mostrada || doArtista?.url} usuario={lv.perfil.usuario} />
            </div>
            <p className="lv-eyebrow mt-3 text-center">
              {previa ? 'Prévia · ainda não salva' : atual ? `Atual · ${atual.fonte || 'sua foto'}` : doArtista ? 'Atual · foto do artista' : 'Atual · foto automática do artista'}
            </p>
          </div>
          <div className="lv-perf hidden md:block" aria-hidden="true" />
          <div className="p-5 sm:p-6 min-w-0">
            <h2 className="lv-h2">{show.artista}</h2>
            <p className="lv-meta mt-1">
              {show.casa} · {show.cidade}
            </p>
            <p className="lv-sub mt-3">Toda foto entra no padrão Livvo: corte no formato do pôster e duotone suave nas cores da marca. Vale para o pôster e para o ingresso.</p>

            <div className="mt-5">
              <input
                ref={input}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) tratar(f, 'upload', 'Sua foto', 'upload');
                }}
              />
              <Stub icone={Upload} cor="cream" onClick={() => input.current?.click()} disabled={Boolean(tratando)}>
                {tratando === 'upload' ? 'Tratando…' : 'Enviar uma foto sua'}
              </Stub>
              <p className="lv-meta mt-2">Foto sua do show sobe a memória para “Com foto”.</p>
            </div>

            <Grupo titulo="Fotos do artista" extra={<span className="lv-meta">Deezer · Wikimedia · Wikipédia</span>} />
            {opcoes === null ? (
              <div className="lv-fotos-grid mt-3" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="lv-skel" style={{ aspectRatio: '1' }} />
                ))}
              </div>
            ) : opcoes.length === 0 ? (
              <p className="lv-meta mt-3">Nenhuma foto deste artista nas fontes agora. Envie uma foto sua.</p>
            ) : (
              <div className="lv-fotos-grid mt-3">
                {opcoes.map((o) => (
                  <button
                    key={o.url}
                    type="button"
                    className="lv-foto-opcao"
                    data-on={escolhida === o.url}
                    disabled={Boolean(tratando)}
                    onClick={() => tratar(o.url, 'busca', o.fonte, o.url)}
                    title={o.fonte}
                  >
                    <img src={o.miniatura} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    <span>{tratando === o.url ? 'Tratando…' : o.fonte.replace(/ \(.*\)$/, '')}</span>
                  </button>
                ))}
              </div>
            )}
            {erro && (
              <p className="mt-3 text-[13px] font-bold text-[#ECE5D1]" role="alert">
                {erro}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Stub icone={Check} onClick={salvar} disabled={!previa}>
                Salvar foto
              </Stub>
              <button type="button" className="lv-ghost !py-[14px]" onClick={fechar}>
                Cancelar
              </button>
              {atual && !previa && (
                <button type="button" className="lv-link" onClick={voltarAoGerado}>
                  {doArtista ? 'Voltar à foto do artista' : 'Voltar à foto automática'}
                </button>
              )}
            </div>
          </div>
        </div>
      </Bilhete>
    </Modal>
  );
};

/* Admin: atualizar todas as fotos de artista de uma vez ------------------------------------ */

type Escopo = 'historia' | 'catalogo';

export const AdminFotos: React.FC<{ catalogo: Catalogo | null; fechar: () => void }> = ({ catalogo, fechar }) => {
  const lv = useLivvo();
  const [escopo, setEscopo] = useState<Escopo>('historia');
  const [refazer, setRefazer] = useState(false);
  const [rodando, setRodando] = useState(false);
  const [prog, setProg] = useState({ feitos: 0, total: 0, ok: 0, semFoto: 0, erro: 0, pulados: 0 });
  const [semFoto, setSemFoto] = useState<string[]>([]);
  const [comFoto, setComFoto] = useState<number | null>(null);
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const parar = useRef(false);

  const artistas = useMemo(() => {
    if (!catalogo) return [];
    if (escopo === 'catalogo') return Array.from(catalogo.artistas.values());
    const ids = new Set<string>();
    lv.memorias.forEach((m) => {
      const s = catalogo.porId.get(m.showId);
      if (s) ids.add(s.artistaId);
    });
    Object.keys(lv.interesses).forEach((id) => {
      const s = catalogo.porId.get(id);
      if (s) ids.add(s.artistaId);
    });
    return Array.from(ids)
      .map((id) => catalogo.artistas.get(id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
  }, [catalogo, escopo, lv.memorias, lv.interesses]);

  const atualizarContagem = () => contarFotos('artista:').then(setComFoto);
  useEffect(() => {
    atualizarContagem();
  }, []);

  const iniciar = async () => {
    parar.current = false;
    setRodando(true);
    setSemFoto([]);
    const lista = artistas.slice();
    const p = { feitos: 0, total: lista.length, ok: 0, semFoto: 0, erro: 0, pulados: 0 };
    setProg({ ...p });
    const faltando: string[] = [];
    let i = 0;
    const trabalhador = async () => {
      while (!parar.current && i < lista.length) {
        const a = lista[i++]!;
        try {
          if (!refazer && (await temFoto(`artista:${a.id}`))) {
            p.pulados++;
          } else {
            const melhor = await melhorFotoDoArtista(a.nome, a.foto);
            if (!melhor) {
              p.semFoto++;
              faltando.push(a.nome);
            } else {
              const url = await padronizar(melhor.url);
              await salvarFoto(`artista:${a.id}`, { url, origem: 'admin', fonte: melhor.fonte, em: Date.now() });
              p.ok++;
            }
          }
        } catch {
          p.erro++;
        }
        p.feitos++;
        setProg({ ...p });
      }
    };
    await Promise.all([trabalhador(), trabalhador(), trabalhador()]);
    setSemFoto(faltando.sort((x, y) => x.localeCompare(y, 'pt-BR')));
    setRodando(false);
    atualizarContagem();
    avisar(parar.current ? 'Atualização interrompida' : `${p.ok} ${p.ok === 1 ? 'foto atualizada' : 'fotos atualizadas'}`);
  };

  const pct = prog.total ? prog.feitos / prog.total : 0;

  return (
    <Modal rotulo="Atualizar todas as fotos" fechar={rodando ? () => undefined : fechar}>
      <Bilhete
        esquerda={
          <>
            Livvo · <b>Área interna</b>
          </>
        }
        direita={
          <button type="button" className="lv-iconbtn !w-8 !h-8 -my-2 -mr-2" aria-label="Fechar" onClick={fechar} disabled={rodando}>
            <X className="w-4 h-4" />
          </button>
        }
      >
        <div className="lv-pad">
          <h2 className="lv-display text-[26px] sm:text-[30px]">Atualizar todas as fotos</h2>
          <p className="lv-sub mt-2 max-w-2xl">
            Busca a foto de cada artista nas mesmas fontes do Estúdio (Deezer, Wikimedia Commons e Wikipédia, só com nome exato), aplica o padrão Livvo (corte 4:5 e
            duotone suave) e coloca nos pôsteres e ingressos de todos os shows do artista. Foto enviada por uma pessoa na própria memória continua valendo para ela.
          </p>
          <p className="lv-meta mt-2">{comFoto === null ? ' ' : `${comFoto} ${comFoto === 1 ? 'artista com foto' : 'artistas com foto'} agora.`}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 max-w-2xl">
            {(
              [
                ['historia', 'Artistas da conta e da agenda', 'Os da história e da agenda da conta de demonstração. Rápido.'],
                ['catalogo', `Todo o catálogo da prévia`, `${catalogo ? catalogo.artistas.size : '…'} artistas. Pode levar alguns minutos.`],
              ] as Array<[Escopo, string, string]>
            ).map(([id, titulo, texto]) => (
              <button key={id} type="button" className="lv-opt text-left p-4" data-on={escopo === id} disabled={rodando} onClick={() => setEscopo(id)}>
                <span className="block font-extrabold text-[14px] text-[#ECE5D1]">{titulo}</span>
                <span className="block lv-meta mt-1">{texto}</span>
              </button>
            ))}
          </div>
          <label className="lv-check max-w-2xl text-[13.5px] font-bold">
            <span>Refazer também quem já tem foto</span>
            <input type="checkbox" className="accent-[#4FDCDE] w-4 h-4" checked={refazer} disabled={rodando} onChange={() => setRefazer((v) => !v)} />
          </label>

          {prog.total > 0 && (
            <div className="mt-4 max-w-2xl">
              <Picotes feitos={Math.round(pct * 24)} />
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#B3AE9F]">
                <span>
                  <b className="text-[#ECE5D1]">{prog.feitos}</b> de {prog.total} · {prog.ok} atualizadas · {prog.pulados} já tinham · {prog.semFoto} sem foto nas fontes ·{' '}
                  {prog.erro} com erro
                </span>
                <span className="lv-mono text-[12px] text-[#4FDCDE]">{Math.round(pct * 100)}%</span>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {rodando ? (
              <button type="button" className="lv-ghost !py-[14px]" onClick={() => (parar.current = true)}>
                Parar
              </button>
            ) : (
              <Stub icone={RefreshCw} onClick={iniciar} disabled={!catalogo || artistas.length === 0}>
                Atualizar {artistas.length} {artistas.length === 1 ? 'artista' : 'artistas'}
              </Stub>
            )}
            {!rodando && (comFoto || 0) > 0 && (
              <button
                type="button"
                className="lv-link !text-[#8A8577]"
                onClick={async () => {
                  if (!confirmarLimpar) return setConfirmarLimpar(true);
                  const n = await removerFotosDeArtista();
                  setConfirmarLimpar(false);
                  atualizarContagem();
                  avisar(`${n} ${n === 1 ? 'foto removida' : 'fotos removidas'}: voltaram os pôsteres gerados`);
                }}
              >
                {confirmarLimpar ? 'Toque de novo para voltar todos aos pôsteres gerados' : 'Voltar todos aos pôsteres gerados'}
              </button>
            )}
          </div>

          {semFoto.length > 0 && (
            <>
              <Grupo titulo={`Sem foto nas fontes · ${semFoto.length}`} />
              <p className="lv-meta mt-3 leading-relaxed">{semFoto.slice(0, 60).join(' · ')}{semFoto.length > 60 ? ' …' : ''}</p>
              <p className="lv-meta mt-2">Para estes, use “Atualizar foto” numa memória ou envie as fotos pelo Gerenciar foto do Estúdio.</p>
            </>
          )}
        </div>
      </Bilhete>
    </Modal>
  );
};

/** Botão "Atualizar foto" para a memória (abre o modal). `botao`: botão-ingresso sob o pôster; senão, link. */
export const BotaoAtualizarFoto: React.FC<{
  show: Show;
  memoria: Memoria;
  fotoCatalogo?: string;
  className?: string;
  compacto?: boolean;
  botao?: boolean;
}> = ({ show, memoria, fotoCatalogo, className = '', compacto, botao }) => {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      {botao ? (
        <button type="button" className={`lv-btn lv-btn--stub lv-btn--cream w-full whitespace-nowrap ${className}`} onClick={() => setAberto(true)}>
          <ImagePlus className="w-4 h-4 shrink-0" strokeWidth={2.2} /> <span>Atualizar foto</span>
        </button>
      ) : (
        <button type="button" className={`lv-link ${compacto ? '!text-[12px]' : ''} ${className}`} onClick={() => setAberto(true)}>
          <ImagePlus className={compacto ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> Atualizar foto
        </button>
      )}
      {aberto && <AtualizarFoto show={show} memoria={memoria} fotoCatalogo={fotoCatalogo} fechar={() => setAberto(false)} />}
    </>
  );
};
