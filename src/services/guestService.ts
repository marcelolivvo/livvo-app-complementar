/**
 * Limite de cards sem login (#12, decisão de 06/10/2026).
 *
 * Nesta prévia (Vercel) o login é uma SIMULAÇÃO guardada no navegador: não cria conta
 * nem envia dados. No livvomusic.com.br o mesmo ponto passa a usar o login real.
 *
 * Regra: sem login, a pessoa pode criar até 3 cards diferentes (salvar, baixar,
 * copiar ou compartilhar). No 4º card, abre a tela de login.
 */

export const GUEST_CARD_LIMIT = 3;

const CARDS_KEY = 'livvo_guest_cards_v1';
const LOGIN_KEY = 'livvo_login_sim_v1';
const CHANGE_EVENT = 'livvo-auth-change';
const OPEN_EVENT = 'livvo-open-login';

export interface SimLogin {
  email: string;
  at: number;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
};

let memoryCards: string[] | null = null;
let memoryLogin: SimLogin | null | undefined;

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export const guestService = {
  getLogin(): SimLogin | null {
    if (memoryLogin !== undefined) return memoryLogin;
    return read<SimLogin | null>(LOGIN_KEY, null);
  },

  isLoggedIn(): boolean {
    return Boolean(this.getLogin());
  },

  login(email: string) {
    const value: SimLogin = { email: email.trim().toLowerCase(), at: Date.now() };
    memoryLogin = value;
    write(LOGIN_KEY, value);
    notify();
  },

  logout() {
    memoryLogin = null;
    write(LOGIN_KEY, null);
    notify();
  },

  getGuestCards(): string[] {
    if (memoryCards) return memoryCards;
    const list = read<string[]>(CARDS_KEY, []);
    return Array.isArray(list) ? list : [];
  },

  usedCount(): number {
    return Math.min(GUEST_CARD_LIMIT, this.getGuestCards().length);
  },

  /** Zera a contagem de cards sem login (opção de teste no menu do usuário). */
  resetGuestCards() {
    memoryCards = [];
    write(CARDS_KEY, []);
    notify();
  },

  /**
   * Libera (true) ou bloqueia (false) uma ação sobre o card `cardKey`.
   * Com login, sempre libera. Sem login, libera os 3 primeiros cards diferentes
   * (repetir ações no mesmo card não conta de novo) e, a partir do 4º, abre o login.
   */
  allowCard(cardKey: string): boolean {
    if (this.isLoggedIn()) return true;
    const key = cardKey.trim() || 'card';
    const list = this.getGuestCards();
    if (list.includes(key)) return true;
    if (list.length >= GUEST_CARD_LIMIT) {
      this.requestLogin();
      return false;
    }
    const next = [...list, key];
    memoryCards = next;
    write(CARDS_KEY, next);
    notify();
    return true;
  },

  requestLogin() {
    window.dispatchEvent(new Event(OPEN_EVENT));
  },

  onChange(fn: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, fn);
    return () => window.removeEventListener(CHANGE_EVENT, fn);
  },

  onOpenRequest(fn: () => void): () => void {
    window.addEventListener(OPEN_EVENT, fn);
    return () => window.removeEventListener(OPEN_EVENT, fn);
  },
};
