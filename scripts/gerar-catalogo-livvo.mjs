// Gera public/livvo/catalogo.json: recorte do catálogo (data/shows-index.json, base setlist.fm)
// usado pela prévia "livvo-final" (Explorar, Registrar, Detalhe do show).
// O catálogo completo continua restrito ao Admin; aqui vai só um recorte público de leitura.
// Uso: node scripts/gerar-catalogo-livvo.mjs
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL('data/shows-index.json', root), 'utf8'));

const CIDADES = new Set(['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Curitiba', 'Brasília',
  'Salvador', 'Recife', 'Fortaleza', 'Florianópolis', 'Campinas', 'Goiânia']);
// Shows da conta de demonstração (memórias do Marcelo no livvomusic.com.br)
const DEMO_IDS = new Set(['637092b3', '7b7092a0', '1b4df56c', '6b40a212', '435f27c7', '635aaa67', '6b5aaa6e', '135aa935',
  '5b50ebc0', '73a8fad1', '6b521ed2', '23a10c13', '7b9c2618', '2be020ae', '7bfcf61c', '1bf2d504', '3c4794b', '53c40b15',
  '7bc40e20', '6bc40e12', '33d52015', '33d52499', '33d6b895', '539f5399', '13b5e14d']);
const MIN_ARTISTA = 25; // artistas com pelo menos 25 shows no catálogo inteiro
const ANO_MIN = 2025;

const artistsById = new Map(catalog.artists.map((a) => [a[0], a]));
const ano = (s) => Number(s[1].slice(-4));
const demoArtists = new Set(catalog.shows.filter((s) => DEMO_IDS.has(s[0])).map((s) => s[3]));
const extra = fs.readFileSync(new URL('src/services/expandedSamples.ts', root), 'utf8');
const extraIds = new Set([...extra.matchAll(/"id": "([0-9a-f]+)"/g)].map((m) => m[1]));

const keep = catalog.shows.filter((s) => {
  if (!s[0] || !s[2] || !s[5] || !s[6]) return false;
  if (DEMO_IDS.has(s[0]) || extraIds.has(s[0])) return true;
  const art = artistsById.get(s[3]);
  if (demoArtists.has(s[3]) && ano(s) >= 2008 && CIDADES.has(s[6])) return true;
  return ano(s) >= ANO_MIN && CIDADES.has(s[6]) && art && art[3] >= MIN_ARTISTA;
});

const artistas = [];
const artistIdx = new Map();
const casas = [];
const casaIdx = new Map();
const turnes = [];
const turneIdx = new Map();
const idx = (map, list, key, value) => {
  if (!map.has(key)) { map.set(key, list.length); list.push(value); }
  return map.get(key);
};
const shows = keep.map((s) => {
  const art = artistsById.get(s[3]);
  const a = idx(artistIdx, artistas, s[3], [s[3], s[2], art?.[4] || '', art?.[3] || 0]);
  const v = idx(casaIdx, casas, `${s[5]}|${s[6]}|${s[7]}`, [s[5], s[6], s[7]]);
  const t = s[4] ? idx(turneIdx, turnes, s[4], s[4]) : -1;
  const url = s[9] && s[9].startsWith('https://www.setlist.fm/setlist/') ? s[9].slice(31, -5) : '';
  return [s[0], s[1], a, v, t, url];
});
const out = {
  geradoEm: new Date().toISOString(),
  fonte: 'data/shows-index.json (setlist.fm)',
  totalCatalogo: catalog.metadata.totalShows,
  artistas, casas, turnes, shows,
};
fs.writeFileSync(new URL('public/livvo/catalogo.json', root), JSON.stringify(out));
console.log(`${shows.length} shows, ${artistas.length} artistas, ${casas.length} casas`);
