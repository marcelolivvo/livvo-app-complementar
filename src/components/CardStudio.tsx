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
  Instagram,
  Facebook,
  MessageCircle,
} from 'lucide-react';
import { ShowItem, ArtistItem, CardTemplateConfig, CardTemplateId, AspectRatio, CardFontFamily } from '../types';
import { EventCard } from './EventCard';
import { autoFetchArtistPhoto } from '../services/artistPhotoService';
import { MediaSearchModal } from './MediaSearchModal';
import { ShareModal } from './ShareModal';
import { cleanDateOnly } from '../utils/dateUtils';
import { normalizeStateUF, isSameState } from '../utils/stateUtils';
import { normalizeArtistKey, isDateString } from '../utils/artistUtils';
import { dbService } from '../services/db';
import { SAMPLE_ARTISTS_DATA, generateSampleDataset } from '../services/sampleData';

interface CardStudioProps {
  shows: ShowItem[];
  artists: ArtistItem[];
  selectedShow: ShowItem | null;
  onSelectShow: (show: ShowItem | null) => void;
  photosMap: Map<string, string>;
  onOpenPhotoManager: (artistCode?: string) => void;
  onOpenBatchExport: () => void;
  onUpdateArtistPhoto?: (
    artistCode: string,
    photoUrl: string,
    source: 'upload' | 'url' | 'sample' | 'auto',
    artistName?: string
  ) => Promise<void>;
  onUpdateShowPoster?: (showIdOrCode: string, posterUrl: string) => Promise<void>;
  preselectedArtist?: ArtistItem | null;
  onClearPreselectedArtist?: () => void;
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
  photosMap,
  onOpenPhotoManager,
  onOpenBatchExport,
  onUpdateArtistPhoto,
  onUpdateShowPoster,
  preselectedArtist,
  onClearPreselectedArtist,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Search & Filter State
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistItem | null>(null);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [localPhotos, setLocalPhotos] = useState<Record<string, string>>({});

  // Auto-photo fetching state
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);
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

  // Template configuration state
  const [config, setConfig] = useState<CardTemplateConfig>({
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
  });

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
      const key = normalizeArtistKey(s.name);
      if (!artistMap.has(key)) {
        artistMap.set(key, {
          artistCode: s.code,
          artistName: s.name,
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

  // Filtered artists for autocomplete search with accent-insensitive normalization and typo tolerance
  const filteredArtists = useMemo(() => {
    if (!artistSearchQuery.trim()) {
      return allAvailableArtists.slice(0, 15);
    }
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/kiyaote/g, 'kaiyote') // seamless typo tolerance for Hiatus Kiyaote / Kaiyote
        .trim();

    const q = normalize(artistSearchQuery);
    return allAvailableArtists
      .filter((a) => {
        const normName = normalize(a.artistName);
        const normCode = normalize(a.artistCode);
        return normName.includes(q) || normCode.includes(q);
      })
      .slice(0, 25);
  }, [allAvailableArtists, artistSearchQuery]);

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
      .then((results) => {
        if (!isCancelled && results && results.length > 0) {
          setDbArtistShows(results);
        }
      })
      .catch((err) => console.error('Erro ao buscar shows do artista no banco:', err));

    return () => {
      isCancelled = true;
    };
  }, [selectedArtist]);

  // Shows belonging to the currently selected artist (combining memory, IndexedDB, and sample dataset)
  const artistShows = useMemo(() => {
    if (!selectedArtist) return [];
    const normTarget = selectedArtist.artistName.trim().toLowerCase();
    const fromMemory = shows.filter(
      (s) =>
        s.artistCode === selectedArtist.artistCode ||
        (normTarget && s.artistName.trim().toLowerCase() === normTarget)
    );
    if (fromMemory.length > 0) return fromMemory;
    if (dbArtistShows.length > 0) return dbArtistShows;

    const sample = generateSampleDataset();
    return sample.shows.filter(
      (s) =>
        s.artistCode === selectedArtist.artistCode ||
        (normTarget && s.artistName && s.artistName.trim().toLowerCase() === normTarget)
    );
  }, [shows, selectedArtist, dbArtistShows]);

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
    setIsFetchingPhoto(true);
    setAutoPhotoMessage(null);

    try {
      const result = await autoFetchArtistPhoto(artist.artistName);
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
      setIsFetchingPhoto(false);
      setTimeout(() => setAutoPhotoMessage(null), 4000);
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

    // Fetch shows from IndexedDB or sample dataset
    dbService
      .getShowsByArtist(artist.artistCode, artist.artistName)
      .then((artistShowsFromDb) => {
        const targetName = artist.artistName.trim().toLowerCase();
        let allShows =
          artistShowsFromDb.length > 0
            ? artistShowsFromDb
            : shows.filter(
                (s) =>
                  s.artistCode === artist.artistCode ||
                  (s.artistName && s.artistName.trim().toLowerCase() === targetName)
              );

        if (allShows.length === 0) {
          const sample = generateSampleDataset();
          const sampleShows = sample.shows.filter(
            (s) =>
              s.artistCode === artist.artistCode ||
              (s.artistName && s.artistName.trim().toLowerCase() === targetName)
          );
          if (sampleShows.length > 0) {
            allShows = sampleShows;
            dbService.saveShowsBatch(sampleShows, false).catch(() => {});
          }
        }

        setDbArtistShows(allShows);

        if (allShows.length > 0) {
          const firstShow = allShows[0];
          // If only 1 show, lock to it; if multiple shows, keep city/venue/date open so user can pick other filters!
          if (allShows.length === 1) {
            setSelectedCity(firstShow.city);
            setSelectedVenue(firstShow.venue);
            setSelectedDate(firstShow.date);
          } else {
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
            setSelectedCity(firstShow.city);
            setSelectedVenue(firstShow.venue);
            setSelectedDate(firstShow.date);
          } else {
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
    if (!cardRef.current || !selectedShow) return;
    try {
      setIsExporting(true);

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        quality: 0.98,
      });

      const link = document.createElement('a');
      const safeArtist = selectedShow.artistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safeCity = selectedShow.city.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `livvo_${safeArtist}_${safeCity}_${selectedShow.showCode}.png`;
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
    if (!cardRef.current || !selectedShow) return null;
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
        (targetName && s.name.trim().toLowerCase() === targetName) ||
        (targetCode && s.code === targetCode)
    );
    if (foundInSample?.photoUrl) return foundInSample.photoUrl;

    return null;
  }, [selectedShow, selectedArtist, localPhotos, photosMap, artists, allAvailableArtists]);

  // Current official tour poster for selected show
  const currentPoster = customPosterUrl || selectedShow?.posterUrl || null;

  // Handlers for modal media selection
  const handleSelectModalPhoto = async (artistCode: string, url: string) => {
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

              {artistSearchQuery && (
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
              )}
            </div>

            {/* Dropdown list of matching artists */}
            {isSearchOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div className="absolute z-30 top-full mt-1.5 inset-x-0 bg-[#171226] border border-[#282141] rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-[#282141]">
                  {filteredArtists.length === 0 ? (
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFD60A] text-[#100C1F] hover:bg-[#FFE14D] transition-colors cursor-pointer"
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
        {selectedArtist && (
          <div className="pt-2 border-t border-[#282141] flex flex-wrap items-center justify-between gap-3">
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

            {/* Quick actions for artist media */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMediaModalInitialTab(config.visualMode === 'show-poster' ? 'posters' : 'photos');
                  setIsMediaModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFD60A] hover:bg-[#FFE14D] text-[#100C1F] shadow transition-all cursor-pointer"
                title="Abrir galeria online de pôsteres e fotos em alta resolução"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#100C1F]" />
                <span>Buscar Pôsteres & Fotos Online</span>
              </button>

              {!currentPhoto ? (
                <button
                  id="auto-fetch-photo-btn"
                  onClick={handleAutoFetchPhoto}
                  disabled={isFetchingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#282141] hover:bg-[#1E1833] text-[#4FDCDE] border border-[#2FB8BA]/30 transition-all disabled:opacity-50"
                  title="Conecta o nome do artista com a foto oficial via API pública do Deezer"
                >
                  {isFetchingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4FDCDE]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#2FB8BA]" />
                  )}
                  <span>Auto-vincular</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenPhotoManager(selectedArtist.artistCode)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-[#ECE5D1] bg-[#1E1833] hover:bg-[#282141] border border-[#282141]"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#2FB8BA]" />
                  <span>Gerenciar Foto</span>
                </button>
              )}
            </div>
          </div>
        )}

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
      {/* MAIN STUDIO AREA: CARD MOUNTED OR EMPTY SELECTION PROMPT                  */}
      {/* ========================================================================= */}
      {!selectedShow ? (
        /* Empty State: Step-by-step guidance prompt */
        <div className="bg-[#171226] rounded-3xl border border-[#282141] p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#2FB8BA]/10 text-[#4FDCDE] border border-[#2FB8BA]/20 flex items-center justify-center mx-auto shadow-inner">
            <Ticket className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-[#ECE5D1]">
              {!selectedArtist
                ? 'Selecione um Artista para Começar'
                : 'Filtre a Cidade, Casa de Show e Data'}
            </h3>
            <p className="text-xs sm:text-sm text-[#B3AE9F] max-w-md mx-auto">
              {!selectedArtist
                ? 'Digite o nome do artista no campo de busca acima ou escolha uma das sugestões para carregar a turnê e montar seu card oficial Livvo.'
                : `Agora escolha onde e quando foi o show de ${selectedArtist.artistName} para o sistema montar o card na tela.`}
            </p>
          </div>

          {/* Quick Artist Suggestions if none selected */}
          {!selectedArtist && artists.length > 0 && (
            <div className="pt-4 space-y-2">
              <span className="text-xs font-bold text-[#8A8577] uppercase tracking-wider block">
                Artistas em Destaque no Catálogo:
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {artists.slice(0, 6).map((art) => (
                  <button
                    key={art.artistCode}
                    onClick={() => handleSelectArtist(art)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E1833] hover:bg-[#282141] border border-[#282141] hover:border-[#2FB8BA] text-xs font-bold text-[#ECE5D1] transition-all"
                  >
                    <span>{art.artistName}</span>
                    <span className="text-[10px] text-[#4FDCDE] font-mono">({art.showsCount})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CARD IS MOUNTED: Show the Visual Stage and Customizer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Card Preview Stage */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            {/* Stage Header Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2.5 bg-[#171226] px-4 py-3 rounded-2xl border border-[#282141]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#ECE5D1]">
                  {selectedShow.artistName}
                </span>
                <span className="text-xs text-[#B3AE9F] hidden sm:inline">•</span>
                <span className="text-xs text-[#4FDCDE] hidden sm:inline">
                  {selectedShow.city} ({selectedShow.state})
                </span>
              </div>

              {/* Visual Mode Selector Buttons */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#100C1F] p-1 rounded-xl border border-[#282141]">
                  <button
                    onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'artist-photo' }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      config.visualMode !== 'show-poster'
                        ? 'bg-[#2FB8BA] text-[#100C1F] shadow'
                        : 'text-[#B3AE9F] hover:text-[#ECE5D1]'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Foto</span>
                  </button>

                  <button
                    onClick={() => setConfig((prev) => ({ ...prev, visualMode: 'show-poster' }))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      config.visualMode === 'show-poster'
                        ? 'bg-[#2FB8BA] text-[#100C1F] shadow'
                        : 'text-[#B3AE9F] hover:text-[#ECE5D1]'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Pôster</span>
                    {selectedShow.posterUrl && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22E3E6]" />
                    )}
                  </button>
                </div>

                <button
                  id="open-media-gallery-btn"
                  onClick={() => {
                    setMediaModalInitialTab(config.visualMode === 'show-poster' ? 'posters' : 'photos');
                    setIsMediaModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFD60A] hover:bg-[#FFE14D] text-[#100C1F] shadow transition-all"
                  title="Pesquisa fotos de palco e pôsteres de turnê em alta resolução na web"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#100C1F]" />
                  <span className="hidden sm:inline">Buscar Mídias Online</span>
                  <span className="sm:hidden">Buscar</span>
                </button>
              </div>
            </div>

            {/* Card Stage Container - Restored generous size (max-w-[460px], min-h-[580px]) */}
            <div className="w-full flex justify-center items-center p-4 sm:p-8 bg-[#100C1F] rounded-3xl border border-[#282141] shadow-2xl relative min-h-[580px]">
              <div className="relative shadow-2xl rounded-2xl ring-1 ring-[#282141] transition-all flex justify-center items-center w-full max-w-[460px]">
                <EventCard
                  ref={cardRef}
                  show={selectedShow}
                  photoUrl={currentPhoto}
                  posterUrl={currentPoster}
                  config={config}
                  isExporting={isExporting}
                />
              </div>
            </div>

            {/* Card Status Indicator */}
            <div className="w-full flex items-center justify-center gap-2 text-xs text-[#B3AE9F] pt-1">
              <span className="w-2 h-2 rounded-full bg-[#22E3E6] animate-pulse" />
              <span>Card oficial em alta resolução (300 DPI) pronto para exportação</span>
            </div>
          </div>

          {/* Right Column: Customization & Template Settings */}
          <div className="lg:col-span-5 flex flex-col gap-4">
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
                    <span>Tempo Real</span>
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
                  <option value="">-- Escolha um tópico para abrir os controles --</option>
                  <optgroup label="Tipografia e Arte">
                    <option value="art">🎨 Arte do Card (Foto ou Pôster)</option>
                    <option value="fontSize">🔤 Tamanho da Fonte (Controle Deslizante / Rápidos)</option>
                    <option value="fontFamily">✒️ Tipo de Fonte (Sans, Impact, Editorial, Mono, Vintage)</option>
                    <option value="artistPos">↕️ Posição do Nome da Banda (Em Cima, No Meio, Embaixo)</option>
                  </optgroup>
                  <optgroup label="Demais Ajustes">
                    <option value="venue">🏟️ Casa de Show e Localização</option>
                    <option value="userHandle">👤 Usuário (@nomedousuario)</option>
                    <option value="badge">🏷️ Selo de Status (Ingresso Verificado...)</option>
                    <option value="ratio">📐 Formato & Proporção (Story, Feed...)</option>
                    <option value="color">🎨 Cor de Destaque</option>
                    <option value="template">✨ Estilo Visual (Tema)</option>
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
                          {selectedShow.posterUrl ? 'Pôster oficial ✓' : 'Buscar pôster'}
                        </div>
                      </button>
                    </div>

                    {selectedShow.tourName && (
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
            <div className="flex items-center gap-3">
              {/* Download Button */}
              <button
                id="download-card-png-btn"
                onClick={handleDownloadPng}
                disabled={isExporting || !selectedShow}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-[#FFD60A] to-[#FFC000] hover:from-[#FFE14D] hover:to-[#FFD60A] text-[#100C1F] shadow-lg shadow-[#FFD60A]/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                title="Baixar Card em PNG de alta resolução"
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
                    <span>Download</span>
                  </>
                )}
              </button>

              {/* Compartilhar Button (triggers social media options) */}
              <button
                id="share-card-btn"
                onClick={() => handleOpenShare()}
                disabled={isExporting || !selectedShow}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-sm bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                title="Compartilhar nas redes sociais (Instagram, WhatsApp, Facebook)"
              >
                <Share2 className="w-4 h-4 text-[#100C1F]" />
                <span>Compartilhar</span>
              </button>
            </div>
          </div>
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
    </div>
  );
};
