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
  Lock,
} from 'lucide-react';
import { ShowItem, ArtistItem, CardTemplateConfig, CardTemplateId, AspectRatio, CardFontFamily, CollectorRarity } from '../types';
import { EventCard } from './EventCard';
import { RetroTicket, RetroTicketStage } from './RetroTicket';
import { autoFetchArtistPhoto } from '../services/artistPhotoService';
import { MediaSearchModal } from './MediaSearchModal';
import { getIntegrationStatus, findSetlistForShow } from '../services/liveDataService';
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
import { FanMedalIllustration } from './MedalIllustrations';
import { guestService, GUEST_CARD_LIMIT } from '../services/guestService';
import { VERIFICATION_SOON } from '../utils/livvoBrand';

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

  // Guarda o artista mais recente: atualizações em sequência (ex.: busca de foto logo após escolher o artista)
  // não podem partir de um valor antigo, senão o artista escolhido se perde.
  const selectedArtistRef = useRef<ArtistItem | null>(selectedArtist);
  const setSelectedArtist = (val: React.SetStateAction<ArtistItem | null>) => {
    const next = typeof val === 'function' ? val(selectedArtistRef.current) : val;
    selectedArtistRef.current = next;
    setSelectedArtistState(next);
    if (onSelectArtist) onSelectArtist(next);
  };

  useEffect(() => {
    if (propSelectedArtist) {
      selectedArtistRef.current = propSelectedArtist;
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

  // #12: até 3 cards sem login; cada show (ou artista) é um card
  const getCardKey = () =>
    selectedShow?.showCode || (selectedArtist ? `artist-${selectedArtist.artistCode}` : 'card');
  const [guestState, setGuestState] = useState(() => ({
    loggedIn: guestService.isLoggedIn(),
    used: guestService.usedCount(),
  }));
  useEffect(
    () =>
      guestService.onChange(() =>
        setGuestState({ loggedIn: guestService.isLoggedIn(), used: guestService.usedCount() })
      ),
    []
  );

  const handleOpenShare = (channel?: 'instagram' | 'whatsapp' | 'facebook' | 'native' | null) => {
    if ((selectedShow || selectedArtist) && !guestService.allowCard(getCardKey())) return;
    setShareChannel(channel || null);
    setIsShareModalOpen(true);
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Integração Setlist.fm: o botão só aparece quando a chave estiver configurada no servidor
  const [setlistFmEnabled, setSetlistFmEnabled] = useState(false);
  const [isImportingSetlist, setIsImportingSetlist] = useState(false);
  useEffect(() => {
    getIntegrationStatus().then((s) => setSetlistFmEnabled(s.setlistfm));
  }, []);

  const handleImportSetlist = async () => {
    if (!selectedShow) {
      setToastMessage('Escolha um show na busca acima para importar o setlist.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setIsImportingSetlist(true);
    try {
      const setlist = await findSetlistForShow({
        id: selectedShow.id,
        artistName: selectedShow.artistName,
        date: selectedShow.date,
        city: selectedShow.city,
      });
      const songs = (setlist?.songs || []).filter((song) => !song.tape).map((song) => song.name);
      if (!songs.length) {
        setToastMessage('Esse show ainda não tem setlist publicado no Setlist.fm.');
      } else {
        setConfig((prev) => ({ ...prev, setlistHighlights: songs.slice(0, 5).join(' • ') }));
        setToastMessage(`Setlist importado: ${songs.length} músicas. As 5 primeiras foram adicionadas — edite à vontade.`);
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Não foi possível consultar o Setlist.fm agora.');
    } finally {
      setIsImportingSetlist(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };
  const [isExtractingColor, setIsExtractingColor] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [savedToWalletSuccess, setSavedToWalletSuccess] = useState(false);
  // #9: uma ação principal por estado — antes de salvar, Salvar; depois, Baixar e Compartilhar
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [isTourWrappedOpen, setIsTourWrappedOpen] = useState(false);
  const [fanStats, setFanStats] = useState(() => walletService.getStats());

  // Formato do card: poster vertical ou Ingresso Retrô (exclusivo Fã Ouro+ ou Livvo PRO)
  const [cardFormat, setCardFormat] = useState<'poster' | 'retro'>('poster');
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem('livvo_pro_v1') === '1';
    } catch {
      return false;
    }
  });
  const RETRO_MIN_LEVEL = 3; // Fã Ouro
  const retroUnlocked = isPro || fanStats.level >= RETRO_MIN_LEVEL;
  const isRetro = cardFormat === 'retro';
  const retroBlocked = isRetro && !retroUnlocked;
  const handleUnlockProForTest = () => {
    try {
      localStorage.setItem('livvo_pro_v1', '1');
    } catch {
      /* sem armazenamento: libera só nesta sessão */
    }
    setIsPro(true);
  };
  const warnRetroLocked = () => {
    setToastMessage('O Ingresso Retrô é exclusivo para Fã Ouro (26+ shows) ou Livvo PRO.');
    setTimeout(() => setToastMessage(null), 3500);
  };

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
    customBadgeText: '', // N1: sem selo de verificação até existir a ferramenta
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
          // #2: com mais de um show, a pessoa escolhe o card (data, cidade e local) — nada é preenchido por ela
          onSelectShow(allShows.length === 1 ? firstShow : null);
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
          // #2: com mais de um show, a pessoa escolhe o card (data, cidade e local) — nada é preenchido por ela
          onSelectShow(showsForThisArtist.length === 1 ? firstShow : null);
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
    if (retroBlocked) return warnRetroLocked();
    if (!selectedShow && !selectedArtist) {
      setToastMessage('💡 Escolha uma banda ou show na busca acima para baixar seu card!');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    if (!guestService.allowCard(getCardKey())) return;
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
      link.download = `livvo_${isRetro ? 'ingresso_retro_' : ''}${safeArtist}_${safeCity}_${effectiveCode}.png`;
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
    if (retroBlocked) {
      warnRetroLocked();
      return null;
    }
    if (!guestService.allowCard(getCardKey())) return null;
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
    if (!selectedShow && artistShows.length > 1) {
      // #2: com vários shows, o ingresso só é salvo depois que a pessoa escolhe qual viu
      setToastMessage('Escolha o show na lista acima antes de salvar.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    if (!guestService.allowCard(getCardKey())) return;
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

    setSavedKey(getCardKey());
    setSavedToWalletSuccess(true);
    setToastMessage('Ingresso salvo no seu passaporte. Veja no Livvo Wallet.');
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
    const knownShows = artistShows.length > 0 ? artistShows : dbArtistShows;
    if (!targetShow && knownShows.length <= 1) {
      // #2: só monta o show sozinho quando o artista tem um único show; com vários, a pessoa escolhe
      const candidate = knownShows[0];
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

    const knownPosterShows = artistShows.length > 0 ? artistShows : dbArtistShows;
    if (!targetShow && knownPosterShows.length > 1) {
      // #2: com vários shows, o pôster fica guardado até a pessoa escolher o show
    } else if (!targetShow) {
      const candidate = knownPosterShows[0];
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

  const hasCard = Boolean(selectedShow || selectedArtist);
  const isSaved = hasCard && savedKey === getCardKey();

  return (
    <div className="lv-studio space-y-5">
      {/* ========================================================================= */}
      {/* BILHETE DE BUSCA: artista e show (campos de preenchimento de ingresso)    */}
      {/* ========================================================================= */}
      <section className="lv-ticket">
        <div className="lv-strip">
          <span>Livvo · Estúdio</span>
          <span>
            {selectedShow ? (
              <>
                Nº <b>{selectedShow.showCode}</b>
              </>
            ) : (
              'Nº ———'
            )}
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          <div className="space-y-1.5">
            <h2 className="lv-display whitespace-nowrap text-[clamp(18px,5.6vw,36px)] text-[#ECE5D1]">
              Monte seu Poster Virtual
            </h2>
            <p className="text-[14px] text-[#B3AE9F]">Escolha o artista e o show que você viu.</p>
          </div>

          {/* Campos: Artista | UF | Cidade | Local | Data */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-x-6 gap-y-5">
            {/* Artista */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-4 relative">
              <label htmlFor="artist-search-input" className="lv-eyebrow block">
                Artista
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
                  placeholder="Busque uma banda ou artista"
                  autoComplete="off"
                  className="lv-input pl-6 pr-7"
                />
                <Search className="w-4 h-4 text-[#8A8577] absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" />

                {isSearchingCatalog ? (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                    <RefreshCw className="w-3.5 h-3.5 text-[#4FDCDE] animate-spin" />
                  </div>
                ) : artistSearchQuery ? (
                  <button
                    type="button"
                    aria-label="Limpar busca"
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
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8A8577] hover:text-[#ECE5D1] p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Resultados da busca de artistas */}
              {isSearchOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsSearchOpen(false)} />
                  <div className="absolute z-30 top-full mt-2 inset-x-0 bg-[#171226] border border-[#3A3159] rounded-md shadow-[0_18px_40px_rgba(0,0,0,0.5)] max-h-72 overflow-y-auto">
                    {artistSearchQuery.trim().length > 0 && artistSearchQuery.trim().length < 3 && (
                      <div className="px-3.5 py-2 border-b border-dashed border-[#282141] flex items-center justify-between text-[11px] text-[#B3AE9F]">
                        <span>Digite pelo menos 3 letras para buscar</span>
                        <span className="lv-eyebrow text-[#4FDCDE]">Destaques</span>
                      </div>
                    )}
                    {isSearchingCatalog ? (
                      <div className="p-4 space-y-3">
                        {[0, 1].map((i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-[#282141]" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-[#282141] rounded-sm w-3/4" />
                              <div className="h-2.5 bg-[#282141] rounded-sm w-1/2" />
                            </div>
                          </div>
                        ))}
                        <div className="lv-mono flex items-center justify-center gap-2 pt-1 text-[11px] text-[#4FDCDE]">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Buscando no catálogo…</span>
                        </div>
                      </div>
                    ) : filteredArtists.length === 0 ? (
                      <div className="p-4 text-center text-xs space-y-3">
                        <p className="text-[#B3AE9F]">Nenhum artista no catálogo com &quot;{artistSearchQuery}&quot;.</p>
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
                            className="lv-ghost"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Usar &quot;{artistSearchQuery.trim()}&quot; e buscar foto online</span>
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
                          selectedArtist?.artistName.trim().toLowerCase() === artist.artistName.trim().toLowerCase();

                        return (
                          <div
                            key={artist.artistCode}
                            role="option"
                            aria-selected={isChosen}
                            onClick={() => handleSelectArtist(artist)}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-dashed border-[#282141] last:border-b-0 hover:bg-[#4FDCDE]/[0.05] transition-colors ${
                              isChosen ? 'bg-[#4FDCDE]/[0.07]' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#100C1F] shrink-0 flex items-center justify-center">
                              {photo ? (
                                <img src={photo} alt={artist.artistName} className="w-full h-full object-cover" />
                              ) : (
                                <Music className="w-4 h-4 text-[#8A8577]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold text-[#ECE5D1] truncate">{artist.artistName}</div>
                              <div className="lv-mono text-[10.5px] text-[#8A8577]">
                                {artist.showsCount} {artist.showsCount === 1 ? 'show' : 'shows'} no catálogo
                              </div>
                            </div>
                            {isChosen && <Check className="w-4 h-4 text-[#4FDCDE] shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* UF */}
            <div className="col-span-1 lg:col-span-1">
              <label htmlFor="filter-state-select" className="lv-eyebrow block">
                UF
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

                    // Se só um show bate com artista + estado, aplica direto
                    const matches = artistShows.filter((s) => !stateVal || isSameState(s.state, stateVal));
                    if (matches.length === 1) {
                      handleApplyShow(matches[0]);
                    } else {
                      onSelectShow(null);
                    }
                  }}
                  className="lv-input"
                >
                  <option value="">{!selectedArtist ? '—' : 'Todos'}</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Cidade */}
            <div className="col-span-1 lg:col-span-2">
              <label htmlFor="filter-city-select" className="lv-eyebrow block">
                Cidade
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

                    const matches = artistShows.filter(
                      (s) => (!selectedState || isSameState(s.state, selectedState)) && (!city || s.city === city)
                    );
                    if (matches.length === 1) {
                      handleApplyShow(matches[0]);
                    } else {
                      onSelectShow(null);
                    }
                  }}
                  className="lv-input"
                >
                  <option value="">
                    {!selectedArtist ? '—' : selectedState ? `Cidades de ${selectedState}` : 'Todas'}
                  </option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Local */}
            <div className="col-span-1 lg:col-span-3">
              <label htmlFor="filter-venue-select" className="lv-eyebrow block">
                Local
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
                  className="lv-input"
                >
                  <option value="">{!selectedArtist ? '—' : 'Todos'}</option>
                  {availableVenues.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Data */}
            <div className="col-span-1 lg:col-span-2">
              <label htmlFor="filter-date-select" className="lv-eyebrow block">
                Data
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
                        (!selectedState || (s.state && s.state.toUpperCase() === selectedState.toUpperCase())) &&
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
                  className="lv-input lv-mono"
                >
                  <option value="">{!selectedArtist ? '—' : 'Todas'}</option>
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {cleanDateOnly(d)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#8A8577] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Artista escolhido + mídia */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-1">
            {selectedArtist ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#100C1F] shrink-0 flex items-center justify-center">
                  {currentPhoto ? (
                    <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-4 h-4 text-[#8A8577]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-[#ECE5D1] truncate">{selectedArtist.artistName}</div>
                  <div className="lv-mono text-[10.5px] text-[#8A8577] flex items-center gap-1.5">
                    {currentPhoto ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-[#4FDCDE]" />
                        <span>foto vinculada</span>
                      </>
                    ) : (
                      <span>
                        {artistShows.length} {artistShows.length === 1 ? 'show no catálogo' : 'shows no catálogo'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#8A8577]">Comece pelo nome do artista. Os outros campos se ajustam a ele.</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <div className="lv-seg" role="group" aria-label="Imagem do card">
                <button
                  type="button"
                  data-on={config.visualMode !== 'show-poster'}
                  aria-pressed={config.visualMode !== 'show-poster'}
                  onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'artist-photo' }))}
                  title="Usar a foto do artista no card"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Foto</span>
                </button>
                <button
                  type="button"
                  data-on={config.visualMode === 'show-poster'}
                  aria-pressed={config.visualMode === 'show-poster'}
                  onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'show-poster' }))}
                  title="Usar o pôster da turnê no card"
                >
                  <LivvoTicketIcon className="w-3.5 h-3.5" />
                  <span>Pôster</span>
                  {selectedShow?.posterUrl && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenPhotoManager?.(selectedArtist?.artistCode)}
                className="lv-ghost"
                title="Trocar ou enviar foto do artista"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Gerenciar foto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaModalInitialTab(config.visualMode === 'show-poster' ? 'posters' : 'photos');
                  setIsMediaModalOpen(true);
                }}
                className="lv-ghost"
                title="Buscar foto ou pôster atualizado online"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Foto Atualizada</span>
              </button>

              {selectedArtist && !currentPhoto && (
                <button
                  type="button"
                  id="auto-fetch-photo-btn"
                  onClick={handleAutoFetchPhoto}
                  disabled={isFetchingPhoto}
                  className="lv-link"
                  title="Busca a foto oficial do artista pelo nome"
                >
                  {isFetchingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Vincular foto automaticamente</span>
                </button>
              )}
            </div>
          </div>

          {/* Retorno da busca automática de foto */}
          {autoPhotoMessage && (
            <p className="lv-mono text-[11.5px] text-[#4FDCDE] border-l-2 border-[#4FDCDE] pl-3">{autoPhotoMessage}</p>
          )}

          {/* Shows do artista quando o show ainda não foi escolhido */}
          {selectedArtist && !selectedShow && filteredShows.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between border-b border-[#282141] pb-2">
                <span className="lv-eyebrow text-[#4FDCDE]">Escolha o show</span>
                <span className="lv-mono text-[11px] text-[#8A8577]">
                  {filteredShows.length} {filteredShows.length === 1 ? 'show' : 'shows'}
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredShows.map((sh) => (
                  <button key={sh.id} type="button" onClick={() => handleApplyShow(sh)} className="lv-show">
                    <span className="lv-mono text-[12px] text-[#4FDCDE]">{cleanDateOnly(sh.date)}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-[#ECE5D1] truncate">
                        {sh.city} ({sh.state})
                      </span>
                      <span className="block text-[11.5px] text-[#8A8577] truncate">{sh.venue}</span>
                    </span>
                    <ChevronRight className="lv-show-go w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INGRESSO PRINCIPAL: palco (card) · picote · canhoto (controles)           */}
      {/* ========================================================================= */}
      <section className="lv-ticket lg:grid lg:grid-cols-[minmax(0,1fr)_28px_minmax(0,440px)]">
        {/* Palco */}
        <div className="lv-stage">
          <div
            className={`${isRetro ? 'px-3 py-5 sm:p-8' : 'p-5 sm:p-10'} flex flex-col items-center gap-4 lg:sticky lg:top-4`}
          >
            {/* Formato do card */}
            <div className="lv-seg" role="group" aria-label="Formato do card">
              <button
                type="button"
                data-on={!isRetro}
                aria-pressed={!isRetro}
                onClick={() => setCardFormat('poster')}
                title="Poster vertical para Stories e feed"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Poster</span>
              </button>
              <button
                type="button"
                data-on={isRetro}
                aria-pressed={isRetro}
                onClick={() => setCardFormat('retro')}
                title={retroUnlocked ? 'Ingresso horizontal com fundo transparente' : 'Exclusivo para Fã Ouro ou Livvo PRO'}
              >
                {retroUnlocked ? <LivvoTicketIcon className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Ingresso Retrô</span>
              </button>
            </div>

            {/* #1: durante a criação o card é uma prévia; nada aparece como verificado */}
            {hasCard && (
              <span className="lv-state-chip" data-saved={isSaved}>
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Salvo no seu Wallet
                  </>
                ) : (
                  'Prévia · ainda não salvo'
                )}
              </span>
            )}

            {isRetro ? (
              <div className="w-full max-w-[960px]">
                <RetroTicketStage>
                  <RetroTicket
                    ref={cardRef}
                    show={selectedShow}
                    artistName={selectedArtist?.artistName}
                    photoUrl={currentPhoto}
                    posterUrl={currentPoster}
                    config={config}
                  />
                </RetroTicketStage>
              </div>
            ) : (
              <div className="relative shadow-[0_24px_60px_rgba(0,0,0,0.55)] flex justify-center items-center w-full max-w-[440px]">
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
            )}

            {retroBlocked ? (
              <div className="w-full max-w-[560px] border-t border-dashed border-[#3A3159] pt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="text-[12.5px] text-[#B3AE9F] flex items-center gap-2 min-w-0">
                  <Lock className="w-3.5 h-3.5 text-[#4FDCDE] shrink-0" />
                  <span>
                    Exclusivo para <b className="text-[#ECE5D1]">Fã Ouro</b> ou <b className="text-[#ECE5D1]">Livvo PRO</b>.
                    {fanStats.effectiveShows < 26 && (
                      <>
                        {' '}
                        Falta{26 - fanStats.effectiveShows === 1 ? '' : 'm'}{' '}
                        <span className="text-[#4FDCDE]">{26 - fanStats.effectiveShows}</span>{' '}
                        {26 - fanStats.effectiveShows === 1 ? 'show' : 'shows'}.
                      </>
                    )}
                  </span>
                </p>
                <button type="button" onClick={handleUnlockProForTest} className="lv-link" title="Simula a assinatura PRO neste navegador">
                  <span>Liberar para teste (admin)</span>
                </button>
              </div>
            ) : (
              <p className="lv-mono text-[11px] text-[#8A8577] flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${selectedShow || selectedArtist ? 'bg-[#4FDCDE]' : 'bg-[#8A8577]'}`}
                />
                {!(selectedShow || selectedArtist)
                  ? 'Escolha um artista para montar o card'
                  : isRetro
                    ? 'Ingresso Retrô · PNG com fundo transparente'
                    : 'Alta resolução · 300 DPI · pronto para baixar'}
              </p>
            )}
          </div>
        </div>

        <div className="lv-perf" aria-hidden="true" />

        {/* Canhoto */}
        <div className="p-5 sm:p-7">
          {/* Passaporte de fã */}
          <div className="lv-passport space-y-4">
            <h3 className="lv-display text-[22px] text-[#ECE5D1] flex items-center gap-2.5">
              <PassportIcon className="w-6 h-6 text-[#4FDCDE]" />
              Passaporte de Fã
            </h3>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="lv-eyebrow">Nível de fã</span>
                <div className="flex items-baseline gap-3 min-w-0 mt-1">
                  <span className="lv-num text-[52px] text-[#4FDCDE]">{fanStats.level}</span>
                  <span className="lv-display text-[22px] text-[#ECE5D1] truncate">{fanStats.levelTitle}</span>
                </div>
                <p className="lv-mono text-[11px] text-[#8A8577] mt-1.5">
                  {fanStats.totalShows} {fanStats.totalShows === 1 ? 'ingresso' : 'ingressos'} · {fanStats.uniqueArtists}{' '}
                  {fanStats.uniqueArtists === 1 ? 'artista' : 'artistas'}
                </p>
              </div>
              <FanMedalIllustration
                medalId={fanStats.currentMedal?.id}
                level={fanStats.level}
                unlocked={fanStats.level > 0}
                className="w-[72px] h-[72px] shrink-0"
              />
            </div>

            <div className="space-y-2">
              <div
                className="lv-ticks"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={fanStats.nextLevelProgress}
                aria-label="Progresso até o próximo nível"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} data-on={i < Math.round((fanStats.nextLevelProgress / 100) * 24)} />
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 text-[11.5px]">
                <span className="text-[#B3AE9F]">
                  {fanStats.nextMedal ? (
                    <>
                      Falta{Math.max(0, fanStats.nextMedal.minShows - fanStats.totalShows) === 1 ? '' : 'm'}{' '}
                      <strong className="text-[#ECE5D1]">
                        {Math.max(0, fanStats.nextMedal.minShows - fanStats.totalShows)}
                      </strong>{' '}
                      {Math.max(0, fanStats.nextMedal.minShows - fanStats.totalShows) === 1 ? 'show' : 'shows'} para o nível{' '}
                      {fanStats.nextMedal.name.replace(/^Fã\s+/, '')}
                    </>
                  ) : (
                    'Nível máximo: Lenda Viva'
                  )}
                </span>
                <span className="lv-mono text-[#4FDCDE] shrink-0">{fanStats.nextLevelProgress}%</span>
              </div>
            </div>

            {/* #9: antes de salvar, Salvar é a única ação em destaque */}
            {isSaved ? (
              <p className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4FDCDE]" role="status">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ingresso salvo. Agora baixe ou compartilhe.</span>
              </p>
            ) : (
              <button
                id="save-to-wallet-btn"
                type="button"
                onClick={handleSaveToWallet}
                className="lv-btn lv-btn--teal w-full"
              >
                <LivvoTicketIcon className="w-4 h-4" />
                <span>Salvar ingresso</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button
                id="quick-copy-image-btn"
                type="button"
                onClick={handleCopyImage}
                disabled={isExporting || !hasCard}
                className="lv-link"
                title="Copiar a imagem para colar no WhatsApp ou nos Stories"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? 'Imagem copiada' : 'Copiar imagem'}</span>
              </button>
              <button id="quick-surprise-me-btn" type="button" onClick={handleSurpriseMe} className="lv-link">
                <Dice5 className="w-3.5 h-3.5" />
                <span>Surpreenda-me</span>
              </button>
              <button type="button" onClick={() => setIsTourWrappedOpen(true)} className="lv-link">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tour Wrapped 9:16</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[#B3AE9F] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(config.showCollectorBadge)}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showCollectorBadge: e.target.checked }))}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className={config.showCollectorBadge ? 'text-[#ECE5D1]' : ''}>Selo no card</span>
              </label>
              {onGoToWallet && (
                <button type="button" onClick={onGoToWallet} className="lv-link" title="Abrir Livvo Wallet">
                  <span>Ver no Livvo Wallet</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

            </div>
          </div>

          {/* Personalizar */}
          <div className="mt-7">
            <button
              type="button"
              id="toggle-personalizar-card-btn"
              onClick={() => setIsPersonalizarOpen((prev) => !prev)}
              aria-expanded={isPersonalizarOpen}
              className="lv-drop-head"
            >
              <span className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-[#4FDCDE]" />
                <span className="lv-display text-[22px] text-[#ECE5D1]">Personalizar</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="hidden sm:inline lv-mono text-[11px] text-[#8A8577] whitespace-nowrap">{isPersonalizarOpen ? 'Fechar' : 'Fonte, cor e selos'}</span>
                <ChevronDown className={`w-5 h-5 text-[#4FDCDE] transition-transform duration-200 ${isPersonalizarOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {isPersonalizarOpen && (
            <div className="lv-drop-body">
            <div className="lv-group">Colecionador</div>
                <div className="lv-row" data-open={activeDropdown === 'collector'}>
                  <button
                    type="button"
                    id="dropdown-topic-collector"
                    onClick={() => toggleDropdown('collector')}
                    aria-expanded={activeDropdown === 'collector'}
                    className="lv-row-head"
                  >
                    <div>
                      <div className="lv-row-icon">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="lv-row-title">Selo de Colecionador & Raridade</span>
                        </div>
                    </div>
                    <div>
                      <span className="lv-row-val">
                        {config.showCollectorBadge ? `Ativo (${config.collectorRarity || 'Ouro'})` : 'Desativado'}
                      </span>
                      <ChevronDown className="lv-row-chev" />
                    </div>
                  </button>

                  {activeDropdown === 'collector' && (
                    <div className="lv-row-body space-y-3">
                      <div className="flex items-center justify-between gap-3 py-1">
                        <div>
                          <span className="text-xs font-bold text-[#ECE5D1] block">Exibir Selo de Colecionador no Card</span>
                          <span className="text-[10px] text-[#8A8577]">Adiciona emblema com raridade e série no card</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(config.showCollectorBadge)}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showCollectorBadge: e.target.checked }))}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="lv-label">Raridade do Card Colecionável</label>
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
                              className="lv-opt p-2 text-center text-xs font-bold" data-on={config.collectorRarity === r.id && config.showCollectorBadge}
                            >
                              <span className="block text-sm mb-0.5">{r.label.split(' ').pop()}</span>
                              <span className="text-[10px] block truncate">{r.label.split(' ').slice(0, -1).join(' ')}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="lv-label">
                          <span>Número da Edição / Série</span>
                          <span className="text-[10px] text-[#8A8577]">Ex: #001, #042, #777</span>
                        </label>
                        <input
                          type="text"
                          value={config.collectorEdition || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, collectorEdition: e.target.value }))}
                          placeholder="#042"
                          className="lv-input lv-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="lv-row" data-open={activeDropdown === 'stamp'}>
                  <button
                    type="button"
                    id="dropdown-topic-stamp"
                    onClick={() => toggleDropdown('stamp')}
                    aria-expanded={activeDropdown === 'stamp'}
                    className="lv-row-head"
                  >
                    <div>
                      <div className="lv-row-icon">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="lv-row-title">Carimbos de Presença</span>
                        </div>
                    </div>
                    <div>
                      <span className="lv-row-val">
                        {STAMP_TYPES.find((s) => s.id === (config.stampType || 'none'))?.label || 'Sem carimbo'}
                      </span>
                      <ChevronDown className="lv-row-chev" />
                    </div>
                  </button>

                  {activeDropdown === 'stamp' && (
                    <div className="lv-row-body space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {STAMP_TYPES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, stampType: s.id as any }))}
                            className="lv-opt p-2.5 text-left" data-on={(config.stampType || 'none') === s.id}
                          >
                            <span className="text-xs font-bold text-[#ECE5D1] block">{s.label}</span>
                            <span className="text-[10px] text-[#8A8577] block mt-0.5">{s.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

            <div className="lv-group">Memória do show</div>
                <div className="lv-row" data-open={activeDropdown === 'music'}>
                  <button
                    type="button"
                    id="dropdown-topic-music"
                    onClick={() => toggleDropdown('music')}
                    aria-expanded={activeDropdown === 'music'}
                    className="lv-row-head"
                  >
                    <div>
                      <div className="lv-row-icon">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="lv-row-title">Faixa Marcante, Setor & Companhia</span>
                        </div>
                    </div>
                    <div>
                      <span className="lv-row-val">
                        {config.favoriteSong ? 'Configurado' : 'Opcional'}
                      </span>
                      <ChevronDown className="lv-row-chev" />
                    </div>
                  </button>

                  {activeDropdown === 'music' && (
                    <div className="lv-row-body space-y-3">
                      <div className="space-y-1.5">
                        <label className="lv-label">
                          <span className="flex items-center gap-1.5">
                            <Music className="w-3 h-3 text-[#2FB8BA]" />
                            Faixa Marcante (Música Favorita do Show)
                          </span>
                          <span className="text-[10px] text-[#8A8577]">Aparece como tag no card</span>
                        </label>
                        <input
                          type="text"
                          value={config.favoriteSong || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, favoriteSong: e.target.value }))}
                          placeholder="Ex: Céu Azul, Mulher de Fases, Show das Poderosas..."
                          className="lv-input"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="lv-label">Setor do Ingresso</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {['Pista Premium', 'Na Grade', 'Camarote VIP', 'Pista', 'Cadeira'].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => setConfig((prev) => ({ ...prev, ticketSector: config.ticketSector === sec ? '' : sec }))}
                              className="lv-opt px-2.5 py-1.5 text-xs font-bold" data-on={config.ticketSector === sec}
                            >
                              {sec}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="lv-label">
                          <span>Companhia no Show</span>
                          <span className="text-[10px] text-[#8A8577]">Ex: @mariana, @amor, @amigos</span>
                        </label>
                        <input
                          type="text"
                          value={config.companionHandle || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, companionHandle: e.target.value }))}
                          placeholder="Ex: @mariana"
                          className="lv-input lv-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="lv-label">
                          <span>Destaques da Turnê / Setlist</span>
                          {setlistFmEnabled ? (
                            <button
                              type="button"
                              onClick={handleImportSetlist}
                              disabled={isImportingSetlist}
                              className="lv-link text-[11.5px]"
                            >
                              {isImportingSetlist ? 'Buscando…' : 'Importar do Setlist.fm'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#8A8577]">Músicas marcantes separadas por ponto</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={config.setlistHighlights || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, setlistHighlights: e.target.value }))}
                          placeholder="Ex: Céu Azul • Zoio de Lula • Proibida pra Mim"
                          className="lv-input"
                        />
                      </div>
                    </div>
                  )}
                </div>

            <div className="lv-group">Imagem</div>
                <div className="lv-row" data-open={activeDropdown === 'art'}>
                <button
                  type="button"
                  id="dropdown-topic-art"
                  onClick={() => toggleDropdown('art')}
                  aria-expanded={activeDropdown === 'art'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="lv-row-title">Arte do Card</span>
                      </div>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {config.visualMode === 'show-poster' ? 'Pôster Oficial' : 'Foto do Artista'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'art' && (
                  <div className="lv-row-body space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#B3AE9F]">Escolha a fonte visual de fundo</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaModalInitialTab(config.visualMode === 'show-poster' ? 'posters' : 'photos');
                          setIsMediaModalOpen(true);
                        }}
                        className="lv-link text-[11.5px]"
                      >
                        <Search className="w-3 h-3" />
                        <span>Galeria Online</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'artist-photo' }))}
                        className="lv-opt p-2.5 text-left" data-on={config.visualMode !== 'show-poster'}
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
                        className="lv-opt p-2.5 text-left" data-on={config.visualMode === 'show-poster'}
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

                <div className="lv-row" data-open={activeDropdown === 'effects'}>
                  <button
                    type="button"
                    id="dropdown-topic-effects"
                    onClick={() => toggleDropdown('effects')}
                    aria-expanded={activeDropdown === 'effects'}
                    className="lv-row-head"
                  >
                    <div>
                      <div className="lv-row-icon">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="lv-row-title">Filtros de Foto & Efeito Holográfico</span>
                        </div>
                    </div>
                    <div>
                      <span className="lv-row-val">
                        {PHOTO_FILTERS.find((f) => f.id === (config.photoFilter || 'none'))?.label || 'Normal'}
                      </span>
                      <ChevronDown className="lv-row-chev" />
                    </div>
                  </button>

                  {activeDropdown === 'effects' && (
                    <div className="lv-row-body space-y-3">
                      <div className="space-y-1.5">
                        <label className="lv-label">Filtro de Imagem</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PHOTO_FILTERS.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setConfig((prev) => ({ ...prev, photoFilter: f.id as any }))}
                              className="lv-opt p-2.5 text-left" data-on={(config.photoFilter || 'none') === f.id}
                            >
                              <span className="text-xs font-bold text-[#ECE5D1] block">{f.label}</span>
                              <span className="text-[10px] text-[#8A8577] block mt-0.5">{f.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 py-1">
                        <div>
                          <span className="text-xs font-bold text-[#ECE5D1] block">Película Prismática Holográfica (Foil)</span>
                          <span className="text-[10px] text-[#8A8577]">Brilho iridescente sobreposto ao card</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(config.showHologram)}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showHologram: e.target.checked }))}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="lv-label">
                          <span>Intensidade do Contraste / Sombra</span>
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

                <div className="lv-row" data-open={activeDropdown === 'vibes'}>
                  <button
                    type="button"
                    id="dropdown-topic-vibes"
                    onClick={() => toggleDropdown('vibes')}
                    aria-expanded={activeDropdown === 'vibes'}
                    className="lv-row-head"
                  >
                    <div>
                      <div className="lv-row-icon">
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="lv-row-title">Vibes & Presets de Estilo</span>
                        </div>
                    </div>
                    <div>
                      <span className="lv-row-val">
                        8 Presets
                      </span>
                      <ChevronDown className="lv-row-chev" />
                    </div>
                  </button>

                  {activeDropdown === 'vibes' && (
                    <div className="lv-row-body space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STYLE_VIBES.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleApplyVibe(v)}
                            className="lv-opt p-3 text-left group"
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

            <div className="lv-group">Texto e tipografia</div>
              <div className="lv-row" data-open={activeDropdown === 'fontFamily'}>
                <button
                  type="button"
                  id="dropdown-topic-font-family"
                  onClick={() => toggleDropdown('fontFamily')}
                  aria-expanded={activeDropdown === 'fontFamily'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Type className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="lv-row-title">Tipo de Fonte</span>
                      </div>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {FONT_FAMILIES.find((f) => f.id === (config.fontFamily || 'sans'))?.name || 'Sans Moderno'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'fontFamily' && (
                  <div className="lv-row-body space-y-2.5">
                    <span className="lv-label">
                      Selecione o tipo de fonte para aplicar no Card
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_FAMILIES.map((font) => (
                        <button
                          key={font.id}
                          type="button"
                          id={`font-family-${font.id}`}
                          onClick={() => setConfig((prev) => ({ ...prev, fontFamily: font.id }))}
                          className="lv-opt p-3 text-left" data-on={(config.fontFamily || 'sans') === font.id}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#ECE5D1]">{font.name}</span>
                            {(config.fontFamily || 'sans') === font.id && (
                              <Check className="w-3.5 h-3.5 text-[#4FDCDE]" />
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

              <div className="lv-row" data-open={activeDropdown === 'fontSize'}>
                <button
                  type="button"
                  id="dropdown-topic-font-size"
                  onClick={() => toggleDropdown('fontSize')}
                  aria-expanded={activeDropdown === 'fontSize'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Type className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="lv-row-title">Tamanho da Fonte</span>
                      </div>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {config.fontSize === 'small' ? 'Pequeno' : config.fontSize === 'medium' ? 'Médio' : 'Grande'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'fontSize' && (
                  <div className="lv-row-body space-y-4">
                    {/* Controle Deslizante Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#ECE5D1] flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#2FB8BA]" />
                          Controle Deslizante (Slider)
                        </span>
                        <span className="lv-mono text-[#4FDCDE] text-[11px]">
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
                      <span className="lv-label">
                        Botões Rápidos (Feedback Imediato no Card)
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
                            className="lv-opt py-2 px-2 text-center" data-on={(config.fontSize || 'large') === opt.id}
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

              <div className="lv-row" data-open={activeDropdown === 'artistPos'}>
                <button
                  type="button"
                  id="dropdown-topic-artist-pos"
                  onClick={() => toggleDropdown('artistPos')}
                  aria-expanded={activeDropdown === 'artistPos'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <MoveVertical className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="lv-row-title">Posição da Banda</span>
                      </div>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {config.artistNamePosition === 'top' ? 'Em Cima' : config.artistNamePosition === 'middle' ? 'No Meio' : 'Embaixo'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'artistPos' && (
                  <div className="lv-row-body space-y-2">
                    <span className="lv-label">Escolha a disposição vertical</span>
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
                          className="lv-opt py-2 px-2 text-center" data-on={(config.artistNamePosition || 'bottom') === opt.id}
                        >
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className="text-[9px] text-[#8A8577] mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lv-row" data-open={activeDropdown === 'tagline'}>
                <button
                  type="button"
                  id="dropdown-topic-tagline"
                  onClick={() => toggleDropdown('tagline')}
                  aria-expanded={activeDropdown === 'tagline'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Type className="w-4 h-4" />
                    </div>
                    <span className="lv-row-title">Frase Superior (Tagline)</span>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {config.tagline || 'Nenhuma'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'tagline' && (
                  <div className="lv-row-body space-y-2">
                    <input
                      type="text"
                      value={config.tagline || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Ex: TURNÊ NACIONAL, AO VIVO, FESTIVAL..."
                      className="lv-input"
                    />
                  </div>
                )}
              </div>
            <div className="lv-group">Formato e cor</div>
              <div className="lv-row" data-open={activeDropdown === 'ratio'}>
                <button
                  type="button"
                  id="dropdown-topic-ratio"
                  onClick={() => toggleDropdown('ratio')}
                  aria-expanded={activeDropdown === 'ratio'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="lv-row-title">Formato & Proporção</span>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {RATIOS.find((r) => r.id === config.aspectRatio)?.name || 'Story (9:16)'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'ratio' && (
                  <div className="lv-row-body space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          id={`ratio-${r.id.replace(':', '-')}`}
                          onClick={() => setConfig((prev) => ({ ...prev, aspectRatio: r.id }))}
                          className="lv-opt flex flex-col items-start p-3 text-left" data-on={config.aspectRatio === r.id}
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

              <div className="lv-row" data-open={activeDropdown === 'template'}>
                <button
                  type="button"
                  id="dropdown-topic-template"
                  onClick={() => toggleDropdown('template')}
                  aria-expanded={activeDropdown === 'template'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="lv-row-title">Estilo Visual (Tema)</span>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {TEMPLATES.find((t) => t.id === config.templateId)?.name || 'Modern Stage'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'template' && (
                  <div className="lv-row-body space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, templateId: t.id }))}
                          className="lv-opt p-3 text-left" data-on={config.templateId === t.id}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#ECE5D1]">{t.name}</span>
                            {config.templateId === t.id && (
                              <Check className="w-3.5 h-3.5 text-[#4FDCDE]" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#8A8577] mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lv-row" data-open={activeDropdown === 'color'}>
                <button
                  type="button"
                  id="dropdown-topic-color"
                  onClick={() => toggleDropdown('color')}
                  aria-expanded={activeDropdown === 'color'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="lv-row-title">Cor de Destaque</span>
                  </div>
                  <div>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                      style={{ backgroundColor: config.accentColor }}
                    />
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'color' && (
                  <div className="lv-row-body space-y-2">
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

            <div className="lv-group">Identificação</div>
              <div className="lv-row" data-open={activeDropdown === 'userHandle'}>
                <button
                  type="button"
                  id="dropdown-topic-user-handle"
                  onClick={() => toggleDropdown('userHandle')}
                  aria-expanded={activeDropdown === 'userHandle'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <span className="lv-row-title">Usuário (@nomedousuario)</span>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {config.showUserHandle ? (config.userHandle || '@toboi') : 'Oculto'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'userHandle' && (
                  <div className="lv-row-body space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-[#B3AE9F] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.showUserHandle}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showUserHandle: e.target.checked }))}
                          className="w-4 h-4 cursor-pointer"
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
                      className="lv-input lv-mono text-[#4FDCDE]"
                    />
                    <p className="text-[10px] text-[#8A8577]">
                      Identificador oficial do usuário exibido abaixo do selo Livvo.
                    </p>
                  </div>
                )}
              </div>

              <div className="lv-row" data-open={activeDropdown === 'badge'}>
                <button
                  type="button"
                  id="dropdown-topic-badge"
                  onClick={() => toggleDropdown('badge')}
                  aria-expanded={activeDropdown === 'badge'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="lv-row-title">Selo de Status</span>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {config.customBadgeText || 'Sem selo'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'badge' && (
                  <div className="lv-row-body space-y-2.5">
                    <p className="text-[11px] text-[#B3AE9F] border-l-2 border-[#4FDCDE] pl-2.5">{VERIFICATION_SOON}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, customBadgeText: '' }))}
                        className="lv-opt p-2.5 text-left"
                        data-on={!config.customBadgeText}
                      >
                        <div className="text-xs font-extrabold text-[#ECE5D1]">SEM SELO</div>
                        <div className="text-[10px] text-[#8A8577]">Card limpo</div>
                      </button>
                      {BADGE_PRESETS.map((b) => (
                        <button
                          key={b.label}
                          type="button"
                          id={`badge-preset-${b.label.replace(/\s+/g, '-').toLowerCase()}`}
                          onClick={() => setConfig((prev) => ({ ...prev, customBadgeText: b.label }))}
                          className="lv-opt p-2.5 text-left" data-on={config.customBadgeText === b.label}
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
                      className="lv-input"
                    />
                  </div>
                )}
              </div>

              <div className="lv-row" data-open={activeDropdown === 'venue'}>
                <button
                  type="button"
                  id="dropdown-topic-venue"
                  onClick={() => toggleDropdown('venue')}
                  aria-expanded={activeDropdown === 'venue'}
                    className="lv-row-head"
                >
                  <div>
                    <div className="lv-row-icon">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="lv-row-title">Casa de Show (Box no Card)</span>
                  </div>
                  <div>
                    <span className="lv-row-val">
                      {config.showVenueBadge !== false ? 'Visível' : 'Oculto'}
                    </span>
                    <ChevronDown className="lv-row-chev" />
                  </div>
                </button>

                {activeDropdown === 'venue' && (
                  <div className="lv-row-body space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-[#ECE5D1] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.showVenueBadge !== false}
                          onChange={(e) => setConfig((prev) => ({ ...prev, showVenueBadge: e.target.checked }))}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="font-bold">Exibir Casa de Show no Card (Entre Data e Cidade)</span>
                      </label>
                      <p className="text-[10px] text-[#8A8577] pl-5">
                        Exibe o nome da casa de show com exatamente o mesmo tamanho, ícone e destaque da data e da cidade.
                      </p>
                    </div>

                    <div className="pt-2">
                      <label className="lv-label">
                        Casa de Show do Evento
                      </label>
                      <div className="flex items-center gap-2 py-2 text-[13px] font-bold text-[#ECE5D1]">
                        <Building2 className="w-3.5 h-3.5 text-[#2FB8BA] shrink-0" />
                        <span className="truncate">{selectedShow?.venue || 'Nenhum show selecionado'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
            )}
          </div>

          {/* Exportar — #9: viram a ação principal depois de salvar */}
          <div className="grid grid-cols-2 gap-3 mt-7">
            <button
              id="download-card-png-btn"
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className={isSaved ? 'lv-btn lv-btn--cream' : 'lv-ghost'}
              title="Baixar o card em PNG de alta resolução (300 DPI)"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Baixado</span>
                </>
              ) : isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando PNG…</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar PNG</span>
                </>
              )}
            </button>
            <button
              id="share-card-btn"
              type="button"
              onClick={() => handleOpenShare()}
              disabled={isExporting || !hasCard}
              className={isSaved ? 'lv-btn lv-btn--cyan' : 'lv-ghost'}
              title="Compartilhar no Instagram, WhatsApp ou Facebook"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
          </div>

          {/* #12: contador de cards sem login (prévia: login simulado) */}
          {!guestState.loggedIn && (
            <p className="lv-mono text-[11px] text-[#8A8577] mt-3 flex flex-wrap items-center gap-x-2">
              <span>
                Sem login: {guestState.used} de {GUEST_CARD_LIMIT} cards
              </span>
              <button type="button" onClick={() => guestService.requestLogin()} className="lv-link text-[#4FDCDE]">
                Entrar
              </button>
            </p>
          )}
        </div>
      </section>

      {toastMessage && (
        <div className="lv-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

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
