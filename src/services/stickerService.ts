/**
 * Livvo Stickers — álbum de conquistas da Wallet.
 *
 * Os 51 stickers vêm de `Livvo Stickers/stickers-data.json` (linha Color, 256 px).
 * USO DE TESTE: a coleção ainda não está aprovada (decisão do usuário, 04/10/2026).
 *
 * O desbloqueio é calculado só com o que cada ingresso salvo tem: artista,
 * cidade, estado (UF) e data. Stickers que dependem de review ou de gênero
 * musical ficam como "em breve" até o app ter esses dados.
 */
import STICKERS_RAW from '../data/stickers.json';
import type { CollectedTicket } from './walletService';

export interface StickerDef {
  slug: string;
  name: string;
  family: string;
  criterion: string;
}

export interface StickerState extends StickerDef {
  image: string;
  status: 'unlocked' | 'locked' | 'soon';
  current: number;
  target: number;
  /** Data do show que desbloqueou o sticker (dd/MM/yyyy) e a ordem da conquista */
  unlockedOn?: string;
  unlockOrder?: number;
}

export const STICKERS: StickerDef[] = STICKERS_RAW as StickerDef[];

export const STICKER_FAMILIES: { id: string; label: string }[] = [
  { id: 'entrada-descoberta', label: 'Primeiros passos' },
  { id: 'quantidade-total', label: 'Shows no total' },
  { id: 'mesmo-artista', label: 'Mesmo artista' },
  { id: 'mesma-cidade', label: 'Mesma cidade' },
  { id: 'mesmo-estado', label: 'Mesmo estado' },
  { id: 'cidades-diferentes', label: 'Cidades diferentes' },
  { id: 'cidades-mesmo-mes', label: 'Turnê no mesmo mês' },
  { id: 'estados-diferentes', label: 'Estados diferentes' },
  { id: 'regioes-brasil', label: 'Regiões do Brasil' },
  { id: 'frequencia-diversidade', label: 'Frequência e estilos' },
  { id: 'mesmo-genero', label: 'Mesmo gênero' },
  { id: 'reviews-total', label: 'Reviews' },
  { id: 'reviews-mesmo-genero', label: 'Reviews do mesmo gênero' },
];

const UF_REGION: Record<string, string> = {
  AC: 'N', AP: 'N', AM: 'N', PA: 'N', RO: 'N', RR: 'N', TO: 'N',
  AL: 'NE', BA: 'NE', CE: 'NE', MA: 'NE', PB: 'NE', PE: 'NE', PI: 'NE', RN: 'NE', SE: 'NE',
  DF: 'CO', GO: 'CO', MT: 'CO', MS: 'CO',
  ES: 'SE', MG: 'SE', RJ: 'SE', SP: 'SE',
  PR: 'S', RS: 'S', SC: 'S',
};
const STATE_NAME_TO_UF: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE', 'distrito federal': 'DF',
  'espirito santo': 'ES', goias: 'GO', maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI',
  'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR',
  'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
};

const norm = (v: string) =>
  (v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

const toUF = (state: string) => {
  const s = norm(state);
  if (s.length === 2) return s.toUpperCase();
  return STATE_NAME_TO_UF[s] || '';
};

const parseDate = (d: string): Date | null => {
  const m = (d || '').match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const iso = (d || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return null;
};

const maxCount = (keys: string[]) => {
  const c = new Map<string, number>();
  keys.filter(Boolean).forEach((k) => c.set(k, (c.get(k) || 0) + 1));
  return Math.max(0, ...c.values());
};

/** Regras: slug -> [alvo, função que mede o valor atual]. Ausente = "em breve". */
type Measure = (t: CollectedTicket[]) => number;

const total: Measure = (t) => t.length;
const distinctArtists: Measure = (t) => new Set(t.map((x) => norm(x.artistName))).size;
const sameArtist: Measure = (t) => maxCount(t.map((x) => norm(x.artistName)));
const cityKey = (x: CollectedTicket) => `${norm(x.city)}|${toUF(x.state) || norm(x.state)}`;
const sameCity: Measure = (t) => maxCount(t.map(cityKey));
const sameState: Measure = (t) => maxCount(t.map((x) => toUF(x.state)));
const distinctCities: Measure = (t) => new Set(t.filter((x) => x.city).map(cityKey)).size;
const distinctStates: Measure = (t) => new Set(t.map((x) => toUF(x.state)).filter(Boolean)).size;
const distinctRegions: Measure = (t) =>
  new Set(t.map((x) => UF_REGION[toUF(x.state)]).filter(Boolean)).size;
const artistInCities: Measure = (t) => {
  const m = new Map<string, Set<string>>();
  t.forEach((x) => {
    const a = norm(x.artistName);
    if (!m.has(a)) m.set(a, new Set());
    m.get(a)!.add(cityKey(x));
  });
  return Math.max(0, ...[...m.values()].map((s) => s.size));
};
const citiesSameMonth: Measure = (t) => {
  const m = new Map<string, Set<string>>();
  t.forEach((x) => {
    const d = parseDate(x.date);
    if (!d) return;
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!m.has(k)) m.set(k, new Set());
    m.get(k)!.add(cityKey(x));
  });
  return Math.max(0, ...[...m.values()].map((s) => s.size));
};
const showsSameWeek: Measure = (t) => {
  const days = t
    .map((x) => parseDate(x.date))
    .filter((d): d is Date => !!d)
    .map((d) => Math.floor(d.getTime() / 86400000))
    .sort((a, b) => a - b);
  let best = 0;
  for (let i = 0, j = 0; i < days.length; i++) {
    while (days[i] - days[j] > 6) j++;
    best = Math.max(best, i - j + 1);
  }
  return best;
};

const RULES: Record<string, [number, Measure]> = {
  'eu-tava-la': [1, total],
  'prazer-proximo-show': [5, distinctArtists],
  'segui-o-som': [3, artistInCities],
  'pegou-o-ritmo': [10, total],
  'agenda-lotada': [25, total],
  'patrimonio-da-plateia': [50, total],
  'lenda-do-ao-vivo': [100, total],
  'figurinha-carimbada': [5, sameArtist],
  'sei-ate-as-pausas': [10, sameArtist],
  'bis-por-favor': [25, sameArtist],
  'ja-sou-da-mobilia': [50, sameArtist],
  'pode-me-por-no-release': [100, sameArtist],
  'role-de-casa': [10, sameCity],
  'nome-na-praca': [25, sameCity],
  'de-carteirinha': [50, sameCity],
  'patrimonio-do-role': [100, sameCity],
  'na-minha-area': [10, sameState],
  'circuito-de-casa': [25, sameState],
  'de-canto-a-canto': [50, sameState],
  'lenda-do-circuito': [100, sameState],
  'proxima-parada-show': [3, distinctCities],
  'mala-de-role': [5, distinctCities],
  'gps-do-bis': [10, distinctCities],
  'meu-cep-e-o-show': [25, distinctCities],
  'mini-turne-pessoal': [3, citiesSameMonth],
  'em-turne-so-que-fa': [5, citiesSameMonth],
  'cruzei-a-divisa': [3, distinctStates],
  'rota-do-bis': [5, distinctStates],
  'turne-sem-contrato': [10, distinctStates],
  'brasil-em-frequencia': [3, distinctRegions],
  'do-oiapoque-ao-bis': [5, distinctRegions],
  'zerei-o-mapa-quero-bis': [27, distinctStates],
  'semana-em-alto-volume': [3, showsSameWeek],
};

export function evaluateStickers(tickets: CollectedTicket[]): StickerState[] {
  // Ordem cronológica dos shows (data do show; sem data, a ordem em que foi salvo)
  const ordered = [...tickets].sort((a, b) => {
    const da = parseDate(a.date)?.getTime() ?? a.collectedAt ?? 0;
    const db = parseDate(b.date)?.getTime() ?? b.collectedAt ?? 0;
    return da - db;
  });

  return STICKERS.map((s) => {
    const rule = RULES[s.slug];
    const image = `/stickers/${s.slug}.webp`;
    if (!rule) return { ...s, image, status: 'soon' as const, current: 0, target: 0 };
    const [target, measure] = rule;
    const current = Math.min(target, measure(tickets));
    if (current < target) return { ...s, image, status: 'locked' as const, current, target };
    // Primeiro show da linha do tempo em que o critério foi atingido
    let unlockOrder = ordered.length - 1;
    for (let i = 0; i < ordered.length; i++) {
      if (measure(ordered.slice(0, i + 1)) >= target) {
        unlockOrder = i;
        break;
      }
    }
    return {
      ...s,
      image,
      status: 'unlocked' as const,
      current,
      target,
      unlockOrder,
      unlockedOn: ordered[unlockOrder]?.date,
    };
  });
}

/** Colados em ordem de conquista; a conquistar do mais perto ao mais longe; em breve no fim. */
export function sortStickers(states: StickerState[]): StickerState[] {
  const rank = { unlocked: 0, locked: 1, soon: 2 } as const;
  return [...states].sort((a, b) => {
    if (a.status !== b.status) return rank[a.status] - rank[b.status];
    if (a.status === 'unlocked') return (a.unlockOrder ?? 0) - (b.unlockOrder ?? 0);
    if (a.status === 'locked') return a.target - a.current - (b.target - b.current) || a.target - b.target;
    return 0;
  });
}

/** Primeiro sticker ainda não conquistado de uma trilha ordenada de slugs. */
export function nextStickerFor(states: StickerState[], slugs: string[]): StickerState | undefined {
  for (const slug of slugs) {
    const st = states.find((s) => s.slug === slug);
    if (st && st.status === 'locked') return st;
  }
  return undefined;
}

const SEEN_KEY = 'livvo_stickers_seen_v1';

/** Retorna os stickers desbloqueados que o fã ainda não viu e marca todos como vistos. */
export function takeNewlyUnlocked(states: StickerState[]): StickerState[] {
  const unlocked = states.filter((s) => s.status === 'unlocked');
  let seen: string[] | null = null;
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    seen = raw ? JSON.parse(raw) : null;
  } catch {
    seen = null;
  }
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(unlocked.map((s) => s.slug)));
  } catch {
    /* sem armazenamento: só não avisa */
  }
  // Primeira visita: não dispara aviso para o que já existia
  if (seen === null) return [];
  return unlocked.filter((s) => !seen!.includes(s.slug));
}
