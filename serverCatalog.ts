import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

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
  posterUrl?: string;
  photoUrl?: string;
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

// In-memory singletons populated once at startup
let catalogShows: CatalogShow[] = [];
let catalogArtists: CatalogArtist[] = [];
let isCatalogLoaded = false;

// Canonical verified artist portraits for high fidelity
const CANONICAL_PHOTOS: Record<string, string> = {
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

function normalizeKey(name: string): string {
  return normalizeText(name).replace(/[^a-z0-9]/g, '');
}

/**
 * Loads and parses the private server CSV once, caching everything in memory
 */
export function initCatalog(): void {
  if (isCatalogLoaded) return;

  const csvPath = path.join(process.cwd(), 'data', 'shows.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn(`[Catalog] Arquivo CSV não encontrado em: ${csvPath}`);
    return;
  }

  try {
    const rawContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse<Record<string, string>>(rawContent, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    const shows: CatalogShow[] = [];
    const artistsMap = new Map<string, CatalogArtist>();

    let rowIdx = 0;
    for (const row of parsed.data) {
      rowIdx++;
      const showCode = String(row['codigo_show'] || row['codigoshow'] || '').trim();
      const artistCode = String(row['codigo_artista'] || row['codartista'] || '').trim();
      const artistName = String(row['nome_artista'] || row['artista'] || '').trim();
      const tourName = String(row['turne'] || row['tour'] || '').trim();
      const venue = String(row['local'] || row['venue'] || '').trim();
      const date = String(row['data'] || row['date'] || '').trim();
      const city = String(row['cidade'] || row['city'] || '').trim();
      const state = String(row['estado'] || row['uf'] || '').trim();
      let photoUrl = String(row['foto_url'] || row['fotourl'] || '').trim();
      const posterUrl = String(row['poster_url'] || row['posterurl'] || '').trim();

      if (!artistName && !artistCode && !showCode) continue;

      const normArtist = normalizeKey(artistName);
      if (CANONICAL_PHOTOS[normArtist]) {
        photoUrl = CANONICAL_PHOTOS[normArtist];
      }

      const showItem: CatalogShow = {
        id: `show_${rowIdx}_${showCode || 'item'}`,
        showCode: showCode || `SHW-${rowIdx}`,
        artistCode: artistCode || `ART-${rowIdx}`,
        artistName: artistName || 'Artista Desconhecido',
        tourName: tourName || undefined,
        venue: venue || 'Local a definir',
        date: date || 'A definir',
        city: city || 'Brasil',
        state: state.toUpperCase() || 'BR',
        posterUrl: posterUrl || undefined,
        photoUrl: photoUrl || undefined,
      };

      shows.push(showItem);

      // Aggregate artists
      const artistKey = normArtist || artistCode.toLowerCase();
      const existing = artistsMap.get(artistKey);
      if (existing) {
        existing.showsCount += 1;
        if (!existing.photoUrl && photoUrl) existing.photoUrl = photoUrl;
        if (!existing.featuredPosterUrl && posterUrl) existing.featuredPosterUrl = posterUrl;
      } else {
        artistsMap.set(artistKey, {
          artistCode: artistCode || `ART-${rowIdx}`,
          artistName: showItem.artistName,
          photoUrl: photoUrl || undefined,
          featuredPosterUrl: posterUrl || undefined,
          showsCount: 1,
        });
      }
    }

    catalogShows = shows;
    catalogArtists = Array.from(artistsMap.values()).sort((a, b) => b.showsCount - a.showsCount);
    isCatalogLoaded = true;
    console.log(`[Catalog] Carregado com sucesso: ${catalogShows.length} shows e ${catalogArtists.length} artistas em memória.`);
  } catch (err) {
    console.error('[Catalog] Erro ao carregar shows.csv:', err);
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
  const matchingShows = catalogShows.filter((s) => {
    if (artistFilter) {
      const normArtist = normalizeText(s.artistName);
      const normCode = normalizeText(s.artistCode);
      if (!normArtist.includes(artistFilter) && !normCode.includes(artistFilter)) {
        return false;
      }
    }

    if (stateFilter) {
      if (s.state.toUpperCase() !== stateFilter) return false;
    }

    if (cityFilter) {
      const normCity = normalizeText(s.city);
      if (!normCity.includes(cityFilter)) return false;
    }

    if (venueFilter) {
      const normVenue = normalizeText(s.venue);
      if (!normVenue.includes(venueFilter)) return false;
    }

    if (q && q.length >= 3) {
      const matchArtist = normalizeText(s.artistName).includes(q);
      const matchTour = normalizeText(s.tourName || '').includes(q);
      const matchVenue = normalizeText(s.venue).includes(q);
      const matchCity = normalizeText(s.city).includes(q);
      const matchState = s.state.toLowerCase().includes(q);
      const matchCode = normalizeText(s.showCode).includes(q);
      if (!matchArtist && !matchTour && !matchVenue && !matchCity && !matchState && !matchCode) {
        return false;
      }
    }

    return true;
  });

  // 2. Filter Artists
  const matchingArtists = catalogArtists.filter((a) => {
    if (artistFilter) {
      const normName = normalizeText(a.artistName);
      const normCode = normalizeText(a.artistCode);
      if (!normName.includes(artistFilter) && !normCode.includes(artistFilter)) {
        return false;
      }
    }

    if (q && q.length >= 3) {
      const matchName = normalizeText(a.artistName).includes(q);
      const matchCode = normalizeText(a.artistCode).includes(q);
      if (!matchName && !matchCode) {
        return false;
      }
    }

    // If state/city/venue filter is set, only include artists who have matching shows
    if (stateFilter || cityFilter || venueFilter) {
      const hasShow = matchingShows.some((s) => normalizeKey(s.artistName) === normalizeKey(a.artistName));
      if (!hasShow) return false;
    }

    return true;
  });

  // Calculate pagination based on shows (or artists if no shows matched or artist search was primary)
  const totalItems = Math.max(matchingShows.length, matchingArtists.length);
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedShows = matchingShows.slice(startIndex, startIndex + limit);
  const paginatedArtists = matchingArtists.slice(startIndex, startIndex + limit);
  const hasMore = page < totalPages;

  return {
    page,
    limit,
    totalShows: matchingShows.length,
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
