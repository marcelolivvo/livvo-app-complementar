import { ArtistItem, ShowItem } from '../types';
import { SAMPLE_SHOWS, SAMPLE_ARTISTS_DATA } from './sampleData';

const CUSTOM_ARTISTS_KEY = 'livvo_custom_artists';
const CUSTOM_SHOWS_KEY = 'livvo_custom_shows';

export const dbService = {
  getCustomArtists(): ArtistItem[] {
    try {
      const raw = localStorage.getItem(CUSTOM_ARTISTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCustomArtist(artist: ArtistItem): void {
    const list = this.getCustomArtists().filter((a) => a.artistCode !== artist.artistCode);
    list.unshift(artist);
    localStorage.setItem(CUSTOM_ARTISTS_KEY, JSON.stringify(list));
  },

  getAllArtists(): ArtistItem[] {
    const custom = this.getCustomArtists();
    const map = new Map<string, ArtistItem>();
    SAMPLE_ARTISTS_DATA.forEach((a) => map.set(a.artistCode, a));
    custom.forEach((a) => map.set(a.artistCode, a));
    return Array.from(map.values());
  },

  getCustomShows(): ShowItem[] {
    try {
      const raw = localStorage.getItem(CUSTOM_SHOWS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCustomShows(shows: ShowItem[]): void {
    const existing = this.getCustomShows();
    const map = new Map<string, ShowItem>();
    existing.forEach((s) => map.set(s.id, s));
    shows.forEach((s) => map.set(s.id, s));
    localStorage.setItem(CUSTOM_SHOWS_KEY, JSON.stringify(Array.from(map.values())));
  },

  getAllShows(): ShowItem[] {
    const custom = this.getCustomShows();
    const map = new Map<string, ShowItem>();
    SAMPLE_SHOWS.forEach((s) => map.set(s.id, s));
    custom.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  },

  async getShowsByArtist(artistCode?: string, artistName?: string): Promise<ShowItem[]> {
    const all = this.getAllShows();
    return all.filter((s) => {
      const matchCode = artistCode && s.artistCode.toLowerCase() === artistCode.toLowerCase();
      const matchName = artistName && s.artistName.toLowerCase() === artistName.toLowerCase();
      return Boolean(matchCode || matchName);
    });
  },
};
