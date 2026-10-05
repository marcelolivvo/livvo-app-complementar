// Minha História: números da trajetória do fã, calculados só a partir dos ingressos salvos na Wallet.
import { CollectedTicket, FAN_MEDAL_TIERS } from './walletService';
import { cleanDateOnly } from '../utils/dateUtils';
import { cleanCityOnly, normalizeStateUF } from '../utils/stateUtils';

export const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
export const MONTHS_NAME = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export interface DatedShow {
  ticket: CollectedTicket;
  date: Date;
}

export interface YearBlock {
  year: number;
  total: number;
  months: number[]; // 12 posições, jan..dez
  isRecord: boolean;
  newArtists: number; // artistas vistos pela primeira vez neste ano
  artists: number; // artistas distintos no ano
}

export interface RankItem {
  label: string;
  sub?: string;
  count: number;
}

export interface Milestone {
  key: string;
  title: string;
  detail: string;
  date?: Date;
}

export interface HistoryData {
  dated: DatedShow[];
  undatedCount: number;
  years: YearBlock[]; // ordem cronológica
  recordYear?: YearBlock;
  maxMonth: number; // maior valor mensal (escala comum a todos os anos)
  cumulative: { date: Date; count: number }[];
  medalMarks: { name: string; minShows: number; date: Date }[];
  topArtists: RankItem[];
  topCities: RankItem[];
  topVenues: RankItem[];
  weekdays: number[]; // seg..dom
  milestones: Milestone[];
}

/** Converte a data do ingresso (DD/MM/AAAA, AAAA-MM-DD, ISO) em Date local. */
export function parseShowDate(raw?: string | null): Date | null {
  const clean = cleanDateOnly(raw);
  const m = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  if (Number.isNaN(d.getTime()) || d.getMonth() !== Number(m[2]) - 1) return null;
  return d;
}

export const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

function rank(map: Map<string, RankItem>, n = 5): RankItem[] {
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR')).slice(0, n);
}

export function buildHistory(tickets: CollectedTicket[]): HistoryData {
  const dated: DatedShow[] = [];
  let undatedCount = 0;
  for (const t of tickets) {
    const d = parseShowDate(t.date);
    if (d) dated.push({ ticket: t, date: d });
    else undatedCount++;
  }
  dated.sort((a, b) => a.date.getTime() - b.date.getTime());

  // ---- Por ano e mês + artistas novos por ano ----
  const byYear = new Map<number, YearBlock>();
  const seenArtists = new Set<string>();
  const artistsInYear = new Map<number, Set<string>>();
  for (const { ticket, date } of dated) {
    const y = date.getFullYear();
    if (!byYear.has(y)) {
      byYear.set(y, { year: y, total: 0, months: Array(12).fill(0), isRecord: false, newArtists: 0, artists: 0 });
      artistsInYear.set(y, new Set());
    }
    const block = byYear.get(y)!;
    block.total++;
    block.months[date.getMonth()]++;
    const a = norm(ticket.artistName || '');
    if (a) {
      artistsInYear.get(y)!.add(a);
      if (!seenArtists.has(a)) {
        seenArtists.add(a);
        block.newArtists++;
      }
    }
  }
  const years = [...byYear.values()].sort((a, b) => a.year - b.year);
  years.forEach((b) => (b.artists = artistsInYear.get(b.year)!.size));
  // Ano recorde: maior total; empate fica com o mais recente
  let recordYear: YearBlock | undefined;
  for (const b of years) if (!recordYear || b.total >= recordYear.total) recordYear = b;
  if (recordYear) recordYear.isRecord = true;
  const maxMonth = Math.max(1, ...years.flatMap((b) => b.months));

  // ---- Acumulado + quando cada medalha foi alcançada ----
  const cumulative = dated.map((s, i) => ({ date: s.date, count: i + 1 }));
  const medalMarks = FAN_MEDAL_TIERS.filter((m) => m.minShows <= dated.length).map((m) => ({
    name: m.name,
    minShows: m.minShows,
    date: dated[m.minShows - 1].date,
  }));

  // ---- Rankings (todos os ingressos, mesmo sem data) ----
  const artists = new Map<string, RankItem>();
  const cities = new Map<string, RankItem>();
  const venues = new Map<string, RankItem>();
  for (const t of tickets) {
    const an = (t.artistName || '').trim();
    if (an) {
      const k = norm(an);
      const it = artists.get(k) || { label: an, count: 0 };
      it.count++;
      artists.set(k, it);
    }
    const city = cleanCityOnly(t.city);
    const uf = normalizeStateUF(t.state);
    if (city) {
      const k = `${norm(city)}|${uf}`;
      const it = cities.get(k) || { label: city, sub: uf || undefined, count: 0 };
      it.count++;
      cities.set(k, it);
    }
    const venue = (t.venue || '').trim();
    if (venue) {
      const k = norm(venue);
      const it = venues.get(k) || { label: venue, sub: city || undefined, count: 0 };
      it.count++;
      venues.set(k, it);
    }
  }

  // ---- Dia da semana (seg..dom) ----
  const weekdays = Array(7).fill(0);
  for (const { date } of dated) weekdays[(date.getDay() + 6) % 7]++;

  // ---- Marcos ----
  const milestones: Milestone[] = [];
  if (dated.length) {
    const first = dated[0];
    milestones.push({
      key: 'first',
      title: 'Primeiro show',
      detail: `${first.ticket.artistName}, ${cleanCityOnly(first.ticket.city) || first.ticket.venue}`,
      date: first.date,
    });
    for (const n of [10, 25, 50, 100, 250, 500]) {
      if (dated.length >= n) {
        const s = dated[n - 1];
        milestones.push({
          key: `n${n}`,
          title: `Show nº ${n}`,
          detail: `${s.ticket.artistName}, ${cleanCityOnly(s.ticket.city) || s.ticket.venue}`,
          date: s.date,
        });
      }
    }
    if (dated.length >= 2) {
      // Maior intervalo sem show
      let gap = 0;
      let gapFrom = dated[0].date;
      let gapTo = dated[0].date;
      for (let i = 1; i < dated.length; i++) {
        const diff = Math.round((dated[i].date.getTime() - dated[i - 1].date.getTime()) / 86400000);
        if (diff > gap) {
          gap = diff;
          gapFrom = dated[i - 1].date;
          gapTo = dated[i].date;
        }
      }
      if (gap > 0) {
        milestones.push({
          key: 'gap',
          title: 'Maior intervalo sem show',
          detail: `${gap} ${gap === 1 ? 'dia' : 'dias'}, de ${fmtDate(gapFrom)} a ${fmtDate(gapTo)}`,
        });
      }
      // Maior sequência de meses seguidos com show
      const monthIdx = [...new Set(dated.map((s) => s.date.getFullYear() * 12 + s.date.getMonth()))].sort((a, b) => a - b);
      let best = 1;
      let bestEnd = monthIdx[0];
      let run = 1;
      for (let i = 1; i < monthIdx.length; i++) {
        run = monthIdx[i] === monthIdx[i - 1] + 1 ? run + 1 : 1;
        if (run > best) {
          best = run;
          bestEnd = monthIdx[i];
        }
      }
      if (best >= 2) {
        const startIdx = bestEnd - best + 1;
        const lbl = (idx: number) => `${MONTHS_NAME[idx % 12]}/${Math.floor(idx / 12)}`;
        milestones.push({
          key: 'streak',
          title: 'Meses seguidos com show',
          detail: `${best} meses, de ${lbl(startIdx)} a ${lbl(bestEnd)}`,
        });
      }
    }
  }

  return {
    dated,
    undatedCount,
    years,
    recordYear,
    maxMonth,
    cumulative,
    medalMarks,
    topArtists: rank(artists),
    topCities: rank(cities),
    topVenues: rank(venues),
    weekdays,
    milestones,
  };
}
