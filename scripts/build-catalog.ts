import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Papa from 'papaparse';

/**
 * Build-time Catalog Indexer
 * 
 * Reads data/shows-completo.csv (or data/shows.csv as fallback), validates every row,
 * normalizes text for fast search, and compiles a compact JSON array-of-arrays index
 * saved to data/shows-index.json (private server folder).
 * 
 * Columns in shows-completo.csv:
 * Setlist ID, Data do show, Artista, MBID, Turnê, Local, Cidade, Estado, País, URL setlist.fm
 */

// UUID v4 or standard UUID regex for MBID validation
const MBID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Pre-defined canonical verified artist portraits for high fidelity
const CANONICAL_PHOTOS: Record<string, string> = {
  anitta: 'https://cdn-images.dzcdn.net/images/artist/e1a33054b719a936f00dc2050f3c90a9/1000x1000-000000-80-0-0.jpg',
  ludmilla: 'https://cdn-images.dzcdn.net/images/artist/99d3d3733075c3db11a37c9a6feecce2/1000x1000-000000-80-0-0.jpg',
  luisasonza: 'https://cdn-images.dzcdn.net/images/artist/e57e035caeca80b70ebe378662a36aed/1000x1000-000000-80-0-0.jpg',
  jao: 'https://cdn-images.dzcdn.net/images/artist/f1997d020d2979e2c48ea92a95e72d24/1000x1000-000000-80-0-0.jpg',
  gusttavolima: 'https://cdn-images.dzcdn.net/images/artist/0954d544bbd4183580375545145decd7/1000x1000-000000-80-0-0.jpg',
  jorgemateus: 'https://cdn-images.dzcdn.net/images/artist/46bf72b87250439262cc168d8fdcd240/1000x1000-000000-80-0-0.jpg',
  jorgeemateus: 'https://cdn-images.dzcdn.net/images/artist/46bf72b87250439262cc168d8fdcd240/1000x1000-000000-80-0-0.jpg',
  henriquejuliano: 'https://cdn-images.dzcdn.net/images/artist/19eb92f69ae705d9c19356616053ea6a/1000x1000-000000-80-0-0.jpg',
  henriqueejuliano: 'https://cdn-images.dzcdn.net/images/artist/19eb92f69ae705d9c19356616053ea6a/1000x1000-000000-80-0-0.jpg',
  anacastela: 'https://cdn-images.dzcdn.net/images/artist/e13f4f69904321c7fae98f0694aa2801/1000x1000-000000-80-0-0.jpg',
  charliebrownjr: 'https://cdn-images.dzcdn.net/images/artist/1a2e562dde23cdbd9abea4bae13eb4fc/1000x1000-000000-80-0-0.jpg',
  charliebrownjunior: 'https://cdn-images.dzcdn.net/images/artist/1a2e562dde23cdbd9abea4bae13eb4fc/1000x1000-000000-80-0-0.jpg',
  raimundos: 'https://cdn-images.dzcdn.net/images/artist/5c751567df18d06962a6107f68761bde/1000x1000-000000-80-0-0.jpg',
  blackeyedpeas: 'https://cdn-images.dzcdn.net/images/artist/4230c9807b45b78df8ce1255ca5ca594/1000x1000-000000-80-0-0.jpg',
  theblackeyedpeas: 'https://cdn-images.dzcdn.net/images/artist/4230c9807b45b78df8ce1255ca5ca594/1000x1000-000000-80-0-0.jpg',
  titas: 'https://cdn-images.dzcdn.net/images/artist/88d6b914b1667b49742d46b8d8f5857e/1000x1000-000000-80-0-0.jpg',
  neymatogrosso: 'https://cdn-images.dzcdn.net/images/artist/b17c2f6d2f3484f93cb7003ae3fc8676/1000x1000-000000-80-0-0.jpg',
  zecapagodinho: 'https://cdn-images.dzcdn.net/images/artist/5b8f8888bdf20b41aaae11f3f40d9b4c/1000x1000-000000-80-0-0.jpg',
  loshermanos: 'https://cdn-images.dzcdn.net/images/artist/683ebdfa666e8574044ffca6f2d56a73/1000x1000-000000-80-0-0.jpg',
};

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeKey(text: string): string {
  return normalizeText(text).replace(/[^a-z0-9]/g, '');
}

export type CompactShowRow = [
  string, // 0: setlistId (string, never number)
  string, // 1: date
  string, // 2: artist
  string, // 3: mbid
  string, // 4: tour
  string, // 5: venue
  string, // 6: city
  string, // 7: state
  string, // 8: country
  string, // 9: url
  string, // 10: normArtist
  string  // 11: normCity
];

export type CompactArtistRow = [
  string, // 0: mbid (or artistCode)
  string, // 1: artistName
  string, // 2: normArtist
  number, // 3: showsCount
  string, // 4: photoUrl (or empty string)
  string  // 5: featuredPosterUrl (or empty string)
];

export interface CatalogIndexData {
  metadata: {
    generatedAt: string;
    sourceFile: string;
    sourceSha256: string;
    sourceModifiedAt: string;
    sourceSize: number;
    totalShows: number;
    totalArtists: number;
    discardedEmptyId: number;
    discardedDuplicateId: number;
    discardedInvalidMbid: number;
  };
  shows: CompactShowRow[];
  artists: CompactArtistRow[];
}

export function buildCatalogIndex(): CatalogIndexData {
  const rootDir = process.cwd();
  const completoCsvPath = path.join(rootDir, 'data', 'shows-completo.csv');
  const fallbackCsvPath = path.join(rootDir, 'data', 'shows.csv');
  const outputJsonPath = path.join(rootDir, 'data', 'shows-index.json');

  let targetCsvPath = completoCsvPath;
  let isFullCatalog = true;

  if (!fs.existsSync(completoCsvPath)) {
    if (fs.existsSync(fallbackCsvPath)) {
      console.warn(`[BuildCatalog] Arquivo '${completoCsvPath}' não encontrado.`);
      console.warn(`[BuildCatalog] Usando '${fallbackCsvPath}' como base para geração do índice.`);
      targetCsvPath = fallbackCsvPath;
      isFullCatalog = false;
    } else {
      throw new Error(`[BuildCatalog] Nenhum arquivo CSV encontrado em data/ (${completoCsvPath} ou ${fallbackCsvPath}).`);
    }
  }

  console.log(`[BuildCatalog] Lendo arquivo CSV: ${targetCsvPath}`);
  const csvBuffer = fs.readFileSync(targetCsvPath);
  const fileStats = fs.statSync(targetCsvPath);
  const sha256Hash = crypto.createHash('sha256').update(csvBuffer).digest('hex');
  const csvContent = csvBuffer.toString('utf-8');

  console.log(`[BuildCatalog] SHA-256 do CSV: ${sha256Hash}`);
  console.log(`[BuildCatalog] Data de modificação: ${fileStats.mtime.toISOString()} | Tamanho: ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const shows: CompactShowRow[] = [];
  const artistsMap = new Map<string, {
    mbid: string;
    artistName: string;
    normArtist: string;
    showsCount: number;
    photoUrl: string;
    featuredPosterUrl: string;
  }>();

  const seenSetlistIds = new Set<string>();
  let discardedEmptyId = 0;
  let discardedDuplicateId = 0;
  let discardedInvalidMbid = 0;
  let rowIndex = 0;

  for (const row of parsed.data) {
    rowIndex++;

    // Extract columns supporting both shows-completo.csv and shows.csv header variations
    let setlistId = String(
      row['Setlist ID'] ??
      row['setlist_id'] ??
      row['codigo_show'] ??
      row['codigoshow'] ??
      row['id'] ??
      ''
    ).trim();

    const date = String(
      row['Data do show'] ??
      row['data'] ??
      row['date'] ??
      row['Data'] ??
      ''
    ).trim();

    const artistName = String(
      row['Artista'] ??
      row['nome_artista'] ??
      row['artista'] ??
      row['artist'] ??
      ''
    ).trim();

    let mbid = String(
      row['MBID'] ??
      row['mbid'] ??
      row['codigo_artista'] ??
      row['codartista'] ??
      ''
    ).trim();

    const tour = String(
      row['Turnê'] ??
      row['turne'] ??
      row['tour'] ??
      ''
    ).trim();

    const venue = String(
      row['Local'] ??
      row['local'] ??
      row['venue'] ??
      ''
    ).trim();

    const city = String(
      row['Cidade'] ??
      row['cidade'] ??
      row['city'] ??
      ''
    ).trim();

    const state = String(
      row['Estado'] ??
      row['estado'] ??
      row['uf'] ??
      ''
    ).trim();

    const country = String(
      row['País'] ??
      row['pais'] ??
      row['country'] ??
      (isFullCatalog ? '' : 'Brasil')
    ).trim();

    const url = String(
      row['URL setlist.fm'] ??
      row['url'] ??
      row['setlist_url'] ??
      ''
    ).trim();

    // In fallback shows.csv, setlistId or mbid may be formatted like SHW-1001 or ART-001
    if (!setlistId && !isFullCatalog) {
      setlistId = `SHW-${rowIndex}`;
    }
    if (!mbid && !isFullCatalog) {
      mbid = `ART-${rowIndex}`;
    }

    // 1. Validate Setlist ID: string, must not be empty (never convert to number!)
    if (!setlistId) {
      discardedEmptyId++;
      console.warn(`[BuildCatalog] Linha ${rowIndex}: Setlist ID vazio ignorado.`);
      continue;
    }

    // Check duplicate Setlist ID
    if (seenSetlistIds.has(setlistId)) {
      discardedDuplicateId++;
      console.warn(`[BuildCatalog] Linha ${rowIndex}: Setlist ID duplicado '${setlistId}' ignorado.`);
      continue;
    }

    // 2. Validate MBID (only for full catalog where MBID is expected)
    if (isFullCatalog) {
      if (!mbid || !MBID_REGEX.test(mbid)) {
        discardedInvalidMbid++;
        console.warn(`[BuildCatalog] Linha ${rowIndex}: MBID inválido '${mbid}' (Setlist ID: ${setlistId}) ignorado.`);
        continue;
      }
    } else {
      if (!mbid) {
        discardedInvalidMbid++;
        continue;
      }
    }

    if (!artistName) {
      continue;
    }

    seenSetlistIds.add(setlistId);

    const normArtist = normalizeText(artistName);
    const normCity = normalizeText(city);
    const artistKey = normalizeKey(artistName);

    // Look up canonical photo if available
    let photoUrl = String(row['foto_url'] || row['fotourl'] || '').trim();
    const posterUrl = String(row['poster_url'] || row['posterurl'] || '').trim();

    if (CANONICAL_PHOTOS[artistKey]) {
      photoUrl = CANONICAL_PHOTOS[artistKey];
    }

    // Construct compact row:
    // [setlistId, date, artist, mbid, tour, venue, city, state, country, url, normArtist, normCity]
    shows.push([
      setlistId, // 0: ALWAYS a string (keeps 7 chars or leading characters)
      date,      // 1
      artistName,// 2
      mbid,      // 3
      tour,      // 4 (empty string if absent)
      venue,     // 5 (empty string if absent)
      city,      // 6 (empty string if absent)
      state,     // 7 (empty string if absent)
      country,   // 8
      url,       // 9
      normArtist,// 10: pre-normalized for instant search
      normCity   // 11: pre-normalized
    ]);

    // Aggregate unique artists
    const artistMapKey = mbid ? mbid.toLowerCase() : artistKey;
    const existing = artistsMap.get(artistMapKey);
    if (existing) {
      existing.showsCount += 1;
      if (!existing.photoUrl && photoUrl) existing.photoUrl = photoUrl;
      if (!existing.featuredPosterUrl && posterUrl) existing.featuredPosterUrl = posterUrl;
    } else {
      artistsMap.set(artistMapKey, {
        mbid: mbid || artistKey,
        artistName,
        normArtist,
        showsCount: 1,
        photoUrl: photoUrl || '',
        featuredPosterUrl: posterUrl || '',
      });
    }
  }

  // Convert artists to sorted compact rows (most shows first)
  const artists: CompactArtistRow[] = Array.from(artistsMap.values())
    .sort((a, b) => b.showsCount - a.showsCount)
    .map((a) => [
      a.mbid,
      a.artistName,
      a.normArtist,
      a.showsCount,
      a.photoUrl,
      a.featuredPosterUrl,
    ]);

  const indexData: CatalogIndexData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceFile: path.relative(rootDir, targetCsvPath),
      sourceSha256: sha256Hash,
      sourceModifiedAt: fileStats.mtime.toISOString(),
      sourceSize: fileStats.size,
      totalShows: shows.length,
      totalArtists: artists.length,
      discardedEmptyId,
      discardedDuplicateId,
      discardedInvalidMbid,
    },
    shows,
    artists,
  };

  // Ensure data directory exists and write JSON
  const dataDir = path.dirname(outputJsonPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputJsonPath, JSON.stringify(indexData), 'utf-8');

  const outputStats = fs.statSync(outputJsonPath);
  console.log(`[BuildCatalog] Sucesso! Índice gerado em: ${outputJsonPath}`);
  console.log(`[BuildCatalog] Tamanho do JSON gerado: ${(outputStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`[BuildCatalog] Contagem final de shows: ${shows.length}`);
  console.log(`[BuildCatalog] Contagem de artistas únicos: ${artists.length}`);
  if (discardedEmptyId > 0 || discardedDuplicateId > 0 || discardedInvalidMbid > 0) {
    console.log(`[BuildCatalog] Linhas descartadas: vazias=${discardedEmptyId}, duplicadas=${discardedDuplicateId}, MBID inválido=${discardedInvalidMbid}`);
  }

  return indexData;
}

// When executed directly via node or tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    buildCatalogIndex();
  } catch (err) {
    console.error('[BuildCatalog] Erro fatal ao gerar catálogo:', err);
    process.exit(1);
  }
}
