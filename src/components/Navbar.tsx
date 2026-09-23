import React from 'react';
import {
  Layers,
  Image as ImageIcon,
  Table,
  UploadCloud,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { LivvoLogo } from './LivvoLogo';
import { GlobalSearchBar } from './GlobalSearchBar';
import { ShowItem, ArtistItem } from '../types';

export type ActiveTab = 'studio' | 'photos' | 'shows';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  showsCount: number;
  artistsCount: number;
  photosCount: number;
  shows: ShowItem[];
  artists: ArtistItem[];
  photosMap: Map<string, string>;
  onSelectArtist: (artist: ArtistItem) => void;
  onSelectShow: (show: ShowItem) => void;
  onOpenCsvModal: () => void;
  onLoadSample: () => void;
  onClearAll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  showsCount,
  artistsCount,
  photosCount,
  shows,
  artists,
  photosMap,
  onSelectArtist,
  onSelectShow,
  onOpenCsvModal,
  onLoadSample,
  onClearAll,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#100C1F]/95 backdrop-blur-xl border-b border-[#282141]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center hover:scale-105 transition-transform">
              <LivvoLogo className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-lg" />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-[#ECE5D1] leading-none">
                Show <span className="text-[#2FB8BA]">Card</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-[#B3AE9F] font-medium hidden sm:inline">
                  Lembrança oficial do show
                </span>
              </div>
            </div>
          </div>

          {/* Global Search Bar (Desktop) */}
          {showsCount > 0 && (
            <div className="flex-1 max-w-sm lg:max-w-md mx-2 hidden md:block">
              <GlobalSearchBar
                shows={shows}
                artists={artists}
                photosMap={photosMap}
                onSelectArtist={onSelectArtist}
                onSelectShow={onSelectShow}
              />
            </div>
          )}

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[#171226] p-1 rounded-2xl border border-[#282141] shrink-0">
            <button
              id="tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'studio'
                  ? 'bg-[#2FB8BA] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25'
                  : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Estúdio</span>
            </button>

            <button
              id="tab-photos"
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'photos'
                  ? 'bg-[#2FB8BA] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25'
                  : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Fotos</span>
            </button>

            <button
              id="tab-shows"
              onClick={() => setActiveTab('shows')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'shows'
                  ? 'bg-[#2FB8BA] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25'
                  : 'text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Shows</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="open-csv-modal-btn"
              onClick={onOpenCsvModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2FB8BA]/10 hover:bg-[#2FB8BA]/20 text-[#4FDCDE] border border-[#2FB8BA]/30 transition-all hover:border-[#4FDCDE]"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden md:inline">Importar CSV</span>
            </button>

            {showsCount === 0 && (
              <button
                id="load-sample-btn"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1E1833] hover:bg-[#282141] text-[#ECE5D1] border border-[#282141] transition-all"
                title="Carregar shows de demonstração com fotos de artistas brasileiros"
              >
                <Sparkles className="w-4 h-4 text-[#FFD60A]" />
                <span className="hidden md:inline">Demonstração</span>
              </button>
            )}

            {showsCount > 0 && (
              <button
                onClick={onClearAll}
                className="p-2 rounded-xl text-[#8A8577] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Limpar Base e Dados Salvos"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Search Bar (Mobile) */}
        {showsCount > 0 && (
          <div className="pb-3 md:hidden">
            <GlobalSearchBar
              shows={shows}
              artists={artists}
              photosMap={photosMap}
              onSelectArtist={onSelectArtist}
              onSelectShow={onSelectShow}
            />
          </div>
        )}
      </div>
    </header>
  );
};
