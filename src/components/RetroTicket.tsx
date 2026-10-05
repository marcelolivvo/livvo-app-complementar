import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { ShowItem, CardTemplateConfig } from '../types';
import { cleanDateOnly } from '../utils/dateUtils';
import { cleanCityOnly, getStateAbbreviation } from '../utils/stateUtils';
import { LivvoLogo } from './LivvoLogo';
import { LivvoTicketIcon } from './LivvoTicketIcon';

/**
 * Livvo Ingresso Retrô — versão horizontal do card, desenhada sobre o modelo
 * "ingresso com furos em cima e embaixo" (contorno teal #2FB8BA).
 *
 * O ingresso é desenhado num tamanho fixo (W x H) e só é escalado visualmente
 * pelo invólucro, para o PNG exportado sair sempre com a mesma proporção.
 * Fora do contorno o fundo é transparente; dentro, Preto Profundo.
 */
const W = 960;
const H = 352;
const NOTCH_X = 272; // ~28% da largura, igual ao modelo
const NOTCH_R = 27;
const CORNER_R = 22;
const STROKE = 3;
const TEAL = '#2FB8BA';
const CYAN = '#4FDCDE';
const CREAM = '#ECE5D1';
const DIM = '#8A8577';
const MUTED = '#B3AE9F';
const INK = '#100C1F';

const MONO = "'DM Mono', ui-monospace, monospace";
const SLAB = "'Alfa Slab One', Georgia, serif";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

const s = STROKE / 2;
const TICKET_PATH = `
  M ${CORNER_R},${s}
  L ${NOTCH_X - NOTCH_R},${s}
  A ${NOTCH_R},${NOTCH_R} 0 0,0 ${NOTCH_X + NOTCH_R},${s}
  L ${W - CORNER_R},${s}
  A ${CORNER_R - s},${CORNER_R - s} 0 0,1 ${W - s},${CORNER_R}
  L ${W - s},${H - CORNER_R}
  A ${CORNER_R - s},${CORNER_R - s} 0 0,1 ${W - CORNER_R},${H - s}
  L ${NOTCH_X + NOTCH_R},${H - s}
  A ${NOTCH_R},${NOTCH_R} 0 0,0 ${NOTCH_X - NOTCH_R},${H - s}
  L ${CORNER_R},${H - s}
  A ${CORNER_R - s},${CORNER_R - s} 0 0,1 ${s},${H - CORNER_R}
  L ${s},${CORNER_R}
  A ${CORNER_R - s},${CORNER_R - s} 0 0,1 ${CORNER_R},${s}
  Z
`;

const photoFilterCss = (f?: CardTemplateConfig['photoFilter']) => {
  switch (f) {
    case 'noir':
      return 'grayscale(1) contrast(1.25) brightness(0.95)';
    case 'duotone':
      return 'grayscale(1) contrast(1.5) brightness(0.9)';
    case 'vibrant':
      return 'saturate(2) contrast(1.1)';
    case 'grain':
      return 'contrast(1.15) brightness(0.95)';
    case 'cyber':
      return 'contrast(1.3) brightness(1.1) hue-rotate(15deg) saturate(1.5)';
    default:
      return 'none';
  }
};

const artistSize = (name: string) => {
  const n = name.length;
  if (n <= 12) return 62;
  if (n <= 16) return 52;
  if (n <= 22) return 42;
  if (n <= 30) return 34;
  return 28;
};

interface RetroTicketProps {
  show?: ShowItem | null;
  artistName?: string | null;
  photoUrl?: string | null;
  posterUrl?: string | null;
  config: CardTemplateConfig;
}

export const RetroTicket = forwardRef<HTMLDivElement, RetroTicketProps>(
  ({ show, artistName, photoUrl, posterUrl, config }, ref) => {
    const {
      visualMode = 'artist-photo',
      accentColor = TEAL,
      showShowCode = true,
      showUserHandle = true,
      userHandle = '@toboi',
      customBadgeText = 'INGRESSO VERIFICADO',
    } = config;

    // Mesma foto do poster (foto do artista ou pôster da turnê), recortada para o canhoto
    const image =
      visualMode === 'show-poster'
        ? posterUrl || show?.posterUrl || photoUrl
        : photoUrl || posterUrl || show?.posterUrl;

    const name = show?.artistName || artistName || 'Escolha um artista';
    const tour = show?.tourName || '';
    const date = show?.date ? cleanDateOnly(show.date) : '--/--/----';
    const venue = show?.venue || 'Local a confirmar';
    const uf = show?.state ? getStateAbbreviation(show.state) : '';
    const city = show?.city ? `${cleanCityOnly(show.city)}${uf ? ` · ${uf}` : ''}` : 'Cidade';
    const code = show?.showCode || 'LIVVO';

    // Foto do canhoto: dentro do contorno, sem encostar nos furos
    const PH_X = 16;
    const PH_Y = 16;
    const PH_W = NOTCH_X - 24 - PH_X;
    const PH_H = H - PH_Y * 2;

    return (
      <div
        ref={ref}
        className="relative select-none"
        style={{ width: W, height: H, background: 'transparent', fontFamily: SANS, color: CREAM }}
      >
        {/* Contorno do modelo: furos em cima e embaixo + picote */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0" aria-hidden="true">
          <path d={TICKET_PATH} fill={INK} stroke={TEAL} strokeWidth={STROKE} strokeLinejoin="round" />
          <line
            x1={NOTCH_X}
            y1={NOTCH_R + 8}
            x2={NOTCH_X}
            y2={H - NOTCH_R - 8}
            stroke={TEAL}
            strokeWidth={3}
            strokeDasharray="8 9"
          />
        </svg>

        {/* ===== Canhoto: foto ===== */}
        <div
          className="absolute overflow-hidden"
          style={{ left: PH_X, top: PH_Y, width: PH_W, height: PH_H, borderRadius: 12, background: '#171226' }}
        >
          {image ? (
            <img
              src={image}
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ filter: photoFilterCss(config.photoFilter) }}
              onError={(e) => {
                const t = e.currentTarget;
                if (t.getAttribute('crossorigin')) {
                  t.removeAttribute('crossorigin');
                  t.src = image;
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: TEAL }}>
              <LivvoTicketIcon className="w-14 h-14" />
            </div>
          )}
          {config.photoFilter === 'duotone' && (
            <div className="absolute inset-0" style={{ background: accentColor, mixBlendMode: 'color', opacity: 0.7 }} />
          )}
          {/* leitura dos textos sobre a foto */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(16,12,31,0.55) 0%, rgba(16,12,31,0) 26%, rgba(16,12,31,0) 58%, rgba(16,12,31,0.92) 100%)',
            }}
          />

          <span
            className="absolute"
            style={{
              left: 12,
              top: 12,
              padding: '4px 8px',
              background: INK,
              border: `1px solid ${CYAN}`,
              borderRadius: 3,
              fontFamily: MONO,
              fontSize: 10.5,
              fontWeight: 500,
              letterSpacing: '0.16em',
              color: CREAM,
            }}
          >
            LIVVO PASS
          </span>

          <div className="absolute" style={{ left: 14, right: 14, bottom: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', color: CYAN }}>DATA</div>
            <div style={{ fontFamily: SLAB, fontSize: 24, lineHeight: 1.1, color: CREAM, marginTop: 2 }}>{date}</div>
            {showShowCode && (
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  letterSpacing: '0.08em',
                  color: MUTED,
                  marginTop: 6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {code}
              </div>
            )}
          </div>
        </div>

        {/* ===== Corpo do ingresso ===== */}
        <div
          className="absolute flex flex-col"
          style={{ left: NOTCH_X + 38, right: 34, top: 26, bottom: 22 }}
        >
          {/* Topo: marca + selo */}
          <div className="flex items-start justify-between" style={{ gap: 16 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <LivvoLogo className="w-11 h-11" />
              <div>
                <div style={{ fontFamily: SLAB, fontSize: 17, letterSpacing: '0.03em', color: CYAN, lineHeight: 1 }}>
                  LIVVO RETRO TICKET
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: DIM, marginTop: 5, letterSpacing: '0.06em' }}>
                  Ingresso personalizado
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end" style={{ gap: 7 }}>
              {customBadgeText && (
                <span
                  style={{
                    padding: '5px 10px 4px',
                    border: `1.5px solid ${CYAN}`,
                    borderRadius: 3,
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.16em',
                    color: CYAN,
                    transform: 'rotate(-2deg)',
                    textTransform: 'uppercase',
                  }}
                >
                  {customBadgeText}
                </span>
              )}
              {showUserHandle && (
                <span style={{ fontFamily: MONO, fontSize: 13, color: CREAM }}>{userHandle || '@fa'}</span>
              )}
            </div>
          </div>

          {/* Artista */}
          <div className="flex-1 flex flex-col justify-center min-w-0" style={{ paddingTop: 6 }}>
            {tour && (
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: CYAN,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tour}
              </div>
            )}
            <div
              style={{
                fontFamily: SLAB,
                fontSize: artistSize(name),
                lineHeight: 1.05,
                color: CREAM,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: tour ? 6 : 0,
              }}
            >
              {name}
            </div>
            <div style={{ width: 96, height: 4, background: accentColor, marginTop: 10 }} />
          </div>

          {/* Local e cidade: campos com picote, sem caixas */}
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', marginBottom: 14 }}>
            <div style={{ paddingRight: 18, minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: DIM }}>LOCAL</div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: CREAM,
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {venue}
              </div>
            </div>
            <div style={{ paddingLeft: 18, borderLeft: '1.5px dashed #3A3159', minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: DIM }}>CIDADE</div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: CYAN,
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {city}
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div
            className="flex items-center justify-between"
            style={{
              borderTop: '1.5px dashed #3A3159',
              paddingTop: 10,
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: '0.14em',
              color: MUTED,
            }}
          >
            <span>INGRESSO PERSONALIZADO · LIVVO PASS</span>
            <span className="flex items-center" style={{ gap: 7, color: CREAM }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: CYAN, display: 'inline-block' }} />
              LIVVO PASS DIGITAL
            </span>
          </div>
        </div>
      </div>
    );
  }
);
RetroTicket.displayName = 'RetroTicket';

/** Invólucro que escala o ingresso para a largura disponível (celular = largura toda). */
export const RetroTicketStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScale(Math.min(1, w / W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="w-full" style={{ height: H * scale }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
};

export const RETRO_TICKET_SIZE = { width: W, height: H };
