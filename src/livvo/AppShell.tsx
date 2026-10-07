import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Compass,
  FlaskConical,
  House,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Shield,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Ticket,
  Images,
} from 'lucide-react';
import { Link, useRoute } from './router';
import { livvo, useLivvo } from './store';
import { Avatar, Avisos, avisar } from './ui';
import { guestService } from '../services/guestService';
import { adminCatalog } from '../services/adminCatalogService';
import { LoginModal } from '../components/LoginModal';
import { AdminFotos } from './AtualizarFoto';
import { useCatalogo } from './data/catalog';
import { tabelaDuotone } from './fotos';

/** Modo admin da prévia: ?admin=1 liga, ?admin=0 desliga (igual ao Estúdio). No site final, vem do login. */
export const useAdmin = (): boolean => {
  const [admin] = useState<boolean>(() => {
    try {
      const flag = new URLSearchParams(window.location.search).get('admin');
      if (flag === '1') localStorage.setItem('livvo_admin_mode_v1', '1');
      if (flag === '0') localStorage.removeItem('livvo_admin_mode_v1');
      return localStorage.getItem('livvo_admin_mode_v1') === '1' || adminCatalog.hasKey();
    } catch {
      return false;
    }
  });
  return admin;
};

const ABAS = [
  { to: '/', rotulo: 'Início', icone: House, ativo: (p: string) => p === '/' },
  { to: '/explorar', rotulo: 'Shows', icone: Compass, ativo: (p: string) => p.startsWith('/explorar') || p.startsWith('/show/') },
  { to: '/comunidade', rotulo: 'Comunidade', icone: Users, ativo: (p: string) => p.startsWith('/comunidade') },
  { to: '/minha-historia', rotulo: 'Minha História', icone: BookOpen, ativo: (p: string) => p.startsWith('/minha-historia') },
];

const MenuConta: React.FC<{ fechar: () => void; admin: boolean; abrirFotos: () => void }> = ({ fechar, admin, abrirFotos }) => {
  const { logado, perfil, exemplos } = useLivvo();
  const acao = (fn: () => void, aviso?: string) => () => {
    fn();
    fechar();
    if (aviso) avisar(aviso);
  };
  return (
    <div className="lv-menu" role="menu" aria-label="Menu da conta">
      {logado ? (
        <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
          <Avatar nome={perfil.nome} tamanho={42} />
          <div className="min-w-0">
            <div className="font-extrabold text-[14.5px] truncate">{perfil.nome}</div>
            <div className="lv-meta">@{perfil.usuario}</div>
            <span className="lv-tag lv-tag--teal mt-1">Conta de demonstração</span>
          </div>
        </div>
      ) : (
        <div className="px-2.5 pt-2 pb-3">
          <div className="font-extrabold text-[14.5px]">Você está como visitante</div>
          <p className="lv-meta mt-1">Páginas de show abrem sem login. Para registrar, entre.</p>
        </div>
      )}
      <div className="lv-menu-sep" />
      {logado && (
        <Link to="/minha-historia" className="lv-menu-item" role="menuitem" onClick={fechar}>
          <BookOpen /> Minha História
        </Link>
      )}
      <Link to="/estudio" className="lv-menu-item" role="menuitem" onClick={fechar}>
        <FlaskConical /> Estúdio (laboratório)
      </Link>
      {admin && (
        <Link to="/admin" className="lv-menu-item" role="menuitem" onClick={fechar}>
          <Shield /> Área interna
        </Link>
      )}
      {admin && (
        <button
          type="button"
          className="lv-menu-item"
          role="menuitem"
          onClick={() => {
            fechar();
            abrirFotos();
          }}
        >
          <Images /> Atualizar todas as fotos
          <span className="lv-tag lv-tag--next ml-auto">Admin</span>
        </button>
      )}
      <div className="lv-menu-sep" />
      <div className="lv-kicker px-2.5 pt-1 pb-1">Prévia</div>
      <button
        type="button"
        className="lv-menu-item"
        role="menuitemcheckbox"
        aria-checked={exemplos}
        onClick={acao(() => livvo.alternarExemplos(), exemplos ? 'Comunidade de exemplo desligada' : 'Comunidade de exemplo ligada')}
      >
        {exemplos ? <Eye /> : <EyeOff />}
        <span className="flex-1">Comunidade de exemplo</span>
        <span className={`lv-tag ${exemplos ? 'lv-tag--cyan' : 'lv-tag--next'}`}>{exemplos ? 'Ligada' : 'Desligada'}</span>
      </button>
      {logado && (
        <>
          <button type="button" className="lv-menu-item" role="menuitem" onClick={acao(() => livvo.restaurarDemonstracao(), 'Demonstração restaurada')}>
            <RotateCcw /> Restaurar as 25 memórias
          </button>
          <button type="button" className="lv-menu-item" role="menuitem" onClick={acao(() => livvo.comecarDoZero(), 'Conta zerada')}>
            <Trash2 /> Começar do zero
          </button>
        </>
      )}
      <button
        type="button"
        className="lv-menu-item"
        role="menuitem"
        onClick={acao(() => guestService.resetGuestCards(), 'Contagem do Estúdio zerada')}
      >
        <Ticket /> Zerar cards sem login do Estúdio
      </button>
      <div className="lv-menu-sep" />
      {logado ? (
        <button type="button" className="lv-menu-item" role="menuitem" onClick={acao(() => livvo.sair(), 'Agora você está como visitante')}>
          <LogOut /> Sair e ver como visitante
        </button>
      ) : (
        <button type="button" className="lv-menu-item" role="menuitem" onClick={acao(() => livvo.entrar())}>
          <LogIn /> Entrar
        </button>
      )}
    </div>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path } = useRoute();
  const { logado, perfil } = useLivvo();
  const admin = useAdmin();
  const [menu, setMenu] = useState(false);
  const [fotosAdmin, setFotosAdmin] = useState(false);
  const { catalogo } = useCatalogo();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    if (!menu) return;
    const fora = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [menu]);

  const registrarAtivo = path.startsWith('/registrar');

  return (
    <div className="lv-app">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-[#ECE5D1] focus:text-[#100C1F]">
        Pular para o conteúdo
      </a>
      <div className="lv-preview-strip">
        <span>
          <b>Prévia do Livvo final</b> · o site oficial continua no livvomusic.com.br
        </span>
      </div>
      <header className="lv-topbar">
        <div className="lv-topbar-inner">
          <Link to="/" className="lv-brand" aria-label="Livvo, Início">
            <img src="/livvo/livvo-icon-128.png" alt="" width={34} height={34} />
          </Link>
          <nav className="lv-nav" aria-label="Principal">
            {ABAS.map((a) => (
              <Link key={a.to} to={a.to} aria-current={a.ativo(path) ? 'page' : undefined}>
                {a.rotulo}
              </Link>
            ))}
          </nav>
          <div className="flex-1" />
          <Link to="/registrar" className="lv-btn lv-btn--cyan lv-reg-top" aria-current={registrarAtivo ? 'page' : undefined}>
            <Plus className="w-4 h-4" strokeWidth={3} />
            Registrar show
          </Link>
          <Link to="/alertas" className="lv-iconbtn" aria-label="Alertas" aria-current={path.startsWith('/alertas') ? 'page' : undefined}>
            <Bell className="w-5 h-5" />
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="lv-iconbtn"
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label={logado ? `Conta de ${perfil.nome}` : 'Entrar ou opções da prévia'}
              onClick={() => setMenu((v) => !v)}
            >
              {logado ? <Avatar nome={perfil.nome} tamanho={32} /> : <LogIn className="w-5 h-5" />}
            </button>
            {menu && <MenuConta fechar={() => setMenu(false)} admin={admin} abrirFotos={() => setFotosAdmin(true)} />}
          </div>
        </div>
      </header>

      <main id="conteudo" className="lv-main">
        {children}
      </main>

      <nav className="lv-tabbar" aria-label="Principal">
        {ABAS.slice(0, 2).map((a) => (
          <Link key={a.to} to={a.to} aria-current={a.ativo(path) ? 'page' : undefined}>
            <a.icone />
            {a.rotulo}
          </Link>
        ))}
        <Link to="/registrar" className="lv-tab-reg" aria-current={registrarAtivo ? 'page' : undefined} aria-label="Registrar show">
          <span className="lv-tab-reg-btn">
            <Plus strokeWidth={2.6} />
          </span>
          Registrar
        </Link>
        {ABAS.slice(2).map((a) => (
          <Link key={a.to} to={a.to} aria-current={a.ativo(path) ? 'page' : undefined}>
            <a.icone />
            {a.rotulo}
          </Link>
        ))}
      </nav>

      {/* Duotone suave da marca para fotos automáticas (mesmo mapa de cores de fotos.ts) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="lv-duotone" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={tabelaDuotone(0)} />
            <feFuncG type="table" tableValues={tabelaDuotone(1)} />
            <feFuncB type="table" tableValues={tabelaDuotone(2)} />
          </feComponentTransfer>
        </filter>
      </svg>
      <Avisos />
      <LoginModal />
      {admin && fotosAdmin && <AdminFotos catalogo={catalogo} fechar={() => setFotosAdmin(false)} />}
    </div>
  );
};
