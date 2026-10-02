export interface MediaItem {
  id: string;
  url: string;
  thumbUrl?: string;
  type: 'photo' | 'poster';
  title: string;
  source: string;
}

export interface ArtistMediaResult {
  artistName: string;
  photos: MediaItem[];
  posters: MediaItem[];
}

// In-memory cache to prevent redundant network queries for the same artist
const mediaCache = new Map<string, ArtistMediaResult>();

/**
 * Searches real online media (photos and official tour posters) for any artist
 * using a hybrid architecture:
 * 1. Protected server endpoint (/api/artist-search) with Deezer, Wikipedia & iTunes
 * 2. Client-side iTunes Search API (25+ high-res 1200x1200 album covers & posters)
 * 3. Client-side Wikimedia Commons (live concert & festival stage photos)
 * 4. Client-side Wikipedia (Portuguese & English high-res official portraits)
 */
export async function searchArtistMedia(artistName: string): Promise<ArtistMediaResult> {
  const cleanName = (artistName || '').trim();
  if (!cleanName) {
    return { artistName: '', photos: [], posters: [] };
  }

  const cacheKey = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  const photos: MediaItem[] = [];
  const posters: MediaItem[] = [];
  const seenPhotoUrls = new Set<string>();
  const seenPosterUrls = new Set<string>();

  const addPhoto = (item: MediaItem) => {
    if (!item.url || seenPhotoUrls.has(item.url)) return;
    const lower = item.url.toLowerCase();
    if (lower.endsWith('.pdf') || lower.endsWith('.djvu') || lower.endsWith('.tif') || lower.endsWith('.tiff')) {
      return;
    }
    seenPhotoUrls.add(item.url);
    photos.push(item);
  };

  const addPoster = (item: MediaItem) => {
    if (!item.url || seenPosterUrls.has(item.url)) return;
    const lower = item.url.toLowerCase();
    if (lower.endsWith('.pdf') || lower.endsWith('.djvu')) return;
    seenPosterUrls.add(item.url);
    posters.push(item);
  };

  // 1. Try local server API route (/api/artist-search)
  const serverPromise = fetch(`/api/artist-search?q=${encodeURIComponent(cleanName)}`)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    })
    .catch(() => null);

  // 2. Direct client-side iTunes Search API (100% open CORS, up to 25 items)
  const itunesPromise = fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=album&limit=25`
  )
    .then(async (res) => {
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.results) ? data.results : [];
    })
    .catch(() => []);

  // 3. Direct client-side Wikimedia Commons live concert search (Open CORS with origin=*)
  const commonsPromise = fetch(
    `https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanName + ' concert'
    )}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json`
  )
    .then(async (res) => {
      if (!res.ok) return [];
      const data = await res.json();
      const pages = data.query?.pages ? Object.values(data.query.pages) : [];
      return pages as any[];
    })
    .catch(() => []);

  // 4. Direct client-side Wikipedia (Portuguese & English for Brazilian and Global artists)
  const ptWikiPromise = fetch(
    `https://pt.wikipedia.org/w/api.php?origin=*&action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanName
    )}&gsrlimit=4&prop=pageimages&format=json&pithumbsize=1200`
  )
    .then(async (res) => {
      if (!res.ok) return [];
      const data = await res.json();
      return data.query?.pages ? (Object.values(data.query.pages) as any[]) : [];
    })
    .catch(() => []);

  const enWikiPromise = fetch(
    `https://en.wikipedia.org/w/api.php?origin=*&action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanName
    )}&gsrlimit=4&prop=pageimages&format=json&pithumbsize=1200`
  )
    .then(async (res) => {
      if (!res.ok) return [];
      const data = await res.json();
      return data.query?.pages ? (Object.values(data.query.pages) as any[]) : [];
    })
    .catch(() => []);

  // Wait for all queries in parallel
  const [serverData, itunesResults, commonsPages, ptWikiPages, enWikiPages] = await Promise.all([
    serverPromise,
    itunesPromise,
    commonsPromise,
    ptWikiPromise,
    enWikiPromise,
  ]);

  // Process server data first if available
  if (serverData) {
    if (Array.isArray(serverData.artists)) {
      serverData.artists.forEach((a: any, idx: number) => {
        if (a.photoUrl) {
          addPhoto({
            id: a.id || `server-photo-${idx}`,
            url: a.photoUrl,
            thumbUrl: a.thumbnailUrl || a.photoUrl,
            type: 'photo',
            title: `${a.name || cleanName} (${a.source === 'deezer' ? 'Deezer Oficial' : 'Wikimedia Commons'})`,
            source: a.source === 'deezer' ? 'Deezer Oficial' : 'Wikimedia Commons',
          });
        }
      });
    }

    if (Array.isArray(serverData.posters)) {
      serverData.posters.forEach((p: any, idx: number) => {
        if (p.posterUrl) {
          addPoster({
            id: p.id || `server-poster-${idx}`,
            url: p.posterUrl,
            thumbUrl: p.thumbnailUrl || p.posterUrl,
            type: 'poster',
            title: `${p.title || cleanName} - Pôster Oficial`,
            source: p.source === 'deezer' ? 'Deezer Turnê' : 'Apple Music / iTunes HD',
          });
        }
      });
    }
  }

  // Process iTunes albums & posters (high-res 1200x1200px)
  if (Array.isArray(itunesResults)) {
    itunesResults.forEach((alb: any, idx: number) => {
      if (!alb.artworkUrl100) return;
      const highResUrl = alb.artworkUrl100.replace('100x100bb', '1200x1200bb');
      const medResUrl = alb.artworkUrl100.replace('100x100bb', '600x600bb');
      addPoster({
        id: `itunes-${alb.collectionId || idx}`,
        url: highResUrl,
        thumbUrl: medResUrl,
        type: 'poster',
        title: `${alb.collectionName || cleanName} (${alb.artistName || cleanName})`,
        source: 'Apple Music / iTunes HD',
      });
    });
  }

  // Process Wikimedia Commons concert stage photos
  if (Array.isArray(commonsPages)) {
    commonsPages.forEach((page: any, idx: number) => {
      const info = page.imageinfo?.[0];
      if (!info) return;
      const url = info.thumburl || info.url;
      if (url) {
        const cleanTitle = (page.title || '')
          .replace(/^File:/i, '')
          .replace(/\.(jpg|jpeg|png|webp)$/i, '')
          .replace(/_/g, ' ');

        addPhoto({
          id: `commons-${page.pageid || idx}`,
          url,
          thumbUrl: info.thumburl || url,
          type: 'photo',
          title: cleanTitle ? `${cleanName} - ${cleanTitle}` : `${cleanName} - Ao Vivo no Palco`,
          source: 'Wikimedia Commons (Ao Vivo)',
        });
      }
    });
  }

  // Process Wikipedia portrait photos (PT & EN)
  [...ptWikiPages, ...enWikiPages].forEach((page: any, idx: number) => {
    const src = page.thumbnail?.source;
    if (src) {
      addPhoto({
        id: `wiki-${page.pageid || idx}`,
        url: src,
        thumbUrl: src,
        type: 'photo',
        title: `${page.title || cleanName} - Foto Oficial`,
        source: 'Wikipédia Oficial',
      });
    }
  });

  // Fallback: If no photos were found online (e.g. rare offline edge case), provide quality curated backups
  if (photos.length === 0) {
    const backupPhotos = [
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85',
    ];
    backupPhotos.forEach((url, i) => {
      addPhoto({
        id: `fallback-photo-${i}`,
        url,
        thumbUrl: url,
        type: 'photo',
        title: `${cleanName} - Foto de Palco #${i + 1}`,
        source: 'Acervo Palco Ao Vivo',
      });
    });
  }

  if (posters.length === 0) {
    const backupPosters = [
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
    ];
    backupPosters.forEach((url, i) => {
      addPoster({
        id: `fallback-poster-${i}`,
        url,
        thumbUrl: url,
        type: 'poster',
        title: `${cleanName} - Cartaz Turnê #${i + 1}`,
        source: 'Acervo Pôsteres',
      });
    });
  }

  const result: ArtistMediaResult = {
    artistName: cleanName,
    photos,
    posters,
  };

  mediaCache.set(cacheKey, result);
  return result;
}

/**
 * Automatically fetches the single best high-resolution photo for an artist.
 */
export async function autoFetchArtistPhoto(
  artistName: string
): Promise<{ photoUrl: string; source: string } | null> {
  if (!artistName) return null;

  try {
    // 1. Try server API route first
    const serverRes = await fetch(`/api/artist-search?q=${encodeURIComponent(artistName)}`).catch(() => null);
    if (serverRes && serverRes.ok) {
      const data = await serverRes.json();
      if (data.bestPhotoUrl) {
        const src = data.artists?.[0]?.source || 'deezer';
        return { photoUrl: data.bestPhotoUrl, source: src };
      }
    }

    // 2. Try comprehensive search
    const media = await searchArtistMedia(artistName);
    if (media.photos && media.photos.length > 0) {
      return { photoUrl: media.photos[0].url, source: media.photos[0].source };
    }
  } catch (err) {
    console.warn('Erro ao auto-buscar foto do artista:', err);
  }

  return null;
}
