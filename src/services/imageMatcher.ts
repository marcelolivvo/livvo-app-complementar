import JSZip from 'jszip';
import { ArtistItem, ImageMatchResult } from '../types';

export function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ''); // keep alphanumeric only
}

export function findMatchingArtist(
  rawFileName: string,
  artists: ArtistItem[]
): { artist?: ArtistItem; matchedBy: 'code' | 'name' | 'none' } {
  // Remove extension
  const nameWithoutExt = rawFileName.substring(0, rawFileName.lastIndexOf('.')) || rawFileName;
  const normFile = normalizeKey(nameWithoutExt);

  if (!normFile) {
    return { matchedBy: 'none' };
  }

  // 1. Check exact or normalized code match first
  for (const artist of artists) {
    const normCode = normalizeKey(artist.artistCode);
    if (normCode && (normFile === normCode || normFile === `cod${normCode}` || normFile === `art${normCode}`)) {
      return { artist, matchedBy: 'code' };
    }
  }

  // 2. Check normalized name match
  // Strict matching: exact match OR full word boundary match to prevent partial collisions
  // (e.g. preventing 'Ney' matching 'Holocausto' or short names matching randomly)
  for (const artist of artists) {
    const normName = normalizeKey(artist.artistName);
    if (!normName) continue;

    // Exact match
    if (normFile === normName) {
      return { artist, matchedBy: 'name' };
    }

    // Name contained in file, but ensure artist name is long enough (>= 4 chars) to prevent substring collision
    if (normName.length >= 4 && normFile.includes(normName)) {
      return { artist, matchedBy: 'name' };
    }

    // File contained in artist name only if file name is sufficiently long (>= 5 chars)
    if (normFile.length >= 5 && normName.includes(normFile)) {
      return { artist, matchedBy: 'name' };
    }
  }

  return { matchedBy: 'none' };
}

// Convert File / Blob to Data URL
export function fileToDataUrl(fileOrBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(fileOrBlob);
  });
}

// Match multiple files against artists list
export async function matchFilesAgainstArtists(
  files: File[],
  artists: ArtistItem[]
): Promise<{
  matchedMap: Map<string, string>; // artistCode -> dataUrl
  results: ImageMatchResult[];
}> {
  const matchedMap = new Map<string, string>();
  const results: ImageMatchResult[] = [];

  for (const file of files) {
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(file.name);
    if (!isImage) continue;

    const { artist, matchedBy } = findMatchingArtist(file.name, artists);

    if (artist && matchedBy !== 'none') {
      try {
        const dataUrl = await fileToDataUrl(file);
        matchedMap.set(artist.artistCode, dataUrl);
        results.push({
          fileName: file.name,
          matchedBy,
          artistCode: artist.artistCode,
          artistName: artist.artistName,
          status: 'success',
        });
      } catch {
        results.push({
          fileName: file.name,
          matchedBy,
          artistCode: artist.artistCode,
          artistName: artist.artistName,
          status: 'failed',
        });
      }
    } else {
      results.push({
        fileName: file.name,
        matchedBy: 'none',
        status: 'failed',
      });
    }
  }

  return { matchedMap, results };
}

// Extract and match images from a ZIP file
export async function matchZipAgainstArtists(
  zipFile: File,
  artists: ArtistItem[],
  onProgress?: (processed: number, total: number) => void
): Promise<{
  matchedMap: Map<string, string>;
  results: ImageMatchResult[];
}> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const matchedMap = new Map<string, string>();
  const results: ImageMatchResult[] = [];

  const imageEntries = Object.keys(loadedZip.files).filter((path) => {
    const entry = loadedZip.files[path];
    return !entry.dir && /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(path);
  });

  let count = 0;
  for (const path of imageEntries) {
    count++;
    if (onProgress) {
      onProgress(count, imageEntries.length);
    }

    const simpleName = path.split('/').pop() || path;
    const { artist, matchedBy } = findMatchingArtist(simpleName, artists);

    if (artist && matchedBy !== 'none') {
      try {
        const blob = await loadedZip.files[path].async('blob');
        const dataUrl = await fileToDataUrl(blob);
        matchedMap.set(artist.artistCode, dataUrl);
        results.push({
          fileName: simpleName,
          matchedBy,
          artistCode: artist.artistCode,
          artistName: artist.artistName,
          status: 'success',
        });
      } catch {
        results.push({
          fileName: simpleName,
          matchedBy,
          artistCode: artist.artistCode,
          artistName: artist.artistName,
          status: 'failed',
        });
      }
    } else {
      results.push({
        fileName: simpleName,
        matchedBy: 'none',
        status: 'failed',
      });
    }
  }

  return { matchedMap, results };
}
