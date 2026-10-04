import { ShowItem, CardTemplateConfig } from '../types';

export interface CollectedTicket {
  id: string;
  showCode: string;
  artistName: string;
  tourName?: string;
  venue: string;
  city: string;
  state: string;
  date: string;
  photoUrl?: string;
  posterUrl?: string;
  config: CardTemplateConfig;
  collectedAt: number;
  stampType?: string;
  favoriteSong?: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  rewardXp: number;
  rewardBadge: string;
  icon: string;
  category: 'photos' | 'artists' | 'shows' | 'cities' | 'customization';
  actionPrompt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface FanMedalTier {
  level: number;
  id: string;
  name: string; // 'Fã Bronze', 'Fã Prata', 'Fã Ouro', 'Fã Platina', 'Lenda Viva'
  minShows: number;
  icon: string;
  metalColor: string;
  gradient: string;
  borderGlow: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface FanStats {
  totalShows: number;
  effectiveShows: number;
  bonusShowsFromChallenges: number;
  uniqueArtists: number;
  uniqueStates: number;
  uniqueCities: number;
  estimatedHours: number;
  oldestShowYear?: number;
  topArtist?: { name: string; count: number };
  level: number;
  levelTitle: string;
  nextLevelProgress: number;
  currentMedal: FanMedalTier;
  nextMedal?: FanMedalTier;
}

export const FAN_MEDAL_TIERS: Omit<FanMedalTier, 'unlocked' | 'unlockedAt'>[] = [
  {
    level: 1,
    id: 'fan-bronze',
    name: 'Fã Bronze',
    minShows: 1,
    icon: '🥉',
    metalColor: '#CD7F32',
    gradient: 'from-amber-700 via-amber-600 to-amber-900',
    borderGlow: 'border-amber-600/50 shadow-amber-700/20',
    description: 'Até 10 shows registrados no passaporte de shows',
  },
  {
    level: 2,
    id: 'fan-prata',
    name: 'Fã Prata',
    minShows: 11,
    icon: '🥈',
    metalColor: '#C0C0C0',
    gradient: 'from-slate-400 via-slate-200 to-zinc-500',
    borderGlow: 'border-slate-300/50 shadow-slate-300/20',
    description: 'De 11 a 25 shows colecionados na sua trajetória',
  },
  {
    level: 3,
    id: 'fan-ouro',
    name: 'Fã Ouro',
    minShows: 26,
    icon: '🥇',
    metalColor: '#FFD60A',
    gradient: 'from-amber-500 via-yellow-300 to-yellow-600',
    borderGlow: 'border-yellow-400/50 shadow-yellow-500/20',
    description: 'De 26 a 50 shows: presença VIP nos maiores palcos',
  },
  {
    level: 4,
    id: 'fan-platina',
    name: 'Fã Platina',
    minShows: 51,
    icon: '💎',
    metalColor: '#4FDCDE',
    gradient: 'from-cyan-500 via-teal-300 to-blue-600',
    borderGlow: 'border-cyan-400/50 shadow-cyan-500/20',
    description: 'De 51 a 100 shows: autoridade de pista e festivais',
  },
  {
    level: 5,
    id: 'fan-lenda',
    name: 'Lenda Viva',
    minShows: 101,
    icon: '👑',
    metalColor: '#FFD60A',
    gradient: 'from-yellow-400 via-amber-300 to-purple-600',
    borderGlow: 'border-yellow-400 shadow-yellow-400/40 ring-2 ring-yellow-400/50',
    description: 'Nível máximo: 101 shows ou mais, verdadeira lenda dos espetáculos',
  },
];

const STORAGE_KEY = 'livvo_wallet_tickets_v1';

export const walletService = {
  getTickets(): CollectedTicket[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Erro ao ler ingressos da carteira:', e);
      return [];
    }
  },

  saveTicket(ticket: Omit<CollectedTicket, 'id' | 'collectedAt'>): CollectedTicket {
    const tickets = this.getTickets();
    const id = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTicket: CollectedTicket = {
      ...ticket,
      id,
      collectedAt: Date.now(),
    };

    const filtered = tickets.filter(
      (t) => !(t.showCode === newTicket.showCode && t.artistName.toLowerCase() === newTicket.artistName.toLowerCase())
    );

    filtered.unshift(newTicket);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Erro ao salvar ingresso:', e);
    }
    return newTicket;
  },

  removeTicket(id: string): void {
    const tickets = this.getTickets().filter((t) => t.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Erro ao remover ingresso:', e);
    }
  },

  isCollected(showCode: string, artistName: string): boolean {
    if (!showCode) return false;
    const tickets = this.getTickets();
    return tickets.some(
      (t) => t.showCode === showCode || (t.artistName.toLowerCase() === artistName.toLowerCase() && t.date)
    );
  },

  getFanMedals(): FanMedalTier[] {
    const tickets = this.getTickets();
    const totalShows = tickets.length;

    return FAN_MEDAL_TIERS.map((tier) => ({
      ...tier,
      unlocked: totalShows >= tier.minShows,
      unlockedAt: totalShows >= tier.minShows ? tickets[tickets.length - 1]?.collectedAt || Date.now() : undefined,
    }));
  },

  getStats(): FanStats {
    const tickets = this.getTickets();
    const totalShows = tickets.length;

    const artistMap = new Map<string, number>();
    const stateSet = new Set<string>();
    const citySet = new Set<string>();
    let oldestYear: number | undefined;

    tickets.forEach((t) => {
      if (t.artistName) {
        const norm = t.artistName.trim().toLowerCase();
        artistMap.set(norm, (artistMap.get(norm) || 0) + 1);
      }
      if (t.state) stateSet.add(t.state.toUpperCase());
      if (t.city) citySet.add(t.city.toLowerCase());

      const match = t.date?.match(/\b(19\d{2}|20\d{2})\b/);
      if (match) {
        const year = parseInt(match[1], 10);
        if (!oldestYear || year < oldestYear) oldestYear = year;
      }
    });

    let topArtist: { name: string; count: number } | undefined;
    let maxCount = 0;
    artistMap.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        const match = tickets.find((t) => t.artistName.toLowerCase() === key);
        topArtist = { name: match?.artistName || key, count };
      }
    });

    const completedChallenges = this.getCompletedChallengeIds();
    const bonusShowsFromChallenges = completedChallenges.length;
    const effectiveShows = totalShows + bonusShowsFromChallenges;

    const medals = this.getFanMedals();
    let currentMedal = medals[0];
    let nextMedal: FanMedalTier | undefined = medals[1];
    let nextLevelProgress = 0;

    // Faixas: Bronze 1–10, Prata 11–25, Ouro 26–50, Platina 51–100, Lenda Viva 101+
    if (effectiveShows === 0) {
      currentMedal = { ...medals[0], unlocked: false };
      nextMedal = medals[0];
      nextLevelProgress = 0;
    } else {
      let idx = 0;
      medals.forEach((m, i) => {
        if (effectiveShows >= m.minShows) idx = i;
      });
      currentMedal = medals[idx];
      nextMedal = medals[idx + 1];
      nextLevelProgress = nextMedal
        ? Math.round(((effectiveShows - currentMedal.minShows) / (nextMedal.minShows - currentMedal.minShows)) * 100)
        : 100;
    }

    const level = effectiveShows === 0 ? 0 : currentMedal.level;
    const levelTitle = effectiveShows === 0 ? 'Novo Fã' : currentMedal.name;

    return {
      totalShows,
      effectiveShows,
      bonusShowsFromChallenges,
      uniqueArtists: artistMap.size,
      uniqueStates: stateSet.size,
      uniqueCities: citySet.size,
      estimatedHours: totalShows * 2,
      oldestShowYear: oldestYear,
      topArtist,
      level,
      levelTitle,
      nextLevelProgress: Math.min(Math.max(0, nextLevelProgress), 100),
      currentMedal,
      nextMedal,
    };
  },

  getCompletedChallengeIds(): string[] {
    try {
      const raw = localStorage.getItem('livvo_completed_challenges_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  toggleChallengeCompletion(challengeId: string): boolean {
    const ids = this.getCompletedChallengeIds();
    const exists = ids.includes(challengeId);
    let nextIds: string[];
    if (exists) {
      nextIds = ids.filter((id) => id !== challengeId);
    } else {
      nextIds = [...ids, challengeId];
    }
    localStorage.setItem('livvo_completed_challenges_v1', JSON.stringify(nextIds));
    return !exists;
  },

  getBadges(): AchievementBadge[] {
    const stats = this.getStats();
    const tickets = this.getTickets();

    const hasHologram = tickets.some((t) => t.config?.showHologram);
    const hasFestival = tickets.some(
      (t) =>
        t.venue?.toLowerCase().includes('festival') ||
        t.tourName?.toLowerCase().includes('festival') ||
        t.venue?.toLowerCase().includes('rock in rio') ||
        t.venue?.toLowerCase().includes('lollapalooza') ||
        t.venue?.toLowerCase().includes('the town')
    );
    const hasOldSchool = stats.oldestShowYear ? stats.oldestShowYear < 2010 : false;
    const hasSuperFan = (stats.topArtist?.count || 0) >= 2;

    return [
      {
        id: 'first-ticket',
        title: 'Primeira Fila',
        description: 'Colecionou seu 1º ingresso oficial',
        icon: '🎟️',
        unlocked: stats.totalShows >= 1,
      },
      {
        id: 'interstate-tour',
        title: 'Turnê na Estrada',
        description: 'Shows em 2 ou mais estados diferentes',
        icon: '🛣️',
        unlocked: stats.uniqueStates >= 2,
      },
      {
        id: 'super-fan',
        title: 'Fã Incondicional',
        description: '2 ou mais shows do mesmo artista',
        icon: '👑',
        unlocked: hasSuperFan,
      },
      {
        id: 'time-traveler',
        title: 'Túnel do Tempo',
        description: 'Colecionou um show histórico (antes de 2010)',
        icon: '⏳',
        unlocked: hasOldSchool,
      },
      {
        id: 'festival-rat',
        title: 'Rato de Festival',
        description: 'Esteve presente em um festival ou grande arena',
        icon: '🎪',
        unlocked: hasFestival,
      },
      {
        id: 'holographic-pass',
        title: 'Ingresso VIP Dourado',
        description: 'Personalizou um card com selo holográfico exclusivo',
        icon: '✨',
        unlocked: hasHologram,
      },
      {
        id: 'master-collector',
        title: 'Lenda da Música',
        description: 'Alcançou a marca de 5 ingressos colecionados',
        icon: '🏆',
        unlocked: stats.totalShows >= 5,
      },
    ];
  },

  getWeeklyChallenges(): WeeklyChallenge[] {
    const tickets = this.getTickets();
    const stats = this.getStats();
    const completedIds = new Set(this.getCompletedChallengeIds());

    // 1. Photos challenge (user example: 'Adicione 3 fotos de shows desse mês')
    const ticketsWithPhotos = tickets.filter((t) => t.photoUrl || t.posterUrl).length;

    // 2. Artists diversity challenge
    const uniqueArtists = stats.uniqueArtists;

    // 3. States/Cities exploration
    const uniqueCities = stats.uniqueCities;

    // 4. Ticket with favorite song or custom stamp
    const customizedTickets = tickets.filter((t) => t.favoriteSong || t.stampType).length;

    // 5. Total shows collected
    const totalShows = tickets.length;

    return [
      {
        id: 'challenge_photos',
        title: 'Adicione 3 fotos de shows desse mês',
        description: 'Vincule fotos ao vivo do palco ou pôsteres de turnê aos seus ingressos para enriquecer o passaporte.',
        target: 3,
        current: completedIds.has('challenge_photos') ? 3 : Math.min(3, ticketsWithPhotos),
        completed: completedIds.has('challenge_photos') || ticketsWithPhotos >= 3,
        rewardXp: 150,
        rewardBadge: 'Fotógrafo de Palco',
        icon: '📸',
        category: 'photos',
        actionPrompt: 'Buscar Fotos no Estúdio',
      },
      {
        id: 'challenge_artists',
        title: 'Colecione shows de 3 artistas diferentes',
        description: 'Diversifique sua jornada musical registrando diferentes bandas e cantores ao vivo no Brasil.',
        target: 3,
        current: completedIds.has('challenge_artists') ? 3 : Math.min(3, uniqueArtists),
        completed: completedIds.has('challenge_artists') || uniqueArtists >= 3,
        rewardXp: 120,
        rewardBadge: 'Fã Eclético',
        icon: '🎸',
        category: 'artists',
        actionPrompt: 'Salvar Novo Artista',
      },
      {
        id: 'challenge_cities',
        title: 'Desbrave shows em 2 cidades diferentes',
        description: 'Colecione ingressos de festivais ou shows em cidades ou estados diferentes pelo país.',
        target: 2,
        current: completedIds.has('challenge_cities') ? 2 : Math.min(2, uniqueCities),
        completed: completedIds.has('challenge_cities') || uniqueCities >= 2,
        rewardXp: 100,
        rewardBadge: 'Passaporte na Estrada',
        icon: '📍',
        category: 'cities',
        actionPrompt: 'Explorar Cidades',
      },
      {
        id: 'challenge_custom',
        title: 'Personalize 2 cards com Selo VIP ou Música Favorita',
        description: 'Destaque a música inesquecível daquele show ou ative o carimbo oficial no CardStudio.',
        target: 2,
        current: completedIds.has('challenge_custom') ? 2 : Math.min(2, customizedTickets),
        completed: completedIds.has('challenge_custom') || customizedTickets >= 2,
        rewardXp: 80,
        rewardBadge: 'Colecionador Detalhista',
        icon: '✨',
        category: 'customization',
        actionPrompt: 'Personalizar no Estúdio',
      },
      {
        id: 'challenge_shows',
        title: 'Atinja 5 shows salvos na sua Livvo Wallet',
        description: 'Complete 5 ingressos para garantir o marco de presença VIP e o título de Fã Ouro.',
        target: 5,
        current: completedIds.has('challenge_shows') ? 5 : Math.min(5, totalShows),
        completed: completedIds.has('challenge_shows') || totalShows >= 5,
        rewardXp: 200,
        rewardBadge: 'Rumo ao Nível Ouro 🥇',
        icon: '🎟️',
        category: 'shows',
        actionPrompt: 'Adicionar Ingressos',
      },
    ];
  },

  seedInitialWallet(sampleShows: ShowItem[], photosMap: Map<string, string>, defaultConfigs: CardTemplateConfig): void {
    if (this.getTickets().length > 0) return;
    if (!sampleShows || sampleShows.length === 0) return;

    const picked = sampleShows.slice(0, 3);
    const initialTickets: CollectedTicket[] = picked.map((show, idx) => ({
      id: `seed_ticket_${idx}`,
      showCode: show.showCode,
      artistName: show.artistName,
      tourName: show.tourName,
      venue: show.venue,
      city: show.city,
      state: show.state,
      date: show.date,
      photoUrl: photosMap.get(show.artistCode) || photosMap.get(show.artistName.toLowerCase()),
      posterUrl: show.posterUrl,
      config: {
        ...defaultConfigs,
        accentColor: idx === 0 ? '#2FB8BA' : idx === 1 ? '#FFD60A' : '#ec4899',
        stampType: idx === 0 ? 'eu-fui' : 'verified',
        showHologram: idx === 0,
      },
      collectedAt: Date.now() - (idx + 1) * 86400000 * 15,
      favoriteSong: idx === 0 ? 'Fix You' : idx === 1 ? 'Cruel Summer' : undefined,
    }));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTickets));
    } catch (e) {
      console.error('Erro ao semear carteira:', e);
    }
  },
};
