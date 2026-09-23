import { ArtistItem, ShowItem } from '../types';

/**
 * Normalizes artist name for strict accent-insensitive, case-insensitive comparison
 */
export function normalizeArtistKey(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a string is a date representation (e.g., DD/MM/YYYY, YYYY-MM-DD)
 */
export function isDateString(str: string): boolean {
  if (!str) return false;
  return /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(str.trim());
}

/**
 * Consolidates a raw list of artists to guarantee exactly ONE unique record per artist name.
 * Merges show counts, retains valid artist codes, and preserves authentic photos.
 */
export function consolidateArtists(
  artists: ArtistItem[],
  shows?: ShowItem[],
  photosMap?: Map<string, string>
): ArtistItem[] {
  const consolidatedMap = new Map<string, ArtistItem>();

  for (const artist of artists) {
    if (!artist.artistName || !artist.artistName.trim()) continue;
    const key = normalizeArtistKey(artist.artistName);
    if (!key) continue;

    const isCodeDate = isDateString(artist.artistCode || '');
    const cleanCode = !isCodeDate && artist.artistCode ? artist.artistCode : '';
    const showsCount = Number(artist.showsCount) || 1;
    const photo = artist.photoUrl || (photosMap && cleanCode ? photosMap.get(cleanCode) : undefined);

    if (!consolidatedMap.has(key)) {
      consolidatedMap.set(key, {
        artistCode: cleanCode || `ART-${artist.artistName.trim().replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`,
        artistName: artist.artistName.trim(),
        photoUrl: photo,
        featuredPosterUrl: artist.featuredPosterUrl,
        photoSource: artist.photoSource,
        showsCount,
        updatedAt: artist.updatedAt || Date.now(),
      });
    } else {
      const existing = consolidatedMap.get(key)!;
      existing.showsCount += showsCount;

      // Prefer non-generated clean code over fallback
      if (cleanCode && (!existing.artistCode || isDateString(existing.artistCode) || existing.artistCode.startsWith('ART-'))) {
        existing.artistCode = cleanCode;
      }

      // Preserve photo
      if (!existing.photoUrl && photo) {
        existing.photoUrl = photo;
        existing.photoSource = artist.photoSource || 'auto';
      }

      // Preserve featured poster
      if (!existing.featuredPosterUrl && artist.featuredPosterUrl) {
        existing.featuredPosterUrl = artist.featuredPosterUrl;
      }
    }
  }

  // If shows list is provided, calculate true show count from shows data
  if (shows && shows.length > 0) {
    const showCountsByName = new Map<string, number>();
    for (const show of shows) {
      if (!show.artistName) continue;
      const k = normalizeArtistKey(show.artistName);
      if (k) {
        showCountsByName.set(k, (showCountsByName.get(k) || 0) + 1);
      }
    }

    showCountsByName.forEach((count, k) => {
      const existing = consolidatedMap.get(k);
      if (existing) {
        existing.showsCount = Math.max(existing.showsCount, count);
      }
    });
  }

  return Array.from(consolidatedMap.values());
}
