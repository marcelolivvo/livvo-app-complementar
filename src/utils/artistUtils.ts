import { ArtistItem, ShowItem } from '../types';

export function normalizeArtistKey(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function isDateString(val?: string | null): boolean {
  if (!val) return false;
  return /\b(19\d{2}|20\d{2})\b/.test(val) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val);
}

export function consolidateArtists(
  artists: ArtistItem[],
  shows?: ShowItem[],
  photosMap?: Map<string, string>
): ArtistItem[] {
  const map = new Map<string, ArtistItem>();

  artists.forEach((a) => {
    if (!a.artistName) return;
    const key = normalizeArtistKey(a.artistName);
    const isCodeDate = isDateString(a.artistCode || '');
    const cleanCode = !isCodeDate && a.artistCode ? a.artistCode : '';
    const count = Number(a.showsCount) || 1;

    const photoFromMap =
      (photosMap && (photosMap.get(a.artistCode) || photosMap.get(key))) || undefined;

    if (!map.has(key)) {
      map.set(key, {
        artistCode: cleanCode || `ART-${a.artistName.trim().replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`,
        artistName: a.artistName.trim(),
        photoUrl: photoFromMap || a.photoUrl,
        photoSource: a.photoSource,
        featuredPosterUrl: a.featuredPosterUrl,
        showsCount: count,
        updatedAt: a.updatedAt || Date.now(),
      });
    } else {
      const existing = map.get(key)!;
      existing.showsCount += count;
      if (cleanCode && (!existing.artistCode || isDateString(existing.artistCode) || existing.artistCode.startsWith('ART-'))) {
        existing.artistCode = cleanCode;
      }
      if (!existing.photoUrl && (photoFromMap || a.photoUrl)) {
        existing.photoUrl = photoFromMap || a.photoUrl;
        existing.photoSource = a.photoSource;
      }
      if (!existing.featuredPosterUrl && a.featuredPosterUrl) {
        existing.featuredPosterUrl = a.featuredPosterUrl;
      }
    }
  });

  if (shows && shows.length > 0) {
    const showCountsByName = new Map<string, number>();
    shows.forEach((s) => {
      if (!s.artistName) return;
      const k = normalizeArtistKey(s.artistName);
      showCountsByName.set(k, (showCountsByName.get(k) || 0) + 1);
    });

    showCountsByName.forEach((count, k) => {
      const existing = map.get(k);
      if (existing) {
        existing.showsCount = Math.max(existing.showsCount, count);
      }
    });
  }

  return Array.from(map.values());
}
