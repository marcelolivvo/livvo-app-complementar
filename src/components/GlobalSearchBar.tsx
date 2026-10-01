import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Music, MapPin, Calendar, Building2, ChevronRight, Sparkles, Command } from 'lucide-react';
import { LivvoTicketIcon } from './LivvoTicketIcon';
import { ShowItem, ArtistItem } from '../types';

interface GlobalSearchBarProps {
  shows: ShowItem[];
  artists: ArtistItem[];
  photosMap: Map<string, string>;
  onSelectShow: (show: ShowItem) => void;
  onSelectArtist: (artist: ArtistItem) => void;
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  shows,
  artists,
  photosMap,
  onSelectShow,
  onSelectArtist,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingShows = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return shows.filter(
      (s) =>
        s.artistName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.venue.toLowerCase().includes(q) ||
        (s.tourName && s.tourName.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [query, shows]);

  const matchingArtists = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return artists.filter((a) => a.artistName.toLowerCase().includes(q)).slice(0, 4);
  }, [query, artists]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#8A8577] absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar artistas, shows, cidades, turnês..."
          className="w-full bg-[#100C1F]/90 border border-[#282141] hover:border-[#2FB8BA]/50 focus:border-[#2FB8BA] rounded-2xl pl-10 pr-9 py-2 text-xs text-[#ECE5D1] placeholder:text-[#8A8577] focus:outline-none transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 text-[#8A8577] hover:text-[#ECE5D1]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#171226] border border-[#282141] rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-[#282141] max-h-[70vh] overflow-y-auto">
          {matchingArtists.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8577] px-2 block">
                Artistas
              </span>
              {matchingArtists.map((artist) => (
                <div
                  key={artist.artistCode}
                  onClick={() => {
                    onSelectArtist(artist);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1E1833] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#100C1F] shrink-0 border border-[#282141]">
                      {artist.photoUrl ? (
                        <img src={artist.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">🎤</div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#ECE5D1]">{artist.artistName}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8A8577]" />
                </div>
              ))}
            </div>
          )}

          {matchingShows.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8577] px-2 block flex items-center gap-1.5">
                <LivvoTicketIcon className="w-3.5 h-3.5 text-[#4FDCDE]" />
                <span>Shows & Apresentações</span>
              </span>
              {matchingShows.map((show) => (
                <div
                  key={show.id}
                  onClick={() => {
                    onSelectShow(show);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1E1833] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LivvoTicketIcon className="w-4 h-4 text-[#2FB8BA] shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#ECE5D1] truncate">{show.artistName}</div>
                      <div className="text-[10px] text-[#8A8577] truncate">
                        {show.venue} • {show.city} • {show.date}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8A8577] shrink-0" />
                </div>
              ))}
            </div>
          )}

          {matchingArtists.length === 0 && matchingShows.length === 0 && (
            <div className="p-4 text-center text-xs text-[#8A8577]">
              Nenhum show ou artista encontrado para "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};
