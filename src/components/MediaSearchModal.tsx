import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Ticket,
  Link as LinkIcon,
  Upload,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { searchArtistMedia, MediaItem, ArtistMediaResult } from '../services/artistPhotoService';
import { ArtistItem, ShowItem } from '../types';

interface MediaSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: ArtistItem | null;
  selectedShow: ShowItem | null;
  onSelectPhoto: (artistCode: string, url: string) => Promise<void>;
  onSelectPoster: (showId: string, url: string) => Promise<void>;
  initialTab?: 'posters' | 'photos';
}

export const MediaSearchModal: React.FC<MediaSearchModalProps> = ({
  isOpen,
  onClose,
  artist,
  selectedShow,
  onSelectPhoto,
  onSelectPoster,
  initialTab = 'posters',
}) => {
  const [activeTab, setActiveTab] = useState<'posters' | 'photos'>(initialTab);
  const [searchQuery, setSearchQuery] = useState(artist?.artistName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState<ArtistMediaResult | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [appliedUrl, setAppliedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (artist?.artistName) {
      setSearchQuery(artist.artistName);
      performSearch(artist.artistName);
    }
  }, [artist, isOpen]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const performSearch = async (term: string) => {
    if (!term.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await searchArtistMedia(term);
      setMediaResult(result);
      if (result.photos.length === 0 && result.posters.length === 0) {
        setErrorMessage('Nenhum resultado encontrado automaticamente. Você pode colar um link direto abaixo.');
      }
    } catch {
      setErrorMessage('Falha ao conectar com o serviço de busca de mídias.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPoster = async (url: string) => {
    try {
      const targetId = selectedShow
        ? (selectedShow.id || selectedShow.showCode)
        : (artist ? artist.artistCode : '');
      await onSelectPoster(targetId, url);
      setAppliedUrl(url);
      setTimeout(() => setAppliedUrl(null), 2500);
    } catch (e) {
      console.error('Erro ao aplicar pôster:', e);
    }
  };

  const handleApplyPhoto = async (url: string) => {
    if (!artist) return;
    try {
      await onSelectPhoto(artist.artistCode, url);
      setAppliedUrl(url);
      setTimeout(() => setAppliedUrl(null), 2500);
    } catch (e) {
      console.error('Erro ao aplicar foto:', e);
    }
  };

  const handleApplyCustomUrl = async () => {
    if (!customUrl.trim()) return;
    if (activeTab === 'posters') {
      await handleApplyPoster(customUrl.trim());
    } else if (artist) {
      await handleApplyPhoto(customUrl.trim());
    }
    setCustomUrl('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#100C1F]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#171226] border border-[#282141] rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#282141] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2FB8BA]/10 text-[#4FDCDE] border border-[#2FB8BA]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#22E3E6]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#ECE5D1]">
                Galeria de Pôsteres & Fotos Oficiais
              </h2>
              <p className="text-xs text-[#B3AE9F]">
                {artist ? `Artista: ${artist.artistName} • ` : ''}
                {selectedShow ? `Show: ${selectedShow.city} (${selectedShow.state})` : 'Escolha uma mídia oficial'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#B3AE9F] hover:text-[#ECE5D1] p-2 rounded-xl hover:bg-[#1E1833] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Tabs */}
        <div className="space-y-3 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                placeholder="Pesquisar artista ou álbum..."
                className="w-full bg-[#100C1F] border border-[#282141] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
              />
              <Search className="w-4 h-4 text-[#8A8577] absolute left-3.5 top-3" />
            </div>

            <button
              onClick={() => performSearch(searchQuery)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] font-bold text-xs transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Buscar</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#282141] pb-2">
            <button
              onClick={() => setActiveTab('posters')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'posters'
                  ? 'bg-[#2FB8BA]/15 text-[#22E3E6] border border-[#2FB8BA]/30'
                  : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Pôsteres & Cartazes de Turnê ({mediaResult?.posters.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'photos'
                  ? 'bg-[#2FB8BA]/15 text-[#22E3E6] border border-[#2FB8BA]/30'
                  : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Fotos do Artista ({mediaResult?.photos.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Media Results Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-[#22E3E6] animate-spin" />
              <p className="text-xs font-bold text-[#ECE5D1]">
                Buscando pôsteres oficiais e fotos em alta resolução...
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Posters Tab Content */}
              {activeTab === 'posters' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {mediaResult?.posters && mediaResult.posters.length > 0 ? (
                    mediaResult.posters.map((item) => {
                      const isApplied = appliedUrl === item.url || (selectedShow?.posterUrl === item.url);
                      return (
                        <div
                          key={item.id}
                          className="bg-[#100C1F] rounded-2xl border border-[#282141] hover:border-[#2FB8BA] p-2.5 space-y-2.5 transition-all group relative overflow-hidden"
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-[#171226] relative">
                            <img
                              src={item.thumbnailUrl || item.url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              crossOrigin="anonymous"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#100C1F]/80 backdrop-blur-md text-[10px] font-bold text-[#4FDCDE] uppercase">
                              {item.source}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-bold text-[#ECE5D1] truncate" title={item.title}>
                              {item.title}
                            </div>
                            <div className="text-[10px] text-[#B3AE9F]">
                              Pôster Oficial • 1000×1000px
                            </div>
                          </div>

                          <button
                            onClick={() => handleApplyPoster(item.url)}
                            className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              isApplied
                                ? 'bg-[#22E3E6] text-[#100C1F]'
                                : 'bg-[#282141] hover:bg-[#2FB8BA] text-[#ECE5D1] hover:text-[#100C1F]'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#100C1F]" />
                                <span>Pôster Ativo</span>
                              </>
                            ) : (
                              <>
                                <Ticket className="w-3.5 h-3.5" />
                                <span>Usar no Card</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-xs text-[#8A8577]">
                      Nenhum pôster de turnê retornado. Cole uma URL direta de pôster abaixo.
                    </div>
                  )}
                </div>
              )}

              {/* Photos Tab Content */}
              {activeTab === 'photos' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {mediaResult?.photos && mediaResult.photos.length > 0 ? (
                    mediaResult.photos.map((item) => {
                      const isApplied = appliedUrl === item.url || (artist?.photoUrl === item.url);
                      return (
                        <div
                          key={item.id}
                          className="bg-[#100C1F] rounded-2xl border border-[#282141] hover:border-[#2FB8BA] p-2.5 space-y-2.5 transition-all group relative overflow-hidden"
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-[#171226] relative">
                            <img
                              src={item.thumbnailUrl || item.url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              crossOrigin="anonymous"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#100C1F]/80 backdrop-blur-md text-[10px] font-bold text-[#4FDCDE] uppercase">
                              {item.source}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-bold text-[#ECE5D1] truncate" title={item.title}>
                              {item.title}
                            </div>
                            <div className="text-[10px] text-[#B3AE9F]">
                              Foto Oficial • Alta Resolução
                            </div>
                          </div>

                          <button
                            onClick={() => handleApplyPhoto(item.url)}
                            className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              isApplied
                                ? 'bg-[#22E3E6] text-[#100C1F]'
                                : 'bg-[#282141] hover:bg-[#2FB8BA] text-[#ECE5D1] hover:text-[#100C1F]'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#100C1F]" />
                                <span>Foto Ativa</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Usar no Card</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-xs text-[#8A8577]">
                      Nenhuma foto de artista encontrada. Cole uma URL direta abaixo.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Custom URL Input Footer */}
        <div className="pt-3 border-t border-[#282141] space-y-2 shrink-0">
          <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[#2FB8BA]" />
            <span>Ou insira um link direto de imagem (URL da Web):</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://exemplo.com/poster-oficial.jpg"
              className="flex-1 bg-[#100C1F] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
            />
            <button
              onClick={handleApplyCustomUrl}
              disabled={!customUrl.trim()}
              className="px-4 py-2 rounded-xl bg-[#1E1833] hover:bg-[#282141] border border-[#282141] text-[#ECE5D1] font-bold text-xs transition-all disabled:opacity-50"
            >
              Aplicar {activeTab === 'posters' ? 'Pôster' : 'Foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
