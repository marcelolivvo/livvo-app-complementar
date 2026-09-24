import fs from 'fs';
import path from 'path';
import { buildCatalogIndex, CompactShowRow, CompactArtistRow, CatalogIndexData } from './scripts/build-catalog';

export interface CatalogShow {
  id: string;
  showCode: string;
  artistCode: string;
  artistName: string;
  tourName?: string;
  venue: string;
  date: string;
  city: string;
  state: string;
  country?: string;
  posterUrl?: string;
  photoUrl?: string;
  setlistUrl?: string;
}

export interface CatalogArtist {
  artistCode: string;
  artistName: string;
  photoUrl?: string;
  featuredPosterUrl?: string;
  showsCount: number;
}

export interface CatalogSearchResult {
  page: number;
  limit: number;
  totalShows: number;
  totalArtists: number;
  totalPages: number;
  hasMore: boolean;
  artists: CatalogArtist[];
  shows: CatalogShow[];
  info?: string;
}

// In-memory data store loaded once at server startup
let catalogRawShows: CompactShowRow[] = [];
let catalogArtists: CatalogArtist[] = [];
let isCatalogLoaded = false;
let catalogMetadata: CatalogIndexData['metadata'] | null = null;

// Canonical verified artist portraits for high-profile artists
const CANONICAL_PHOTOS: Record<string, string> = {
  anitta: 'https://cdn-images.dzcdn.net/images/artist/e1a33054b719a936f00dc2050f3c90a9/1000x1000-000000-80-0-0.jpg',
  ludmilla: 'https://cdn-images.dzcdn.net/images/artist/99d3d3733075c3db11a37c9a6feecce2/1000x1000-000000-80-0-0.jpg',
  luisasonza: 'https://cdn-images.dzcdn.net/images/artist/e57e035caeca80b70ebe378662a36aed/1000x1000-000000-80-0-0.jpg',
  jao: 'https://cdn-images.dzcdn.net/images/artist/f1997d020d2979e2c48ea92a95e72d24/1000x1000-000000-80-0-0.jpg',
  gusttavolima: 'https://cdn-images.dzcdn.net/images/artist/0954d544bbd4183580375545145decd7/1000x1000-000000-80-0-0.jpg',
  jorgemateus: 'https://cdn-images.dzcdn.net/images/artist/46bf72b87250439262cc168d8fdcd240/1000x1000-000000-80-0-0.jpg',
  jorgeemateus: 'https://cdn-images.dzcdn.net/images/artist/46bf72b87250439262cc168d8fdcd240/1000x1000-000000-80-0-0.jpg',
  henriquejuliano: 'https://cdn-images.dzcdn.net/images/artist/19eb92f69ae705d9c19356616053ea6a/1000x1000-000000-80-0-0.jpg',
  henriqueejuliano: 'https://cdn-images.dzcdn.net/images/artist/19eb92f69ae705d9c19356616053ea6a/1000x1000-000000-80-0-0.jpg',
  anacastela: 'https://cdn-images.dzcdn.net/images/artist/e13f4f69904321c7fae98f0694aa2801/1000x1000-000000-80-0-0.jpg',
  charliebrownjr: 'https://cdn-images.dzcdn.net/images/artist/1a2e562dde23cdbd9abea4bae13eb4fc/1000x1000-000000-80-0-0.jpg',
  charliebrownjunior: 'https://cdn-images.dzcdn.net/images/artist/1a2e562dde23cdbd9abea4bae13eb4fc/1000x1000-000000-80-0-0.jpg',
  raimundos: 'https://cdn-images.dzcdn.net/images/artist/5c751567df18d06962a6107f68761bde/1000x1000-000000-80-0-0.jpg',
  blackeyedpeas: 'https://cdn-images.dzcdn.net/images/artist/4230c9807b45b78df8ce1255ca5ca594/1000x1000-000000-80-0-0.jpg',
  theblackeyedpeas: 'https://cdn-images.dzcdn.net/images/artist/4230c9807b45b78df8ce1255ca5ca594/1000x1000-000000-80-0-0.jpg',
  titas: 'https://cdn-images.dzcdn.net/images/artist/88d6b914b1667b49742d46b8d8f5857e/1000x1000-000000-80-0-0.jpg',
  neymatogrosso: 'https://cdn-images.dzcdn.net/images/artist/b17c2f6d2f3484f93cb7003ae3fc8676/1000x1000-000000-80-0-0.jpg',
  zecapagodinho: 'https://cdn-images.dzcdn.net/images/artist/5b8f8888bdf20b41aaae11f3f40d9b4c/1000x1000-000000-80-0-0.jpg',
  loshermanos: 'https://cdn-images.dzcdn.net/images/artist/683ebdfa666e8574044ffca6f2d56a73/1000x1000-000000-80-0-0.jpg',
};

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeKey(text: string): string {
  return normalizeText(text).replace(/[^a-z0-9]/g, '');
}

/**
 * Loads the pre-compiled shows-index.json once at server startup.
 * If shows-index.json does not exist, triggers buildCatalogIndex() to generate it.
 */
export function initCatalog(): void {
  if (isCatalogLoaded) return;

  const indexPath = path.join(process.cwd(), 'data', 'shows-index.json');

  try {
    let indexData: CatalogIndexData;

    if (!fs.existsSync(indexPath)) {
      console.warn(`[Catalog] '${indexPath}' não encontrado. Gerando índice agora...`);
      indexData = buildCatalogIndex();
    } else {
      console.log(`[Catalog] Carregando índice em memória de: ${indexPath}`);
      const raw = fs.readFileSync(indexPath, 'utf-8');
      indexData = JSON.parse(raw);
    }

    catalogRawShows = indexData.shows;
    catalogMetadata = indexData.metadata;

    // Convert artists array to CatalogArtist format
    catalogArtists = indexData.artists.map((a: CompactArtistRow) => {
      const normKey = normalizeKey(a[1]);
      const photo = CANONICAL_PHOTOS[normKey] || a[4] || undefined;
      return {
        artistCode: a[0],
        artistName: a[1],
        photoUrl: photo,
        featuredPosterUrl: a[5] || undefined,
        showsCount: a[3],
      };
    });

    isCatalogLoaded = true;
    console.log(`[Catalog] Inicializado com sucesso: ${catalogRawShows.length} shows e ${catalogArtists.length} artistas em memória.`);
  } catch (err) {
    console.error('[Catalog] Erro ao carregar shows-index.json:', err);
  }
}

export interface SearchOptions {
  q?: string;
  artist?: string;
  state?: string;
  city?: string;
  venue?: string;
  page?: number;
  limit?: number;
}

/**
 * Searches the catalog with strict pagination, filtering and protection against mass dump
 */
export function searchCatalog(options: SearchOptions): CatalogSearchResult {
  if (!isCatalogLoaded) {
    initCatalog();
  }

  const MAX_LIMIT = 25;
  const requestedLimit = parseInt(String(options.limit || 20), 10);
  const limit = Math.min(Math.max(1, isNaN(requestedLimit) ? 20 : requestedLimit), MAX_LIMIT);
  const requestedPage = parseInt(String(options.page || 1), 10);
  const page = Math.max(1, isNaN(requestedPage) ? 1 : requestedPage);

  const rawQ = String(options.q || '').trim();
  const rawArtist = String(options.artist || '').trim();
  const rawState = String(options.state || '').trim();
  const rawCity = String(options.city || '').trim();
  const rawVenue = String(options.venue || '').trim();

  const q = normalizeText(rawQ);
  const artistFilter = normalizeText(rawArtist);
  const stateFilter = rawState.toUpperCase();
  const cityFilter = normalizeText(rawCity);
  const venueFilter = normalizeText(rawVenue);

  const hasSpecificFilter = Boolean(artistFilter || stateFilter || cityFilter || venueFilter);
  const isQueryTooShort = q.length > 0 && q.length < 3;

  // SECURITY: Never return the entire catalog without a valid filter!
  // If no filter is specified, or if q has less than 3 characters and no exact filter is provided,
  // return only a small curated preview of top artists (page 1 only).
  // This prevents scraping by iterating single or double characters (q=a, q=b, q=aa, etc.).
  if (!hasSpecificFilter && (!q || isQueryTooShort)) {
    if (page > 1) {
      return {
        page,
        limit,
        totalShows: 0,
        totalArtists: catalogArtists.length,
        totalPages: 1,
        hasMore: false,
        artists: [],
        shows: [],
        info: isQueryTooShort
          ? 'A busca textual exige no mínimo 3 caracteres.'
          : 'Para navegar por mais itens, digite um termo de busca ou selecione um filtro.',
      };
    }

    const previewArtists = catalogArtists.slice(0, Math.min(limit, 12));
    return {
      page: 1,
      limit: Math.min(limit, 12),
      totalShows: 0,
      totalArtists: catalogArtists.length,
      totalPages: 1,
      hasMore: false,
      artists: previewArtists,
      shows: [],
      info: isQueryTooShort
        ? 'Digite ao menos 3 caracteres para buscar no catálogo.'
        : 'Mostrando destaques iniciais. Digite para buscar no catálogo completo.',
    };
  }

  // 1. Filter Shows
  // CompactShowRow:
  // [0: setlistId, 1: date, 2: artist, 3: mbid, 4: tour, 5: venue, 6: city, 7: state, 8: country, 9: url, 10: normArtist, 11: normCity]
  const matchingShowRows = catalogRawShows.filter((row) => {
    const setlistId = row[0];
    const artistName = row[2];
    const mbid = row[3];
    const tour = row[4];
    const venue = row[5];
    const city = row[6];
    const state = row[7];
    const normArtist = row[10];
    const normCity = row[11];

    if (artistFilter) {
      const matchArtist = normArtist.includes(artistFilter) || normalizeText(mbid).includes(artistFilter);
      if (!matchArtist) return false;
    }

    if (stateFilter) {
      if (state.toUpperCase() !== stateFilter) return false;
    }

    if (cityFilter) {
      if (!normCity.includes(cityFilter)) return false;
    }

    if (venueFilter) {
      const normVenue = normalizeText(venue);
      if (!normVenue.includes(venueFilter)) return false;
    }

    if (q && q.length >= 3) {
      const matchArtist = normArtist.includes(q);
      const matchCity = normCity.includes(q);
      const matchTour = tour ? normalizeText(tour).includes(q) : false;
      const matchVenue = venue ? normalizeText(venue).includes(q) : false;
      const matchState = state ? state.toLowerCase().includes(q) : false;
      const matchId = setlistId ? setlistId.toLowerCase().includes(q) : false;

      if (!matchArtist && !matchCity && !matchTour && !matchVenue && !matchState && !matchId) {
        return false;
      }
    }

    return true;
  });

  // 2. Filter Artists
  const matchingArtists = catalogArtists.filter((a) => {
    const normName = normalizeText(a.artistName);
    const normCode = normalizeText(a.artistCode);

    if (artistFilter) {
      if (!normName.includes(artistFilter) && !normCode.includes(artistFilter)) {
        return false;
      }
    }

    if (q && q.length >= 3) {
      const matchName = normName.includes(q);
      const matchCode = normCode.includes(q);
      if (!matchName && !matchCode) {
        // Also check if any matching show was found for this artist in the query
        const hasMatchingShow = matchingShowRows.some((s) => s[3] === a.artistCode || s[10] === normName);
        if (!hasMatchingShow) return false;
      }
    }

    // If state/city/venue filter is set, only include artists who have matching shows
    if (stateFilter || cityFilter || venueFilter) {
      const hasShow = matchingShowRows.some((s) => s[3] === a.artistCode || s[10] === normName);
      if (!hasShow) return false;
    }

    return true;
  });

  // Calculate pagination based on shows (or artists)
  const totalItems = Math.max(matchingShowRows.length, matchingArtists.length);
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;

  // Convert paginated show rows into CatalogShow objects
  // Empty values in tour, venue, or state remain empty string or undefined (never fabricated!)
  const paginatedShows: CatalogShow[] = matchingShowRows
    .slice(startIndex, startIndex + limit)
    .map((row) => {
      const setlistId = String(row[0]);
      const date = row[1];
      const artist = row[2];
      const mbid = row[3];
      const tour = row[4];
      const venue = row[5];
      const city = row[6];
      const state = row[7];
      const country = row[8];
      const url = row[9];
      const normKey = normalizeKey(artist);

      const photoUrl = CANONICAL_PHOTOS[normKey] || undefined;

      return {
        id: setlistId,
        showCode: setlistId, // Always exact string identifier
        artistCode: mbid,     // MusicBrainz ID string
        artistName: artist,
        tourName: tour ? tour : undefined, // Omit field if empty
        venue: venue || '',                // Never invent a fabricated venue name
        date: date || '',
        city: city || '',
        state: state ? state.toUpperCase() : '',
        country: country || undefined,
        setlistUrl: url || undefined,
        photoUrl,
      };
    });

  const paginatedArtists = matchingArtists.slice(startIndex, startIndex + limit);
  const hasMore = page < totalPages;

  return {
    page,
    limit,
    totalShows: matchingShowRows.length,
    totalArtists: matchingArtists.length,
    totalPages,
    hasMore,
    artists: paginatedArtists,
    shows: paginatedShows,
  };
}

// In-Memory Rate Limiting per IP
// 1. Minute window: max 60 requests per 60 seconds
// 2. Burst window: max 10 requests per 10 seconds
interface RateLimitRecord {
  minuteCount: number;
  minuteResetAt: number;
  burstCount: number;
  burstResetAt: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MINUTE_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_MINUTE = 60; // 60 req/min

const RATE_LIMIT_BURST_MS = 10 * 1000; // 10 seconds
const MAX_REQUESTS_BURST = 10; // max 10 req / 10s

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
  reason?: 'burst' | 'minute';
} {
  const now = Date.now();
  const cleanIp = ip || 'unknown-client';
  let record = ipRequestMap.get(cleanIp);

  if (!record) {
    record = {
      minuteCount: 0,
      minuteResetAt: now + RATE_LIMIT_MINUTE_MS,
      burstCount: 0,
      burstResetAt: now + RATE_LIMIT_BURST_MS,
    };
    ipRequestMap.set(cleanIp, record);
  }

  // Reset minute window if expired
  if (now > record.minuteResetAt) {
    record.minuteCount = 0;
    record.minuteResetAt = now + RATE_LIMIT_MINUTE_MS;
  }

  // Reset burst window if expired
  if (now > record.burstResetAt) {
    record.burstCount = 0;
    record.burstResetAt = now + RATE_LIMIT_BURST_MS;
  }

  // Check burst limit first (10 requests per 10 seconds)
  if (record.burstCount >= MAX_REQUESTS_BURST) {
    const resetInSec = Math.max(1, Math.ceil((record.burstResetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSec,
      reason: 'burst',
    };
  }

  // Check minute limit (60 requests per 60 seconds)
  if (record.minuteCount >= MAX_REQUESTS_PER_MINUTE) {
    const resetInSec = Math.max(1, Math.ceil((record.minuteResetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSec,
      reason: 'minute',
    };
  }

  // Increment counters
  record.burstCount += 1;
  record.minuteCount += 1;

  const burstRemaining = MAX_REQUESTS_BURST - record.burstCount;
  const minuteRemaining = MAX_REQUESTS_PER_MINUTE - record.minuteCount;
  const remaining = Math.min(burstRemaining, minuteRemaining);
  const resetInSec = Math.ceil((record.burstResetAt - now) / 1000);

  return {
    allowed: true,
    remaining,
    resetInSec,
  };
}

// Clean up expired IP keys periodically to prevent memory leaks
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.minuteResetAt && now > record.burstResetAt) {
      ipRequestMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);
cleanupTimer.unref();
