// Service to automatically search and connect artist photos and tour posters/flyers
// Combines server-side API proxy (Deezer + iTunes + Wikimedia) with client-side fallback.

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  source: 'deezer' | 'itunes' | 'wikimedia' | 'theaudiodb';
  type: 'photo' | 'poster';
}

export interface ArtistMediaResult {
  query: string;
  bestPhotoUrl: string | null;
  bestPosterUrl: string | null;
  photos: MediaItem[];
  posters: MediaItem[];
}

export interface PhotoSearchResult {
  photoUrl: string;
  posterUrl?: string;
  source: 'deezer' | 'itunes' | 'wikipedia' | 'theaudiodb';
  artistNameMatched: string;
  thumbnailUrl?: string;
}

/**
 * Cleans artist name for optimal search in public music catalogs
 */
export function sanitizeArtistName(name: string): string {
  let cleaned = name
    .replace(/\s*[\(\[](ao vivo|live|acústico|deluxe|remix|feat\.?|ft\.?).*?[\)\]]/gi, '')
    .replace(/\s+feat\.?\s+.*$/i, '')
    .replace(/\s+ft\.?\s+.*$/i, '')
    .replace(/\s+part\.?\s+.*$/i, '')
    .replace(/\s+e\s+participação.*$/i, '')
    .trim();

  if (/hiatus\s+kiyaote/i.test(cleaned)) {
    cleaned = cleaned.replace(/hiatus\s+kiyaote/gi, 'Hiatus Kaiyote');
  }

  return cleaned;
}

/**
 * Comprehensive Search for Artist Photos and Tour Posters
 * Queries `/api/artist-search` (server proxy for Deezer + iTunes), with fallback to direct open APIs.
 */
export async function searchArtistMedia(artistName: string): Promise<ArtistMediaResult> {
  const cleanName = sanitizeArtistName(artistName);
  const emptyResult: ArtistMediaResult = {
    query: cleanName,
    bestPhotoUrl: null,
    bestPosterUrl: null,
    photos: [],
    posters: [],
  };

  if (!cleanName) return emptyResult;

  // 1. Try Backend API Route (Deezer + iTunes high-res without CORS)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`/api/artist-search?q=${encodeURIComponent(cleanName)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const photos: MediaItem[] = (data.artists || []).map((a: any) => ({
        id: `photo-${a.id}`,
        title: a.name,
        url: a.photoUrl,
        thumbnailUrl: a.thumbnailUrl,
        source: a.source || 'deezer',
        type: 'photo' as const,
      }));

      const posters: MediaItem[] = (data.posters || []).map((p: any) => ({
        id: `poster-${p.id}`,
        title: p.title,
        url: p.posterUrl,
        thumbnailUrl: p.thumbnailUrl,
        source: p.source || 'deezer',
        type: 'poster' as const,
      }));

      return {
        query: cleanName,
        bestPhotoUrl: data.bestPhotoUrl || photos[0]?.url || posters[0]?.url || null,
        bestPosterUrl: data.bestPosterUrl || posters[0]?.url || null,
        photos,
        posters,
      };
    }
  } catch {
    // API failed or running in client-only preview - continue to client fallback
  }

  // 2. Client-side Fallback: iTunes & Wikipedia Direct Search
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=album&limit=6`;
    const res = await fetch(itunesUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const posters: MediaItem[] = data.results.map((r: any) => {
          const highRes = (r.artworkUrl100 || '').replace('100x100bb', '1000x1000bb');
          return {
            id: `itunes-${r.collectionId}`,
            title: r.collectionName || r.artistName,
            url: highRes,
            thumbnailUrl: r.artworkUrl100,
            source: 'itunes' as const,
            type: 'poster' as const,
          };
        });

        return {
          query: cleanName,
          bestPhotoUrl: posters[0]?.url || null,
          bestPosterUrl: posters[0]?.url || null,
          photos: posters, // Use album artwork as photo fallback
          posters,
        };
      }
    }
  } catch {
    // Continue
  }

  return emptyResult;
}

/**
 * Direct function to get the best photo and poster URL for an artist
 */
export async function autoFetchArtistPhoto(artistName: string): Promise<PhotoSearchResult | null> {
  const media = await searchArtistMedia(artistName);

  if (media.bestPhotoUrl) {
    return {
      photoUrl: media.bestPhotoUrl,
      posterUrl: media.bestPosterUrl || undefined,
      source: (media.photos[0]?.source as any) || 'deezer',
      artistNameMatched: artistName,
      thumbnailUrl: media.photos[0]?.thumbnailUrl || media.bestPhotoUrl,
    };
  }

  return null;
}
