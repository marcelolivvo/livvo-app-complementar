import { ShowItem, ArtistItem } from '../types';

const DB_NAME = 'ShowCardStudio_DB';
const DB_VERSION = 1;

export class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Shows store
        if (!db.objectStoreNames.contains('shows')) {
          const showStore = db.createObjectStore('shows', { keyPath: 'id' });
          showStore.createIndex('artistCode', 'artistCode', { unique: false });
          showStore.createIndex('showCode', 'showCode', { unique: false });
          showStore.createIndex('city', 'city', { unique: false });
          showStore.createIndex('state', 'state', { unique: false });
        }

        // Artists store
        if (!db.objectStoreNames.contains('artists')) {
          const artistStore = db.createObjectStore('artists', { keyPath: 'artistCode' });
          artistStore.createIndex('artistName', 'artistName', { unique: false });
        }

        // Photos store (artistCode -> dataUrl / blob)
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'artistCode' });
        }

        // Config store
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- SHOWS OPERATIONS ---

  async saveShowsBatch(shows: ShowItem[], clearPrevious = false): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shows'], 'readwrite');
      const store = transaction.objectStore('shows');

      if (clearPrevious) {
        store.clear();
      }

      for (const show of shows) {
        store.put(show);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllShows(limit = 0, offset = 0): Promise<ShowItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shows'], 'readonly');
      const store = transaction.objectStore('shows');

      if (limit === 0 && offset === 0) {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
        return;
      }

      const results: ShowItem[] = [];
      let skipped = 0;

      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (skipped < offset) {
            skipped++;
            cursor.continue();
            return;
          }

          results.push(cursor.value);
          if (limit > 0 && results.length >= limit) {
            resolve(results);
          } else {
            cursor.continue();
          }
        } else {
          resolve(results);
        }
      };

      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  async getShowsCount(): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shows'], 'readonly');
      const store = transaction.objectStore('shows');
      const countRequest = store.count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  async getShowsByArtist(artistCode: string, artistName?: string): Promise<ShowItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shows'], 'readonly');
      const store = transaction.objectStore('shows');
      const artistIndex = store.index('artistCode');
      const req = artistIndex.getAll(artistCode);

      req.onsuccess = () => {
        const directResults = req.result || [];
        if (directResults.length > 0) {
          resolve(directResults);
          return;
        }

        // If artistCode didn't match (e.g., CSV mapped differently or code missing),
        // fallback to scanning cursor matching artistName if provided
        if (artistName) {
          const targetName = artistName.trim().toLowerCase();
          const fallbackResults: ShowItem[] = [];
          const cursorReq = store.openCursor();
          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const item = cursor.value as ShowItem;
              if (item.artistName && item.artistName.trim().toLowerCase() === targetName) {
                fallbackResults.push(item);
              }
              cursor.continue();
            } else {
              resolve(fallbackResults);
            }
          };
          cursorReq.onerror = () => resolve([]);
        } else {
          resolve([]);
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  // --- ARTISTS OPERATIONS ---

  async saveArtists(artists: ArtistItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['artists'], 'readwrite');
      const store = transaction.objectStore('artists');

      for (const artist of artists) {
        store.put(artist);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllArtists(): Promise<ArtistItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['artists'], 'readonly');
      const store = transaction.objectStore('artists');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateArtistPhoto(artistCode: string, photoUrl: string, photoSource: 'upload' | 'url' | 'sample' | 'auto'): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['artists', 'photos'], 'readwrite');
      const artistStore = transaction.objectStore('artists');
      const photoStore = transaction.objectStore('photos');

      // Save to photos store
      photoStore.put({ artistCode, photoUrl, updatedAt: Date.now() });

      // Update artist record
      const getReq = artistStore.get(artistCode);
      getReq.onsuccess = () => {
        const artist = getReq.result as ArtistItem | undefined;
        if (artist) {
          artist.photoUrl = photoUrl;
          artist.photoSource = photoSource;
          artist.updatedAt = Date.now();
          artistStore.put(artist);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async batchUpdateArtistPhotos(photosMap: Map<string, string>): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['artists', 'photos'], 'readwrite');
      const artistStore = transaction.objectStore('artists');
      const photoStore = transaction.objectStore('photos');
      let updatedCount = 0;

      photosMap.forEach((photoUrl, artistCode) => {
        photoStore.put({ artistCode, photoUrl, updatedAt: Date.now() });

        const getReq = artistStore.get(artistCode);
        getReq.onsuccess = () => {
          const artist = getReq.result as ArtistItem | undefined;
          if (artist) {
            artist.photoUrl = photoUrl;
            artist.photoSource = 'upload';
            artist.updatedAt = Date.now();
            artistStore.put(artist);
            updatedCount++;
          }
        };
      });

      transaction.oncomplete = () => resolve(updatedCount);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPhoto(artistCode: string): Promise<string | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const req = store.get(artistCode);
      req.onsuccess = () => {
        if (req.result && req.result.photoUrl) {
          resolve(req.result.photoUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deletePhoto(artistCode: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['artists', 'photos'], 'readwrite');
      const photoStore = transaction.objectStore('photos');
      const artistStore = transaction.objectStore('artists');

      photoStore.delete(artistCode);

      const getReq = artistStore.get(artistCode);
      getReq.onsuccess = () => {
        const artist = getReq.result as ArtistItem | undefined;
        if (artist) {
          delete artist.photoUrl;
          delete artist.photoSource;
          artist.updatedAt = Date.now();
          artistStore.put(artist);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllPhotos(): Promise<Map<string, string>> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const req = store.getAll();
      req.onsuccess = () => {
        const photoMap = new Map<string, string>();
        const results = req.result || [];
        for (const item of results) {
          if (item && item.artistCode && item.photoUrl) {
            photoMap.set(item.artistCode, item.photoUrl);
          }
        }
        resolve(photoMap);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateShowPoster(showIdOrCode: string, posterUrl: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shows'], 'readwrite');
      const store = transaction.objectStore('shows');
      const req = store.get(showIdOrCode);

      req.onsuccess = () => {
        const show = req.result;
        if (show) {
          show.posterUrl = posterUrl;
          store.put(show);
        } else {
          // If not found directly by ID, search by artistCode index
          const artistIndex = store.index('artistCode');
          const artistReq = artistIndex.getAll(showIdOrCode);
          artistReq.onsuccess = () => {
            const matches = artistReq.result || [];
            matches.forEach((item) => {
              item.posterUrl = posterUrl;
              store.put(item);
            });
          };
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shows', 'artists', 'photos'], 'readwrite');
      transaction.objectStore('shows').clear();
      transaction.objectStore('artists').clear();
      transaction.objectStore('photos').clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const dbService = new DatabaseService();
