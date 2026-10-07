import { useEffect, useState } from 'react';
import { getStateAbbreviation } from '../../utils/stateUtils';
import { dataParaTs, hojeTs, normalizar, somarDias, tsParaData } from '../format';
import { FUTUROS_EXEMPLO } from './demo';

/**
 * Catálogo de shows da prévia.
 * Fonte: recorte de data/shows-index.json (base setlist.fm, 114.800 shows), gerado por
 * scripts/gerar-catalogo-livvo.mjs em public/livvo/catalogo.json e carregado sob demanda.
 * No site final, este módulo vira uma chamada à API do catálogo único (ID estável por show).
 */

export interface Show {
  id: string;
  data: string; // dd/mm/aaaa
  ts: number; // meia-noite local
  artistaId: string;
  artista: string;
  foto?: string;
  casa: string;
  cidade: string;
  estado: string;
  uf: string;
  turne?: string;
  setlistUrl?: string;
  exemplo?: boolean;
}

export interface Artista {
  id: string;
  nome: string;
  foto?: string;
  totalCatalogo: number;
  shows: Show[]; // mais recente primeiro
}

export interface Catalogo {
  shows: Show[]; // mais recente primeiro (inclui futuros de exemplo)
  porId: Map<string, Show>;
  artistas: Map<string, Artista>;
  listaArtistas: Artista[];
  totalCatalogo: number;
  geradoEm: string;
}

interface CatalogoBruto {
  geradoEm: string;
  totalCatalogo: number;
  artistas: Array<[string, string, string, number]>;
  casas: Array<[string, string, string]>;
  turnes: string[];
  shows: Array<[string, string, number, number, number, string]>;
}

let cache: Catalogo | null = null;
let carregando: Promise<Catalogo> | null = null;

const montar = (bruto: CatalogoBruto): Catalogo => {
  const artistas = new Map<string, Artista>();
  const porNome = new Map<string, Artista>();
  bruto.artistas.forEach(([id, nome, foto, total]) => {
    const a: Artista = { id, nome, foto: foto || undefined, totalCatalogo: total, shows: [] };
    artistas.set(id, a);
    porNome.set(normalizar(nome), a);
  });

  const shows: Show[] = bruto.shows.map(([id, data, ai, ci, ti, url]) => {
    const [aid, nome, foto] = bruto.artistas[ai]!;
    const [casa, cidade, estado] = bruto.casas[ci]!;
    return {
      id,
      data,
      ts: dataParaTs(data),
      artistaId: aid,
      artista: nome,
      foto: foto || undefined,
      casa,
      cidade,
      estado,
      uf: getStateAbbreviation(estado) || estado,
      turne: ti >= 0 ? bruto.turnes[ti] : undefined,
      setlistUrl: url ? `https://www.setlist.fm/setlist/${url}.html` : undefined,
    };
  });

  // Shows futuros de exemplo (datas fictícias contadas a partir de hoje)
  const hoje = hojeTs();
  FUTUROS_EXEMPLO.forEach((f) => {
    const art = porNome.get(normalizar(f.artista));
    const ts = somarDias(hoje, f.emDias);
    const show: Show = {
      id: f.id,
      data: tsParaData(ts),
      ts,
      artistaId: art?.id || `ex-${normalizar(f.artista).replace(/\W+/g, '-')}`,
      artista: art?.nome || f.artista,
      foto: art?.foto,
      casa: f.casa,
      cidade: f.cidade,
      estado: f.estado,
      uf: getStateAbbreviation(f.estado) || f.estado,
      turne: f.turne,
      exemplo: true,
    };
    if (!art) {
      const novo: Artista = { id: show.artistaId, nome: f.artista, totalCatalogo: 0, shows: [] };
      artistas.set(novo.id, novo);
      porNome.set(normalizar(f.artista), novo);
    }
    shows.push(show);
  });

  shows.sort((a, b) => b.ts - a.ts || a.artista.localeCompare(b.artista));
  const porId = new Map(shows.map((s) => [s.id, s]));
  shows.forEach((s) => artistas.get(s.artistaId)?.shows.push(s));
  const listaArtistas = Array.from(artistas.values()).filter((a) => a.shows.length > 0);

  return { shows, porId, artistas, listaArtistas, totalCatalogo: bruto.totalCatalogo, geradoEm: bruto.geradoEm };
};

export const carregarCatalogo = (): Promise<Catalogo> => {
  if (cache) return Promise.resolve(cache);
  if (!carregando) {
    carregando = fetch('/livvo/catalogo.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Catálogo indisponível (${r.status})`);
        return r.json() as Promise<CatalogoBruto>;
      })
      .then((bruto) => (cache = montar(bruto)))
      .catch((e) => {
        carregando = null;
        throw e;
      });
  }
  return carregando;
};

export const useCatalogo = (): { catalogo: Catalogo | null; erro: string | null; tentarDeNovo: () => void } => {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(cache);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (cache) return;
    let vivo = true;
    carregarCatalogo()
      .then((c) => vivo && setCatalogo(c))
      .catch((e: Error) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [tentativa]);
  return {
    catalogo,
    erro,
    tentarDeNovo: () => {
      setErro(null);
      setTentativa((n) => n + 1);
    },
  };
};

export const ehFuturo = (s: Show): boolean => s.ts > hojeTs();

/** Busca por artista, casa ou cidade (sem acento). */
export const combina = (s: Show, termo: string): boolean => {
  if (!termo) return true;
  const t = normalizar(termo);
  return (
    normalizar(s.artista).includes(t) ||
    normalizar(s.casa).includes(t) ||
    normalizar(s.cidade).includes(t) ||
    (s.turne ? normalizar(s.turne).includes(t) : false)
  );
};

/** Artistas cujo nome combina com o termo, mais conhecidos primeiro. */
export const buscarArtistas = (cat: Catalogo, termo: string, limite = 8): Artista[] => {
  const t = normalizar(termo);
  if (t.length < 2) return [];
  return cat.listaArtistas
    .filter((a) => normalizar(a.nome).includes(t))
    .sort((a, b) => {
      const ia = normalizar(a.nome).startsWith(t) ? 0 : 1;
      const ib = normalizar(b.nome).startsWith(t) ? 0 : 1;
      return ia - ib || b.totalCatalogo - a.totalCatalogo;
    })
    .slice(0, limite);
};
