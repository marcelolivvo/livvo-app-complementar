import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type { Show } from './data/catalog';
import { Link } from './router';
import { dataCartao, hash, iniciais, nota as fmtNota } from './format';

/* Pôster Halftone gerado pelos dados do show -------------------------------------
 * Prioridade de imagem (plano de fusão): foto do usuário → foto licenciada do artista em
 * halftone → pôster gerado pelos dados. Nunca foto de banco nem capa igual para todos.
 * As fotos de artista do catálogo (Deezer) NÃO são usadas aqui: ainda não há licença para
 * usá-las em peças públicas. Quando houver, basta passar a foto licenciada em `fotoLicenciada`.
 */

const PALETAS = [
  { bg: '#100C1F', acc: '#4FDCDE', fg: '#ECE5D1' },
  { bg: '#171226', acc: '#2FB8BA', fg: '#ECE5D1' },
  { bg: '#ECE5D1', acc: '#100C1F', fg: '#100C1F' },
  { bg: '#100C1F', acc: '#2FB8BA', fg: '#ECE5D1' },
  { bg: '#4FDCDE', acc: '#100C1F', fg: '#100C1F' },
];

const tamanhoNome = (nome: string): string => {
  const maior = Math.max(...nome.split(/\s+/).map((p) => p.length));
  const n = nome.length;
  if (n <= 6 && maior <= 6) return '18cqw';
  if (n <= 12 && maior <= 9) return '14cqw';
  if (n <= 20 && maior <= 11) return '11.5cqw';
  if (n <= 30) return '9.5cqw';
  return '8cqw';
};

export const Poster: React.FC<{
  show: Pick<Show, 'id' | 'artista' | 'casa' | 'cidade' | 'uf' | 'ts' | 'artistaId'>;
  fotoUsuario?: string;
  fotoLicenciada?: string;
  className?: string;
  children?: React.ReactNode;
}> = ({ show, fotoUsuario, fotoLicenciada, className = '', children }) => {
  const h = hash(show.artistaId || show.artista);
  const p = PALETAS[h % PALETAS.length]!;
  const [falhou, setFalhou] = useState(false);
  useEffect(() => setFalhou(false), [show.id]);
  const foto = !falhou ? fotoUsuario || fotoLicenciada : undefined;
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
    <div className={`lv-poster ${className}`} style={style} aria-hidden="true">
      {foto ? (
        <>
          <img className="lv-poster-photo" src={foto} alt="" loading="lazy" onError={() => setFalhou(true)} />
          <div className="lv-poster-shade" />
        </>
      ) : (
        <>
          <div className="lv-poster-grain" />
          <div className="lv-poster-sun" />
        </>
      )}
      <div className="lv-poster-top">
        <span>
          <span className="lv-poster-day">{d.dia}</span>
          {d.mes} {d.ano}
        </span>
        <span style={{ textAlign: 'right' }}>{show.uf}</span>
      </div>
      <div className="lv-poster-bottom">
        <div className="lv-poster-name">{show.artista}</div>
        <div className="lv-poster-venue">{show.casa}</div>
      </div>
      {children}
    </div>
  );
};

/* Notas em discos: meio a cinco, amarelo #FFD60A ---------------------------------- */

const Disco: React.FC<{ fill: 0 | 0.5 | 1; id: string }> = ({ fill, id }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
    <defs>
      <clipPath id={id}>
        <rect x="0" y="0" width="12" height="24" />
      </clipPath>
    </defs>
    <circle cx="12" cy="12" r="10.6" fill="none" stroke={fill ? 'currentColor' : '#3A3159'} strokeWidth="1.6" />
    {fill === 1 && <circle cx="12" cy="12" r="10.6" fill="currentColor" />}
    {fill === 0.5 && <circle cx="12" cy="12" r="10.6" fill="currentColor" clipPath={`url(#${id})`} />}
    <circle cx="12" cy="12" r="6.4" fill="none" stroke={fill ? 'rgba(16,12,31,0.35)' : '#3A3159'} strokeWidth="0.9" />
    <circle cx="12" cy="12" r="2.2" fill={fill ? '#100C1F' : '#3A3159'} />
  </svg>
);

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
  const style = { '--d-size': `${tamanho}px`, '--d-gap': `${Math.round(tamanho / 5)}px` } as React.CSSProperties;
  const discos = [1, 2, 3, 4, 5].map((i) => {
    const fill: 0 | 0.5 | 1 = valor >= i ? 1 : valor >= i - 0.5 ? 0.5 : 0;
    return (
      <span className="lv-disc" key={i}>
        <Disco fill={fill} id={`${uid}-${i}`} />
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

/* Progresso em picotes -------------------------------------------------------------- */

export const Picotes: React.FC<{ total: number; feitos: number; className?: string }> = ({ total, feitos, className = '' }) => (
  <div className={`lv-perfs ${className}`} style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
    {Array.from({ length: total }, (_, i) => (
      <span key={i} data-on={i < feitos} />
    ))}
  </div>
);

/* Caixa de data -------------------------------------------------------------------- */

export const CaixaData: React.FC<{ ts: number; comAno?: boolean }> = ({ ts, comAno }) => {
  const d = dataCartao(ts);
  return (
    <span className="lv-datebox" aria-hidden="true">
      <b>{d.dia}</b>
      <span>{comAno ? `${d.mes} ${d.ano.slice(2)}` : d.mes}</span>
    </span>
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
        <div className="lv-toast2">
          <Check className="w-4 h-4" strokeWidth={3} />
          {texto}
        </div>
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
