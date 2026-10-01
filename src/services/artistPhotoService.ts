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

const CURATED_MEDIA: Record<string, { photos: string[]; posters: string[] }> = {
  coldplay: {
    photos: [
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
    ],
    posters: [
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  taylor_swift: {
    photos: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85',
    ],
    posters: [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=85',
    ],
  },
};

export async function searchArtistMedia(artistName: string): Promise<ArtistMediaResult> {
  const norm = artistName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const found = CURATED_MEDIA[norm] || {
    photos: [
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=85',
    ],
    posters: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=85',
    ],
  };

  return {
    artistName,
    photos: found.photos.map((url, idx) => ({
      id: `photo_${idx}_${Date.now()}`,
      url,
      type: 'photo',
      title: `${artistName} - Palco Ao Vivo #${idx + 1}`,
      source: 'Unsplash Curated',
    })),
    posters: found.posters.map((url, idx) => ({
      id: `poster_${idx}_${Date.now()}`,
      url,
      type: 'poster',
      title: `${artistName} - Pôster de Turnê #${idx + 1}`,
      source: 'Acervo Oficial',
    })),
  };
}
