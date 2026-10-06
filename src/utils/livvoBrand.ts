/**
 * Regras de produto decididas em 06/10/2026 (documento "Estúdio Livvo — Decisões de Produto e UX").
 */

/** Site do Livvo, presente em todos os cards exportados (#12). */
export const LIVVO_SITE = 'www.livvomusic.com.br';

/** Mínimo de shows para mostrar gráficos e métricas de padrão (#6, #18, #4). */
export const MIN_SHOWS_FOR_PATTERNS = 10;

/** Mínimo de shows para a conquista de stickers (N2). */
export const MIN_SHOWS_FOR_STICKERS = 5;

/** Frase padrão enquanto não existe ferramenta de verificação de presença (N1). */
export const VERIFICATION_SOON = 'Em breve, o Livvo vai verificar a sua presença nos shows.';

/**
 * Selo de status exibido no card. O Livvo não usa "verificado" até ter ferramenta
 * de verificação (N1): selos com esse termo, inclusive de cards já salvos, não aparecem.
 */
export const visibleBadge = (text?: string | null): string => {
  const t = (text || '').trim();
  if (!t || /verificad/i.test(t)) return '';
  return t;
};
