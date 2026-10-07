import React, { useEffect, useRef, useState } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import type { Show } from './data/catalog';
import { Link } from './router';
import { dataCartao, hash, iniciais, nota as fmtNota } from './format';
import { useFoto, useFotoAutomatica } from './fotos';

/* Pôster do show ---------------------------------------------------------------------
 * Imagem (decisões de 07/10/2026): foto da pessoa (memória) → foto definida pelo admin → foto
 * automática do artista (Deezer/Wikimedia, só o artista certo) → pôster halftone gerado pelos dados.
 * Toda foto aparece com o duotone suave da marca (filtro SVG `#lv-duotone` para a automática;
 * as salvas já vêm tratadas, ver fotos.ts). Todo pôster leva o logo Livvo no canto superior
 * esquerdo, como no Estúdio; o @ da pessoa entra só nas memórias e no que é compartilhado.
 */

const PALETAS = [
  { bg: '#100C1F', acc: '#4FDCDE', fg: '#ECE5D1' },
  { bg: '#171226', acc: '#2FB8BA', fg: '#ECE5D1' },
  { bg: '#ECE5D1', acc: '#100C1F', fg: '#100C1F' },
  { bg: '#100C1F', acc: '#2FB8BA', fg: '#ECE5D1' },
  { bg: '#4FDCDE', acc: '#100C1F', fg: '#100C1F' },
];

export const paletaDoArtista = (artistaIdOuNome: string) => PALETAS[hash(artistaIdOuNome) % PALETAS.length]!;

export const tamanhoNome = (nome: string): string => {
  const maior = Math.max(...nome.split(/\s+/).map((p) => p.length));
  const n = nome.length;
  if (n <= 6 && maior <= 6) return '18cqw';
  if (n <= 12 && maior <= 9) return '14cqw';
  if (n <= 20 && maior <= 11) return '11.5cqw';
  if (n <= 30) return '9.5cqw';
  return '8cqw';
};

/** Fica true quando o elemento chega perto da tela (para buscar a foto automática só do que aparece). */
const useVisivel = (ref: React.RefObject<HTMLElement | null>) => {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visivel) return;
    if (typeof IntersectionObserver === 'undefined') return setVisivel(true);
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setVisivel(true), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, visivel]);
  return visivel;
};

/** Imagem que o pôster vai usar (mesma regra da tela e das imagens de compartilhar). */
export const useImagemDoPoster = (
  show: Pick<Show, 'id' | 'artista' | 'artistaId'>,
  opcoes: { fotosSalvas?: boolean; automatica?: boolean } = {},
) => {
  const { fotosSalvas = true, automatica = true } = opcoes;
  const daMemoria = useFoto(fotosSalvas ? `show:${show.id}` : undefined);
  const doArtista = useFoto(fotosSalvas && show.artistaId ? `artista:${show.artistaId}` : undefined);
  const auto = useFotoAutomatica(show.artista, automatica && !daMemoria && !doArtista);
  if (daMemoria) return { url: daMemoria.url, tratada: true, origem: 'memoria' as const, fonte: daMemoria.fonte };
  if (doArtista) return { url: doArtista.url, tratada: true, origem: 'admin' as const, fonte: doArtista.fonte };
  if (automatica && auto?.url) return { url: auto.url, tratada: false, origem: 'automatica' as const, fonte: auto.fonte || undefined };
  return null;
};

export const Poster: React.FC<{
  show: Pick<Show, 'id' | 'artista' | 'casa' | 'cidade' | 'uf' | 'ts' | 'artistaId'>;
  /** Foto já tratada que substitui todas as outras (prévia do "Atualizar foto"). */
  fotoUsuario?: string;
  /** false: ignora as fotos salvas (usado na prévia do "Atualizar foto") */
  fotosSalvas?: boolean;
  /** @ da pessoa sob o logo (só em memórias e no que é compartilhado). */
  usuario?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ show, fotoUsuario, fotosSalvas = true, usuario, className = '', children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const visivel = useVisivel(ref);
  const p = paletaDoArtista(show.artistaId || show.artista);
  const h = hash(show.artistaId || show.artista);
  const imagem = useImagemDoPoster(show, { fotosSalvas, automatica: visivel && !fotoUsuario });
  const [falhou, setFalhou] = useState<string | null>(null);
  const url = fotoUsuario || imagem?.url;
  const foto = url && url !== falhou ? url : undefined;
  const tratada = Boolean(fotoUsuario || imagem?.tratada);
  const d = dataCartao(show.ts);
  const style = {
    '--p-bg': foto ? '#100C1F' : p.bg,
    '--p-acc': foto ? '#4FDCDE' : p.acc,
    '--p-fg': foto ? '#ECE5D1' : p.fg,
    '--p-x': `${55 + (h % 35)}%`,
    '--p-y': `${-42 + ((h >>> 6) % 30)}%`,
    '--p-name': tamanhoNome(show.artista),
  } as React.CSSProperties;
  return (
    <div ref={ref} className={`lv-poster ${foto ? 'lv-poster--foto' : ''} ${className}`} style={style} aria-hidden="true">
      {foto ? (
        <>
          <img
            className={`lv-poster-photo ${tratada ? 'lv-poster-photo--pronta' : 'lv-poster-photo--duo'}`}
            src={foto}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFalhou(foto)}
          />
          <div className="lv-poster-shade" />
        </>
      ) : (
        <>
          <div className="lv-poster-grain" />
          <div className="lv-poster-sun" />
        </>
      )}
      <div className="lv-poster-top">
        <span className="lv-poster-marca">
          <img src="/livvo/livvo-icon-128.png" alt="" width={64} height={64} />
          {usuario && <span>@{usuario}</span>}
        </span>
        <span className="lv-poster-data">
          <span className="lv-poster-day">{d.dia}</span>
          {d.mes} {d.ano}
          <span className="lv-poster-uf">{show.uf}</span>
        </span>
      </div>
      <div className="lv-poster-bottom">
        <div className="lv-poster-name">{show.artista}</div>
        <div className="lv-poster-venue">{show.casa}</div>
      </div>
      {children}
    </div>
  );
};

/* Notas em ingressos (decisão de 07/10/2026): meio a cinco ------------------------------
 * Desenho do ícone enviado pelo Edmir: ingresso vertical com recortes laterais, código de barras,
 * picote e palheta com nota musical. Off-white onde o ícone é branco, Teal onde é preto.
 * Meio ponto = metade esquerda preenchida (como nos discos).
 */

const TEAL = '#2FB8BA';
const OFFWHITE = '#ECE5D1';
const APAGADO = '#3A3159';
export const CONTORNO_INGRESSO =
  'M4,1 H16 A3,3 0 0 1 19,4 V13 A2,2 0 0 0 19,17 V26 A3,3 0 0 1 16,29 H4 A3,3 0 0 1 1,26 V17 A2,2 0 0 0 1,13 V4 A3,3 0 0 1 4,1 Z';
export const BARRAS: Array<[number, number]> = [
  [4.4, 1.1],
  [6.2, 1.6],
  [8.5, 0.7],
  [9.9, 0.7],
  [11.3, 1.6],
  [13.6, 0.7],
  [15, 0.7],
];
export const PALHETA = 'M10,26.4 C7.7,24.5 5.7,21.9 6,19.9 C6.2,18.6 7.9,18.1 10,18.1 C12.1,18.1 13.8,18.6 14,19.9 C14.3,21.9 12.3,24.5 10,26.4 Z';

const Disco: React.FC<{ fill: 0 | 0.5 | 1; id: string; interativo?: boolean }> = ({ fill, id, interativo }) => {
  const traco = fill ? TEAL : interativo ? 'rgba(47,184,186,0.55)' : APAGADO;
  const detalhe = fill ? TEAL : APAGADO;
  return (
    <svg viewBox="0 0 20 30" width="100%" height="100%" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width="10" height="30" />
        </clipPath>
      </defs>
      {fill === 1 && <path d={CONTORNO_INGRESSO} fill={OFFWHITE} />}
      {fill === 0.5 && <path d={CONTORNO_INGRESSO} fill={OFFWHITE} clipPath={`url(#${id})`} />}
      <path d={CONTORNO_INGRESSO} fill="none" stroke={traco} strokeWidth="1.7" strokeLinejoin="round" />
      {BARRAS.map(([x, w]) => (
        <rect key={x} x={x} y="4.4" width={w} height="6.6" rx="0.25" fill={detalhe} />
      ))}
      <line x1="4.6" y1="15" x2="15.6" y2="15" stroke={detalhe} strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1.2 1.3" />
      <path d={PALHETA} fill={detalhe} />
      <g fill={fill ? OFFWHITE : '#100C1F'} stroke={fill ? OFFWHITE : '#100C1F'}>
        <path d="M9.3,22.7 V20.3 L11.9,19.8 V22.2" fill="none" strokeWidth="0.6" strokeLinejoin="round" />
        <circle cx="8.75" cy="22.75" r="0.75" stroke="none" />
        <circle cx="11.35" cy="22.25" r="0.75" stroke="none" />
      </g>
    </svg>
  );
};

let discosSeq = 0;

export const Discos: React.FC<{
  valor?: number;
  onChange?: (v: number) => void;
  tamanho?: number;
  rotulo: string;
  className?: string;
}> = ({ valor = 0, onChange, tamanho = 22, rotulo, className = '' }) => {
  const [uid] = useState(() => `lvd${++discosSeq}`);
  const interativo = Boolean(onChange);
  // tamanho = altura de referência; o ingresso é vertical (20 × 30)
  const style = {
    '--d-w': `${Math.round(tamanho * 0.8)}px`,
    '--d-h': `${Math.round(tamanho * 1.2)}px`,
    '--d-gap': `${Math.max(2, Math.round(tamanho / 5))}px`,
  } as React.CSSProperties;
  const discos = [1, 2, 3, 4, 5].map((i) => {
    const fill: 0 | 0.5 | 1 = valor >= i ? 1 : valor >= i - 0.5 ? 0.5 : 0;
    return (
      <span className="lv-disc" key={i}>
        <Disco fill={fill} id={`${uid}-${i}`} interativo={interativo} />
        {interativo && (
          <>
            <button type="button" tabIndex={-1} aria-label={`${fmtNota(i - 0.5)}`} onClick={() => onChange!(i - 0.5)} />
            <button type="button" tabIndex={-1} aria-label={`${fmtNota(i)}`} onClick={() => onChange!(i)} />
          </>
        )}
      </span>
    );
  });
  if (!interativo) {
    return (
      <span className={`lv-discs ${className}`} style={style} role="img" aria-label={`${rotulo}: ${valor ? `${fmtNota(valor)} de 5` : 'sem nota'}`}>
        {discos}
      </span>
    );
  }
  return (
    <span
      className={`lv-discs ${className}`}
      style={style}
      role="slider"
      tabIndex={0}
      aria-label={rotulo}
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={valor || undefined}
      aria-valuetext={valor ? `${fmtNota(valor)} de 5` : 'sem nota'}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          onChange!(Math.min(5, (valor || 0) + 0.5));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          onChange!(Math.max(0.5, (valor || 1) - 0.5));
        }
      }}
    >
      {discos}
    </span>
  );
};

/* Avatar com iniciais (pessoas de exemplo e conta) --------------------------------- */

const CORES_AVATAR = ['#4FDCDE', '#2FB8BA', '#ECE5D1', '#B3AE9F'];

export const Avatar: React.FC<{ nome: string; tamanho?: number; className?: string }> = ({ nome, tamanho = 36, className = '' }) => (
  <span
    className={`lv-av ${className}`}
    style={{ '--av': `${tamanho}px`, background: CORES_AVATAR[hash(nome) % CORES_AVATAR.length] } as React.CSSProperties}
    aria-hidden="true"
  >
    {iniciais(nome)}
  </span>
);

/* Etiquetas ------------------------------------------------------------------------ */

export const TagExemplo: React.FC<{ texto?: string; title?: string }> = ({ texto = 'Exemplo', title }) => (
  <span
    className="lv-tag lv-tag--ex"
    title={title || 'Dado de exemplo para a prévia. Pessoas, números e resenhas reais vêm do livvomusic.com.br.'}
  >
    {texto}
  </span>
);

export const TagProxima: React.FC<{ parte: number }> = ({ parte }) => (
  <span className="lv-tag lv-tag--next" title={`Entra na parte ${parte} desta prévia`}>
    Parte {parte}
  </span>
);

/* Carimbo "Você foi" ---------------------------------------------------------------- */

export const CarimboFui: React.FC<{ animar?: boolean; texto?: string }> = ({ animar, texto = 'Você foi' }) => (
  <span className={`lv-stamp-fui ${animar ? 'lv-stamp-in' : ''}`}>
    <Check strokeWidth={3} />
    {texto}
  </span>
);

/* Progresso em marcas de picote (.lv-ticks do Estúdio) ------------------------------ */

export const Picotes: React.FC<{ total?: number; feitos: number; fino?: boolean; className?: string }> = ({ total = 24, feitos, fino, className = '' }) => (
  <div
    className={`lv-ticks ${fino ? 'lv-ticks--thin' : ''} ${className}`}
    style={total !== 24 ? { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` } : undefined}
    aria-hidden="true"
  >
    {Array.from({ length: total }, (_, i) => (
      <span key={i} data-on={i < feitos} />
    ))}
  </div>
);

/* Data em coluna (dia em RAYDIS, mês em Barlow), sem caixa ---------------------------- */

export const CaixaData: React.FC<{ ts: number; comAno?: boolean }> = ({ ts, comAno }) => {
  const d = dataCartao(ts);
  return (
    <span className="lv-dt" aria-hidden="true">
      <b>{d.dia}</b>
      <span>{comAno ? `${d.mes} ${d.ano}` : d.mes}</span>
    </span>
  );
};

/* Página-ingresso: papel + tira superior (.lv-ticket + .lv-strip do Estúdio) ---------- */

export const Bilhete: React.FC<{
  esquerda: React.ReactNode;
  direita?: React.ReactNode;
  rotulo?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ esquerda, direita, rotulo, className = '', children }) => (
  <section className={`lv-ticket ${className}`} aria-label={rotulo}>
    <div className="lv-strip">
      <span className="min-w-0 truncate">{esquerda}</span>
      {direita !== undefined && <span className="shrink-0">{direita}</span>}
    </div>
    {children}
  </section>
);

/** Cabeçalho de grupo: rótulo ciano em caixa alta + linha (.lv-group do Estúdio). */
export const Grupo: React.FC<{ titulo: React.ReactNode; extra?: React.ReactNode; className?: string }> = ({ titulo, extra, className = '' }) => (
  <div className={`lv-grp ${className}`}>
    <h2 className="lv-group">{titulo}</h2>
    {extra}
  </div>
);

/** Botão-ingresso com canhoto (furos em cima e embaixo, ícone no canhoto): .lv-btn--stub. */
export const Stub: React.FC<
  {
    icone: LucideIcon;
    cor?: 'cyan' | 'cream' | 'teal';
    to?: string;
    className?: string;
    children: React.ReactNode;
  } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>
> = ({ icone: Icone, cor = 'cyan', to, className = '', children, ...resto }) => {
  const cls = `lv-btn lv-btn--stub lv-btn--${cor} ${className}`;
  const dentro = (
    <>
      <Icone className="w-4 h-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      <span>{children}</span>
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {dentro}
    </Link>
  ) : (
    <button type="button" className={cls} {...resto}>
      {dentro}
    </button>
  );
};

/** Linha de lista com picote (.lv-show do Estúdio): coluna inicial, texto e um fim. */
export const Linha: React.FC<{
  to?: string;
  onClick?: () => void;
  inicio: React.ReactNode;
  titulo: React.ReactNode;
  sub?: React.ReactNode;
  nota?: React.ReactNode;
  fim?: React.ReactNode;
  avatar?: boolean;
  rotulo?: string;
}> = ({ to, onClick, inicio, titulo, sub, nota, fim, avatar, rotulo }) => {
  const cls = `lv-show ${avatar ? 'lv-show--av' : ''} ${to || onClick ? '' : 'lv-show--fixa'}`;
  const dentro = (
    <>
      <span className="flex items-center">{inicio}</span>
      <span className="min-w-0">
        <span className="lv-show-t">{titulo}</span>
        {sub && <span className="lv-show-s">{sub}</span>}
        {nota && <span className="lv-show-n">{nota}</span>}
      </span>
      <span className="flex items-center gap-2 justify-end text-right">{fim}</span>
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls} aria-label={rotulo}>
        {dentro}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className={cls} onClick={onClick} aria-label={rotulo}>
        {dentro}
      </button>
    );
  return <div className={cls}>{dentro}</div>;
};

/**
 * Ingresso em contorno ciano (mesmo desenho da Carteira de ingressos do Estúdio,
 * TransparentTicketItem): recortes em cima e embaixo, picote tracejado e canhoto à esquerda.
 */
export const IngressoContorno: React.FC<{
  canhoto: React.ReactNode;
  children: React.ReactNode;
  ativo?: boolean;
  className?: string;
  rotulo?: string;
}> = ({ canhoto, children, ativo, className = '', rotulo }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ w: 560, h: 185 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setTam({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { w, h } = tam;
  const nx = Math.round(Math.max(100, Math.min(175, w * 0.28)));
  const nr = 16;
  const cr = 24;
  const d = `M ${cr},0 L ${nx - nr},0 A ${nr},${nr} 0 0,0 ${nx + nr},0 L ${w - cr},0 A ${cr},${cr} 0 0,1 ${w},${cr} L ${w},${h - cr} A ${cr},${cr} 0 0,1 ${w - cr},${h} L ${nx + nr},${h} A ${nr},${nr} 0 0,0 ${nx - nr},${h} L ${cr},${h} A ${cr},${cr} 0 0,1 0,${h - cr} L 0,${cr} A ${cr},${cr} 0 0,1 ${cr},0 Z`;
  return (
    <section ref={ref} className={`lv-contorno ${className}`} data-on={ativo || undefined} aria-label={rotulo} style={{ '--nx': `${nx}px` } as React.CSSProperties}>
      <svg width={w} height={h} className="lv-contorno-svg" aria-hidden="true">
        <path d={d} fill="none" stroke="#4FDCDE" strokeWidth="3" strokeLinejoin="round" />
        <line x1={nx} y1={nr + 3} x2={nx} y2={h - nr - 3} stroke="#4FDCDE" strokeWidth="2.5" strokeDasharray="5 5" />
      </svg>
      <div className="lv-contorno-canhoto">{canhoto}</div>
      <div className="lv-contorno-corpo">{children}</div>
    </section>
  );
};

/* Card de show (catálogo) ------------------------------------------------------------ */

export const CardShow: React.FC<{
  show: Show;
  fui?: boolean;
  linhaSocial?: React.ReactNode;
}> = ({ show, fui, linhaSocial }) => {
  const d = dataCartao(show.ts);
  return (
    <Link to={`/show/${show.id}`} className="lv-showcard" aria-label={`${show.artista}, ${show.casa}, ${show.cidade}, ${d.dia} ${d.mes} ${d.ano}${fui ? ', você foi' : ''}`}>
      <Poster show={show}>
        {(fui || show.exemplo) && (
          <span className="lv-poster-flag">{fui ? <CarimboFui /> : <TagExemploPoster />}</span>
        )}
      </Poster>
      <div className="lv-showcard-info">
        <div className="lv-showcard-title lv-clamp-2">{show.artista}</div>
        <div className="lv-meta mt-1 truncate">
          {show.casa} · {show.cidade}
        </div>
        <div className="lv-meta mt-0.5">
          {d.semana}, {d.dia} {d.mes} {d.ano}
        </div>
        {linhaSocial && <div className="mt-1.5">{linhaSocial}</div>}
      </div>
    </Link>
  );
};

const TagExemploPoster = () => (
  <span className="lv-tag" style={{ background: 'rgba(16,12,31,0.85)', color: '#ECE5D1', border: '1px dashed #8A8577' }}>
    Exemplo
  </span>
);

export const GradeCarregando: React.FC<{ n?: number }> = ({ n = 8 }) => (
  <div className="lv-grid" aria-busy="true" aria-label="Carregando shows">
    {Array.from({ length: n }, (_, i) => (
      <div key={i}>
        <div className="lv-skel" style={{ aspectRatio: '4 / 5' }} />
        <div className="lv-skel mt-3" style={{ height: 14, width: '80%' }} />
        <div className="lv-skel mt-2" style={{ height: 11, width: '60%' }} />
      </div>
    ))}
  </div>
);

/* Aviso rápido (toast) -------------------------------------------------------------- */

const EVENTO_TOAST = 'livvo-toast';

export const avisar = (texto: string) => window.dispatchEvent(new CustomEvent(EVENTO_TOAST, { detail: texto }));

export const Avisos: React.FC = () => {
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    const fn = (e: Event) => {
      setTexto((e as CustomEvent<string>).detail);
      window.clearTimeout(t);
      t = window.setTimeout(() => setTexto(null), 2600);
    };
    window.addEventListener(EVENTO_TOAST, fn);
    return () => {
      window.removeEventListener(EVENTO_TOAST, fn);
      window.clearTimeout(t);
    };
  }, []);
  return (
    <div className="lv-toast-host" role="status" aria-live="polite">
      {texto && (
        <div className="lv-toast2">{texto}</div>
      )}
    </div>
  );
};

/** Compartilhar um link: usa o menu nativo do celular; no computador, copia o link. */
export const compartilharLink = async (url: string, titulo: string, texto?: string) => {
  try {
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ url, title: titulo, text: texto });
      return;
    }
  } catch {
    return; // pessoa cancelou o menu
  }
  try {
    await navigator.clipboard.writeText(url);
    avisar('Link copiado');
  } catch {
    avisar('Não deu para copiar. Use o endereço da barra do navegador.');
  }
};
