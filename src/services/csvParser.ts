import Papa from 'papaparse';
import { ColumnMapping, ShowItem, ArtistItem } from '../types';
import { normalizeStateUF, cleanCityOnly } from '../utils/stateUtils';
import { normalizeArtistKey } from '../utils/artistUtils';

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (h: string) =>
    h.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const normHeaders = headers.map(h => ({ original: h, normalized: normalize(h) }));

  const findBestMatch = (keywords: string[]): string => {
    for (const kw of keywords) {
      const exact = normHeaders.find(h => h.normalized === kw);
      if (exact) return exact.original;
    }
    for (const kw of keywords) {
      const contains = normHeaders.find(h => h.normalized.includes(kw));
      if (contains) return contains.original;
    }
    return '';
  };

  const isDateColumn = (name: string) => {
    const norm = normalize(name);
    return /^(data|dia|date|datadoshow|ano|mes|horario|time)/.test(norm);
  };
  const isVenueColumn = (name: string) => {
    const norm = normalize(name);
    return /^(local|venue|espaco|casadeshow|estadio|teatro|arena)/.test(norm);
  };
  const isCityColumn = (name: string) => {
    const norm = normalize(name);
    return /^(cidade|city|municipio|localidade)/.test(norm);
  };

  const isCodeColumn = (name: string) => {
    const norm = normalize(name);
    return /^(cod|code|id|num|key)/.test(norm);
  };

  const detectedArtistCode = findBestMatch([
    'codigoartista', 'codartista', 'idartista', 'artistcode', 'artistid', 'codigocantor', 'idcantor', 'codigobanda', 'idbanda'
  ]);
  const fallbackArtistCode = (headers[1] && isCodeColumn(headers[1])) ? headers[1] : '';

  const detectedArtistName = findBestMatch([
    'nomeartista', 'artista', 'artist', 'banda', 'nomedabanda', 'band', 'bandname',
    'nomecantor', 'nomedoartista', 'cantor', 'nome', 'atracao', 'atracaoartista',
    'grupo', 'lineup', 'line_up', 'artistabanda', 'headliner', 'showartist', 'musico'
  ]);

  return {
    showCode: findBestMatch([
      'codigoshow', 'codshow', 'idshow', 'showid', 'showcode', 'numshow', 'codigodoevento', 'idevento'
    ]) || headers[0] || '',

    artistCode: detectedArtistCode || fallbackArtistCode,

    artistName: detectedArtistName || (headers[1] && !isCodeColumn(headers[1]) && !isDateColumn(headers[1]) && !isVenueColumn(headers[1]) && !isCityColumn(headers[1]) ? headers[1] : headers[2]) || '',

    venue: findBestMatch([
      'local', 'venue', 'espaco', 'casadeshow', 'localdoshow', 'estadio', 'teatro', 'arena'
    ]) || headers[3] || '',

    date: findBestMatch([
      'dia', 'data', 'date', 'datadoshow', 'diaevento', 'horario', 'datahora'
    ]) || headers[4] || '',

    city: findBestMatch([
      'cidade', 'city', 'municipio', 'localidade'
    ]) || headers[5] || '',

    state: findBestMatch([
      'estado', 'uf', 'state', 'siglaestado', 'regiao'
    ]) || headers[6] || '',

    photoUrl: findBestMatch([
      'fotourl', 'urlfoto', 'linkfoto', 'foto', 'photo', 'imagem', 'image', 'picture', 'avatar', 'imageurl'
    ]) || '',

    posterUrl: findBestMatch([
      'poster', 'posterurl', 'urlposter', 'flyer', 'cartaz', 'banner', 'arte', 'flyerurl', 'cartazurl', 'posterdoshow'
    ]) || '',

    tourName: findBestMatch([
      'turne', 'tour', 'nometurne', 'nometour', 'nometourne', 'titulo', 'eventotitulo', 'nomeevento'
    ]) || '',
  };
}

export interface ParseCsvOptions {
  file: File;
  mapping: ColumnMapping;
  onProgress?: (processed: number, estimatedTotal: number) => void;
  onChunkReady?: (showsChunk: ShowItem[], artistsMap: Map<string, ArtistItem>) => Promise<void>;
}

export async function parseAndProcessCsv(options: ParseCsvOptions): Promise<{
  totalShows: number;
  totalArtists: number;
  artistsMap: Map<string, ArtistItem>;
}> {
  const { file, mapping, onProgress, onChunkReady } = options;
  const artistsMap = new Map<string, ArtistItem>();

  let processedCount = 0;
  // Estimate total rows based on file size (~80 bytes per row for typical show record)
  const estimatedTotalRows = Math.max(1000, Math.round(file.size / 80));

  let currentChunk: ShowItem[] = [];
  const CHUNK_SIZE = 5000;

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      chunk: async (results, parser) => {
        parser.pause();

        for (const row of results.data as Record<string, string>[]) {
          const showCode = String(row[mapping.showCode] || '').trim();
          const artistCode = String(row[mapping.artistCode] || '').trim();
          const artistName = String(row[mapping.artistName] || '').trim();
          const venue = String(row[mapping.venue] || '').trim();
          const date = String(row[mapping.date] || '').trim();
          const rawCity = String(row[mapping.city] || '').trim();
          let rawState = String(row[mapping.state] || '').trim();
          if (!rawState) {
            const match = rawCity.match(/[\s/,-]+([A-Za-z]{2})\s*$/);
            if (match) {
              rawState = match[1];
            }
          }
          const city = cleanCityOnly(rawCity);
          const state = rawState;
          const photoUrl = mapping.photoUrl ? String(row[mapping.photoUrl] || '').trim() : '';
          const posterUrl = mapping.posterUrl ? String(row[mapping.posterUrl] || '').trim() : '';
          const tourName = mapping.tourName ? String(row[mapping.tourName] || '').trim() : '';

          if (!artistName && !artistCode && !showCode) continue;

          processedCount++;
          // Ensure guaranteed unique ID for every record so duplicates in showCode never overwrite
          const id = `show_${processedCount}_${showCode || 'item'}`;

          const isDateValue = (val: string) => /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(val.trim());
          const cleanRawCode = (artistCode && !isDateValue(artistCode) && artistCode !== date) ? artistCode : '';
          const finalArtistCode = cleanRawCode || (artistName ? `ART-${artistName.trim().replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}` : `ART-${processedCount}`);

          const showItem: ShowItem = {
            id,
            showCode: showCode || `SHOW-${processedCount}`,
            artistCode: finalArtistCode,
            artistName: artistName || 'Artista Desconhecido',
            tourName: tourName || undefined,
            venue: venue || 'Local a confirmar',
            date: date || 'A definir',
            city: city || 'Brasil',
            state: normalizeStateUF(state) || 'BR',
            posterUrl: posterUrl || undefined,
          };

          currentChunk.push(showItem);

          // Aggregate artists uniquely by normalized artist name to avoid collisions
          const artistKey = normalizeArtistKey(showItem.artistName) || finalArtistCode.toLowerCase();
          const existing = artistsMap.get(artistKey);
          if (existing) {
            existing.showsCount += 1;
            if (!existing.photoUrl && photoUrl) {
              existing.photoUrl = photoUrl;
              existing.photoSource = 'auto';
            }
            if (!existing.featuredPosterUrl && posterUrl) {
              existing.featuredPosterUrl = posterUrl;
            }
            // Keep clean code if existing had fallback
            if (cleanRawCode && existing.artistCode.startsWith('ART-') && existing.artistCode !== cleanRawCode) {
              existing.artistCode = cleanRawCode;
            }
          } else {
            artistsMap.set(artistKey, {
              artistCode: finalArtistCode,
              artistName: showItem.artistName,
              showsCount: 1,
              photoUrl: photoUrl || undefined,
              featuredPosterUrl: posterUrl || undefined,
              photoSource: photoUrl ? 'auto' : undefined,
            });
          }
        }

        if (onProgress) {
          onProgress(processedCount, estimatedTotalRows);
        }

        if (currentChunk.length >= CHUNK_SIZE) {
          if (onChunkReady) {
            await onChunkReady(currentChunk, artistsMap);
          }
          currentChunk = [];
        }

        parser.resume();
      },
      complete: async () => {
        // flush remaining
        if (currentChunk.length > 0 && onChunkReady) {
          await onChunkReady(currentChunk, artistsMap);
        }

        resolve({
          totalShows: processedCount,
          totalArtists: artistsMap.size,
          artistsMap,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
