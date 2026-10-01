import { ShowItem } from '../types';
import { dbService } from './db';

export async function searchCatalogApi(query: string): Promise<ShowItem[]> {
  const all = dbService.getAllShows();
  if (!query) return all.slice(0, 10);
  const q = query.toLowerCase();
  return all.filter(
    (s) =>
      s.artistName.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.venue.toLowerCase().includes(q) ||
      (s.tourName && s.tourName.toLowerCase().includes(q))
  );
}
