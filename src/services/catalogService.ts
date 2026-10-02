import { ShowItem, ArtistItem } from '../types';
import { dbService } from './db';

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
