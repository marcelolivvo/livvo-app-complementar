/**
 * Catálogo completo (CSV do Setlist.fm, data/shows-completo.csv) — só para admin.
 *
 * O servidor só responde /api/catalog/search com o código de admin certo
 * (variável LIVVO_ADMIN_KEY no Vercel). O código digitado fica guardado só
 * neste navegador e vai no cabeçalho x-livvo-admin-key de cada busca.
 */
import type { ArtistItem, ShowItem } from '../types';
import { normalizeStateUF } from '../utils/stateUtils';

const KEY_STORAGE = 'livvo_admin_key_v1';
const ON_STORAGE = 'livvo_full_catalog_v1';
const EVENT = 'livvo:full-catalog-changed';

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* sem armazenamento */
  }
};

export const adminCatalog = {
  hasKey: () => Boolean(read(KEY_STORAGE)),
  isEnabled: () => read(ON_STORAGE) === '1' && Boolean(read(KEY_STORAGE)),

  /** Confere o código no servidor. Só guarda se estiver certo. */
  async unlock(code: string): Promise<{ ok: boolean; message: string }> {
    const clean = code.trim();
    if (!clean) return { ok: false, message: 'Digite o código de admin.' };
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'x-livvo-admin-key': clean },
      });
      if (res.ok) {
        write(KEY_STORAGE, clean);
        write(ON_STORAGE, '1');
        window.dispatchEvent(new Event(EVENT));
        return { ok: true, message: 'Catálogo completo ligado.' };
      }
      if (res.status === 503) return { ok: false, message: 'O código de admin ainda não foi criado no Vercel.' };
      if (res.status === 429) return { ok: false, message: 'Muitas tentativas. Aguarde um minuto.' };
      return { ok: false, message: 'Código incorreto.' };
    } catch {
      return { ok: false, message: 'Sem conexão com o servidor.' };
    }
  },

  setEnabled(on: boolean) {
    write(ON_STORAGE, on ? '1' : null);
    window.dispatchEvent(new Event(EVENT));
  },

  /** Esquece o código neste navegador. */
  lock() {
    write(KEY_STORAGE, null);
    write(ON_STORAGE, null);
    window.dispatchEvent(new Event(EVENT));
  },

  onChange(cb: () => void) {
    window.addEventListener(EVENT, cb);
    return () => window.removeEventListener(EVENT, cb);
  },
};

interface ServerSearch {
  artists: Array<ArtistItem & { mbid?: string }>;
  shows: Array<ShowItem & { country?: string; setlistUrl?: string }>;
}

const normName = (v: string) =>
  (v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

/** Busca no catálogo completo. Retorna null se não autorizado (cai para a lista padrão). */
export async function searchFullCatalog(
  params: { q?: string; artist?: string; artistCode?: string; limit?: number },
  signal?: AbortSignal
): Promise<{ artists: ArtistItem[]; shows: ShowItem[] } | null> {
  const key = read(KEY_STORAGE);
  if (!key) return null;
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.artist) qs.set('artist', params.artist);
  if (params.limit) qs.set('limit', String(params.limit));
  const res = await fetch(`/api/catalog/search?${qs}`, { headers: { 'x-livvo-admin-key': key }, signal });
  if (res.status === 401) {
    // Código trocado no Vercel: desliga até digitar de novo
    adminCatalog.lock();
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json()) as ServerSearch;

  let shows: ShowItem[] = (data.shows || []).map((s) => ({
    id: s.id,
    showCode: s.showCode,
    artistCode: s.artistCode,
    artistName: s.artistName,
    tourName: s.tourName,
    venue: s.venue,
    date: s.date,
    city: s.city,
    state: normalizeStateUF(s.state) || s.state,
    posterUrl: s.posterUrl,
    photoUrl: s.photoUrl,
  }));

  // Shows de um artista: só os do próprio artista (o servidor busca por trecho do nome)
  if (params.artist) {
    const target = normName(params.artist);
    shows = shows.filter(
      (s) => (params.artistCode && s.artistCode === params.artistCode) || normName(s.artistName) === target
    );
  }

  const artists: ArtistItem[] = (data.artists || []).map((a) => ({
    artistCode: a.artistCode,
    artistName: a.artistName,
    photoUrl: a.photoUrl,
    showsCount: a.showsCount,
  }));

  return { artists, shows };
}
