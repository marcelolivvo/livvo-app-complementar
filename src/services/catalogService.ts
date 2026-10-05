import { ShowItem, ArtistItem } from '../types';
import { dbService } from './db';
import { adminCatalog, searchFullCatalog } from './adminCatalogService';

export interface CatalogSearchParams {
  q?: string;
  artist?: string;
  limit?: number;
}

export interface CatalogSearchResult {
  artists: ArtistItem[];
  shows: ShowItem[];
}

export async function searchCatalogApi(
  params?: string | CatalogSearchParams,
  signal?: AbortSignal
): Promise<CatalogSearchResult> {
  // Admin com o catálogo completo ligado: busca no CSV inteiro pelo servidor
  if (adminCatalog.isEnabled()) {
    const p = typeof params === 'string' ? { q: params } : params || {};
    const q = (p.q || '').trim();
    if (p.artist || q.length >= 3) {
      try {
        const full = await searchFullCatalog(
          { q: q || undefined, artist: p.artist, limit: p.artist ? 2000 : p.limit },
          signal
        );
        if (full) {
          // Shows do artista no CSV + os da lista padrão (sem repetir)
          if (p.artist) {
            const local = dbService.getAllShows().filter((s) => s.artistName.toLowerCase() === p.artist!.toLowerCase());
            const seen = new Set(full.shows.map((s) => s.showCode));
            local.forEach((s) => !seen.has(s.showCode) && full.shows.push(s));
          }
          return full;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        console.warn('Catálogo completo indisponível, usando a lista padrão:', err);
      }
    }
  }

  const allShows = dbService.getAllShows();
  const allArtists = dbService.getAllArtists();

  let q = '';
  let artistFilter = '';
  let limit = 20;

  if (typeof params === 'string') {
    q = params.toLowerCase().trim();
  } else if (params) {
    if (params.q) q = params.q.toLowerCase().trim();
    if (params.artist) artistFilter = params.artist.toLowerCase().trim();
    if (params.limit) limit = params.limit;
  }

  let filteredShows = allShows;
  if (artistFilter) {
    filteredShows = filteredShows.filter(
      (s) =>
        s.artistName.toLowerCase().includes(artistFilter) ||
        s.artistCode.toLowerCase() === artistFilter
    );
  } else if (q) {
    filteredShows = filteredShows.filter(
      (s) =>
        s.artistName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.venue.toLowerCase().includes(q) ||
        (s.tourName && s.tourName.toLowerCase().includes(q))
    );
  }

  let filteredArtists = allArtists;
  if (artistFilter) {
    filteredArtists = filteredArtists.filter(
      (a) =>
        a.artistName.toLowerCase().includes(artistFilter) ||
        a.artistCode.toLowerCase() === artistFilter
    );
  } else if (q) {
    filteredArtists = filteredArtists.filter(
      (a) =>
        a.artistName.toLowerCase().includes(q) ||
        a.artistCode.toLowerCase().includes(q)
    );
  }

  return {
    artists: filteredArtists.slice(0, limit),
    shows: filteredShows.slice(0, limit),
  };
}
