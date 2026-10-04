import type { Express, Request, Response } from 'express';
import { checkRateLimit } from './serverCatalog';

/**
 * Integrações externas de dados ao vivo: Setlist.fm e Bandsintown.
 *
 * As chaves ficam SOMENTE no servidor (variáveis de ambiente da Vercel) e nunca
 * são enviadas ao navegador. Sem a chave configurada, a rota responde 503 e o
 * front-end esconde os recursos correspondentes.
 *
 *   SETLISTFM_API_KEY   -> https://www.setlist.fm/settings/api
 *   BANDSINTOWN_APP_ID  -> app_id fornecido pela Bandsintown
 */

const SETLISTFM_BASE = 'https://api.setlist.fm/rest/1.0';
const BANDSINTOWN_BASE = 'https://rest.bandsintown.com';
const USER_AGENT = 'LivvoApp/1.0 (https://livvo.com.br)';

const setlistKey = () => (process.env.SETLISTFM_API_KEY || '').trim();
const bandsintownId = () => (process.env.BANDSINTOWN_APP_ID || '').trim();

// ---------------------------------------------------------------------------
// Cache simples em memória (por instância serverless)
// ---------------------------------------------------------------------------
const cache = new Map<string, { expires: number; value: unknown }>();
const CACHE_MAX = 500;

async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await loader();
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

// ---------------------------------------------------------------------------
// Setlist.fm: limite padrão de 2 requisições/segundo -> fila com espaçamento
// ---------------------------------------------------------------------------
let setlistQueue: Promise<unknown> = Promise.resolve();
let lastSetlistCall = 0;
const SETLIST_MIN_INTERVAL_MS = 550;

class UpstreamError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function setlistFetch(pathAndQuery: string): Promise<any> {
  const run = async () => {
    const wait = lastSetlistCall + SETLIST_MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastSetlistCall = Date.now();
    const res = await fetch(`${SETLISTFM_BASE}${pathAndQuery}`, {
      headers: {
        'x-api-key': setlistKey(),
        Accept: 'application/json',
        'Accept-Language': 'pt',
        'User-Agent': USER_AGENT,
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new UpstreamError(res.status, `Setlist.fm respondeu ${res.status}`);
    return res.json();
  };
  const p = setlistQueue.then(run, run);
  setlistQueue = p.catch(() => undefined);
  return p;
}

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
  date: string; // dd/MM/yyyy (mesmo formato do catálogo Livvo)
  venue: string;
  city: string;
  state?: string;
  country?: string;
  tourName?: string;
  url?: string;
  songs: LiveSetlistSong[];
}

function normalizeSetlist(s: any): LiveSetlist {
  const songs: LiveSetlistSong[] = [];
  for (const set of s?.sets?.set || []) {
    const encore = Boolean(set?.encore);
    for (const song of set?.song || []) {
      if (!song?.name) continue;
      songs.push({
        name: String(song.name),
        cover: song.cover?.name || undefined,
        info: song.info || undefined,
        encore,
        tape: Boolean(song.tape),
      });
    }
  }
  return {
    id: String(s?.id || ''),
    artistName: s?.artist?.name || '',
    artistMbid: s?.artist?.mbid || undefined,
    date: String(s?.eventDate || '').replace(/-/g, '/'),
    venue: s?.venue?.name || '',
    city: s?.venue?.city?.name || '',
    state: s?.venue?.city?.stateCode || s?.venue?.city?.state || undefined,
    country: s?.venue?.city?.country?.code || undefined,
    tourName: s?.tour?.name || undefined,
    url: s?.url || undefined,
    songs,
  };
}

// ---------------------------------------------------------------------------
// Bandsintown
// ---------------------------------------------------------------------------
function encodeBandsintownName(name: string): string {
  // Bandsintown exige escape duplo para / ? * " no nome do artista
  return encodeURIComponent(name)
    .replace(/%2F/gi, '%252F')
    .replace(/%3F/gi, '%253F')
    .replace(/\*/g, '%252A')
    .replace(/%22/gi, '%27C');
}

async function bandsintownFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams({ ...params, app_id: bandsintownId() });
  const res = await fetch(`${BANDSINTOWN_BASE}${path}?${qs.toString()}`, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new UpstreamError(res.status, `Bandsintown respondeu ${res.status}`);
  const text = await res.text();
  if (!text || text.trim() === '' || text.includes('{warn=Not found}')) return null;
  return JSON.parse(text);
}

export interface LiveEvent {
  id: string;
  artistName: string;
  date: string; // dd/MM/yyyy
  time?: string; // HH:mm
  datetime: string; // ISO original
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

function normalizeEvent(e: any, fallbackArtist: string): LiveEvent {
  const dt = String(e?.datetime || '');
  const [d, t] = dt.split('T');
  const [y, m, day] = (d || '').split('-');
  const ticket = (e?.offers || []).find((o: any) => o?.type === 'Tickets') || (e?.offers || [])[0];
  return {
    id: String(e?.id || ''),
    artistName: (e?.lineup && e.lineup[0]) || fallbackArtist,
    date: y && m && day ? `${day}/${m}/${y}` : '',
    time: t ? t.slice(0, 5) : undefined,
    datetime: dt,
    title: e?.title || undefined,
    venue: e?.venue?.name || '',
    city: e?.venue?.city || '',
    region: e?.venue?.region || undefined,
    country: e?.venue?.country || undefined,
    lineup: Array.isArray(e?.lineup) ? e.lineup : [],
    ticketUrl: ticket?.url || undefined,
    ticketStatus: ticket?.status || undefined,
    url: e?.url || undefined,
  };
}

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------
function clientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown-client'
  );
}

function guard(req: Request, res: Response): boolean {
  const rl = checkRateLimit(clientIp(req));
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.resetInSec));
    res.status(429).json({ error: 'Muitas requisições. Aguarde alguns segundos.', retryAfter: rl.resetInSec });
    return false;
  }
  return true;
}

function handleError(res: Response, err: unknown, source: string) {
  const status = err instanceof UpstreamError ? err.status : 500;
  console.error(`Erro na integração ${source}:`, err);
  if (status === 401 || status === 403) {
    return res.status(502).json({ error: `Chave da ${source} inválida ou sem permissão.` });
  }
  if (status === 429) {
    return res.status(503).json({ error: `Limite de uso da ${source} atingido. Tente novamente em instantes.` });
  }
  return res.status(502).json({ error: `Falha ao consultar ${source}.` });
}

const SETLIST_ID_RE = /^[0-9a-f]{6,12}$/i;
const DATE_RE = /^(\d{2})[/-](\d{2})[/-](\d{4})$/;
const HOUR = 60 * 60 * 1000;

export function registerIntegrationRoutes(app: Express) {
  app.get('/api/integrations/status', (_req, res) => {
    res.json({ setlistfm: Boolean(setlistKey()), bandsintown: Boolean(bandsintownId()) });
  });

  // Setlist completo pelo ID do setlist.fm (o mesmo ID usado no catálogo Livvo)
  app.get('/api/setlistfm/setlist/:id', async (req, res) => {
    if (!setlistKey()) return res.status(503).json({ error: 'Setlist.fm não configurado.' });
    const id = String(req.params.id || '').trim();
    if (!SETLIST_ID_RE.test(id)) return res.status(400).json({ error: 'ID de setlist inválido.' });
    if (!guard(req, res)) return;
    try {
      const data = await cached(`sl:id:${id}`, 12 * HOUR, () => setlistFetch(`/setlist/${id}`));
      if (!data) return res.status(404).json({ error: 'Setlist não encontrado.' });
      return res.json({ setlist: normalizeSetlist(data) });
    } catch (err) {
      return handleError(res, err, 'Setlist.fm');
    }
  });

  // Busca de setlists por artista (nome ou MBID), data (dd/MM/yyyy) e cidade
  app.get('/api/setlistfm/search', async (req, res) => {
    if (!setlistKey()) return res.status(503).json({ error: 'Setlist.fm não configurado.' });
    const artist = String(req.query.artist || '').trim();
    const mbid = String(req.query.mbid || '').trim();
    const date = String(req.query.date || '').trim();
    const city = String(req.query.city || '').trim();
    const page = Math.max(1, Math.min(20, parseInt(String(req.query.page || '1'), 10) || 1));
    if (!artist && !mbid) return res.status(400).json({ error: 'Informe "artist" ou "mbid".' });
    if (!guard(req, res)) return;

    const qs = new URLSearchParams({ p: String(page) });
    if (mbid) qs.set('artistMbid', mbid);
    else qs.set('artistName', artist);
    const dm = date.match(DATE_RE);
    if (dm) qs.set('date', `${dm[1]}-${dm[2]}-${dm[3]}`);
    if (city) qs.set('cityName', city);

    try {
      const data = await cached(`sl:q:${qs.toString()}`, 6 * HOUR, () => setlistFetch(`/search/setlists?${qs}`));
      const list = (data?.setlist || []).map(normalizeSetlist);
      return res.json({
        page,
        total: data?.total || list.length,
        setlists: list,
      });
    } catch (err) {
      return handleError(res, err, 'Setlist.fm');
    }
  });

  // Perfil do artista na Bandsintown
  app.get('/api/bandsintown/artist', async (req, res) => {
    if (!bandsintownId()) return res.status(503).json({ error: 'Bandsintown não configurado.' });
    const name = String(req.query.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Informe "name".' });
    if (!guard(req, res)) return;
    try {
      const data = await cached(`bit:a:${name.toLowerCase()}`, 12 * HOUR, () =>
        bandsintownFetch(`/artists/${encodeBandsintownName(name)}`)
      );
      if (!data || data.error) return res.status(404).json({ error: 'Artista não encontrado na Bandsintown.' });
      return res.json({
        artist: {
          id: String(data.id || ''),
          name: data.name || name,
          imageUrl: data.image_url || undefined,
          thumbUrl: data.thumb_url || undefined,
          url: data.url || undefined,
          trackers: data.tracker_count ?? undefined,
          upcomingEvents: data.upcoming_event_count ?? undefined,
          mbid: data.mbid || undefined,
        },
      });
    } catch (err) {
      return handleError(res, err, 'Bandsintown');
    }
  });

  // Agenda do artista na Bandsintown (upcoming | past | all | yyyy-mm-dd,yyyy-mm-dd)
  app.get('/api/bandsintown/events', async (req, res) => {
    if (!bandsintownId()) return res.status(503).json({ error: 'Bandsintown não configurado.' });
    const artist = String(req.query.artist || '').trim();
    const rawDate = String(req.query.date || 'upcoming').trim();
    const country = String(req.query.country || '').trim().toUpperCase();
    if (!artist) return res.status(400).json({ error: 'Informe "artist".' });
    const date = /^(upcoming|past|all|\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2})$/.test(rawDate) ? rawDate : 'upcoming';
    if (!guard(req, res)) return;
    try {
      const data = await cached(`bit:e:${artist.toLowerCase()}:${date}`, 3 * HOUR, () =>
        bandsintownFetch(`/artists/${encodeBandsintownName(artist)}/events`, { date })
      );
      let events: LiveEvent[] = Array.isArray(data) ? data.map((e: any) => normalizeEvent(e, artist)) : [];
      if (country) {
        const wanted = country === 'BR' ? 'BRAZIL' : country;
        events = events.filter((e) => (e.country || '').toUpperCase() === wanted);
      }
      return res.json({ artist, date, total: events.length, events });
    } catch (err) {
      return handleError(res, err, 'Bandsintown');
    }
  });
}
