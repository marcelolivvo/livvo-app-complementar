import React, { useSyncExternalStore } from 'react';

/**
 * Roteador mínimo por URL (History API), sem dependência externa.
 * Rotas da prévia "livvo-final" (estrutura proposta para o site final):
 *   /                 Início
 *   /explorar         Explorar shows (?q= &aba=proximos &cidade= &ano= &casa=)
 *   /show/:id         Detalhe do show (ID do catálogo, base setlist.fm)
 *   /registrar        Registrar show (artista → data → Eu fui)
 *   /comunidade       Comunidade (parte 4)
 *   /minha-historia   Minha História / Passaporte (parte 3)
 *   /alertas          Alertas e agenda (parte 4)
 *   /estudio          Estúdio (laboratório do redesign, mantido para comparação)
 *   /admin            Área interna (só com modo admin)
 * Na Vercel, o vercel.json já devolve o index.html para qualquer rota fora de /api.
 */

const EVENT = 'livvo-route-change';

const subscribe = (fn: () => void) => {
  window.addEventListener('popstate', fn);
  window.addEventListener(EVENT, fn);
  return () => {
    window.removeEventListener('popstate', fn);
    window.removeEventListener(EVENT, fn);
  };
};

const snapshot = () => window.location.pathname + window.location.search;

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

export const useRoute = (): Route => {
  const href = useSyncExternalStore(subscribe, snapshot, () => '/');
  const url = new URL(href, 'http://livvo.local');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  return { path, segments: path.split('/').filter(Boolean), query: url.searchParams };
};

export const navigate = (to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}) => {
  if (to === snapshot()) return;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(EVENT));
  if (!opts.keepScroll) window.scrollTo({ top: 0 });
};

/** Atualiza só a query da rota atual (filtros), sem empilhar histórico. */
export const setQuery = (patch: Record<string, string | null | undefined>) => {
  const url = new URL(window.location.href);
  Object.entries(patch).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  });
  navigate(url.pathname + (url.search ? url.search : ''), { replace: true, keepScroll: true });
};

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export const Link: React.FC<LinkProps> = ({ to, onClick, children, ...rest }) => (
  <a
    href={to}
    onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (rest.target && rest.target !== '_self') return;
      e.preventDefault();
      navigate(to);
    }}
    {...rest}
  >
    {children}
  </a>
);
