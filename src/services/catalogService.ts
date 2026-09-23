export interface CatalogArtistItem {
  artistCode: string;
  artistName: string;
  photoUrl?: string;
  featuredPosterUrl?: string;
  showsCount: number;
}

export interface CatalogShowItem {
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

export interface CatalogSearchResponse {
  page: number;
  limit: number;
  totalShows: number;
  totalArtists: number;
  totalPages: number;
  hasMore: boolean;
  artists: CatalogArtistItem[];
  shows: CatalogShowItem[];
  info?: string;
  error?: string;
}

export interface CatalogSearchParams {
  q?: string;
  artist?: string;
  state?: string;
  city?: string;
  venue?: string;
  page?: number;
  limit?: number;
}

// In-memory cache for recent queries within the session
const sessionSearchCache = new Map<string, CatalogSearchResponse>();
const MAX_CACHE_ENTRIES = 120;

function createCacheKey(params: CatalogSearchParams): string {
  return [
    params.q?.trim().toLowerCase() || '',
    params.artist?.trim().toLowerCase() || '',
    params.state?.trim().toUpperCase() || '',
    params.city?.trim().toLowerCase() || '',
    params.venue?.trim().toLowerCase() || '',
    params.page || 1,
    params.limit || 20,
  ].join('|');
}

/**
 * Searches the server catalog API with in-memory caching and request cancellation
 */
export async function searchCatalogApi(
  params: CatalogSearchParams,
  signal?: AbortSignal
): Promise<CatalogSearchResponse> {
  const cacheKey = createCacheKey(params);

  // 1. Check in-memory cache
  if (sessionSearchCache.has(cacheKey)) {
    return sessionSearchCache.get(cacheKey)!;
  }

  // 2. Build URL search params
  const urlParams = new URLSearchParams();
  if (params.q?.trim()) urlParams.set('q', params.q.trim());
  if (params.artist?.trim()) urlParams.set('artist', params.artist.trim());
  if (params.state?.trim()) urlParams.set('state', params.state.trim());
  if (params.city?.trim()) urlParams.set('city', params.city.trim());
  if (params.venue?.trim()) urlParams.set('venue', params.venue.trim());
  if (params.page && params.page > 1) urlParams.set('page', String(params.page));
  if (params.limit) urlParams.set('limit', String(params.limit));

  const url = `/api/catalog/search${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Muitas buscas em curto intervalo. Aguarde alguns segundos.');
    }
    throw new Error(`Falha na busca do catálogo (${res.status})`);
  }

  const data: CatalogSearchResponse = await res.json();

  // 3. Save into session cache (with size limit)
  if (sessionSearchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = sessionSearchCache.keys().next().value;
    if (oldestKey) sessionSearchCache.delete(oldestKey);
  }
  sessionSearchCache.set(cacheKey, data);

  return data;
}

/**
 * Clear the in-memory session cache if needed
 */
export function clearCatalogSearchCache(): void {
  sessionSearchCache.clear();
}
