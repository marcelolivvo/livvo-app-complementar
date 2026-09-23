import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Music,
  MapPin,
  Calendar,
  Building2,
  Ticket,
  ChevronRight,
  Sparkles,
  Command,
  CheckCircle2,
} from 'lucide-react';
import { ShowItem, ArtistItem } from '../types';

interface GlobalSearchBarProps {
  shows: ShowItem[];
  artists: ArtistItem[];
  photosMap: Map<string, string>;
  onSelectArtist: (artist: ArtistItem) => void;
  onSelectShow: (show: ShowItem) => void;
  placeholder?: string;
  className?: string;
}

type FilterCategory = 'all' | 'artists' | 'shows';

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  shows,
  artists,
  photosMap,
  onSelectArtist,
  onSelectShow,
  placeholder = 'Buscar artista ou show... (ex: Alok, Ivete, São Paulo)',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Cmd+K, Ctrl+K or "/" to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input/textarea
      const target = e.target as HTMLElement | null;
      const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isInput)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Matching Artists
  const matchingArtists = useMemo(() => {
    if (!query.trim()) {
      // If query is empty, show top artists with most shows
      return [...artists]
        .sort((a, b) => b.showsCount - a.showsCount)
        .slice(0, 6);
    }
    const q = query.toLowerCase().trim();
    return artists
      .filter((a) => a.artistName.toLowerCase().includes(q) || a.artistCode.toLowerCase().includes(q))
      .slice(0, 8);
  }, [artists, query]);

  // Filter Matching Shows
  const matchingShows = useMemo(() => {
    if (!query.trim()) {
      return shows.slice(0, 6);
    }
    const q = query.toLowerCase().trim();
    return shows
      .filter(
        (s) =>
          s.artistName.toLowerCase().includes(q) ||
          s.artistCode.toLowerCase().includes(q) ||
          s.showCode.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.venue.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [shows, query]);

  const totalMatches = matchingArtists.length + matchingShows.length;

  const handleChooseArtist = (artist: ArtistItem) => {
    onSelectArtist(artist);
    setIsOpen(false);
  };

  const handleChooseShow = (show: ShowItem) => {
    onSelectShow(show);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-[#8A8577] group-focus-within:text-[#2FB8BA] transition-colors" />
        </div>

        <input
          ref={inputRef}
          type="text"
          id="global-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#171226] hover:bg-[#1C1630] focus:bg-[#100C1F] border border-[#282141] focus:border-[#2FB8BA] rounded-2xl pl-10 pr-20 py-2 sm:py-2.5 text-xs sm:text-sm text-[#ECE5D1] placeholder-[#8A8577] focus:outline-none transition-all shadow-inner"
        />

        {/* Right side controls: Clear (X) or Shortcut Key Badge */}
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-[#8A8577] hover:text-[#ECE5D1] hover:bg-[#282141] transition-colors"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#100C1F] border border-[#282141] text-[10px] font-mono text-[#8A8577]">
              <Command className="w-3 h-3" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Overlay with Live Filtered Results */}
      {isOpen && (
        <div className="absolute top-full mt-2 inset-x-0 sm:w-[540px] md:w-[620px] max-w-[95vw] bg-[#171226]/98 backdrop-blur-2xl border border-[#282141] rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-[#282141] ring-1 ring-black/40">
          {/* Header with Categories & Total Count */}
          <div className="p-3 bg-[#100C1F]/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-[#2FB8BA] text-[#100C1F]'
                    : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
                }`}
              >
                Tudo ({totalMatches})
              </button>
              <button
                onClick={() => setActiveCategory('artists')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'artists'
                    ? 'bg-[#2FB8BA] text-[#100C1F]'
                    : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
                }`}
              >
                Artistas ({matchingArtists.length})
              </button>
              <button
                onClick={() => setActiveCategory('shows')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'shows'
                    ? 'bg-[#2FB8BA] text-[#100C1F]'
                    : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
                }`}
              >
                Shows ({matchingShows.length})
              </button>
            </div>

            <span className="text-[11px] text-[#8A8577] font-mono hidden sm:inline">
              ESC para fechar
            </span>
          </div>

          {/* Results List Area */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-[#282141]/60">
            {totalMatches === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Search className="w-8 h-8 text-[#8A8577] mx-auto opacity-50" />
                <p className="text-sm font-semibold text-[#ECE5D1]">
                  Nenhum resultado para &quot;{query}&quot;
                </p>
                <p className="text-xs text-[#B3AE9F]">
                  Verifique a ortografia do artista, cidade ou código do show.
                </p>
              </div>
            ) : (
              <>
                {/* 1. ARTISTS SECTION */}
                {(activeCategory === 'all' || activeCategory === 'artists') &&
                  matchingArtists.length > 0 && (
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between px-2 text-[11px] font-bold text-[#8A8577] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-[#2FB8BA]" />
                          <span>Artistas Correspondentes</span>
                        </span>
                        <span>{matchingArtists.length} encontrados</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchingArtists.map((artist) => {
                          const photo =
                            photosMap.get(artist.artistCode) ||
                            photosMap.get(artist.artistName.trim().toLowerCase()) ||
                            artist.photoUrl;
                          return (
                            <div
                              key={artist.artistCode}
                              onClick={() => handleChooseArtist(artist)}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#100C1F]/60 hover:bg-[#1E1833] border border-[#282141]/70 hover:border-[#2FB8BA] transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#100C1F] border border-[#282141] shrink-0 flex items-center justify-center">
                                  {photo ? (
                                    <img
                                      src={photo}
                                      alt={artist.artistName}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <Music className="w-4 h-4 text-[#8A8577]" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#ECE5D1] group-hover:text-[#4FDCDE] transition-colors truncate">
                                    {artist.artistName}
                                  </div>
                                  <div className="text-[10px] text-[#B3AE9F] flex items-center gap-1.5">
                                    <span className="font-mono text-[#8A8577]">{artist.artistCode}</span>
                                    <span>•</span>
                                    <span>{artist.showsCount} {artist.showsCount === 1 ? 'show' : 'shows'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {photo ? (
                                  <span
                                    title="Foto Vinculada"
                                    className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <span
                                    title="Foto Pendente"
                                    className="text-[9px] font-bold text-[#FFD60A] bg-[#FFD60A]/10 px-1.5 py-0.5 rounded-full"
                                  >
                                    Sem Foto
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-[#8A8577] group-hover:text-[#2FB8BA] group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 2. SHOWS SECTION */}
                {(activeCategory === 'all' || activeCategory === 'shows') &&
                  matchingShows.length > 0 && (
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between px-2 text-[11px] font-bold text-[#8A8577] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-[#4FDCDE]" />
                          <span>Shows & Apresentações</span>
                        </span>
                        <span>{matchingShows.length} encontrados</span>
                      </div>

                      <div className="space-y-1.5">
                        {matchingShows.map((show) => {
                          const photo =
                            photosMap.get(show.artistCode) ||
                            photosMap.get(show.artistName.trim().toLowerCase()) ||
                            artists.find(
                              (a) =>
                                a.artistName.trim().toLowerCase() ===
                                show.artistName.trim().toLowerCase()
                            )?.photoUrl;
                          return (
                            <div
                              key={show.id}
                              onClick={() => handleChooseShow(show)}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#100C1F]/60 hover:bg-[#1E1833] border border-[#282141]/70 hover:border-[#2FB8BA] transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#100C1F] border border-[#282141] shrink-0 flex items-center justify-center">
                                  {photo ? (
                                    <img
                                      src={photo}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Ticket className="w-4 h-4 text-[#2FB8BA]" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#ECE5D1] group-hover:text-[#4FDCDE] transition-colors truncate">
                                      {show.artistName}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#2FB8BA]/10 text-[#4FDCDE] border border-[#2FB8BA]/20">
                                      {show.showCode}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-[#B3AE9F] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-[#2FB8BA]" />
                                      <span>
                                        {show.city} ({show.state})
                                      </span>
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 truncate">
                                      <Building2 className="w-3 h-3 text-[#8A8577]" />
                                      <span className="truncate">{show.venue}</span>
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-[#8A8577]" />
                                      <span>{show.date}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2FB8BA]/10 text-[#22E3E6] border border-[#2FB8BA]/20 group-hover:bg-[#2FB8BA] group-hover:text-[#100C1F] transition-all shrink-0"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span className="hidden sm:inline">Montar Card</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Quick Footer Prompt */}
          <div className="p-2.5 bg-[#100C1F] px-4 text-[11px] text-[#8A8577] flex items-center justify-between">
            <span>Clique em um artista ou show para carregar no estúdio de criação</span>
            <span className="font-semibold text-[#4FDCDE]">Total no Catálogo: {shows.length} shows</span>
          </div>
        </div>
      )}
    </div>
  );
};
