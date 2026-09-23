import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Table,
  UploadCloud,
  Sparkles,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Check,
  Lock,
} from 'lucide-react';
import { LivvoLogo } from './LivvoLogo';
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
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  showsCount,
  artistsCount,
  photosCount,
  onOpenCsvModal,
  onLoadSample,
  onClearAll,
  isAdmin = true,
  onToggleAdmin,
}) => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdminMenuOpen(false);
      }
    };

    if (isAdminMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#100C1F]/95 backdrop-blur-xl border-b border-[#282141]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center hover:scale-105 transition-transform cursor-pointer" onClick={() => setActiveTab('studio')}>
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

          {/* Navigation - Main Navigation Bar (Fotos e Shows foram movidos exclusivamente para o menu de Admin) */}
          <nav className="flex items-center gap-2 shrink-0">
            <button
              id="tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-[#2FB8BA] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25 scale-100'
                  : 'bg-[#171226] text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833] border border-[#282141]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Estúdio</span>
            </button>

            {/* Active Context Chip for Admin (quando visualizando Fotos ou Shows) */}
            {isAdmin && activeTab === 'photos' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30 animate-in fade-in">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Admin:</span> Fotos
              </span>
            )}

            {isAdmin && activeTab === 'shows' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2FB8BA]/15 text-[#4FDCDE] border border-[#2FB8BA]/30 animate-in fade-in">
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Admin:</span> Shows
              </span>
            )}
          </nav>

          {/* Action & Admin Menu Dropdown Area */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Admin Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="admin-dropdown-toggle-btn"
                onClick={() => setIsAdminMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                  isAdmin
                    ? isAdminMenuOpen
                      ? 'bg-[#2FB8BA] text-[#100C1F] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/25'
                      : 'bg-[#2FB8BA]/10 text-[#4FDCDE] border-[#2FB8BA]/30 hover:bg-[#2FB8BA]/20 hover:border-[#4FDCDE]'
                    : 'bg-[#1E1833] text-[#8A8577] border-[#282141] hover:text-[#ECE5D1]'
                }`}
                title="Abrir menu de opções de Administrador"
              >
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-inherit" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-inherit" />
                )}
                <span>Admin</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isAdminMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Panel */}
              {isAdminMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl bg-[#140F24]/98 border border-[#282141] shadow-2xl backdrop-blur-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-3 py-2.5 border-b border-[#282141] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-xl ${
                          isAdmin ? 'bg-[#2FB8BA]/20 text-[#4FDCDE]' : 'bg-[#282141] text-[#8A8577]'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#ECE5D1] leading-tight">
                          Painel do Administrador
                        </h4>
                        <p className="text-[10px] text-[#B3AE9F]">
                          {isAdmin ? 'Acesso total liberado' : 'Acesso restrito (Modo Padrão)'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isAdmin
                          ? 'bg-[#2FB8BA]/10 text-[#4FDCDE] border-[#2FB8BA]/30'
                          : 'bg-[#1E1833] text-[#8A8577] border-[#282141]'
                      }`}
                    >
                      {isAdmin ? 'Admin' : 'Padrão'}
                    </span>
                  </div>

                  {isAdmin ? (
                    <div className="py-2 space-y-3">
                      {/* Grupo 1: Telas Exclusivas do Administrador */}
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-black tracking-wider uppercase text-[#8A8577] block">
                          Visualização & Gerenciamento
                        </span>

                        {/* Botão de Fotos - Exclusivo Admin */}
                        <button
                          id="admin-menu-photos-btn"
                          onClick={() => {
                            setActiveTab('photos');
                            setIsAdminMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                            activeTab === 'photos'
                              ? 'bg-[#2FB8BA]/15 border border-[#2FB8BA]/30 text-[#4FDCDE]'
                              : 'hover:bg-[#1E1833] text-[#ECE5D1]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#2FB8BA]/10 text-[#2FB8BA]">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                                Base de Fotos
                                {activeTab === 'photos' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2FB8BA]"></span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#B3AE9F] mt-0.5">
                                Gerenciar fotos e atualizar Deezer
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-[#171226] text-[#4FDCDE] px-2 py-0.5 rounded-lg border border-[#282141]">
                            {photosCount}/{artistsCount}
                          </span>
                        </button>

                        {/* Botão de Shows - Exclusivo Admin */}
                        <button
                          id="admin-menu-shows-btn"
                          onClick={() => {
                            setActiveTab('shows');
                            setIsAdminMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                            activeTab === 'shows'
                              ? 'bg-[#FFD60A]/15 border border-[#FFD60A]/30 text-[#FFD60A]'
                              : 'hover:bg-[#1E1833] text-[#ECE5D1]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#FFD60A]/10 text-[#FFD60A]">
                              <Table className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                                Catálogo de Shows
                                {activeTab === 'shows' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A]"></span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#B3AE9F] mt-0.5">
                                Lista detalhada de todos os eventos
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-[#171226] text-[#FFD60A] px-2 py-0.5 rounded-lg border border-[#282141]">
                            {showsCount} shows
                          </span>
                        </button>
                      </div>

                      {/* Grupo 2: Tarefas Exclusivas do Administrador */}
                      <div className="space-y-1 pt-2 border-t border-[#282141]">
                        <span className="px-3 text-[10px] font-black tracking-wider uppercase text-[#8A8577] block">
                          Tarefas de Administração
                        </span>

                        {/* Importar CSV */}
                        <button
                          id="admin-menu-csv-btn"
                          onClick={() => {
                            onOpenCsvModal();
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left hover:bg-[#1E1833] text-[#ECE5D1] transition-all cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-[#4FDCDE]/10 text-[#4FDCDE]">
                            <UploadCloud className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">Importar CSV de Shows</div>
                            <div className="text-[11px] text-[#B3AE9F] mt-0.5">
                              Carregar planilha com códigos e datas
                            </div>
                          </div>
                        </button>

                        {/* Carregar Demonstração */}
                        <button
                          id="admin-menu-demo-btn"
                          onClick={() => {
                            onLoadSample();
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left hover:bg-[#1E1833] text-[#ECE5D1] transition-all cursor-pointer"
                        >
                          <div className="p-2 rounded-xl bg-[#FFD60A]/10 text-[#FFD60A]">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">Carregar Demonstração</div>
                            <div className="text-[11px] text-[#B3AE9F] mt-0.5">
                              Popular com artistas e shows brasileiros
                            </div>
                          </div>
                        </button>

                        {/* Limpar Base de Dados */}
                        {showsCount > 0 && (
                          <button
                            id="admin-menu-clear-btn"
                            onClick={() => {
                              onClearAll();
                              setIsAdminMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                          >
                            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                              <Trash2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight">Limpar Base de Dados</div>
                              <div className="text-[11px] text-rose-400/70 mt-0.5">
                                Zerar catálogo e fotos salvas
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Grupo 3: Alternância de Perfil */}
                      {onToggleAdmin && (
                        <div className="pt-2 border-t border-[#282141]">
                          <button
                            id="admin-menu-toggle-profile-btn"
                            onClick={() => {
                              onToggleAdmin();
                              setIsAdminMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#171226] hover:bg-[#1E1833] text-left text-[11px] text-[#8A8577] hover:text-[#ECE5D1] transition-all cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Alternar para Modo Usuário (Padrão)
                            </span>
                            <Check className="w-3.5 h-3.5 text-[#2FB8BA]" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Conteúdo para usuário comum quando clica no botão Admin */
                    <div className="py-3 px-1 space-y-3">
                      <div className="p-3 bg-[#171226] rounded-2xl border border-[#282141] text-xs text-[#B3AE9F] space-y-1.5">
                        <div className="font-bold text-[#ECE5D1] flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-[#FFD60A]" />
                          Acesso de Administrador
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          As funções de <strong>Base de Fotos</strong>, <strong>Catálogo de Shows</strong> e{' '}
                          <strong>Importação CSV</strong> são reservadas aos administradores do sistema.
                        </p>
                      </div>

                      {onToggleAdmin && (
                        <button
                          id="admin-menu-enable-btn"
                          onClick={() => {
                            onToggleAdmin();
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full py-2.5 px-3 rounded-2xl font-extrabold text-xs bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] flex items-center justify-center gap-2 shadow-lg shadow-[#2FB8BA]/20 transition-all cursor-pointer active:scale-95"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Ativar Modo Administrador</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
