import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import {
  Download,
  Sliders,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Archive,
  AtSign,
  Search,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  X,
  ChevronDown,
  CheckCircle2,
  Ticket,
  Music,
  Type,
  MoveVertical,
  Palette,
  Layers,
  Share2,
  MessageCircle,
  Wand2,
  Copy,
  Smartphone,
  Bookmark,
  Dice5,
  Flame,
  ChevronRight,
  Trophy,
  Award,
} from 'lucide-react';
import { ShowItem, ArtistItem, CardTemplateConfig, CardTemplateId, AspectRatio, CardFontFamily, CollectorRarity } from '../types';
import { EventCard } from './EventCard';
import { autoFetchArtistPhoto } from '../services/artistPhotoService';
import { MediaSearchModal } from './MediaSearchModal';
import { ShareModal } from './ShareModal';
import { TourWrappedModal } from './TourWrappedModal';
import { cleanDateOnly } from '../utils/dateUtils';
import { normalizeStateUF, isSameState } from '../utils/stateUtils';
import { normalizeArtistKey, isDateString } from '../utils/artistUtils';
import { dbService } from '../services/db';
import { PassportIcon } from './PassportIcon';
import { LivvoTicketIcon } from './LivvoTicketIcon';
import { SAMPLE_ARTISTS_DATA, generateSampleDataset } from '../services/sampleData';
import { searchCatalogApi } from '../services/catalogService';
import { extractDominantColor } from '../services/colorExtractor';
import { walletService } from '../services/walletService';

interface CardStudioProps {
  shows: ShowItem[];
  artists: ArtistItem[];
  selectedShow: ShowItem | null;
  onSelectShow: (show: ShowItem | null) => void;
  photosMap?: Map<string, string>;
  onOpenPhotoManager?: (artistCode?: string) => void;
  onOpenBatchExport?: () => void;
  onUpdateArtistPhoto?: (
    artistCode: string,
    photoUrl: string,
    source: 'upload' | 'url' | 'sample' | 'auto',
    artistName?: string
  ) => Promise<void>;
  onUpdateShowPoster?: (showIdOrCode: string, posterUrl: string) => Promise<void>;
  preselectedArtist?: ArtistItem | null;
  selectedArtist?: ArtistItem | null;
  onSelectArtist?: (artist: ArtistItem | null) => void;
  onClearPreselectedArtist?: () => void;
  onWalletUpdated?: () => void;
  onGoToWallet?: () => void;
  initialConfig?: CardTemplateConfig;
}

const ACCENT_COLORS = [
  { name: 'Teal Livvo', hex: '#2FB8BA' },
  { name: 'Ciano Brilhante', hex: '#22E3E6' },
  { name: 'Ciano', hex: '#4FDCDE' },
  { name: 'Estrela Ouro', hex: '#FFD60A' },
  { name: 'Creme Clássico', hex: '#ECE5D1' },
  { name: 'Rosa Neon', hex: '#ec4899' },
  { name: 'Coral Show', hex: '#ff5c5c' },
  { name: 'Branco Puro', hex: '#ffffff' },
];

const STYLE_VIBES = [
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    icon: '⚡',
    config: {
      templateId: 'neon-tour' as CardTemplateId,
      accentColor: '#22E3E6',
      photoFilter: 'vibrant' as const,
      fontFamily: 'impact' as CardFontFamily,
      showHologram: true,
      tagline: 'CYBER TOUR',
    },
  },
  {
    id: 'vintage',
    name: 'Vintage Woodstock',
    icon: '🎸',
    config: {
      templateId: 'minimal-editorial' as CardTemplateId,
      accentColor: '#ECE5D1',
      photoFilter: 'grain' as const,
      fontFamily: 'vintage' as CardFontFamily,
      showHologram: false,
      tagline: 'CLÁSSICO AO VIVO',
    },
  },
  {
    id: 'vip',
    name: 'Festival VIP',
    icon: '🏆',
    config: {
      templateId: 'festival-bold' as CardTemplateId,
      accentColor: '#FFD60A',
      photoFilter: 'duotone' as const,
      stampType: 'vip' as const,
      fontFamily: 'impact' as CardFontFamily,
      showHologram: true,
      tagline: 'ACESSO VIP PASS',
    },
  },
  {
    id: 'editorial',
    name: 'Minimal Editorial',
    icon: '📰',
    config: {
      templateId: 'minimal-editorial' as CardTemplateId,
      accentColor: '#ffffff',
      photoFilter: 'noir' as const,
      fontFamily: 'serif' as CardFontFamily,
      showHologram: false,
      tagline: 'EDIÇÃO LIMITADA',
    },
  },
  {
    id: 'carnaval',
    name: 'Carnaval Elétrico',
    icon: '🎭',
    config: {
      templateId: 'modern-stage' as CardTemplateId,
      accentColor: '#ec4899',
      photoFilter: 'vibrant' as const,
      stampType: 'eu-fui' as const,
      fontFamily: 'sans' as CardFontFamily,
      showHologram: true,
      tagline: 'AO VIVO NO BRASIL',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Acústico',
    icon: '🌅',
    config: {
      templateId: 'modern-stage' as CardTemplateId,
      accentColor: '#ff5c5c',
      photoFilter: 'vibrant' as const,
      fontFamily: 'sans' as CardFontFamily,
      showHologram: false,
      tagline: 'SUNSET SESSION',
    },
  },
  {
    id: 'rock',
    name: 'Rock Underground',
    icon: '🖤',
    config: {
      templateId: 'festival-bold' as CardTemplateId,
      accentColor: '#2FB8BA',
      photoFilter: 'noir' as const,
      stampType: 'eu-fui' as const,
      fontFamily: 'impact' as CardFontFamily,
      showHologram: false,
      tagline: 'ROCK UNDERGROUND',
    },
  },
  {
    id: 'hologram',
    name: 'Holo Tour Pass',
    icon: '💎',
    config: {
      templateId: 'neon-tour' as CardTemplateId,
      accentColor: '#22E3E6',
      photoFilter: 'cyber' as const,
      stampType: 'vip' as const,
      fontFamily: 'mono' as CardFontFamily,
      showHologram: true,
      tagline: 'HOLOGRAPHIC PASS',
    },
  },
];

const HISTORICAL_SHORTCUTS = [
  { label: 'Rock in Rio', query: 'Rock in Rio', icon: '🎸' },
  { label: 'Lollapalooza', query: 'Lollapalooza', icon: '🎡' },
  { label: 'The Town', query: 'The Town', icon: '🎪' },
  { label: 'Planeta Atlântida', query: 'Planeta Atlantida', icon: '🌴' },
  { label: 'Circo Voador', query: 'Circo Voador', icon: '🎪' },
  { label: 'Maracanã', query: 'Maracana', icon: '🏟️' },
  { label: 'Anos 80', query: '198', icon: '📻' },
  { label: 'Anos 90', query: '199', icon: '📼' },
  { label: 'Anos 2000', query: '200', icon: '💿' },
  { label: '2020+', query: '202', icon: '⚡' },
];

const PHOTO_FILTERS = [
  { id: 'none', label: 'Normal', desc: 'Cores originais' },
  { id: 'noir', label: 'P&B Noir', desc: 'Preto e branco dramático' },
  { id: 'duotone', label: 'Duotone', desc: 'Tingido com a cor de destaque' },
  { id: 'grain', label: 'Film Grain', desc: 'Granulado analógico vintage' },
  { id: 'vibrant', label: 'Vibrante', desc: 'Saturação e pop' },
  { id: 'cyber', label: 'Cyber Glitch', desc: 'Cromático futurista com glow' },
];

const STAMP_TYPES = [
  { id: 'none', label: 'Sem Carimbo', desc: 'Padrão limpo' },
  { id: 'eu-fui', label: 'EU FUI!', desc: 'Carimbo retrô de presença' },
  { id: 'countdown', label: 'Contagem Regressiva', desc: 'Faltam X dias / Anos' },
  { id: 'vip', label: 'VIP Pass', desc: 'Acesso especial' },
  { id: 'saudade', label: 'Show da Minha Vida', desc: 'Memória inesquecível' },
  { id: 'historico', label: 'Show Histórico', desc: 'Patrimônio da música ao vivo' },
];

const TEMPLATES: { id: CardTemplateId; name: string; desc: string }[] = [
  { id: 'modern-stage', name: 'Palco Moderno', desc: 'Gradiente atmosférico, holofotes e tipografia de impacto' },
  { id: 'festival-bold', name: 'Festival Poster', desc: 'Duotone enérgico e tipografia pesada de festivais' },
  { id: 'minimal-editorial', name: 'Editorial Minimal', desc: 'Moldura fina, tipografia clássica e elegância' },
  { id: 'neon-tour', name: 'Neon Cyber Tour', desc: 'Brilho noturno de sintetizadores e turnês eletrônicas' },
  { id: 'ticket-pass', name: 'Ingresso VIP', desc: 'Estilo ticket de show com código e borda pontilhada' },
];

const RATIOS: { id: AspectRatio; name: string; icon: string; res: string }[] = [
  { id: '9:16', name: 'Story / Reel', icon: '📱', res: '1080 × 1920' },
  { id: '1:1', name: 'Feed Quadrado', icon: '⏹️', res: '1080 × 1080' },
  { id: '4:5', name: 'Feed Vertical', icon: '📄', res: '1080 × 1350' },
  { id: '16:9', name: 'Banner Horizontal', icon: '🖥️', res: '1920 × 1080' },
];

const BADGE_PRESETS = [
  { label: 'INGRESSO VERIFICADO', desc: 'Em 2 linhas' },
  { label: 'EU FUI', desc: 'Selo presença' },
  { label: 'VIP PASS', desc: 'Acesso VIP' },
  { label: 'AO VIVO', desc: 'Em tempo real' },
];

const FONT_FAMILIES: { id: CardFontFamily; name: string; sample: string; desc: string; previewFont: string }[] = [
  { id: 'sans', name: 'Sans Moderno', sample: 'Plus Jakarta Sans', desc: 'Limpo e contemporâneo', previewFont: "'Plus Jakarta Sans', sans-serif" },
  { id: 'impact', name: 'Impact / Festival', sample: 'Oswald Bold', desc: 'Forte, condensado e marcante', previewFont: "'Oswald', sans-serif" },
  { id: 'serif', name: 'Clássico Editorial', sample: 'Playfair Display', desc: 'Elegante e sofisticado', previewFont: "'Playfair Display', serif" },
  { id: 'mono', name: 'Digital Mono', sample: 'Space Mono', desc: 'Estilo ingresso e ticket digital', previewFont: "'Space Mono', monospace" },
  { id: 'vintage', name: 'Vintage Rock', sample: 'Bebas Neue', desc: 'Pôster retrô e cartaz vintage', previewFont: "'Bebas Neue', cursive" },
];

export const CardStudio: React.FC<CardStudioProps> = ({
  shows,
  artists,
  selectedShow,
  onSelectShow,
  photosMap = new Map(),
  onOpenPhotoManager,
  onOpenBatchExport,
  onUpdateArtistPhoto,
  onUpdateShowPoster,
  preselectedArtist,
  selectedArtist: propSelectedArtist,
  onSelectArtist,
  onClearPreselectedArtist,
  onWalletUpdated,
  onGoToWallet,
  initialConfig,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Search & Filter State
  const [artistSearchQuery, setArtistSearchQuery] = useState(
    propSelectedArtist?.artistName || preselectedArtist?.artistName || ''
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedArtist, setSelectedArtistState] = useState<ArtistItem | null>(
    propSelectedArtist || preselectedArtist || null
  );

  const setSelectedArtist = (val: React.SetStateAction<ArtistItem | null>) => {
    const next = typeof val === 'function' ? val(selectedArtist) : val;
    setSelectedArtistState(next);
    if (onSelectArtist) onSelectArtist(next);
  };

  useEffect(() => {
    if (propSelectedArtist) {
      setSelectedArtistState(propSelectedArtist);
      setArtistSearchQuery(propSelectedArtist.artistName);
    }
  }, [propSelectedArtist]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [catalogArtists, setCatalogArtists] = useState<ArtistItem[]>([]);
  const [defaultPreviewArtists, setDefaultPreviewArtists] = useState<ArtistItem[]>([]);
  const [serverArtistShows, setServerArtistShows] = useState<ShowItem[]>([]);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [localPhotos, setLocalPhotos] = useState<Record<string, string>>({});

  // Auto-photo fetching state
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);
  const photoRequestId = useRef(0);
  const [autoPhotoMessage, setAutoPhotoMessage] = useState<string | null>(null);

  // Online Media Search Modal state (Posters & Photos)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalInitialTab, setMediaModalInitialTab] = useState<'posters' | 'photos'>('posters');

  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareChannel, setShareChannel] = useState<'instagram' | 'whatsapp' | 'facebook' | 'native' | null>(null);

  const handleOpenShare = (channel?: 'instagram' | 'whatsapp' | 'facebook' | 'native' | null) => {
    setShareChannel(channel || null);
    setIsShareModalOpen(true);
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExtractingColor, setIsExtractingColor] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [savedToWalletSuccess, setSavedToWalletSuccess] = useState(false);
  const [isTourWrappedOpen, setIsTourWrappedOpen] = useState(false);
  const [fanStats, setFanStats] = useState(() => walletService.getStats());

  const refreshStats = () => {
    setFanStats(walletService.getStats());
  };

  // Template configuration state
  const [config, setConfig] = useState<CardTemplateConfig>(() => ({
    templateId: 'modern-stage',
    aspectRatio: '9:16',
    visualMode: 'artist-photo',
    fontSize: 'large',
    artistNamePosition: 'bottom',
    accentColor: '#2FB8BA',
    tagline: '',
    showShowCode: true,
    showUserHandle: true,
    userHandle: '@toboi',
    showLocationBadge: true,
    showVenueBadge: true,
    showDateHighlight: true,
    contrastOverlay: 40,
    customBadgeText: 'INGRESSO VERIFICADO',
    photoFilter: 'none',
    stampType: 'none',
    showHologram: false,
    favoriteSong: '',
    phoneMockup: false,
    showCollectorBadge: false,
    collectorEdition: '#042',
    collectorRarity: 'gold',
    ticketSector: '',
    companionHandle: '',
    setlistHighlights: '',
    ...(initialConfig || {}),
  }));

  useEffect(() => {
    if (initialConfig) {
      setConfig((prev) => ({ ...prev, ...initialConfig }));
    }
  }, [initialConfig]);

  // Dropdown menu state for Personalizar Card topics (null = all controls hidden by default until clicked)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // Personalizar Card accordion toggle state (false = collapsed single line by default)
  const [isPersonalizarOpen, setIsPersonalizarOpen] = useState(false);

  const toggleDropdown = (key: string) => {
    setActiveDropdown((current) => (current === key ? null : key));
  };

  // Keep selectedArtist and location in sync when selectedShow changes externally
  useEffect(() => {
    if (selectedShow) {
      const normArtist = selectedShow.artistName.trim().toLowerCase();
      const matched =
        artists.find((a) => a.artistName.trim().toLowerCase() === normArtist) ||
        artists.find((a) => a.artistCode === selectedShow.artistCode && !/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(a.artistCode));
      if (matched && (!selectedArtist || selectedArtist.artistName.trim().toLowerCase() !== matched.artistName.trim().toLowerCase())) {
        setSelectedArtist(matched);
        setArtistSearchQuery(matched.artistName);
      }
      setSelectedState(normalizeStateUF(selectedShow.state));
      setSelectedCity(selectedShow.city);
      setSelectedVenue(selectedShow.venue);
      setSelectedDate(selectedShow.date);
    }
  }, [selectedShow, artists]);

  // Check if string looks like a date (DD/MM/YYYY, YYYY-MM-DD, etc.)
  const isDateValue = (str: string) => /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(str.trim());

  // Master list of artists combining runtime state, imported shows, and sample catalog.
  // CRITICAL: Deduplicates strictly by normalized artistName so date strings mistakenly parsed as codes
  // do not duplicate artist entries (e.g., Ney Matogrosso or Zeca Pagodinho with multiple show dates).
  const allAvailableArtists = useMemo(() => {
    const artistMap = new Map<string, ArtistItem>();

    // 1. Process all artists from state/IndexedDB
    artists.forEach((a) => {
      if (!a.artistName) return;
      const key = normalizeArtistKey(a.artistName);
      const isCodeDate = isDateString(a.artistCode || '');
      const cleanCode = !isCodeDate && a.artistCode ? a.artistCode : '';
      const count = Number(a.showsCount) || 1;

      if (!artistMap.has(key)) {
        artistMap.set(key, {
          artistCode: cleanCode || `ART-${a.artistName.trim().replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`,
          artistName: a.artistName.trim(),
          photoUrl: a.photoUrl,
          featuredPosterUrl: a.featuredPosterUrl,
          photoSource: a.photoSource,
          showsCount: count,
          updatedAt: a.updatedAt || Date.now(),
        });
      } else {
        const item = artistMap.get(key)!;
        item.showsCount += count;
        if (cleanCode && (!item.artistCode || isDateString(item.artistCode) || item.artistCode.startsWith('ART-'))) {
          item.artistCode = cleanCode;
        }
        if (!item.photoUrl && a.photoUrl) {
          item.photoUrl = a.photoUrl;
          item.photoSource = a.photoSource;
        }
        if (!item.featuredPosterUrl && a.featuredPosterUrl) {
          item.featuredPosterUrl = a.featuredPosterUrl;
        }
      }
    });

    // 2. Cross-check with shows list to ensure exact shows count per artist
    if (shows && shows.length > 0) {
      const showCountsByName = new Map<string, number>();
      shows.forEach((s) => {
        if (!s.artistName) return;
        const k = normalizeArtistKey(s.artistName);
        showCountsByName.set(k, (showCountsByName.get(k) || 0) + 1);
      });

      showCountsByName.forEach((count, k) => {
        const existing = artistMap.get(k);
        if (existing) {
          existing.showsCount = Math.max(existing.showsCount, count);
        }
      });
    }

    // 3. Guarantee all sample artists are available (including Hiatus Kaiyote)
    SAMPLE_ARTISTS_DATA.forEach((s) => {
      const key = normalizeArtistKey(s.artistName);
      if (!artistMap.has(key)) {
        artistMap.set(key, {
          artistCode: s.artistCode,
          artistName: s.artistName,
          photoUrl: s.photoUrl,
          featuredPosterUrl: s.featuredPosterUrl,
          photoSource: 'sample',
          showsCount: 1,
          updatedAt: Date.now(),
        });
      } else {
        const item = artistMap.get(key)!;
        if (!item.photoUrl && s.photoUrl) {
          item.photoUrl = s.photoUrl;
          item.featuredPosterUrl = s.featuredPosterUrl;
        }
      }
    });

    return Array.from(artistMap.values());
  }, [artists, shows]);

  // Fetch default featured preview once on mount to show when query is empty or < 3 chars
  useEffect(() => {
    let isCancelled = false;
    searchCatalogApi({ limit: 50 })
      .then((res) => {
        if (!isCancelled && res.artists && res.artists.length > 0) {
          const mapped: ArtistItem[] = res.artists.map((a: ArtistItem) => ({
            artistCode: a.artistCode,
            artistName: a.artistName,
            photoUrl: a.photoUrl,
            featuredPosterUrl: a.featuredPosterUrl,
            showsCount: a.showsCount,
            updatedAt: Date.now(),
          }));
          setDefaultPreviewArtists(mapped);
          setCatalogArtists((prev) => (prev.length === 0 ? mapped : prev));
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar prévia padrão do catálogo:', err);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  // 300ms debounced catalog search from protected server API (with in-memory caching)
  // ONLY fires network search when field has 3 or more characters (q.length >= 3).
  // Below 3 characters, shows the default featured preview without calling the API.
  useEffect(() => {
    const q = artistSearchQuery.trim();

    // If query has fewer than 3 characters, DO NOT call search API!
    // Restore the default preview without making any network request.
    if (q.length < 3) {
      setIsSearchingCatalog(false);
      if (defaultPreviewArtists.length > 0) {
        setCatalogArtists(defaultPreviewArtists);
      }
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    setIsSearchingCatalog(true);
    const handler = setTimeout(async () => {
      try {
        const res = await searchCatalogApi(
          { q, limit: 20 },
          controller.signal
        );

        if (!isCancelled) {
          const mapped: ArtistItem[] = res.artists.map((a: ArtistItem) => ({
            artistCode: a.artistCode,
            artistName: a.artistName,
            photoUrl: a.photoUrl,
            featuredPosterUrl: a.featuredPosterUrl,
            showsCount: a.showsCount,
            updatedAt: Date.now(),
          }));
          setCatalogArtists(mapped);
          setIsSearchingCatalog(false);
        }
      } catch (err: any) {
        if (!isCancelled && err.name !== 'AbortError') {
          console.warn('Erro na busca do catálogo:', err);
          setIsSearchingCatalog(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(handler);
      controller.abort();
    };
  }, [artistSearchQuery, defaultPreviewArtists]);

  // Filtered artists for autocomplete search combining server API results and local state
  const filteredArtists = useMemo(() => {
    const artistMap = new Map<string, ArtistItem>();

    // 1. Add catalog artists returned by the server API
    catalogArtists.forEach((a) => {
      const key = normalizeArtistKey(a.artistName);
      if (key) artistMap.set(key, a);
    });

    // 2. Also incorporate local artists (from state/admin imports)
    allAvailableArtists.forEach((a) => {
      const key = normalizeArtistKey(a.artistName);
      if (key && !artistMap.has(key)) {
        if (!artistSearchQuery.trim()) {
          artistMap.set(key, a);
        } else {
          const normQuery = artistSearchQuery.trim().toLowerCase();
          if (a.artistName.toLowerCase().includes(normQuery)) {
            artistMap.set(key, a);
          }
        }
      }
    });

    return Array.from(artistMap.values()).slice(0, artistSearchQuery.trim() ? 25 : 50);
  }, [catalogArtists, allAvailableArtists, artistSearchQuery]);

  const [dbArtistShows, setDbArtistShows] = useState<ShowItem[]>([]);
  const [customPosterUrl, setCustomPosterUrl] = useState<string | null>(null);

  // Load artist shows from IndexedDB directly whenever selectedArtist changes
  useEffect(() => {
    if (!selectedArtist) {
      setDbArtistShows([]);
      return;
    }
    let isCancelled = false;
    dbService
      .getShowsByArtist(selectedArtist.artistCode, selectedArtist.artistName)
      .then((results: ShowItem[]) => {
        if (!isCancelled && results && results.length > 0) {
          setDbArtistShows(results);
        }
      })
      .catch((err: any) => console.error('Erro ao buscar shows do artista no banco:', err));

    return () => {
      isCancelled = true;
    };
  }, [selectedArtist]);

  // Shows belonging to the currently selected artist (combining server API, memory, and IndexedDB)
  const artistShows = useMemo(() => {
    if (!selectedArtist) return [];
    const normTarget = selectedArtist.artistName.trim().toLowerCase();

    // 1. If server returned shows for this artist, prioritize them
    if (serverArtistShows.length > 0) {
      return serverArtistShows;
    }

    const fromMemory = shows.filter(
      (s) =>
        s.artistCode === selectedArtist.artistCode ||
        (normTarget && s.artistName.trim().toLowerCase() === normTarget)
    );
    if (fromMemory.length > 0) return fromMemory;
    if (dbArtistShows.length > 0) return dbArtistShows;

    return [];
  }, [selectedArtist, serverArtistShows, shows, dbArtistShows]);

  // Available states: if artist is selected, states from that artist's shows; otherwise, all states in catalog
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    const sourceShows = selectedArtist && artistShows.length > 0 ? artistShows : shows;
    sourceShows.forEach((s) => {
      const uf = normalizeStateUF(s.state);
      if (uf) {
        states.add(uf);
      }
    });
    if (states.size === 0) {
      const sample = generateSampleDataset();
      sample.shows.forEach((s) => {
        const uf = normalizeStateUF(s.state);
        if (uf) states.add(uf);
      });
    }
    return Array.from(states).sort();
  }, [selectedArtist, artistShows, shows]);

  // Available cities for this artist (filtered by state if a state is selected)
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    artistShows.forEach((s) => {
      if (selectedState && !isSameState(s.state, selectedState)) {
        return;
      }
      if (s.city) cities.add(s.city);
    });
    return Array.from(cities).sort();
  }, [artistShows, selectedState]);

  // Available venues for this artist (optionally filtered by state and city)
  const availableVenues = useMemo(() => {
    const venues = new Set<string>();
    artistShows.forEach((s) => {
      if (selectedState && !isSameState(s.state, selectedState)) {
        return;
      }
      if (!selectedCity || s.city === selectedCity) {
        if (s.venue) venues.add(s.venue);
      }
    });
    return Array.from(venues).sort();
  }, [artistShows, selectedState, selectedCity]);

  // Available dates for this artist, state, city, and venue
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    artistShows.forEach((s) => {
      if (selectedState && !isSameState(s.state, selectedState)) {
        return;
      }
      if ((!selectedCity || s.city === selectedCity) && (!selectedVenue || s.venue === selectedVenue)) {
        if (s.date) dates.add(s.date);
      }
    });
    return Array.from(dates).sort();
  }, [artistShows, selectedState, selectedCity, selectedVenue]);

  // Matching shows based on current state, city, venue, date filters
  const filteredShows = useMemo(() => {
    if (!selectedArtist) return [];
    return artistShows.filter((s) => {
      if (selectedState && !isSameState(s.state, selectedState)) return false;
      if (selectedCity && s.city !== selectedCity) return false;
      if (selectedVenue && s.venue !== selectedVenue) return false;
      if (selectedDate && s.date !== selectedDate) return false;
      return true;
    });
  }, [artistShows, selectedState, selectedCity, selectedVenue, selectedDate]);

  // Automated background photo link for an artist without asking the user
  const triggerAutoLinkPhoto = async (artist: ArtistItem) => {
    if (!onUpdateArtistPhoto) return;
    const requestId = ++photoRequestId.current;
    setIsFetchingPhoto(true);
    setAutoPhotoMessage(null);

    try {
      const result = await autoFetchArtistPhoto(artist.artistName);
      if (requestId !== photoRequestId.current) return;
      if (result && result.photoUrl) {
        setLocalPhotos((prev) => ({
          ...prev,
          [artist.artistCode]: result.photoUrl,
          [artist.artistName.trim().toLowerCase()]: result.photoUrl,
        }));
        setSelectedArtist((prev) =>
          prev &&
          (prev.artistCode === artist.artistCode ||
            prev.artistName.trim().toLowerCase() === artist.artistName.trim().toLowerCase())
            ? { ...prev, photoUrl: result.photoUrl }
            : prev
        );
        await onUpdateArtistPhoto(artist.artistCode, result.photoUrl, 'auto', artist.artistName);
        const sourceLabel =
          result.source === 'itunes'
            ? 'Apple Music / iTunes'
            : result.source === 'wikipedia'
            ? 'Wikimedia Oficial'
            : result.source === 'deezer'
            ? 'Deezer HQ'
            : 'TheAudioDB';
        setAutoPhotoMessage(`Foto auto-vinculada com sucesso (${sourceLabel})!`);
      }
    } catch {
      // Silent in background
    } finally {
      if (requestId === photoRequestId.current) {
        setIsFetchingPhoto(false);
        setTimeout(() => { if (requestId === photoRequestId.current) setAutoPhotoMessage(null); }, 4000);
      }
    }
  };

  // Handler: user chooses an artist
  const handleSelectArtist = (artist: ArtistItem) => {
    setSelectedArtist(artist);
    setArtistSearchQuery(artist.artistName);
    setIsSearchOpen(false);

    // Reset filters
    setSelectedState('');
    setSelectedCity('');
    setSelectedVenue('');
    setSelectedDate('');
    setAutoPhotoMessage(null);
    setCustomPosterUrl(null);

    // If artist already has photoUrl, save to localPhotos immediately
    if (artist.photoUrl) {
      setLocalPhotos((prev) => ({
        ...prev,
        [artist.artistCode]: artist.photoUrl!,
        [artist.artistName.trim().toLowerCase()]: artist.photoUrl!,
      }));
    }

    // Automatically trigger "Auto-vincular" without asking the user
    triggerAutoLinkPhoto(artist);

    // Fetch shows for this artist from the protected server API (with in-memory cache)
    searchCatalogApi({ artist: artist.artistName, limit: 25 })
      .then((catalogRes) => {
        let allShows: ShowItem[] = (catalogRes.shows || []).map((s: ShowItem) => ({
          id: s.id,
          showCode: s.showCode,
          artistCode: s.artistCode,
          artistName: s.artistName,
          tourName: s.tourName,
          venue: s.venue,
          date: s.date,
          city: s.city,
          state: s.state,
          posterUrl: s.posterUrl,
          photoUrl: (s as any).photoUrl,
        }));

        // Also check if any local shows exist in state for this artist
        if (shows && shows.length > 0) {
          const targetName = artist.artistName.trim().toLowerCase();
          const localMatches = shows.filter(
            (s) =>
              s.artistCode === artist.artistCode ||
              (s.artistName && s.artistName.trim().toLowerCase() === targetName)
          );
          if (localMatches.length > 0) {
            const existingCodes = new Set(allShows.map((s) => s.showCode));
            localMatches.forEach((ls) => {
              if (!existingCodes.has(ls.showCode)) {
                allShows.push(ls);
              }
            });
          }
        }

        setServerArtistShows(allShows);
        setDbArtistShows(allShows);

        if (allShows.length > 0) {
          const firstShow = allShows[0];
          // If only 1 show, lock to it; if multiple shows, keep city/venue/date open so user can pick other filters!
          if (allShows.length === 1) {
            setSelectedState(normalizeStateUF(firstShow.state));
            setSelectedCity(firstShow.city);
            setSelectedVenue(firstShow.venue);
            setSelectedDate(firstShow.date);
          } else {
            setSelectedState('');
            setSelectedCity('');
            setSelectedVenue('');
            setSelectedDate('');
          }
          onSelectShow(firstShow);
        } else {
          // Fallback show with artist's own name so it NEVER shows a different band
          const fallbackShow: ShowItem = {
            id: `show_${artist.artistCode}`,
            showCode: `LIVVO_${artist.artistCode}`,
            artistName: artist.artistName,
            artistCode: artist.artistCode,
            city: 'Brasil',
            state: 'BR',
            venue: 'Turnê Ao Vivo',
            date: 'Data a Definir',
            posterUrl: artist.featuredPosterUrl || artist.photoUrl,
          };
          setSelectedCity(fallbackShow.city);
          setSelectedVenue(fallbackShow.venue);
          setSelectedDate(fallbackShow.date);
          onSelectShow(fallbackShow);
        }
      })
      .catch(() => {
        const targetName = artist.artistName.trim().toLowerCase();
        const showsForThisArtist = shows.filter(
          (s) =>
            s.artistCode === artist.artistCode ||
            (s.artistName && s.artistName.trim().toLowerCase() === targetName)
        );
        if (showsForThisArtist.length > 0) {
          const firstShow = showsForThisArtist[0];
          if (showsForThisArtist.length === 1) {
            setSelectedState(normalizeStateUF(firstShow.state));
            setSelectedCity(firstShow.city);
            setSelectedVenue(firstShow.venue);
            setSelectedDate(firstShow.date);
          } else {
            setSelectedState('');
            setSelectedCity('');
            setSelectedVenue('');
            setSelectedDate('');
          }
          onSelectShow(firstShow);
        } else {
          const fallbackShow: ShowItem = {
            id: `show_${artist.artistCode}`,
            showCode: `LIVVO_${artist.artistCode}`,
            artistName: artist.artistName,
            artistCode: artist.artistCode,
            city: 'Brasil',
            state: 'BR',
            venue: 'Turnê Ao Vivo',
            date: 'Data a Definir',
            posterUrl: artist.featuredPosterUrl || artist.photoUrl,
          };
          setSelectedCity(fallbackShow.city);
          setSelectedVenue(fallbackShow.venue);
          setSelectedDate(fallbackShow.date);
          onSelectShow(fallbackShow);
        }
      });
  };

  // Listen to preselectedArtist from global search bar
  useEffect(() => {
    if (preselectedArtist) {
      handleSelectArtist(preselectedArtist);
      if (onClearPreselectedArtist) {
        onClearPreselectedArtist();
      }
    }
  }, [preselectedArtist]);

  // Handler: apply show selection when filter narrows down or user clicks a specific show
  const handleApplyShow = (show: ShowItem) => {
    setSelectedState(normalizeStateUF(show.state));
    setSelectedCity(show.city);
    setSelectedVenue(show.venue);
    setSelectedDate(show.date);
    onSelectShow(show);
  };

  // Automated photo fetch for selected artist
  const handleAutoFetchPhoto = async () => {
    if (!selectedArtist) return;
    await triggerAutoLinkPhoto(selectedArtist);
  };

  // Download Single Card as high resolution PNG
  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    if (!selectedShow && !selectedArtist) {
      setToastMessage('💡 Escolha uma banda ou show na busca acima para baixar seu card!');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    try {
      setIsExporting(true);

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        quality: 0.98,
      });

      const effectiveArtist = selectedShow?.artistName || selectedArtist?.artistName || 'card';
      const effectiveCity = selectedShow?.city || selectedCity || 'brasil';
      const effectiveCode = selectedShow?.showCode || 'livvo';
      const link = document.createElement('a');
      const safeArtist = effectiveArtist.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safeCity = effectiveCity.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `livvo_${safeArtist}_${safeCity}_${effectiveCode}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate PNG Blob for native sharing & clipboard
  const handleGeneratePngBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current || (!selectedShow && !selectedArtist)) return null;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        quality: 0.98,
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (err) {
      console.error('Erro ao gerar blob da imagem:', err);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  // 1. Auto Palette from photo
  const handleAutoPalette = async () => {
    const imgUrl = currentPhoto || currentPoster;
    if (!imgUrl) return;
    setIsExtractingColor(true);
    try {
      const hex = await extractDominantColor(imgUrl);
      if (hex) {
        setConfig((prev) => ({ ...prev, accentColor: hex }));
        setToastMessage(`✨ Cor harmonizada da foto: ${hex}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error('Erro na auto-palette:', err);
    } finally {
      setIsExtractingColor(false);
    }
  };

  // 2. Quick Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const blob = await handleGeneratePngBlob();
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopySuccess(true);
      setToastMessage('📋 Imagem copiada! Cole direto no WhatsApp ou Stories');
      setTimeout(() => {
        setCopySuccess(false);
        setToastMessage(null);
      }, 3500);
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      // Fallback
      handleDownloadPng();
    }
  };

  // 3. Save current card to Ticket Wallet (Gamification)
  const handleSaveToWallet = () => {
    if (!selectedShow && !selectedArtist) {
      setToastMessage('💡 Escolha uma banda ou show na busca acima para salvar seu passaporte!');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    const effectiveShowCode = selectedShow?.showCode || `LIVVO_${selectedArtist?.artistCode || 'TICKET'}`;
    const effectiveArtistName = selectedShow?.artistName || selectedArtist?.artistName || 'Artista';

    walletService.saveTicket({
      showCode: effectiveShowCode,
      artistName: effectiveArtistName,
      tourName: selectedShow?.tourName,
      venue: selectedShow?.venue || 'Local a confirmar',
      city: selectedShow?.city || 'Brasil',
      state: selectedShow?.state || 'BR',
      date: selectedShow?.date || new Date().toLocaleDateString('pt-BR'),
      photoUrl: currentPhoto || undefined,
      posterUrl: currentPoster || undefined,
      config: { ...config },
      stampType: config.stampType,
      favoriteSong: config.favoriteSong,
    });

    refreshStats();
    if (onWalletUpdated) onWalletUpdated();

    setSavedToWalletSuccess(true);
    setToastMessage('🎟️ Salvo no seu Passaporte de Shows! Veja na aba "Livvo Wallet"');
    setTimeout(() => {
      setSavedToWalletSuccess(false);
      setToastMessage(null);
    }, 4000);
  };

  // 4. Surpreenda-me (Random Show & Style Preset)
  const handleSurpriseMe = async () => {
    try {
      // Pick a random vibe
      const randomVibe = STYLE_VIBES[Math.floor(Math.random() * STYLE_VIBES.length)];
      
      let targetShow: ShowItem | null = null;
      if (shows && shows.length > 0) {
        targetShow = shows[Math.floor(Math.random() * shows.length)];
      } else {
        const sampleArtists = ['Anitta', 'Titãs', 'Charlie Brown Jr.', 'Raimundos', 'Ivete Sangalo', 'Nando Reis', 'Ludmilla', 'Capital Inicial'];
        const randomArtistName = sampleArtists[Math.floor(Math.random() * sampleArtists.length)];
        const res = await searchCatalogApi({ q: randomArtistName, limit: 10 });
        if (res.shows && res.shows.length > 0) {
          const s = res.shows[Math.floor(Math.random() * res.shows.length)];
          targetShow = {
            id: s.id,
            showCode: s.showCode,
            artistCode: s.artistCode,
            artistName: s.artistName,
            tourName: s.tourName,
            venue: s.venue,
            city: s.city,
            state: s.state,
            date: s.date,
          };
        }
      }

      if (targetShow) {
        handleApplyShow(targetShow);
        setConfig((prev) => ({
          ...prev,
          ...randomVibe.config,
        }));
        setToastMessage(`🎲 Sorteado: ${targetShow.artistName} com estilo ${randomVibe.name}!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Erro no Surpreenda-me:', err);
    }
  };

  // 5. Apply Historical / Festival Shortcut
  const handleHistoricalShortcut = (query: string) => {
    setArtistSearchQuery(query);
    setIsSearchOpen(true);
    searchInputRef.current?.focus();
  };

  // 6. Apply Quick Vibe
  const handleApplyVibe = (vibe: typeof STYLE_VIBES[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...vibe.config,
    }));
    setToastMessage(`⚡ Estilo "${vibe.name}" aplicado!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Current photo for selected show or artist (checks local cache, photosMap, artist record, and catalogs)
  const currentPhoto = useMemo(() => {
    const targetName = (selectedShow?.artistName || selectedArtist?.artistName || '').trim().toLowerCase();
    const targetCode = selectedShow?.artistCode || selectedArtist?.artistCode || '';

    // 1. Check local state cache first (immediate visual feedback)
    if (targetCode && localPhotos[targetCode]) return localPhotos[targetCode];
    if (targetName && localPhotos[targetName]) return localPhotos[targetName];

    // 2. Check photosMap prop
    if (targetCode && photosMap.get(targetCode)) return photosMap.get(targetCode)!;
    if (targetName && photosMap.get(targetName)) return photosMap.get(targetName)!;

    // 3. Check selectedArtist / selectedShow direct photoUrl
    if (selectedArtist?.photoUrl) return selectedArtist.photoUrl;

    // 4. Check artists array
    const foundInArtists = artists.find(
      (a) =>
        (targetName && a.artistName.trim().toLowerCase() === targetName) ||
        (targetCode && a.artistCode === targetCode)
    );
    if (foundInArtists?.photoUrl) return foundInArtists.photoUrl;

    // 5. Check allAvailableArtists
    const foundInAvailable = allAvailableArtists.find(
      (a) =>
        (targetName && a.artistName.trim().toLowerCase() === targetName) ||
        (targetCode && a.artistCode === targetCode)
    );
    if (foundInAvailable?.photoUrl) return foundInAvailable.photoUrl;

    // 6. Check SAMPLE_ARTISTS_DATA
    const foundInSample = SAMPLE_ARTISTS_DATA.find(
      (s) =>
        (targetName && s.artistName.trim().toLowerCase() === targetName) ||
        (targetCode && s.artistCode === targetCode)
    );
    if (foundInSample?.photoUrl) return foundInSample.photoUrl;

    return null;
  }, [selectedShow, selectedArtist, localPhotos, photosMap, artists, allAvailableArtists]);

  // Current official tour poster for selected show
  const currentPoster = customPosterUrl || selectedShow?.posterUrl || null;

  // Handlers for modal media selection
  const handleSelectModalPhoto = async (artistCode: string, url: string) => {
    photoRequestId.current += 1;
    setIsFetchingPhoto(false);
    setAutoPhotoMessage(null);
    const targetName = (selectedArtist?.artistName || selectedShow?.artistName || '').trim().toLowerCase();
    setLocalPhotos((prev) => ({
      ...prev,
      [artistCode]: url,
      ...(targetName ? { [targetName]: url } : {}),
    }));
    setSelectedArtist((prev) => (prev ? { ...prev, photoUrl: url } : null));

    if (onUpdateArtistPhoto) {
      await onUpdateArtistPhoto(artistCode, url, 'auto', selectedArtist?.artistName || selectedShow?.artistName);
    }

    // Auto-mount card if none is mounted yet
    let targetShow = selectedShow;
    if (!targetShow) {
      const candidate = artistShows[0] || dbArtistShows[0];
      if (candidate) {
        targetShow = candidate;
        handleApplyShow(candidate);
      } else if (selectedArtist) {
        const fallbackShow: ShowItem = {
          id: `photo_${selectedArtist.artistCode}`,
          showCode: `LIVVO_${selectedArtist.artistCode}`,
          artistName: selectedArtist.artistName,
          artistCode: selectedArtist.artistCode,
          city: 'Brasil',
          state: 'BR',
          venue: 'Turnê Ao Vivo',
          date: new Date().toLocaleDateString('pt-BR'),
        };
        targetShow = fallbackShow;
        handleApplyShow(fallbackShow);
      }
    }

    // Switch visualMode to artist-photo so the user sees it immediately on the Card
    setConfig((prev) => ({ ...prev, visualMode: 'artist-photo' }));

    // Automatically close modal after selection so user sees card immediately
    setTimeout(() => {
      setIsMediaModalOpen(false);
    }, 350);
  };

  const handleSelectModalPoster = async (showIdOrCode: string, url: string) => {
    setCustomPosterUrl(url);

    let targetShow = selectedShow;

    if (!targetShow) {
      // Find candidate show from artistShows or dbArtistShows
      const candidate = artistShows[0] || dbArtistShows[0];
      if (candidate) {
        targetShow = { ...candidate, posterUrl: url };
        handleApplyShow(targetShow);
      } else if (selectedArtist) {
        // Fallback preview show
        const fallbackShow: ShowItem = {
          id: `poster_${selectedArtist.artistCode}`,
          showCode: `LIVVO_${selectedArtist.artistCode}`,
          artistName: selectedArtist.artistName,
          artistCode: selectedArtist.artistCode,
          city: 'Turnê Oficial',
          state: 'BR',
          venue: 'Show ao Vivo',
          date: new Date().toLocaleDateString('pt-BR'),
          posterUrl: url,
        };
        targetShow = fallbackShow;
        handleApplyShow(fallbackShow);
      }
    } else {
      targetShow = { ...targetShow, posterUrl: url };
      onSelectShow(targetShow);
    }

    if (onUpdateShowPoster && targetShow) {
      await onUpdateShowPoster(targetShow.id || targetShow.showCode, url);
    }

    // Also switch visualMode to poster so the user sees it immediately
    setConfig((prev) => ({ ...prev, visualMode: 'show-poster' }));
    setTimeout(() => {
      setIsMediaModalOpen(false);
    }, 350);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP SECTION: ARTIST SEARCH & GUIDED FILTERS (CITY, VENUE, DATE)          */}
      {/* ========================================================================= */}
      <div className="bg-[#171226] border border-[#282141] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Step Indicator & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282141] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2FB8BA]/10 text-[#4FDCDE] border border-[#2FB8BA]/20 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-[#ECE5D1]">
                Crie seu Livvo Virtual Poster
              </h2>
              <p className="text-xs text-[#B3AE9F]">
                Busque o artista e filtre por cidade, casa de show e data para gerar o card oficial.
              </p>
            </div>
          </div>
        </div>

        {/* Filters Grid: Artist | Estado | Cidade | Local | Data */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* 1. Artist Search Field (Col 3) */}
          <div className="md:col-span-3 relative">
            <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5 mb-1.5">
              <Music className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Nome do Artista</span>
            </label>

            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                id="artist-search-input"
                value={artistSearchQuery}
                onChange={(e) => {
                  setArtistSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Pesquisar artista..."
                className="w-full bg-[#100C1F] border border-[#282141] rounded-2xl pl-9 pr-8 py-2.5 text-xs text-[#ECE5D1] placeholder-[#8A8577] focus:outline-none focus:border-[#2FB8BA] transition-colors"
              />
              <Search className="w-4 h-4 text-[#8A8577] absolute left-3 top-3 pointer-events-none" />

              {isSearchingCatalog ? (
                <div className="absolute right-3 top-3 pointer-events-none">
                  <RefreshCw className="w-3.5 h-3.5 text-[#2FB8BA] animate-spin" />
                </div>
              ) : artistSearchQuery ? (
                <button
                  onClick={() => {
                    setArtistSearchQuery('');
                    setSelectedArtist(null);
                    setSelectedState('');
                    setSelectedCity('');
                    setSelectedVenue('');
                    setSelectedDate('');
                    onSelectShow(null);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-2.5 text-[#8A8577] hover:text-[#ECE5D1] p-1 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown list of matching artists */}
            {isSearchOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div className="absolute z-30 top-full mt-1.5 inset-x-0 bg-[#171226] border border-[#282141] rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-[#282141]">
                  {artistSearchQuery.trim().length > 0 && artistSearchQuery.trim().length < 3 && (
                    <div className="px-3.5 py-2 bg-[#201838] border-b border-[#282141] flex items-center justify-between text-[11px] text-[#A69F8D]">
                      <span>Digite pelo menos 3 caracteres para buscar</span>
                      <span className="text-[10px] text-[#2FB8BA] font-semibold uppercase tracking-wider">
                        Destaques
                      </span>
                    </div>
                  )}
                  {isSearchingCatalog ? (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-[#282141]" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-[#282141] rounded w-3/4" />
                          <div className="h-2.5 bg-[#282141] rounded w-1/2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-[#282141]" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-[#282141] rounded w-2/3" />
                          <div className="h-2.5 bg-[#282141] rounded w-1/3" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#2FB8BA]">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Buscando no catálogo seguro...</span>
                      </div>
                    </div>
                  ) : filteredArtists.length === 0 ? (
                    <div className="p-4 text-center text-xs space-y-2">
                      <p className="text-[#8A8577]">
                        Nenhum artista na base com &quot;{artistSearchQuery}&quot;
                      </p>
                      {artistSearchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            const newArtist: ArtistItem = {
                              artistCode: `ART-${Date.now()}`,
                              artistName: artistSearchQuery.trim(),
                              showsCount: 1,
                            };
                            handleSelectArtist(newArtist);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] transition-colors cursor-pointer shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Buscar Online & Auto-vincular</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredArtists.map((artist) => {
                      const photo =
                        localPhotos[artist.artistCode] ||
                        localPhotos[artist.artistName.trim().toLowerCase()] ||
                        photosMap.get(artist.artistCode) ||
                        photosMap.get(artist.artistName.trim().toLowerCase()) ||
                        artist.photoUrl;
                      const isChosen =
                        selectedArtist?.artistName.trim().toLowerCase() ===
                        artist.artistName.trim().toLowerCase();

                      return (
                        <div
                          key={artist.artistCode}
                          onClick={() => handleSelectArtist(artist)}
                          className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-[#1E1833] transition-colors ${
                            isChosen ? 'bg-[#2FB8BA]/10' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#100C1F] border border-[#282141] shrink-0 flex items-center justify-center">
                            {photo ? (
                              <img
                                src={photo}
                                alt={artist.artistName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music className="w-4 h-4 text-[#8A8577]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#ECE5D1] truncate">
                              {artist.artistName}
                            </div>
                            <div className="text-[10px] text-[#B3AE9F] flex items-center gap-1.5">
                              <span>
                                {artist.showsCount}{' '}
                                {artist.showsCount === 1 ? 'show cadastrado' : 'shows cadastrados'}
                              </span>
                            </div>
                          </div>
                          {isChosen && (
                            <Check className="w-4 h-4 text-[#2FB8BA] shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* 2. State / UF Filter Dropdown (Col 2) */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Estado (UF)</span>
            </label>
            <div className="relative">
              <select
                id="filter-state-select"
                disabled={!selectedArtist}
                value={selectedState}
                onChange={(e) => {
                  const stateVal = e.target.value;
                  setSelectedState(stateVal);
                  setSelectedCity('');
                  setSelectedVenue('');
                  setSelectedDate('');

                  // If only one show matches this artist + state, apply it
                  const matches = artistShows.filter(
                    (s) => !stateVal || isSameState(s.state, stateVal)
                  );
                  if (matches.length === 1) {
                    handleApplyShow(matches[0]);
                  } else {
                    onSelectShow(null);
                  }
                }}
                className="w-full bg-[#100C1F] border border-[#282141] rounded-2xl px-3 py-2.5 text-xs text-[#ECE5D1] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-[#2FB8BA] appearance-none cursor-pointer"
              >
                <option value="">
                  {!selectedArtist ? 'Estado' : 'Todos os Estados'}
                </option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. City Filter Dropdown (Col 3 - filtered by selectedState) */}
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Cidade</span>
            </label>
            <div className="relative">
              <select
                id="filter-city-select"
                disabled={!selectedArtist}
                value={selectedCity}
                onChange={(e) => {
                  const city = e.target.value;
                  setSelectedCity(city);
                  setSelectedVenue('');
                  setSelectedDate('');

                  // If only one show matches, apply it
                  const matches = artistShows.filter(
                    (s) =>
                      (!selectedState || isSameState(s.state, selectedState)) &&
                      (!city || s.city === city)
                  );
                  if (matches.length === 1) {
                    handleApplyShow(matches[0]);
                  } else {
                    onSelectShow(null);
                  }
                }}
                className="w-full bg-[#100C1F] border border-[#282141] rounded-2xl px-3 py-2.5 text-xs text-[#ECE5D1] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-[#2FB8BA] appearance-none cursor-pointer"
              >
                <option value="">
                  {!selectedArtist
                    ? 'Cidade'
                    : selectedState
                    ? `Cidades de ${selectedState}`
                    : 'Todas as Cidades'}
                </option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 4. Venue / Espaço Filter Dropdown (Col 2) */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Local</span>
            </label>
            <div className="relative">
              <select
                id="filter-venue-select"
                disabled={!selectedArtist}
                value={selectedVenue}
                onChange={(e) => {
                  const venue = e.target.value;
                  setSelectedVenue(venue);
                  setSelectedDate('');

                  const matches = artistShows.filter(
                    (s) =>
                      (!selectedState || isSameState(s.state, selectedState)) &&
                      (!selectedCity || s.city === selectedCity) &&
                      (!venue || s.venue === venue)
                  );
                  if (matches.length === 1) {
                    handleApplyShow(matches[0]);
                  } else {
                    onSelectShow(null);
                  }
                }}
                className="w-full bg-[#100C1F] border border-[#282141] rounded-2xl px-3 py-2.5 text-xs text-[#ECE5D1] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-[#2FB8BA] appearance-none cursor-pointer"
              >
                <option value="">
                  {!selectedArtist ? 'Local' : 'Todos os Locais'}
                </option>
                {availableVenues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 5. Date Filter Dropdown (Col 2) */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Data</span>
            </label>
            <div className="relative">
              <select
                id="filter-date-select"
                disabled={!selectedArtist}
                value={selectedDate}
                onChange={(e) => {
                  const date = e.target.value;
                  setSelectedDate(date);

                  const match = artistShows.find(
                    (s) =>
                      (!selectedState ||
                        (s.state && s.state.toUpperCase() === selectedState.toUpperCase())) &&
                      (!selectedCity || s.city === selectedCity) &&
                      (!selectedVenue || s.venue === selectedVenue) &&
                      s.date === date
                  );
                  if (match) {
                    handleApplyShow(match);
                  } else {
                    onSelectShow(null);
                  }
                }}
                className="w-full bg-[#100C1F] border border-[#282141] rounded-2xl px-3 py-2.5 text-xs text-[#ECE5D1] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-[#2FB8BA] appearance-none cursor-pointer"
              >
                <option value="">
                  {!selectedArtist ? 'Data' : 'Todas'}
                </option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {cleanDateOnly(d)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selected Artist Details & Photo Status Bar */}
        <div className="pt-2 border-t border-[#282141] flex flex-wrap items-center justify-between gap-3">
          {selectedArtist ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#100C1F] border border-[#282141] shrink-0 flex items-center justify-center shadow">
                {currentPhoto ? (
                  <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-4 h-4 text-[#8A8577]" />
                )}
              </div>
              <span className="text-xs font-bold text-[#ECE5D1]">
                {selectedArtist.artistName}
              </span>
              {currentPhoto ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#2FB8BA] bg-[#2FB8BA]/10 px-2.5 py-0.5 rounded-full border border-[#2FB8BA]/30 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2FB8BA]" />
                  Foto vinculada
                </span>
              ) : (
                <span className="text-xs text-[#B3AE9F]">
                  ({artistShows.length} {artistShows.length === 1 ? 'show no catálogo' : 'shows no catálogo'})
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#8A8577] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Selecione uma banda ou artista para montar seu poster virtual</span>
            </div>
          )}

          {/* Quick actions for artist media */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Opção Foto / Pôster ao lado de Gerenciar Foto */}
            <div className="flex items-center bg-[#100C1F] p-0.5 rounded-xl border border-[#282141]">
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'artist-photo' }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.visualMode !== 'show-poster'
                    ? 'bg-[#2FB8BA] text-[#100C1F] shadow'
                    : 'text-[#B3AE9F] hover:text-[#ECE5D1]'
                }`}
                title="Exibir foto do artista"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Foto</span>
              </button>

              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'show-poster' }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.visualMode === 'show-poster'
                    ? 'bg-[#2FB8BA] text-[#100C1F] shadow'
                    : 'text-[#B3AE9F] hover:text-[#ECE5D1]'
                }`}
                title="Exibir pôster da turnê"
              >
                <LivvoTicketIcon className="w-3.5 h-3.5" />
                <span>Pôster</span>
                {selectedShow?.posterUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22E3E6]" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenPhotoManager?.(selectedArtist?.artistCode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ECE5D1] bg-[#1E1833] hover:bg-[#282141] border border-[#282141] transition-all cursor-pointer"
              title="Gerenciar fotos do artista"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Gerenciar Foto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMediaModalInitialTab(config.visualMode === 'show-poster' ? 'posters' : 'photos');
                setIsMediaModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] shadow-sm transition-all cursor-pointer"
              title="Abrir galeria online de pôsteres e fotos em alta resolução"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#100C1F]" />
              <span>Buscar Mídias Online</span>
            </button>

            {selectedArtist && !currentPhoto && (
              <button
                type="button"
                id="auto-fetch-photo-btn"
                onClick={handleAutoFetchPhoto}
                disabled={isFetchingPhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#282141] hover:bg-[#1E1833] text-[#4FDCDE] border border-[#2FB8BA]/30 transition-all disabled:opacity-50 cursor-pointer"
                title="Conecta o nome do artista com a foto oficial via API pública do Deezer"
              >
                {isFetchingPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4FDCDE]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#2FB8BA]" />
                )}
                <span>Auto-vincular</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback message for auto-photo */}
        {autoPhotoMessage && (
          <div className="p-2.5 rounded-xl bg-[#2FB8BA]/10 border border-[#2FB8BA]/30 text-xs text-[#4FDCDE] flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-[#FFD60A]" />
            <span>{autoPhotoMessage}</span>
          </div>
        )}

        {/* Quick show pills when artist is chosen but show is not yet finalized */}
        {selectedArtist && !selectedShow && filteredShows.length > 0 && (
          <div className="p-3 bg-[#100C1F] rounded-2xl border border-[#282141] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#B3AE9F]">
              <span className="font-bold text-[#ECE5D1]">
                Escolha um dos shows abaixo para montar o card:
              </span>
              <span>{filteredShows.length} shows encontrados</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredShows.map((sh) => (
                <button
                  key={sh.id}
                  onClick={() => handleApplyShow(sh)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E1833] hover:bg-[#282141] border border-[#282141] hover:border-[#2FB8BA] text-left transition-all group"
                >
                  <Ticket className="w-3.5 h-3.5 text-[#2FB8BA] group-hover:scale-110 transition-transform" />
                  <div className="text-xs">
                    <span className="font-bold text-[#ECE5D1] block">{sh.city} ({sh.state})</span>
                    <span className="text-[10px] text-[#B3AE9F]">{sh.venue} • {cleanDateOnly(sh.date)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MAIN STUDIO AREA: VISUAL STAGE AND CUSTOMIZATION CONTROLS                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Card Preview Stage */}
        <div className="lg:col-span-7 flex flex-col items-center gap-4">
          {/* Card Stage Container - Restored generous size (max-w-[460px], min-h-[580px]) */}
          <div className="w-full flex justify-center items-center p-4 sm:p-8 bg-[#100C1F] rounded-3xl border border-[#282141] shadow-2xl relative min-h-[580px]">
            <div className="relative shadow-2xl rounded-2xl ring-1 ring-[#282141] transition-all flex justify-center items-center w-full max-w-[460px]">
              <EventCard
                ref={cardRef}
                show={selectedShow}
                artistName={selectedArtist?.artistName}
                photoUrl={currentPhoto}
                posterUrl={currentPoster}
                config={config}
                isExporting={isExporting}
              />
            </div>
          </div>

          {/* Card Status Indicator */}
          <div className="w-full flex items-center justify-center gap-2 text-xs text-[#B3AE9F] pt-1">
            <span className={`w-2 h-2 rounded-full ${selectedShow || selectedArtist ? 'bg-[#22E3E6] animate-pulse' : 'bg-[#8A8577]'}`} />
            <span>
              {selectedShow || selectedArtist
                ? 'Card oficial em alta resolução (300 DPI) pronto para exportação'
                : 'Aguardando seleção de banda ou artista para montagem do card'}
            </span>
          </div>
        </div>

          {/* Right Column: Customization & Template Settings */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* ========================================================================= */}
            {/* CARD DE GAMIFICAÇÃO DE COLECIONADOR & PASSAPORTE DE FÃ                    */}
            {/* ========================================================================= */}
            <div className="bg-gradient-to-br from-[#171226] via-[#1A142D] to-[#120E22] rounded-3xl border border-[#FFD60A]/30 p-5 shadow-2xl relative overflow-hidden space-y-4">
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#FFD60A]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#2FB8BA]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282141] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-transparent" title="Passaporte Oficial do Colecionador">
                    <PassportIcon className="w-9 h-9 text-[#2FB8BA]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#ECE5D1] uppercase tracking-wide">
                      Passaporte do Colecionador
                    </h3>
                    <p className="text-[11px] text-[#B3AE9F]">
                      {fanStats.totalShows} {fanStats.totalShows === 1 ? 'ingresso colecionado' : 'ingressos colecionados'} • {fanStats.uniqueArtists} artistas
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                  {/* Palavra Nível / Nível de Fã acima do box */}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8577]">
                    Nível de Fã
                  </span>

                  {/* Box quadrado idêntico ao botão Livvo Wallet, com número e título centralizados e destacados */}
                  <div className="w-full min-w-[140px] px-3 py-1.5 rounded-xl text-xs font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 border border-[#2FB8BA]/30 flex items-center justify-center gap-1.5 shadow-sm text-center">
                    <span className="text-sm">{fanStats.currentMedal?.icon || '🥉'}</span>
                    <span className="font-mono font-black text-sm">{fanStats.level}</span>
                    <span className="text-[#4FDCDE]/60">-</span>
                    <span className="truncate">{fanStats.levelTitle}</span>
                  </div>

                  {/* Botão Livvo Wallet logo abaixo desse box */}
                  {onGoToWallet && (
                    <button
                      onClick={onGoToWallet}
                      className="w-full min-w-[140px] px-3 py-1.5 rounded-xl text-xs font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 hover:bg-[#2FB8BA]/20 border border-[#2FB8BA]/30 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      title="Abrir Livvo Wallet"
                    >
                      <span>Livvo Wallet</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Level Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8577]">
                  <span>
                    {fanStats.nextMedal ? (
                      <span>
                        Faltam <strong className="text-[#FFD60A]">{Math.max(0, fanStats.nextMedal.minShows - fanStats.totalShows)}</strong>{' '}
                        {Math.max(0, fanStats.nextMedal.minShows - fanStats.totalShows) === 1 ? 'show' : 'shows'} para o Nível {fanStats.nextMedal.name.replace(/^Fã\s+/, '')}
                      </span>
                    ) : (
                      <span className="text-[#FFD60A]">Nível Máximo de Fã Atingido (Lenda) 👑</span>
                    )}
                  </span>
                  <span className="text-[#FFD60A] font-bold">{fanStats.nextLevelProgress}%</span>
                </div>
                <div className="w-full bg-[#100C1F] h-1.5 rounded-full overflow-hidden border border-[#282141]">
                  <div
                    className="bg-gradient-to-r from-[#2FB8BA] via-[#4FDCDE] to-[#FFD60A] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${fanStats.nextLevelProgress}%` }}
                  />
                </div>
              </div>

              {/* Quick Action Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Salvar no Passaporte (Gamificação) */}
                <button
                  id="save-to-wallet-btn"
                  onClick={handleSaveToWallet}
                  className="inline-flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] shadow-lg shadow-black/20 active:scale-95 transition-all cursor-pointer"
                >
                  <LivvoTicketIcon className="w-4 h-4 text-[#100C1F]" />
                  <span>{savedToWalletSuccess ? 'Salvo na Livvo Wallet!' : 'Salvar o Passaporte'}</span>
                </button>

                {/* 2. Copiar Imagem (Clipboard) */}
                <button
                  id="quick-copy-image-btn"
                  onClick={handleCopyImage}
                  disabled={isExporting || (!selectedShow && !selectedArtist)}
                  className="inline-flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs bg-[#1E1833] hover:bg-[#282141] text-[#ECE5D1] border border-[#282141] hover:border-[#2FB8BA] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  title="Copiar direto para área de transferência para colar no WhatsApp ou Stories"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-[#2FB8BA]" />
                      <span className="text-[#2FB8BA]">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#4FDCDE]" />
                      <span>Copiar Imagem</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Features Row: Surpreenda-me & Gerar Tour Wrapped & Toggle Selo no Card */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#282141]/60">
                <button
                  id="quick-surprise-me-btn"
                  onClick={handleSurpriseMe}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#100C1F] hover:bg-[#1E1833] text-[#4FDCDE] border border-[#282141] hover:border-[#2FB8BA]/40 transition-all cursor-pointer"
                >
                  <Dice5 className="w-3.5 h-3.5 text-[#2FB8BA]" />
                  <span>Surpreenda-me</span>
                </button>

                <button
                  onClick={() => setIsTourWrappedOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#100C1F] hover:bg-[#1E1833] text-[#FFD60A] border border-[#282141] hover:border-[#FFD60A]/40 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
                  <span>Tour Wrapped 9:16</span>
                </button>

                {/* Toggle Selo de Colecionador no Card */}
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ECE5D1] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(config.showCollectorBadge)}
                    onChange={(e) => setConfig((prev) => ({ ...prev, showCollectorBadge: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#FFD60A] focus:ring-0 bg-[#100C1F] border-[#282141] cursor-pointer"
                  />
                  <span className={config.showCollectorBadge ? 'text-[#FFD60A]' : 'text-[#8A8577]'}>
                    Selo no Card
                  </span>
                </label>
              </div>
            </div>

            {/* Personalizar Card - Single line with Dropdown option */}
            <div className="bg-[#171226] rounded-3xl border border-[#282141] shadow-xl overflow-hidden transition-all">
              <button
                type="button"
                id="toggle-personalizar-card-btn"
                onClick={() => setIsPersonalizarOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-[#1E1833] transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-[#2FB8BA]/10 text-[#2FB8BA] shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#ECE5D1] truncate">Personalizar Card</h2>
                    <p className="text-xs text-[#B3AE9F] truncate">
                      {isPersonalizarOpen ? 'Clique para recolher opções' : 'Clique para abrir opções'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2FB8BA]/10 text-[#4FDCDE] font-mono text-[11px] border border-[#2FB8BA]/25 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22E3E6] animate-pulse" />
                    <span>5 Categorias</span>
                  </span>
                  <div className={`p-1.5 rounded-lg bg-[#282141] text-[#2FB8BA] transition-transform duration-200 ${isPersonalizarOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* All Customization Lines & Boxes Shown Inside Dropdown */}
              {isPersonalizarOpen && (
                <div className="p-5 sm:p-6 pt-2 border-t border-[#282141] space-y-4 animate-in fade-in">
                  {/* Top Dropdown Quick Selector */}
            <div className="space-y-2">
              <label htmlFor="customization-quick-select" className="text-[11px] font-bold uppercase tracking-wider text-[#4FDCDE] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#2FB8BA]" />
                  Menu Dropdown de Personalização
                </span>
                <span className="text-[10px] font-normal text-[#8A8577]">
                  {activeDropdown ? '1 tópico aberto' : 'Selecione ou clique nos boxes abaixo'}
                </span>
              </label>

              <div className="relative">
                <select
                  id="customization-quick-select"
                  value={activeDropdown || ''}
                  onChange={(e) => setActiveDropdown(e.target.value || null)}
                  className="w-full bg-[#100C1F] border border-[#282141] hover:border-[#2FB8BA]/60 text-[#ECE5D1] text-xs font-bold rounded-xl px-3.5 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-[#2FB8BA] transition-all"
                >
                  <option value="">-- Escolha um tópico das 5 Categorias --</option>
                  <optgroup label="1. Gamificação & Colecionador">
                    <option value="collector">🏆 Selo de Colecionador & Raridade</option>
                    <option value="stamp">🏷️ Carimbos de Presença (EU FUI, VIP Pass...)</option>
                  </optgroup>
                  <optgroup label="2. Vibes & Presets 1-Clique">
                    <option value="vibes">⚡ Vibes & Presets de Estilo</option>
                  </optgroup>
                  <optgroup label="3. Memória & Conteúdo do Show">
                    <option value="music">🎵 Faixa Marcante, Setor & Companhia</option>
                  </optgroup>
                  <optgroup label="4. Filtros Fotográficos & Efeitos">
                    <option value="effects">✨ Filtros de Foto & Efeito Holográfico</option>
                    <option value="art">🎨 Arte do Card (Foto ou Pôster)</option>
                    <option value="fontSize">🔤 Tamanho da Fonte (Pequeno, Médio, Grande)</option>
                    <option value="fontFamily">✒️ Tipo de Fonte (5 Famílias)</option>
                    <option value="artistPos">↕️ Posição do Nome da Banda (Em Cima, No Meio, Embaixo)</option>
                    <option value="color">🎨 Cor de Destaque Oficial</option>
                    <option value="ratio">📐 Formato & Proporção (Story, Feed...)</option>
                    <option value="template">🎭 Estilo Visual (Tema)</option>
                  </optgroup>
                  <optgroup label="5. Identificação & Detalhes">
                    <option value="venue">🏟️ Casa de Show e Localização</option>
                    <option value="userHandle">👤 Usuário (@nomedousuario)</option>
                    <option value="badge">🏷️ Selo de Status Superior</option>
                    <option value="tagline">✍️ Frase Superior (Tagline)</option>
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#2FB8BA]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Grid de Personalização: 50% horizontal (2 boxes lado a lado por linha) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B3AE9F]">
                  Menus de Personalização (Dois lado a lado):
                </span>
                <span className="text-[10px] text-[#8A8577]">
                  Clique em qualquer box para abrir
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Box A: Selo de Colecionador & Raridade */}
                <div
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    activeDropdown === 'collector'
                      ? 'sm:col-span-2 bg-[#1E1833] border-[#FFD60A] shadow-lg shadow-[#FFD60A]/10'
                      : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#FFD60A]/40'
                  }`}
                >
                  <button
                    type="button"
                    id="dropdown-topic-collector"
                    onClick={() => toggleDropdown('collector')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${activeDropdown === 'collector' ? 'bg-[#FFD60A] text-[#100C1F]' : 'bg-[#282141] text-[#FFD60A]'}`}>
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#ECE5D1] block">Selo de Colecionador & Raridade</span>
                        <span className="text-[10px] text-[#8A8577]">Emblema oficial, número da edição e raridade</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-[#FFD60A] bg-[#FFD60A]/10 px-2 py-0.5 rounded-full border border-[#FFD60A]/20">
                        {config.showCollectorBadge ? `Ativo (${config.collectorRarity || 'Ouro'})` : 'Desativado'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                          activeDropdown === 'collector' ? 'rotate-180 text-[#FFD60A]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {activeDropdown === 'collector' && (
                    <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#171226] border border-[#282141]">
                        <div>
                          <span className="text-xs font-bold text-[#ECE5D1] block">Exibir Selo de Colecionador no Card</span>
                          <span className="text-[10px] text-[#8A8577]">Adiciona emblema com raridade e série no card</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(config.showCollectorBadge)}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showCollectorBadge: e.target.checked }))}
                          className="w-5 h-5 rounded text-[#FFD60A] focus:ring-0 bg-[#100C1F] border-[#282141] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#ECE5D1] block">Raridade do Card Colecionável:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {[
                            { id: 'gold', label: 'Ouro ✨' },
                            { id: 'platinum', label: 'Platina 💎' },
                            { id: 'diamond', label: 'Diamante ⚡' },
                            { id: 'legendary', label: 'Lendário 👑' },
                            { id: 'classic', label: 'Vintage 🎟️' },
                          ].map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setConfig((prev) => ({ ...prev, collectorRarity: r.id as CollectorRarity, showCollectorBadge: true }))}
                              className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                config.collectorRarity === r.id && config.showCollectorBadge
                                  ? 'border-[#FFD60A] bg-[#FFD60A]/15 text-[#ECE5D1] shadow'
                                  : 'border-[#282141] bg-[#171226] text-[#8A8577] hover:text-[#ECE5D1]'
                              }`}
                            >
                              <span className="block text-sm mb-0.5">{r.label.slice(-2)}</span>
                              <span className="text-[10px] block truncate">{r.label.slice(0, -2)}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#ECE5D1] flex items-center justify-between">
                          <span>Número da Edição / Série:</span>
                          <span className="text-[10px] text-[#8A8577]">Ex: #001, #042, #777</span>
                        </label>
                        <input
                          type="text"
                          value={config.collectorEdition || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, collectorEdition: e.target.value }))}
                          placeholder="#042"
                          className="w-full bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] font-mono focus:outline-none focus:border-[#FFD60A]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Box B: Carimbos de Presença & Tempo */}
                <div
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    activeDropdown === 'stamp'
                      ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                      : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                  }`}
                >
                  <button
                    type="button"
                    id="dropdown-topic-stamp"
                    onClick={() => toggleDropdown('stamp')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${activeDropdown === 'stamp' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#ECE5D1] block">Carimbos de Presença</span>
                        <span className="text-[10px] text-[#8A8577]">Carimbo EU FUI, Show Histórico, Contagem</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                        {STAMP_TYPES.find((s) => s.id === (config.stampType || 'none'))?.label || 'Sem carimbo'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                          activeDropdown === 'stamp' ? 'rotate-180 text-[#2FB8BA]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {activeDropdown === 'stamp' && (
                    <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2 animate-fadeIn">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {STAMP_TYPES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, stampType: s.id as any }))}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              (config.stampType || 'none') === s.id
                                ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                                : 'bg-[#100C1F] border-[#282141] text-[#8A8577] hover:text-[#ECE5D1]'
                            }`}
                          >
                            <span className="text-xs font-bold text-[#ECE5D1] block">{s.label}</span>
                            <span className="text-[10px] text-[#8A8577] block mt-0.5">{s.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Box C: Vibes & Presets 1-Clique */}
                <div
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    activeDropdown === 'vibes'
                      ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                      : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                  }`}
                >
                  <button
                    type="button"
                    id="dropdown-topic-vibes"
                    onClick={() => toggleDropdown('vibes')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${activeDropdown === 'vibes' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#ECE5D1] block">Vibes & Presets de Estilo</span>
                        <span className="text-[10px] text-[#8A8577]">8 estilos visuais pré-configurados em 1 clique</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                        8 Presets
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                          activeDropdown === 'vibes' ? 'rotate-180 text-[#2FB8BA]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {activeDropdown === 'vibes' && (
                    <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STYLE_VIBES.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleApplyVibe(v)}
                            className="p-3 rounded-xl border border-[#282141] bg-[#171226] hover:bg-[#1E1833] hover:border-[#2FB8BA] text-left transition-all cursor-pointer group"
                          >
                            <span className="text-lg block mb-1 group-hover:scale-110 transition-transform">{v.icon}</span>
                            <span className="text-xs font-bold text-[#ECE5D1] block leading-tight">{v.name}</span>
                            <span className="text-[9px] text-[#8A8577] block mt-0.5">{v.config.tagline}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Box D: Memória & Conteúdo do Show */}
                <div
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    activeDropdown === 'music'
                      ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                      : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                  }`}
                >
                  <button
                    type="button"
                    id="dropdown-topic-music"
                    onClick={() => toggleDropdown('music')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${activeDropdown === 'music' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#ECE5D1] block">Faixa Marcante, Setor & Companhia</span>
                        <span className="text-[10px] text-[#8A8577]">Música favorita, lugar no show e quem foi com você</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                        {config.favoriteSong ? 'Configurado' : 'Opcional'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                          activeDropdown === 'music' ? 'rotate-180 text-[#2FB8BA]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {activeDropdown === 'music' && (
                    <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-3 animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#ECE5D1] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Music className="w-3 h-3 text-[#2FB8BA]" />
                            Faixa Marcante (Música Favorita do Show):
                          </span>
                          <span className="text-[10px] text-[#8A8577]">Aparece como tag no card</span>
                        </label>
                        <input
                          type="text"
                          value={config.favoriteSong || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, favoriteSong: e.target.value }))}
                          placeholder="Ex: Céu Azul, Mulher de Fases, Show das Poderosas..."
                          className="w-full bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#ECE5D1] block">Setor do Ingresso:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {['Pista Premium', 'Na Grade', 'Camarote VIP', 'Pista', 'Cadeira'].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => setConfig((prev) => ({ ...prev, ticketSector: config.ticketSector === sec ? '' : sec }))}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                config.ticketSector === sec
                                  ? 'border-[#FFD60A] bg-[#FFD60A]/15 text-[#FFD60A]'
                                  : 'border-[#282141] bg-[#171226] text-[#8A8577] hover:text-[#ECE5D1]'
                              }`}
                            >
                              {sec}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#ECE5D1] flex items-center justify-between">
                          <span>Companhia no Show:</span>
                          <span className="text-[10px] text-[#8A8577]">Ex: @mariana, @amor, @amigos</span>
                        </label>
                        <input
                          type="text"
                          value={config.companionHandle || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, companionHandle: e.target.value }))}
                          placeholder="Ex: @mariana"
                          className="w-full bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] font-mono focus:outline-none focus:border-[#2FB8BA]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#ECE5D1] flex items-center justify-between">
                          <span>Destaques da Turnê / Setlist:</span>
                          <span className="text-[10px] text-[#8A8577]">Músicas marcantes separadas por ponto</span>
                        </label>
                        <input
                          type="text"
                          value={config.setlistHighlights || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, setlistHighlights: e.target.value }))}
                          placeholder="Ex: Céu Azul • Zoio de Lula • Proibida pra Mim"
                          className="w-full bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Box E: Filtros de Foto & Efeito Holográfico */}
                <div
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    activeDropdown === 'effects'
                      ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                      : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                  }`}
                >
                  <button
                    type="button"
                    id="dropdown-topic-effects"
                    onClick={() => toggleDropdown('effects')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${activeDropdown === 'effects' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#ECE5D1] block">Filtros de Foto & Efeito Holográfico</span>
                        <span className="text-[10px] text-[#8A8577]">P&B Noir, Duotone, Grain, Cyber e Brilho Foil</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                        {PHOTO_FILTERS.find((f) => f.id === (config.photoFilter || 'none'))?.label || 'Normal'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                          activeDropdown === 'effects' ? 'rotate-180 text-[#2FB8BA]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {activeDropdown === 'effects' && (
                    <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-3 animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#ECE5D1] block">Filtro de Imagem:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PHOTO_FILTERS.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setConfig((prev) => ({ ...prev, photoFilter: f.id as any }))}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                (config.photoFilter || 'none') === f.id
                                  ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                                  : 'bg-[#100C1F] border-[#282141] text-[#8A8577] hover:text-[#ECE5D1]'
                              }`}
                            >
                              <span className="text-xs font-bold text-[#ECE5D1] block">{f.label}</span>
                              <span className="text-[10px] text-[#8A8577] block mt-0.5">{f.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#171226] border border-[#282141]">
                        <div>
                          <span className="text-xs font-bold text-[#ECE5D1] block">Película Prismática Holográfica (Foil)</span>
                          <span className="text-[10px] text-[#8A8577]">Brilho iridescente sobreposto ao card</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(config.showHologram)}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showHologram: e.target.checked }))}
                          className="w-5 h-5 rounded text-[#2FB8BA] focus:ring-0 bg-[#100C1F] border-[#282141] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#ECE5D1]">
                          <span>Intensidade do Contraste / Sombra:</span>
                          <span className="font-mono text-[#2FB8BA]">{config.contrastOverlay}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="80"
                          value={config.contrastOverlay}
                          onChange={(e) => setConfig((prev) => ({ ...prev, contrastOverlay: parseInt(e.target.value) }))}
                          className="w-full accent-[#2FB8BA] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Box 1: Arte do Card */}
                <div
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    activeDropdown === 'art'
                      ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                      : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                  }`}
                >
                <button
                  type="button"
                  id="dropdown-topic-art"
                  onClick={() => toggleDropdown('art')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors ${activeDropdown === 'art' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#ECE5D1] block">Arte do Card</span>
                      <span className="text-[10px] text-[#8A8577]">Foto de palco ou pôster oficial</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                      {config.visualMode === 'show-poster' ? 'Pôster Oficial' : 'Foto do Artista'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'art' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'art' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#B3AE9F]">Escolha a fonte visual de fundo:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaModalInitialTab(config.visualMode === 'show-poster' ? 'posters' : 'photos');
                          setIsMediaModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-[#4FDCDE] hover:text-[#22E3E6] flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3 h-3" />
                        <span>Galeria Online</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'artist-photo' }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          config.visualMode !== 'show-poster'
                            ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                            : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#ECE5D1]">
                          <ImageIcon className="w-3.5 h-3.5 text-[#2FB8BA]" />
                          <span>Foto do Artista</span>
                        </div>
                        <div className="text-[10px] text-[#8A8577] mt-0.5">
                          {currentPhoto ? 'Foto vinculada ✓' : 'Sem foto'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'show-poster' }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          config.visualMode === 'show-poster'
                            ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                            : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#ECE5D1]">
                          <Ticket className="w-3.5 h-3.5 text-[#2FB8BA]" />
                          <span>Pôster Oficial</span>
                        </div>
                        <div className="text-[10px] text-[#8A8577] mt-0.5">
                          {selectedShow?.posterUrl ? 'Pôster oficial ✓' : 'Buscar pôster'}
                        </div>
                      </button>
                    </div>

                    {selectedShow?.tourName && (
                      <div className="text-[11px] text-[#4FDCDE] font-semibold flex items-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2FB8BA]" />
                        <span>Turnê: {selectedShow.tourName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2: Tamanho da Fonte (Com Controle Deslizante e Botões Rápidos) */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'fontSize'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-font-size"
                  onClick={() => toggleDropdown('fontSize')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'fontSize' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Type className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-[#ECE5D1] block truncate">Tamanho da Fonte</span>
                      <span className="text-[10px] text-[#8A8577] block truncate">Slider e botões rápidos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                      {config.fontSize === 'small' ? 'Pequeno' : config.fontSize === 'medium' ? 'Médio' : 'Grande'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'fontSize' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'fontSize' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-4 animate-fadeIn">
                    {/* Controle Deslizante Slider */}
                    <div className="space-y-2 bg-[#100C1F] p-3 rounded-xl border border-[#282141]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#ECE5D1] flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#2FB8BA]" />
                          Controle Deslizante (Slider)
                        </span>
                        <span className="font-mono text-[#4FDCDE] font-bold text-xs bg-[#2FB8BA]/10 px-2 py-0.5 rounded border border-[#2FB8BA]/30">
                          {config.fontSize === 'small' ? 'Pequeno (80%)' : config.fontSize === 'medium' ? 'Médio (90%)' : 'Grande (100% Padrão)'}
                        </span>
                      </div>

                      <div className="px-1 py-1">
                        <input
                          type="range"
                          id="font-size-slider"
                          min="1"
                          max="3"
                          step="1"
                          value={config.fontSize === 'small' ? 1 : config.fontSize === 'medium' ? 2 : 3}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const size = val === 1 ? 'small' : val === 2 ? 'medium' : 'large';
                            setConfig((prev) => ({ ...prev, fontSize: size }));
                          }}
                          className="w-full accent-[#2FB8BA] cursor-pointer h-2 bg-[#1E1833] rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-[#8A8577] font-semibold pt-1">
                          <span className={config.fontSize === 'small' ? 'text-[#4FDCDE] font-bold' : ''}>Pequeno (80%)</span>
                          <span className={config.fontSize === 'medium' ? 'text-[#4FDCDE] font-bold' : ''}>Médio (90%)</span>
                          <span className={(config.fontSize || 'large') === 'large' ? 'text-[#4FDCDE] font-bold' : ''}>Grande (100%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões Rápidos */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-[#B3AE9F] font-bold block">
                        Botões Rápidos (Feedback Imediato no Card):
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'small', label: 'Pequeno', desc: '80% Compacto', badge: 'A-' },
                          { id: 'medium', label: 'Médio', desc: '90% Equilibrado', badge: 'A' },
                          { id: 'large', label: 'Grande', desc: '100% Padrão', badge: 'A+' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            id={`font-size-btn-${opt.id}`}
                            onClick={() => setConfig((prev) => ({ ...prev, fontSize: opt.id as any }))}
                            className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                              (config.fontSize || 'large') === opt.id
                                ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50 shadow-md shadow-[#2FB8BA]/10'
                                : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/40 hover:text-[#ECE5D1]'
                            }`}
                          >
                            <div className="text-base font-black text-[#4FDCDE] mb-0.5">{opt.badge}</div>
                            <div className="text-xs font-bold text-[#ECE5D1]">{opt.label}</div>
                            <div className="text-[9px] text-[#8A8577] mt-0.5">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 3: Tipo de Fonte (Tipografia / Família da Fonte) */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'fontFamily'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-font-family"
                  onClick={() => toggleDropdown('fontFamily')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'fontFamily' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Type className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-[#ECE5D1] block truncate">Tipo de Fonte</span>
                      <span className="text-[10px] text-[#8A8577] block truncate">Família tipográfica</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                      {FONT_FAMILIES.find((f) => f.id === (config.fontFamily || 'sans'))?.name || 'Sans Moderno'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'fontFamily' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'fontFamily' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2.5 animate-fadeIn">
                    <span className="text-[11px] text-[#B3AE9F] font-bold block">
                      Selecione o tipo de fonte para aplicar no Card:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {FONT_FAMILIES.map((font) => (
                        <button
                          key={font.id}
                          type="button"
                          id={`font-family-${font.id}`}
                          onClick={() => setConfig((prev) => ({ ...prev, fontFamily: font.id }))}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            (config.fontFamily || 'sans') === font.id
                              ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50 shadow-md shadow-[#2FB8BA]/10'
                              : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/40 hover:text-[#ECE5D1]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#ECE5D1]">{font.name}</span>
                            {(config.fontFamily || 'sans') === font.id && (
                              <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                            )}
                          </div>
                          <div
                            className="text-base text-[#4FDCDE] font-black mt-1 tracking-wide truncate"
                            style={{ fontFamily: font.previewFont }}
                          >
                            {selectedShow?.artistName || 'Nome da Banda'}
                          </div>
                          <p className="text-[10px] text-[#8A8577] mt-0.5">{font.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 4: Posição do Nome da Banda */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'artistPos'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-artist-pos"
                  onClick={() => toggleDropdown('artistPos')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'artistPos' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <MoveVertical className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-[#ECE5D1] block truncate">Posição da Banda</span>
                      <span className="text-[10px] text-[#8A8577] block truncate">Em cima, no meio ou embaixo</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                      {config.artistNamePosition === 'top' ? 'Em Cima' : config.artistNamePosition === 'middle' ? 'No Meio' : 'Embaixo'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'artistPos' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'artistPos' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2 animate-fadeIn">
                    <span className="text-[11px] text-[#B3AE9F] block mb-1">Escolha a disposição vertical:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'top', label: 'Em Cima', desc: 'Abaixo do Logo' },
                        { id: 'middle', label: 'No Meio', desc: 'Centro do Card' },
                        { id: 'bottom', label: 'Atual Local', desc: 'Embaixo (Padrão)' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          id={`artist-pos-${opt.id}`}
                          onClick={() => setConfig((prev) => ({ ...prev, artistNamePosition: opt.id as any }))}
                          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            (config.artistNamePosition || 'bottom') === opt.id
                              ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                              : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/40 hover:text-[#ECE5D1]'
                          }`}
                        >
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className="text-[9px] text-[#8A8577] mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Box: Casa de Show & Localização */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'venue'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-venue"
                  onClick={() => toggleDropdown('venue')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'venue' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1] truncate">Casa de Show (Box no Card)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20 truncate max-w-[120px]">
                      {config.showVenueBadge !== false ? 'Visível' : 'Oculto'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'venue' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'venue' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-3 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-[#ECE5D1] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.showVenueBadge !== false}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showVenueBadge: e.target.checked }))}
                          className="rounded border-[#282141] text-[#2FB8BA] focus:ring-0 accent-[#2FB8BA]"
                        />
                        <span className="font-bold">Exibir Casa de Show no Card (Entre Data e Cidade)</span>
                      </label>
                      <p className="text-[10px] text-[#8A8577] pl-5">
                        Exibe o nome da casa de show com exatamente o mesmo tamanho, ícone e destaque da data e da cidade.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#282141]/60">
                      <label className="text-[11px] font-bold text-[#B3AE9F] block mb-1">
                        Casa de Show do Evento:
                      </label>
                      <div className="flex items-center gap-2 bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs font-bold text-[#ECE5D1]">
                        <Building2 className="w-3.5 h-3.5 text-[#2FB8BA] shrink-0" />
                        <span className="truncate">{selectedShow?.venue || 'Nenhum show selecionado'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 5: Usuário no Card */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'userHandle'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-user-handle"
                  onClick={() => toggleDropdown('userHandle')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'userHandle' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <AtSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1] truncate">Usuário (@nomedousuario)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                      {config.showUserHandle ? (config.userHandle || '@toboi') : 'Oculto'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'userHandle' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'userHandle' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-[#B3AE9F] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.showUserHandle}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showUserHandle: e.target.checked }))}
                          className="rounded border-[#282141] text-[#2FB8BA] focus:ring-0 accent-[#2FB8BA]"
                        />
                        <span>Exibir no Card</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      id="user-handle-input"
                      value={config.userHandle}
                      onChange={(e) => setConfig((prev) => ({ ...prev, userHandle: e.target.value }))}
                      placeholder="@toboi"
                      className="w-full bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs font-mono text-[#4FDCDE] font-bold focus:outline-none focus:border-[#2FB8BA]"
                    />
                    <p className="text-[10px] text-[#8A8577]">
                      Identificador oficial do usuário exibido abaixo do selo Livvo.
                    </p>
                  </div>
                )}
              </div>

              {/* Box 6: Selo de Status */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'badge'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-badge"
                  onClick={() => toggleDropdown('badge')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'badge' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1] truncate">Selo de Status</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20 truncate max-w-[120px]">
                      {config.customBadgeText || 'INGRESSO VERIFICADO'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'badge' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'badge' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2.5 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2">
                      {BADGE_PRESETS.map((b) => (
                        <button
                          key={b.label}
                          type="button"
                          id={`badge-preset-${b.label.replace(/\s+/g, '-').toLowerCase()}`}
                          onClick={() => setConfig((prev) => ({ ...prev, customBadgeText: b.label }))}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            config.customBadgeText === b.label
                              ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                              : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/40'
                          }`}
                        >
                          <div className="text-xs font-extrabold text-[#ECE5D1]">{b.label}</div>
                          <div className="text-[10px] text-[#8A8577]">{b.desc}</div>
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      id="custom-badge-input"
                      value={config.customBadgeText}
                      onChange={(e) => setConfig((prev) => ({ ...prev, customBadgeText: e.target.value }))}
                      placeholder="Digite outro texto de selo..."
                      className="w-full bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                    />
                  </div>
                )}
              </div>

              {/* Box 7: Formato & Proporção */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'ratio'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-ratio"
                  onClick={() => toggleDropdown('ratio')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'ratio' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1] truncate">Formato & Proporção</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20">
                      {RATIOS.find((r) => r.id === config.aspectRatio)?.name || 'Story (9:16)'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'ratio' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'ratio' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2">
                      {RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          id={`ratio-${r.id.replace(':', '-')}`}
                          onClick={() => setConfig((prev) => ({ ...prev, aspectRatio: r.id }))}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            config.aspectRatio === r.id
                              ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                              : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/50 hover:text-[#ECE5D1]'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{r.icon}</span>
                            <span className="text-xs font-bold text-[#ECE5D1]">{r.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#8A8577]">{r.res}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 8: Cor de Destaque */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'color'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-color"
                  onClick={() => toggleDropdown('color')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'color' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1] truncate">Cor de Destaque</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                      style={{ backgroundColor: config.accentColor }}
                    />
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'color' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'color' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, accentColor: c.hex }))}
                          className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                            config.accentColor === c.hex
                              ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#171226]'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 9: Estilo Visual (Tema) */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'template'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-template"
                  onClick={() => toggleDropdown('template')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'template' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1] truncate">Estilo Visual (Tema)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20 truncate max-w-[120px]">
                      {TEMPLATES.find((t) => t.id === config.templateId)?.name || 'Modern Stage'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'template' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'template' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, templateId: t.id }))}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            config.templateId === t.id
                              ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] text-[#ECE5D1] ring-1 ring-[#2FB8BA]/50'
                              : 'bg-[#100C1F] border-[#282141] text-[#B3AE9F] hover:border-[#2FB8BA]/40 hover:text-[#ECE5D1]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#ECE5D1]">{t.name}</span>
                            {config.templateId === t.id && (
                              <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#8A8577] mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 10: Frase Superior */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  activeDropdown === 'tagline'
                    ? 'sm:col-span-2 bg-[#1E1833] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/10'
                    : 'bg-[#1E1833]/80 border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                <button
                  type="button"
                  id="dropdown-topic-tagline"
                  onClick={() => toggleDropdown('tagline')}
                  className="w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${activeDropdown === 'tagline' ? 'bg-[#2FB8BA] text-[#100C1F]' : 'bg-[#282141] text-[#2FB8BA]'}`}>
                      <Type className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1] truncate">Frase Superior (Tagline)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold text-[#4FDCDE] bg-[#2FB8BA]/10 px-2 py-0.5 rounded-full border border-[#2FB8BA]/20 truncate max-w-[120px]">
                      {config.tagline || 'Nenhuma'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8A8577] transition-transform duration-200 ${
                        activeDropdown === 'tagline' ? 'rotate-180 text-[#2FB8BA]' : ''
                      }`}
                    />
                  </div>
                </button>

                {activeDropdown === 'tagline' && (
                  <div className="p-4 pt-2 border-t border-[#282141] bg-[#100C1F]/50 space-y-2 animate-fadeIn">
                    <input
                      type="text"
                      value={config.tagline || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Ex: TURNÊ NACIONAL, AO VIVO, FESTIVAL..."
                      className="w-full bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

            {/* Options directly BELOW Personalizar Card: Download and Compartilhar side by side */}
              <div>
                <div className="flex items-center gap-3">
                  {/* Download Button */}
                  <button
                    id="download-card-png-btn"
                    onClick={handleDownloadPng}
                    disabled={isExporting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-sm bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] shadow-lg shadow-black/25 active:scale-95 transition-all cursor-pointer"
                    title="Baixar Card em PNG de alta resolução (300 DPI)"
                  >
                    {downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-[#100C1F]" />
                        <span>Baixado!</span>
                      </>
                    ) : isExporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#100C1F]" />
                        <span>Gerando PNG...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-[#100C1F]" />
                        <span>Download PNG</span>
                      </>
                    )}
                  </button>

                  {/* Compartilhar Button (triggers social media options) */}
                  <button
                    id="share-card-btn"
                    onClick={() => handleOpenShare()}
                    disabled={isExporting || (!selectedShow && !selectedArtist)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-sm bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    title="Compartilhar nas redes sociais (Instagram, WhatsApp, Facebook)"
                  >
                    <Share2 className="w-4 h-4 text-[#100C1F]" />
                    <span>Compartilhar</span>
                  </button>
                </div>
              </div>
          </div>
        </div>

      {/* Online Media Search Modal (Posters & Photos) */}
      <MediaSearchModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        artist={selectedArtist}
        selectedShow={selectedShow}
        onSelectPhoto={handleSelectModalPhoto}
        onSelectPoster={handleSelectModalPoster}
        initialTab={mediaModalInitialTab}
      />

      {/* Social Share Modal (Instagram, WhatsApp, Facebook) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareChannel(null);
        }}
        show={selectedShow}
        onGeneratePng={handleGeneratePngBlob}
        onDownloadPng={handleDownloadPng}
        initialChannel={shareChannel}
      />

      {/* Tour Wrapped Modal (Resumo Retrospectiva do Fã 9:16) */}
      <TourWrappedModal
        isOpen={isTourWrappedOpen}
        onClose={() => setIsTourWrappedOpen(false)}
        stats={fanStats}
        tickets={walletService.getTickets()}
        userHandle={config.userHandle}
      />
    </div>
  );
};
