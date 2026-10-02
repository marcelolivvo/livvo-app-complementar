import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Sparkles, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { LivvoTicketIcon } from './LivvoTicketIcon';
import { searchArtistMedia, MediaItem, ArtistMediaResult } from '../services/artistPhotoService';
import { ArtistItem, ShowItem } from '../types';

export interface MediaSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist?: ArtistItem | null;
  artistName?: string;
  selectedShow?: ShowItem | null;
  initialTab?: 'photos' | 'posters';
  onSelectPhoto?: (artistCode: string, url: string) => Promise<void> | void;
  onSelectPoster?: (showIdOrCode: string, url: string) => Promise<void> | void;
  onSelectMedia?: (url: string, type: 'photo' | 'poster') => void;
}

export const MediaSearchModal: React.FC<MediaSearchModalProps> = ({
  isOpen,
  onClose,
  artist,
  artistName,
  selectedShow,
  initialTab = 'photos',
  onSelectPhoto,
  onSelectPoster,
  onSelectMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'posters'>(initialTab);
  const resolvedName = artistName || artist?.artistName || selectedShow?.artistName || '';
  const [searchQuery, setSearchQuery] = useState(resolvedName);
  const [loading, setLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState<ArtistMediaResult | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (isOpen) {
      const targetName = resolvedName;
      setSelectedItem(null);
      setError(null);
      setSearchQuery(targetName);
      setActiveTab(initialTab);
      if (targetName) {
        loadMedia(targetName);
      }
    }
    return () => { requestId.current += 1; };
  }, [isOpen, resolvedName, initialTab]);

  const loadMedia = async (name: string) => {
    if (!name) return;
    const id = ++requestId.current;
    setSelectedItem(null);
    setError(null);
    try {
      setLoading(true);
      const res = await searchArtistMedia(name);
      if (id === requestId.current) setMediaResult(res);
    } catch (e) {
      console.error('Erro ao buscar mídias:', e);
      if (id === requestId.current) setError('Não foi possível buscar as imagens. Tente novamente.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'photos' ? mediaResult?.photos || [] : mediaResult?.posters || [];

  const handleSelectItem = async (item: MediaItem) => {
    if (applying) return;
    setApplying(true);
    setError(null);
    try {
    if (onSelectMedia) {
      onSelectMedia(item.url, item.type);
    }
    if (item.type === 'photo' && onSelectPhoto) {
      const code = artist?.artistCode || selectedShow?.artistCode || '';
      await onSelectPhoto(code, item.url);
    } else if (item.type === 'poster' && onSelectPoster) {
      const target = selectedShow?.id || selectedShow?.showCode || artist?.artistCode || '';
      await onSelectPoster(target, item.url);
    }
    onClose();
    } catch {
      setError('Não foi possível aplicar a imagem. Tente novamente.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#171226] border border-[#282141] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282141] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2FB8BA]" />
            <h3 className="text-base font-black text-[#ECE5D1]">Mídias Oficiais & Pôsteres</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#1E1833] text-[#8A8577] hover:text-[#ECE5D1]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#8A8577] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMedia(searchQuery)}
              placeholder="Buscar por artista ou banda..."
              className="w-full bg-[#100C1F] border border-[#282141] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
            />
          </div>
          <button
            onClick={() => loadMedia(searchQuery)}
            className="px-4 py-2.5 rounded-2xl bg-[#2FB8BA] text-[#100C1F] font-black text-xs hover:bg-[#22E3E6] transition-all cursor-pointer"
          >
            Buscar
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-[#282141] pb-2">
          <button
            onClick={() => setActiveTab('photos')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'photos'
                ? 'bg-[#2FB8BA]/15 text-[#22E3E6] border border-[#2FB8BA]/30'
                : 'text-[#B3AE9F] hover:text-[#ECE5D1]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Fotos de Palco ({mediaResult?.photos.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('posters')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'posters'
                ? 'bg-[#2FB8BA]/15 text-[#22E3E6] border border-[#2FB8BA]/30'
                : 'text-[#B3AE9F] hover:text-[#ECE5D1]'
            }`}
          >
            <LivvoTicketIcon className="w-4 h-4 text-[#2FB8BA]" />
            <span>Pôsteres & Cartazes ({mediaResult?.posters.length || 0})</span>
          </button>
        </div>

        {/* Grid List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[260px]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-xs text-[#8A8577] gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2FB8BA]" />
              <span>Buscando mídias em alta resolução...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#8A8577]">
              Nenhuma mídia encontrada para esta busca.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Selecionar ${item.title}`}
                  aria-pressed={selectedItem?.id === item.id}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedItem(item); } }}
                  className="group relative rounded-2xl overflow-hidden border border-[#282141] hover:border-[#2FB8BA] cursor-pointer aspect-square bg-[#100C1F] shadow-lg transition-all"
                >
                  <img
                    src={item.thumbUrl || item.url}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      // If thumb failed, fallback to url or hide card gracefully
                      const target = e.currentTarget;
                      if (target.src !== item.url) {
                        target.src = item.url;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Source Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#100C1F]/80 text-[#22E3E6] border border-white/10 backdrop-blur-sm shadow">
                      {item.source}
                    </span>
                  </div>
                  {selectedItem?.id === item.id && <span className="absolute bottom-2 left-2 right-2 z-20 rounded-lg bg-[#4FDCDE] text-[#100C1F] text-xs font-bold p-2 text-center">Selecionada</span>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                    <span className="text-[11px] font-bold text-[#ECE5D1] leading-tight line-clamp-2">{item.title}</span>
                    <span className="text-[9px] text-[#2FB8BA] font-semibold mt-0.5">Clique para selecionar</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-[#ECE5D1]">{error}</p>}
        <button
          disabled={!selectedItem || loading || applying || selectedItem.type !== (activeTab === 'photos' ? 'photo' : 'poster')}
          onClick={() => selectedItem && handleSelectItem(selectedItem)}
          className="w-full rounded-2xl bg-[#4FDCDE] text-[#100C1F] py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {applying ? 'Aplicando...' : activeTab === 'photos' ? 'Usar foto no card' : 'Usar pôster no card'}
        </button>
      </div>
    </div>
  );
};
