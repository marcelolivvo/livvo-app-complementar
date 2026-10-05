import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CollectedTicket } from '../services/walletService';
import {
  buildHistory,
  fmtDate,
  MONTHS_NAME,
  MONTHS_SHORT,
  RankItem,
  WEEKDAYS_SHORT,
  YearBlock,
} from '../services/historyService';

// Cores oficiais Livvo usadas nos gráficos
const CYAN = '#4FDCDE'; // destaque (ano recorde, valor máximo)
const TEAL = '#2FB8BA'; // série padrão
const LINE = '#282141';
const DIM = '#8A8577';


/** Largura real do contêiner, para o SVG desenhar 1:1 (texto nunca estica). */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/* ------------------------------------------------------------------------ */
/* Leitura do valor sob o cursor (substitui tooltip flutuante)              */
/* ------------------------------------------------------------------------ */
const Readout: React.FC<{ text: string | null; fallback: string }> = ({ text, fallback }) => (
  <p className="lv-hist-readout" aria-live="polite">
    {text ?? fallback}
  </p>
);

/* ------------------------------------------------------------------------ */
/* 1a. Total por ano                                                         */
/* ------------------------------------------------------------------------ */
const YearTotals: React.FC<{ years: YearBlock[] }> = ({ years }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...years.map((y) => y.total));
  const h = 120;
  const colW = 34;
  const gap = 14;
  const w = years.length * (colW + gap) - gap;
  const hovered = years.find((y) => y.year === hover);
  return (
    <div>
      <div className="lv-hist-scroll">
        <svg
          viewBox={`0 0 ${Math.max(w, 1)} ${h + 40}`}
          width={Math.max(w, 1)}
          height={h + 40}
          role="img"
          aria-label={`Shows por ano: ${years.map((y) => `${y.year}, ${y.total}`).join('; ')}`}
        >
          <line x1={0} x2={w} y1={h + 0.5} y2={h + 0.5} stroke={LINE} />
          {years.map((y, i) => {
            const x = i * (colW + gap);
            const bh = Math.max(3, (y.total / max) * (h - 22));
            return (
              <g
                key={y.year}
                onMouseEnter={() => setHover(y.year)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setHover(y.year)}
                style={{ cursor: 'default' }}
              >
                <rect x={x - gap / 2} y={0} width={colW + gap} height={h + 40} fill="transparent" />
                <path
                  d={`M${x},${h} V${h - bh + 4} q0,-4 4,-4 h${colW - 8} q4,0 4,4 V${h} Z`}
                  fill={y.isRecord ? CYAN : TEAL}
                  opacity={y.isRecord ? 1 : hover === y.year ? 0.85 : 0.55}
                />
                <text
                  x={x + colW / 2}
                  y={h - bh - 7}
                  textAnchor="middle"
                  className="lv-num"
                  fontSize={15}
                  fill={y.isRecord ? '#ECE5D1' : DIM}
                >
                  {y.total}
                </text>
                <text x={x + colW / 2} y={h + 18} textAnchor="middle" className="lv-mono" fontSize={11} fill={y.isRecord ? CYAN : DIM}>
                  {y.year}
                </text>
                {y.isRecord && (
                  <text x={x + colW / 2} y={h + 33} textAnchor="middle" className="lv-mono" fontSize={9} fill={CYAN} letterSpacing="0.1em">
                    RECORDE
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <Readout
        text={hovered ? `${hovered.year}: ${plural(hovered.total, 'show', 'shows')}${hovered.isRecord ? ' · ano recorde' : ''}` : null}
        fallback="Passe o dedo ou o mouse sobre um ano."
      />
    </div>
  );
};

/* ------------------------------------------------------------------------ */
/* 1b. Mês a mês, um bloco por ano (escala comum a todos os anos)           */
/* ------------------------------------------------------------------------ */
const YearMonths: React.FC<{ block: YearBlock; maxMonth: number }> = ({ block, maxMonth }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth<HTMLDivElement>(300);
  const H = 96;
  const slot = W / 12;
  const bw = Math.min(18, slot * 0.6);
  const peak = Math.max(...block.months);
  return (
    <article className="lv-hist-year" data-record={block.isRecord}>
      <header>
        <span className="lv-num text-[26px]" style={{ color: block.isRecord ? CYAN : '#ECE5D1' }}>
          {block.year}
        </span>
        <span className="lv-mono text-[12px] text-[#B3AE9F]">{plural(block.total, 'show', 'shows')}</span>
        {block.isRecord && <span className="lv-hist-stamp">Ano recorde</span>}
      </header>
      <div ref={box}>
      <svg
        viewBox={`0 0 ${W} ${H + 18}`}
        width={W}
        height={H + 18}
        className="block"
        role="img"
        aria-label={`${block.year}, shows por mês: ${block.months
          .map((v, i) => `${MONTHS_NAME[i]} ${v}`)
          .join(', ')}`}
      >
        <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} stroke={LINE} />
        {block.months.map((v, i) => {
          const x = i * slot + (slot - bw) / 2;
          const bh = v === 0 ? 0 : Math.max(4, (v / maxMonth) * (H - 18));
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(i)}
            >
              <rect x={i * slot} y={0} width={slot} height={H + 18} fill="transparent" />
              {v > 0 && (
                <path
                  d={`M${x},${H} V${H - bh + 3} q0,-3 3,-3 h${bw - 6} q3,0 3,3 V${H} Z`}
                  fill={block.isRecord ? CYAN : TEAL}
                  opacity={block.isRecord ? 1 : hover === i ? 0.9 : 0.6}
                />
              )}
              {v > 0 && (v === peak || hover === i) && (
                <text x={x + bw / 2} y={H - bh - 5} textAnchor="middle" className="lv-num" fontSize={12} fill="#ECE5D1">
                  {v}
                </text>
              )}
              <text
                x={i * slot + slot / 2}
                y={H + 14}
                textAnchor="middle"
                className="lv-mono"
                fontSize={10}
                fill={hover === i ? '#ECE5D1' : DIM}
              >
                {MONTHS_SHORT[i]}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <Readout
        text={hover !== null ? `${MONTHS_NAME[hover]} de ${block.year}: ${plural(block.months[hover], 'show', 'shows')}` : null}
        fallback={(() => {
          const best = block.months.indexOf(peak);
          return `Mês mais cheio: ${MONTHS_NAME[best]} (${peak})`;
        })()}
      />
    </article>
  );
};

/* ------------------------------------------------------------------------ */
/* 2. Linha do tempo acumulada, com as medalhas alcançadas                  */
/* ------------------------------------------------------------------------ */
const Cumulative: React.FC<{
  points: { date: Date; count: number }[];
  medals: { name: string; minShows: number; date: Date }[];
}> = ({ points, medals }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth<HTMLDivElement>(680);
  const H = W < 480 ? 180 : 220;
  const padL = 34;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const t0 = points[0].date.getTime();
  const t1 = points[points.length - 1].date.getTime();
  const span = Math.max(1, t1 - t0);
  const max = points[points.length - 1].count;
  const sx = (t: number) => padL + ((t - t0) / span) * (W - padL - padR);
  const sy = (c: number) => padT + (1 - c / Math.max(1, max)) * (H - padT - padB);
  // Degraus: o total só muda no dia do show
  let d = `M${sx(t0)},${sy(0)}`;
  points.forEach((p) => {
    const x = sx(p.date.getTime());
    d += ` H${x} V${sy(p.count)}`;
  });
  const y0 = points[0].date.getFullYear();
  const y1 = points[points.length - 1].date.getFullYear();
  const yearTicks: number[] = [];
  const step = Math.max(1, Math.ceil((y1 - y0 + 1) / Math.max(2, Math.floor(W / 70))));
  for (let y = y0; y <= y1; y += step) yearTicks.push(y);
  const yTicks = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const dd = Math.abs(sx(p.date.getTime()) - x);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    });
    setHover(best);
  };
  const hp = hover !== null ? points[hover] : null;

  return (
    <div ref={box}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block touch-pan-y"
        role="img"
        aria-label={`Total acumulado de shows: ${max} entre ${y0} e ${y1}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={sy(v)} y2={sy(v)} stroke={LINE} strokeDasharray={v === 0 ? undefined : '3 5'} />
            <text x={padL - 8} y={sy(v) + 4} textAnchor="end" className="lv-mono" fontSize={10} fill={DIM}>
              {v}
            </text>
          </g>
        ))}
        {yearTicks.map((y) => {
          const x = sx(Math.max(t0, new Date(y, 0, 1).getTime()));
          return (
            <text key={y} x={x} y={H - 6} textAnchor="middle" className="lv-mono" fontSize={10} fill={DIM}>
              {y}
            </text>
          );
        })}
        <path d={d} fill="none" stroke={TEAL} strokeWidth={2} strokeLinejoin="round" />
        {medals.map((m) => {
          const x = sx(m.date.getTime());
          const y = sy(m.minShows);
          return (
            <g key={m.name}>
              <circle cx={x} cy={y} r={5} fill={CYAN} stroke="#171226" strokeWidth={2} />
              <text
                x={Math.min(x + 8, W - padR - 70)}
                y={y - 8}
                className="lv-mono"
                fontSize={10}
                fill="#ECE5D1"
              >
                {m.name}
              </text>
            </g>
          );
        })}
        {hp && (
          <g pointerEvents="none">
            <line x1={sx(hp.date.getTime())} x2={sx(hp.date.getTime())} y1={padT} y2={H - padB} stroke={DIM} strokeDasharray="2 4" />
            <circle cx={sx(hp.date.getTime())} cy={sy(hp.count)} r={4} fill="#ECE5D1" stroke="#171226" strokeWidth={2} />
          </g>
        )}
      </svg>
      <Readout
        text={hp ? `${fmtDate(hp.date)}: show nº ${hp.count}` : null}
        fallback={`${plural(max, 'show', 'shows')} desde ${fmtDate(points[0].date)}. Pontos ciano: medalhas alcançadas.`}
      />
    </div>
  );
};

/* ------------------------------------------------------------------------ */
/* 3. Rankings em barras horizontais                                         */
/* ------------------------------------------------------------------------ */
const RankList: React.FC<{ title: string; items: RankItem[]; unit?: [string, string] }> = ({
  title,
  items,
  unit = ['vez', 'vezes'],
}) => {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="lv-hist-block">
      <h4 className="lv-eyebrow">{title}</h4>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-[#8A8577] mt-3">Sem dados ainda.</p>
      ) : (
        <ol className="lv-hist-rank">
          {items.map((it, i) => (
            <li key={`${it.label}-${i}`} title={`${it.label}: ${plural(it.count, unit[0], unit[1])}`}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] text-[#ECE5D1] font-semibold">
                  {it.label}
                  {it.sub && <span className="lv-mono text-[11px] text-[#8A8577] font-normal ml-1.5">{it.sub}</span>}
                </span>
                <span className="lv-num text-[16px] text-[#ECE5D1] shrink-0">{it.count}</span>
              </div>
              <div className="lv-hist-bar">
                <span style={{ width: `${(it.count / max) * 100}%`, background: i === 0 ? CYAN : TEAL, opacity: i === 0 ? 1 : 0.6 }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------------ */
/* 4. Colunas simples (dia da semana, artistas novos por ano)               */
/* ------------------------------------------------------------------------ */
const SmallColumns: React.FC<{
  title: string;
  labels: string[];
  values: number[];
  describe: (i: number) => string;
  fallback: string;
}> = ({ title, labels, values, describe, fallback }) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...values);
  const peak = Math.max(...values);
  const [box, boxW] = useWidth<HTMLDivElement>(320);
  const W = Math.max(boxW, labels.length * 36);
  const H = 110;
  const slot = W / labels.length;
  const bw = Math.min(24, slot * 0.5);
  return (
    <div className="lv-hist-block">
      <h4 className="lv-eyebrow">{title}</h4>
      <div className="lv-hist-scroll mt-3" ref={box}>
        <svg viewBox={`0 0 ${W} ${H + 18}`} width={W} height={H + 18} className="block" role="img" aria-label={`${title}: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}`}>
          <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} stroke={LINE} />
          {values.map((v, i) => {
            const x = i * slot + (slot - bw) / 2;
            const bh = v === 0 ? 0 : Math.max(4, (v / max) * (H - 20));
            const isPeak = v === peak && v > 0;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
                <rect x={i * slot} y={0} width={slot} height={H + 18} fill="transparent" />
                {v > 0 && (
                  <path
                    d={`M${x},${H} V${H - bh + 3} q0,-3 3,-3 h${bw - 6} q3,0 3,3 V${H} Z`}
                    fill={isPeak ? CYAN : TEAL}
                    opacity={isPeak ? 1 : hover === i ? 0.9 : 0.6}
                  />
                )}
                {v > 0 && (isPeak || hover === i) && (
                  <text x={x + bw / 2} y={H - bh - 5} textAnchor="middle" className="lv-num" fontSize={12} fill="#ECE5D1">
                    {v}
                  </text>
                )}
                <text x={i * slot + slot / 2} y={H + 14} textAnchor="middle" className="lv-mono" fontSize={10} fill={hover === i ? '#ECE5D1' : DIM}>
                  {labels[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <Readout text={hover !== null ? describe(hover) : null} fallback={fallback} />
    </div>
  );
};

/* ------------------------------------------------------------------------ */
/* Seção Minha História                                                      */
/* ------------------------------------------------------------------------ */
export const MyHistory: React.FC<{ tickets: CollectedTicket[] }> = ({ tickets }) => {
  const h = useMemo(() => buildHistory(tickets), [tickets]);
  const yearsDesc = [...h.years].reverse();
  const firstYear = h.years[0]?.year;

  if (h.dated.length === 0) {
    return (
      <div className="lv-hist-empty">
        <p className="text-[13.5px] text-[#B3AE9F]">
          {tickets.length === 0
            ? 'Sua história começa no primeiro ingresso salvo. Monte um poster no Estúdio e salve.'
            : 'Os ingressos salvos ainda não têm data de show reconhecida, então os gráficos não podem ser montados.'}
        </p>
      </div>
    );
  }

  const bestWeekday = h.weekdays.indexOf(Math.max(...h.weekdays));

  return (
    <div className="space-y-8">
      <p className="text-[14px] text-[#B3AE9F] max-w-[720px]">
        <strong className="text-[#ECE5D1]">{plural(h.dated.length, 'show', 'shows')}</strong> desde {firstYear}
        {h.recordYear && h.years.length > 1 && (
          <>
            . Seu ano recorde foi <strong className="text-[#4FDCDE]">{h.recordYear.year}</strong>, com{' '}
            {plural(h.recordYear.total, 'show', 'shows')}
          </>
        )}
        .
        {h.undatedCount > 0 && (
          <span className="text-[#8A8577]">
            {' '}
            {plural(h.undatedCount, 'ingresso sem data reconhecida ficou', 'ingressos sem data reconhecida ficaram')} fora dos
            gráficos por data.
          </span>
        )}
      </p>

      {/* 1. Shows por ano e por mês */}
      <div className="lv-hist-block">
        <h4 className="lv-eyebrow">Shows por ano</h4>
        <div className="mt-3">
          <YearTotals years={h.years} />
        </div>
      </div>

      <div className="lv-hist-block">
        <h4 className="lv-eyebrow">Mês a mês</h4>
        <div className="lv-hist-years mt-3">
          {yearsDesc.map((y) => (
            <YearMonths key={y.year} block={y} maxMonth={h.maxMonth} />
          ))}
        </div>
      </div>

      {/* 2. Linha do tempo */}
      {h.cumulative.length >= 2 && (
        <div className="lv-hist-block">
          <h4 className="lv-eyebrow">Linha do tempo</h4>
          <div className="mt-3">
            <Cumulative points={h.cumulative} medals={h.medalMarks} />
          </div>
        </div>
      )}

      {/* 3. Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <RankList title="Artistas mais vistos" items={h.topArtists} />
        <RankList title="Cidades" items={h.topCities} unit={['show', 'shows']} />
        <RankList title="Casas de show" items={h.topVenues} unit={['show', 'shows']} />
      </div>

      {/* 4. Dia da semana e artistas novos por ano */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <SmallColumns
          title="Dia da semana preferido"
          labels={WEEKDAYS_SHORT}
          values={h.weekdays}
          describe={(i) => `${WEEKDAYS_SHORT[i]}: ${plural(h.weekdays[i], 'show', 'shows')}`}
          fallback={`Seu dia de show: ${WEEKDAYS_SHORT[bestWeekday]}`}
        />
        <SmallColumns
          title="Artistas novos por ano"
          labels={h.years.map((y) => String(y.year))}
          values={h.years.map((y) => y.newArtists)}
          describe={(i) =>
            `${h.years[i].year}: ${plural(h.years[i].newArtists, 'artista visto', 'artistas vistos')} pela primeira vez, de ${h.years[i].artists} no ano`
          }
          fallback="Artistas que você viu ao vivo pela primeira vez em cada ano."
        />
      </div>

      {/* 5. Marcos */}
      {h.milestones.length > 0 && (
        <div className="lv-hist-block">
          <h4 className="lv-eyebrow">Marcos da história</h4>
          <ol className="lv-hist-milestones">
            {h.milestones.map((m) => (
              <li key={m.key}>
                <span className="lv-mono text-[11px] text-[#4FDCDE] w-[86px] shrink-0">{m.date ? fmtDate(m.date) : ''}</span>
                <span className="text-[13.5px] text-[#ECE5D1] font-bold">{m.title}</span>
                <span className="text-[13px] text-[#B3AE9F] min-w-0">{m.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
