import type { Catalogo, Show } from './data/catalog';
import type { Memoria } from './store';

/**
 * Passaporte: números e faixa de acesso.
 * Faixas iguais às da Credencial Backstage do Estúdio (public/credencial/livvo-credencial.js):
 * Pista até 10 shows · Pista Premium 11–25 · Camarote 26–50 · Backstage 51–100 · All Access 101+.
 * Shows resgatados do passado contam igual (a faixa premia a história, não a frequência).
 */
export const FAIXAS = [
  { nome: 'Pista', ate: 10 },
  { nome: 'Pista Premium', ate: 25 },
  { nome: 'Camarote', ate: 50 },
  { nome: 'Backstage', ate: 100 },
  { nome: 'All Access', ate: Infinity },
] as const;

export interface Passaporte {
  shows: number;
  artistas: number;
  cidades: number;
  estados: number;
  casas: number;
  faixa: string;
  proximaFaixa?: string;
  faltam: number;
  progresso: number; // 0..1 dentro da faixa atual
  memoriasComShow: Array<{ memoria: Memoria; show: Show }>;
  primeiroShow?: Show;
  ultimoShow?: Show;
  artistaMaisVisto?: { nome: string; vezes: number; artistaId: string };
  semNotaOrganizacao: Array<{ memoria: Memoria; show: Show }>;
  semNotaShow: Array<{ memoria: Memoria; show: Show }>;
}

export const calcularPassaporte = (memorias: Memoria[], cat: Catalogo | null): Passaporte => {
  const memoriasComShow = memorias
    .map((memoria) => ({ memoria, show: cat?.porId.get(memoria.showId) }))
    .filter((x): x is { memoria: Memoria; show: Show } => Boolean(x.show))
    .sort((a, b) => b.show.ts - a.show.ts);

  const shows = memoriasComShow.length;
  const artistas = new Map<string, { nome: string; vezes: number; artistaId: string }>();
  const cidades = new Set<string>();
  const casas = new Set<string>();
  const estados = new Set<string>();
  memoriasComShow.forEach(({ show }) => {
    const a = artistas.get(show.artistaId) || { nome: show.artista, vezes: 0, artistaId: show.artistaId };
    a.vezes++;
    artistas.set(show.artistaId, a);
    cidades.add(`${show.cidade}|${show.uf}`);
    casas.add(`${show.casa}|${show.cidade}`);
    if (show.uf) estados.add(show.uf);
  });

  const idx = FAIXAS.findIndex((f) => shows <= f.ate);
  const faixa = FAIXAS[Math.max(0, idx)]!;
  const anterior = idx > 0 ? FAIXAS[idx - 1]!.ate : 0;
  const proxima = FAIXAS[idx + 1];
  const faltam = Number.isFinite(faixa.ate) ? faixa.ate - shows + 1 : 0;
  const progresso = Number.isFinite(faixa.ate) ? (shows - anterior) / (faixa.ate - anterior + 1) : 1;

  const maisVisto = Array.from(artistas.values()).sort((a, b) => b.vezes - a.vezes)[0];

  return {
    shows,
    artistas: artistas.size,
    cidades: cidades.size,
    estados: estados.size,
    casas: casas.size,
    faixa: faixa.nome,
    proximaFaixa: proxima?.nome,
    faltam,
    progresso: Math.max(0, Math.min(1, progresso)),
    memoriasComShow,
    primeiroShow: memoriasComShow[memoriasComShow.length - 1]?.show,
    ultimoShow: memoriasComShow[0]?.show,
    artistaMaisVisto: maisVisto && maisVisto.vezes > 1 ? maisVisto : undefined,
    semNotaOrganizacao: memoriasComShow.filter((x) => x.memoria.notaOrganizacao === undefined),
    semNotaShow: memoriasComShow.filter((x) => x.memoria.notaShow === undefined),
  };
};
