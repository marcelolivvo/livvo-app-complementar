import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Check, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { LivvoTicketIcon } from './LivvoTicketIcon';
import { searchArtistMedia, MediaItem, ArtistMediaResult } from '../services/artistPhotoService';

interface MediaSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistName: string;
  initialTab?: 'photos' | 'posters';
  onSelectMedia: (url: string, type: 'photo' | 'poster') => void;
}

export const MediaSearchModal: React.FC<MediaSearchModalProps> = ({
  isOpen,
  onClose,
  artistName,
  initialTab = 'photos',
  onSelectMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'posters'>(initialTab);
  const [searchQuery, setSearchQuery] = useState(artistName);
  const [loading, setLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState<ArtistMediaResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(artistName);
      setActiveTab(initialTab);
      loadMedia(artistName);
    }
  }, [isOpen, artistName, initialTab]);

  const loadMedia = async (name: string) => {
    if (!name) return;
    try {
      setLoading(true);
      const res = await searchArtistMedia(name);
      setMediaResult(res);
    } catch (e) {
      console.error('Erro ao buscar mídias:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'photos' ? mediaResult?.photos || [] : mediaResult?.posters || [];

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
                  onClick={() => {
                    onSelectMedia(item.url, item.type);
                    onClose();
                  }}
                  className="group relative rounded-2xl overflow-hidden border border-[#282141] hover:border-[#2FB8BA] cursor-pointer aspect-square bg-[#100C1F] shadow-lg transition-all"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span className="text-[10px] font-bold text-[#ECE5D1] truncate">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
