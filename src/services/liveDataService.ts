/**
 * Cliente das integrações Setlist.fm e Bandsintown.
 * Todas as chamadas passam pelo servidor Livvo (/api/...), que guarda as chaves.
 */

export interface LiveSetlistSong {
  name: string;
  cover?: string;
  info?: string;
  encore: boolean;
  tape: boolean;
}

export interface LiveSetlist {
  id: string;
  artistName: string;
  artistMbid?: string;
  date: string; // dd/MM/yyyy
  venue: string;
  city: string;
  state?: string;
  country?: string;
  tourName?: string;
  url?: string;
  songs: LiveSetlistSong[];
}

export interface LiveEvent {
  id: string;
  artistName: string;
  date: string; // dd/MM/yyyy
  time?: string;
  datetime: string;
  title?: string;
  venue: string;
  city: string;
  region?: string;
  country?: string;
  lineup: string[];
  ticketUrl?: string;
  ticketStatus?: string;
  url?: string;
}

export interface IntegrationStatus {
  setlistfm: boolean;
  bandsintown: boolean;
}

let statusPromise: Promise<IntegrationStatus> | null = null;

export function getIntegrationStatus(): Promise<IntegrationStatus> {
  if (!statusPromise) {
    statusPromise = fetch('/api/integrations/status')
      .then((r) => (r.ok ? r.json() : { setlistfm: false, bandsintown: false }))
      .catch(() => ({ setlistfm: false, bandsintown: false }));
  }
  return statusPromise;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Erro ${res.status}`);
  return body as T;
}

const SETLIST_ID_RE = /^[0-9a-f]{6,12}$/i;

/** Busca o setlist de um show: pelo ID do setlist.fm quando houver, senão por artista + data. */
export async function findSetlistForShow(show: {
  id?: string;
  artistName: string;
  date?: string;
  city?: string;
}): Promise<LiveSetlist | null> {
  if (show.id && SETLIST_ID_RE.test(show.id)) {
    try {
      const { setlist } = await getJson<{ setlist: LiveSetlist }>(
        `/api/setlistfm/setlist/${encodeURIComponent(show.id)}`
      );
      if (setlist?.songs?.length) return setlist;
    } catch {
      // cai para a busca por artista + data
    }
  }
  const qs = new URLSearchParams({ artist: show.artistName });
  if (show.date) qs.set('date', show.date);
  if (show.city) qs.set('city', show.city);
  const { setlists } = await getJson<{ setlists: LiveSetlist[] }>(`/api/setlistfm/search?${qs}`);
  return setlists.find((s) => s.songs.length > 0) || setlists[0] || null;
}

export function searchSetlists(params: { artist?: string; mbid?: string; date?: string; city?: string; page?: number }) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && qs.set(k, String(v)));
  return getJson<{ page: number; total: number; setlists: LiveSetlist[] }>(`/api/setlistfm/search?${qs}`);
}

export function getArtistEvents(artist: string, date: 'upcoming' | 'past' | 'all' = 'upcoming', country?: string) {
  const qs = new URLSearchParams({ artist, date });
  if (country) qs.set('country', country);
  return getJson<{ artist: string; total: number; events: LiveEvent[] }>(`/api/bandsintown/events?${qs}`);
}

export function getBandsintownArtist(name: string) {
  return getJson<{
    artist: { id: string; name: string; imageUrl?: string; url?: string; trackers?: number; upcomingEvents?: number };
  }>(`/api/bandsintown/artist?name=${encodeURIComponent(name)}`);
}
