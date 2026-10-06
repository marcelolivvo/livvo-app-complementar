import React, { useState, useRef, useEffect } from 'react';
import { AdminCatalogToggle } from './AdminCatalogToggle';
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
  Ticket,
  UserCircle2,
  LogIn,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { guestService, GUEST_CARD_LIMIT } from '../services/guestService';
import { adminCatalog } from '../services/adminCatalogService';
import { LivvoLogo } from './LivvoLogo';
import { ShowItem, ArtistItem } from '../types';

export type ActiveTab = 'studio' | 'wallet' | 'photos' | 'shows' | 'table' | 'b2b';

export interface NavbarProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  currentTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  showsCount?: number;
  artistsCount?: number;
  photosCount?: number;
  walletCount?: number;
  shows?: ShowItem[];
  artists?: ArtistItem[];
  photosMap?: Map<string, string>;
  onSelectArtist?: (artist: ArtistItem) => void;
  onSelectShow?: (show: ShowItem) => void;
  onOpenCsvModal?: () => void;
  onOpenUploader?: () => void;
  onLoadSample?: () => void;
  onClearAll?: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  currentTab,
  onSelectTab,
  showsCount: propShowsCount,
  artistsCount: propArtistsCount,
  photosCount: propPhotosCount,
  walletCount = 0,
  shows = [],
  artists = [],
  photosMap = new Map(),
  onSelectArtist,
  onSelectShow,
  onOpenCsvModal,
  onOpenUploader,
  onLoadSample,
  onClearAll,
  isAdmin: _isAdminProp,
  onToggleAdmin,
}) => {
  // #14: o Admin fica dentro do menu do usuário e só aparece para administradores.
  // Nesta prévia, a área de admin é liberada com ?admin=1 no endereço (ou pelo código de admin já salvo);
  // ?admin=0 desliga. No livvomusic.com.br, quem define o admin é o login real.
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const flag = new URLSearchParams(window.location.search).get('admin');
      if (flag === '1') localStorage.setItem('livvo_admin_mode_v1', '1');
      if (flag === '0') localStorage.removeItem('livvo_admin_mode_v1');
      return localStorage.getItem('livvo_admin_mode_v1') === '1' || adminCatalog.hasKey();
    } catch {
      return false;
    }
  });
  const [account, setAccount] = useState(() => ({
    login: guestService.getLogin(),
    used: guestService.usedCount(),
  }));
  useEffect(
    () =>
      guestService.onChange(() => setAccount({ login: guestService.getLogin(), used: guestService.usedCount() })),
    []
  );
  useEffect(() => adminCatalog.onChange(() => setIsAdmin((prev) => prev || adminCatalog.hasKey())), []);
  const accountLabel = account.login ? account.login.email.split('@')[0] : 'Entrar';
  const activeTab = (propActiveTab || currentTab || 'studio') as ActiveTab;
  const setActiveTab = (tab: ActiveTab) => {
    if (propSetActiveTab) propSetActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };
  const handleOpenCsv = () => {
    if (onOpenCsvModal) onOpenCsvModal();
    else if (onOpenUploader) onOpenUploader();
  };
  const showsCount = propShowsCount ?? shows.length;
  const artistsCount = propArtistsCount ?? artists.length;
  const photosCount = propPhotosCount ?? photosMap.size;
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
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center hover:scale-105 transition-transform cursor-pointer" onClick={() => setActiveTab('studio')}>
              <LivvoLogo className="w-11 h-11 sm:w-16 sm:h-16 drop-shadow-lg" />
            </div>

            {/* #14: no celular o cabeçalho fica só com a marca, as abas e o usuário */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tight text-[#ECE5D1] leading-none">
                Virtual <span className="text-[#2FB8BA]">Poster</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-[#B3AE9F] font-medium hidden sm:inline">
                  Lembrança Personalizada do Show
                </span>
              </div>
            </div>
          </div>

          {/* Navigation - Main Navigation Bar (Fotos e Shows foram movidos exclusivamente para o menu de Admin) */}
          <nav className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              id="tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-[#2FB8BA] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25 scale-100'
                  : 'bg-[#171226] text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833] border border-[#282141]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Estúdio</span>
            </button>

            <button
              id="tab-wallet"
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] shadow-lg shadow-black/20 scale-100'
                  : 'bg-[#171226] text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#1E1833] border border-[#282141]'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span className="sm:hidden">Wallet</span>
              <span className="hidden sm:inline">Livvo Wallet</span>
              {typeof walletCount === 'number' && walletCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'wallet' ? 'bg-[#100C1F] text-[#ECE5D1]' : 'bg-[#ECE5D1]/20 text-[#ECE5D1]'}`}>
                  {walletCount}
                </span>
              )}
            </button>

            {/* Active Context Chip for Admin (quando visualizando Fotos ou Shows) */}
            {isAdmin && activeTab === 'photos' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30 animate-in fade-in">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Admin:</span> Fotos
              </span>
            )}

            {isAdmin && activeTab === 'shows' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2FB8BA]/15 text-[#4FDCDE] border border-[#2FB8BA]/30 animate-in fade-in">
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
                id="user-menu-toggle-btn"
                onClick={() => setIsAdminMenuOpen((prev) => !prev)}
                aria-expanded={isAdminMenuOpen}
                aria-haspopup="menu"
                aria-label={account.login ? `Menu do usuário ${account.login.email}` : 'Entrar ou abrir o menu do usuário'}
                className={`inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-2.5 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                  isAdminMenuOpen
                    ? 'bg-[#2FB8BA] text-[#100C1F] border-[#2FB8BA] shadow-lg shadow-[#2FB8BA]/25'
                    : 'bg-[#2FB8BA]/10 text-[#4FDCDE] border-[#2FB8BA]/30 hover:bg-[#2FB8BA]/20 hover:border-[#4FDCDE]'
                }`}
                title={account.login ? account.login.email : 'Entrar'}
              >
                <UserCircle2 className="w-5 h-5 text-inherit" />
                <span className="hidden sm:inline max-w-[110px] truncate">{accountLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isAdminMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Panel */}
              {isAdminMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl bg-[#140F24]/98 border border-[#282141] shadow-2xl backdrop-blur-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Conta do usuário (#12 e #14) */}
                  <div className="px-3 py-3 space-y-3">
                    {account.login ? (
                      <>
                        <div className="min-w-0">
                          <div className="text-[11px] text-[#8A8577]">Conectado como</div>
                          <div className="text-[13px] font-bold text-[#ECE5D1] truncate">{account.login.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            guestService.logout();
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#171226] hover:bg-[#1E1833] text-[12px] font-bold text-[#B3AE9F] hover:text-[#ECE5D1]"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[12.5px] text-[#B3AE9F]">
                          Sem login você cria até {GUEST_CARD_LIMIT} cards.{' '}
                          <span className="text-[#ECE5D1] font-bold">
                            {account.used} de {GUEST_CARD_LIMIT} usados.
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdminMenuOpen(false);
                            guestService.requestLogin();
                          }}
                          className="w-full py-2.5 px-3 rounded-2xl font-extrabold text-xs bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          Entrar no Livvo
                        </button>
                      </>
                    )}
                  </div>

                  {isAdmin && (
                  <div className="border-t border-[#282141] pt-1">
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
                      {/* Catálogo completo (CSV) — liberado só com o código de admin */}
                      <AdminCatalogToggle />

                      {/* Grupo 1: Telas Exclusivas do Administrador */}
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-black tracking-wider uppercase text-[#8A8577] block">
                          Visualização & Gerenciamento
                        </span>

                        <button id="admin-menu-b2b-btn" onClick={() => { setActiveTab('b2b'); setIsAdminMenuOpen(false); }} className="w-full p-2.5 rounded-2xl text-left hover:bg-[#2FB8BA]/15 text-[#4FDCDE]">
                          <span className="font-bold">Livvo B2B</span>
                          <span className="block text-[11px] text-[#B3AE9F] mt-0.5">Páginas para parceiros do Livvo</span>
                        </button>

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
                            handleOpenCsv();
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
                            if (onLoadSample) onLoadSample();
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
                              if (onClearAll) onClearAll();
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
                  ) : null}
                  {/* Teste da prévia: zera a contagem de cards sem login */}
                  <div className="px-3 pt-2 border-t border-[#282141] mt-2">
                    <button
                      type="button"
                      onClick={() => guestService.resetGuestCards()}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-[11px] text-[#8A8577] hover:text-[#ECE5D1] hover:bg-[#1E1833]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Zerar contagem de cards sem login (teste)
                    </button>
                  </div>
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
