import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL('data/shows-index.json', root), 'utf8'));
const existing = new Set(['Coldplay', 'Taylor Swift', 'Titãs', 'Bruno Mars', 'Ivete Sangalo']);
const dateKey = (date) => date.split('/').reverse().join('-');
const artists = [];
const shows = [];
for (const artist of catalog.artists) {
  if (existing.has(artist[1])) continue;
  const matches = catalog.shows.filter((s) => s[3] === artist[0] && s[2] === artist[1] && s[5] && s[6] && s[7])
    .sort((a, b) => dateKey(b[1]).localeCompare(dateKey(a[1])) || a[0].localeCompare(b[0])).slice(0, 2);
  if (!matches.length) continue;
  artists.push({ artistCode: artist[0], artistName: artist[1], showsCount: matches.length,
    ...(artist[4] ? { photoUrl: artist[4] } : {}) });
  for (const s of matches) shows.push({ id: s[0], showCode: `LIVVO_${s[0]}`, artistCode: artist[0],
    artistName: s[2], date: s[1], venue: s[5], city: s[6], state: s[7], ...(s[4] ? { tourName: s[4] } : {}) });
  if (artists.length === 45) break;
}
if (artists.length !== 45) throw new Error('Catálogo insuficiente para 45 artistas adicionais');
const source = `// Gerado por node scripts/expand-samples.mjs a partir de data/shows-index.json.\nimport type { ArtistItem, ShowItem } from '../types';\n\nexport const EXTRA_ARTISTS: ArtistItem[] = ${JSON.stringify(artists, null, 2)};\n\nexport const EXTRA_SHOWS: ShowItem[] = ${JSON.stringify(shows, null, 2)};\n`;
fs.writeFileSync(new URL('src/services/expandedSamples.ts', root), source);
console.log(`45 artistas e ${shows.length} shows adicionais salvos em ${fileURLToPath(root)}`);
