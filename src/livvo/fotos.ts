import { useEffect, useState } from 'react';
import { searchArtistMedia } from '../services/artistPhotoService';

/**
 * Fotos do Livvo final: pôsteres e ingressos com foto padronizada.
 *
 * Padrão (decisão do Edmir em 07/10/2026): toda foto, venha de onde vier, passa pelo mesmo tratamento
 * antes de entrar num pôster ou ingresso: corte 4:5 e retícula halftone nas cores da marca
 * (fundo Preto Profundo, pontos em Ciano que clareiam para Off-white nas luzes). Assim fotos
 * tiradas de qualquer jeito ficam com a mesma cara.
 *
 * Fontes (as mesmas que o Estúdio já usava em "Buscar mídias online" e "Gerenciar foto"):
 * foto enviada pela pessoa, Deezer, Wikimedia Commons e Wikipédia. Os bancos de imagem genéricos
 * (Unsplash) ficam fora: não são fotos do artista.
 *
 * Chaves: `show:<id>` (foto da memória da pessoa) e `artista:<id>` (foto do artista, atualizada pelo admin).
 * Nesta prévia as fotos ficam no IndexedDB do navegador; no site final, num armazenamento de arquivos de B.
 */

export const LARGURA = 640;
export const ALTURA = 800;

export interface FotoSalva {
  url: string; // data URL JPEG já tratada
  origem: 'upload' | 'busca' | 'admin';
  fonte?: string; // ex.: "Deezer Oficial", "Wikimedia Commons", "Sua foto"
  em: number;
}

/* IndexedDB -------------------------------------------------------------------------- */

const BANCO = 'livvo_final_fotos';
const LOJA = 'fotos';

let bancoP: Promise<IDBDatabase> | null = null;
const abrir = (): Promise<IDBDatabase> => {
  if (!bancoP) {
    bancoP = new Promise((ok, erro) => {
      const req = indexedDB.open(BANCO, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(LOJA);
      req.onsuccess = () => ok(req.result);
      req.onerror = () => erro(req.error);
    });
  }
  return bancoP;
};

const tx = async <T,>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await abrir();
  return new Promise((ok, erro) => {
    const r = fn(db.transaction(LOJA, modo).objectStore(LOJA));
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
};

/* Índice em memória (só as chaves) + cache dos valores pedidos -------------------------- */

let chaves: Set<string> | null = null;
let chavesP: Promise<Set<string>> | null = null;
const cache = new Map<string, FotoSalva | null>();
const ouvintes = new Set<() => void>();
const avisarMudanca = () => ouvintes.forEach((f) => f());

const carregarChaves = (): Promise<Set<string>> => {
  if (chaves) return Promise.resolve(chaves);
  if (!chavesP) {
    chavesP = tx('readonly', (s) => s.getAllKeys())
      .then((ks) => {
        chaves = new Set(ks.map(String));
        avisarMudanca();
        return chaves;
      })
      .catch(() => {
        chaves = new Set();
        return chaves;
      });
  }
  return chavesP;
};

export const lerFoto = async (chave: string): Promise<FotoSalva | null> => {
  if (cache.has(chave)) return cache.get(chave)!;
  const ks = await carregarChaves();
  if (!ks.has(chave)) return null;
  const v = ((await tx('readonly', (s) => s.get(chave)).catch(() => undefined)) as FotoSalva | undefined) || null;
  cache.set(chave, v);
  return v;
};

export const salvarFoto = async (chave: string, foto: FotoSalva) => {
  await tx('readwrite', (s) => s.put(foto, chave));
  (await carregarChaves()).add(chave);
  cache.set(chave, foto);
  avisarMudanca();
};

export const removerFoto = async (chave: string) => {
  await tx('readwrite', (s) => s.delete(chave));
  (await carregarChaves()).delete(chave);
  cache.set(chave, null);
  avisarMudanca();
};

/** Remove todas as fotos de artista (as das memórias da pessoa ficam). */
export const removerFotosDeArtista = async (): Promise<number> => {
  const ks = Array.from(await carregarChaves()).filter((k) => k.startsWith('artista:'));
  for (const k of ks) await removerFoto(k);
  return ks.length;
};

export const contarFotos = async (prefixo: string): Promise<number> =>
  Array.from(await carregarChaves()).filter((k) => k.startsWith(prefixo)).length;

export const temFoto = async (chave: string) => (await carregarChaves()).has(chave);

/** Foto de uma chave, atualizada quando ela muda. */
export const useFoto = (chave: string | undefined): FotoSalva | null => {
  const [foto, setFoto] = useState<FotoSalva | null>(() => (chave && cache.has(chave) ? cache.get(chave)! : null));
  useEffect(() => {
    if (!chave) {
      setFoto(null);
      return;
    }
    let vivo = true;
    const atualizar = () => {
      lerFoto(chave)
        .then((f) => vivo && setFoto(f))
        .catch(() => undefined);
    };
    atualizar();
    ouvintes.add(atualizar);
    return () => {
      vivo = false;
      ouvintes.delete(atualizar);
    };
  }, [chave]);
  return foto;
};

/* Tratamento padrão: corte 4:5 + halftone nas cores da marca ---------------------------- */

const carregarImagem = (src: string): Promise<HTMLImageElement> =>
  new Promise((ok, erro) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error('imagem'));
    img.src = src;
  });

/** Endereço externo passa pelo /api/foto (mesmo domínio), para o canvas poder ler os pixels. */
const viaServidor = (url: string) => (/^(data:|blob:|\/)/.test(url) ? url : `/api/foto?url=${encodeURIComponent(url)}`);

const lerArquivo = (file: Blob): Promise<string> =>
  new Promise((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => erro(r.error);
    r.readAsDataURL(file);
  });

const CIANO = [79, 220, 222];
const OFFWHITE = [236, 229, 209];
const FUNDO = '#100C1F';

/**
 * Aplica o padrão Livvo a uma imagem (arquivo ou endereço) e devolve um JPEG 640 × 800 em data URL.
 * Corte: centralizado, puxado para cima (rostos costumam ficar no terço superior).
 */
export const padronizar = async (origem: Blob | string): Promise<string> => {
  const src = typeof origem === 'string' ? viaServidor(origem) : await lerArquivo(origem);
  const img = await carregarImagem(src);

  // 1. Recorte 4:5 numa tela pequena para medir a luz de cada célula da retícula
  const celula = 7;
  const cols = Math.ceil(LARGURA / celula);
  const lins = Math.ceil(ALTURA / celula);
  const medida = document.createElement('canvas');
  medida.width = cols;
  medida.height = lins;
  const m = medida.getContext('2d', { willReadFrequently: true });
  if (!m) throw new Error('canvas');
  const alvo = LARGURA / ALTURA;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  if (sw / sh > alvo) {
    sw = sh * alvo;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw / alvo;
    sy = (img.naturalHeight - sh) * 0.3;
  }
  m.drawImage(img, sx, sy, sw, sh, 0, 0, cols, lins);
  const px = m.getImageData(0, 0, cols, lins).data; // lança erro se a imagem não for liberada (CORS)

  // 2. Luminância com contraste automático (níveis entre os percentis 3 e 97)
  const lum = new Float32Array(cols * lins);
  for (let i = 0; i < lum.length; i++) lum[i] = (0.2126 * px[i * 4]! + 0.7152 * px[i * 4 + 1]! + 0.0722 * px[i * 4 + 2]!) / 255;
  const ord = Array.from(lum).sort((a, b) => a - b);
  const baixo = ord[Math.floor(ord.length * 0.03)] ?? 0;
  const alto = ord[Math.floor(ord.length * 0.97)] ?? 1;
  const faixa = Math.max(0.08, alto - baixo);

  // 3. Desenho: fundo Preto Profundo, pontos em Ciano que clareiam para Off-white nas luzes
  const out = document.createElement('canvas');
  out.width = LARGURA;
  out.height = ALTURA;
  const c = out.getContext('2d');
  if (!c) throw new Error('canvas');
  c.fillStyle = FUNDO;
  c.fillRect(0, 0, LARGURA, ALTURA);
  const rMax = celula * 0.62;
  for (let y = 0; y < lins; y++) {
    for (let x = 0; x < cols; x++) {
      const v = Math.min(1, Math.max(0, (lum[y * cols + x]! - baixo) / faixa));
      const t = Math.pow(v, 1.15);
      const r = rMax * Math.sqrt(t);
      if (r < 0.35) continue;
      const k = Math.max(0, (t - 0.55) / 0.45); // só as luzes viram Off-white
      const cor = CIANO.map((ci, i) => Math.round(ci + (OFFWHITE[i]! - ci) * k));
      c.fillStyle = `rgb(${cor[0]},${cor[1]},${cor[2]})`;
      c.beginPath();
      c.arc(x * celula + celula / 2, y * celula + celula / 2, r, 0, Math.PI * 2);
      c.fill();
    }
  }
  return out.toDataURL('image/jpeg', 0.84);
};

/* Fontes de foto do artista (mesmo método do Estúdio) --------------------------------------- */

export interface OpcaoFoto {
  url: string;
  miniatura: string;
  fonte: string;
}

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]/g, '');

const QUALIFICADOR_MUSICAL = /band|banda|singer|cantor|cantora|musician|m[uú]sic|rapper|grupo|group|duo|dupla|\bdj\b|compositor|songwriter/i;

/** Imagem vazia do Deezer (silhueta cinza): o hash é o MD5 de texto vazio. */
const ehSemFoto = (url: string) => /\/artist\/(d41d8cd98f00b204e9800998ecf8427e)?\//i.test(url);

/**
 * Fotos do artista nas fontes do Estúdio (Deezer, Wikimedia Commons, Wikipédia), sem os bancos genéricos.
 * Só entram fotos que são mesmo do artista: no Deezer e na Wikipédia, nome igual ao do catálogo
 * (a busca do Deezer devolve também "Oasis Gospel", "Oasis Acoustic"...); no Wikimedia, arquivo com o
 * nome do artista no título.
 */
export const buscarFotosDoArtista = async (nome: string, fotoCatalogo?: string): Promise<OpcaoFoto[]> => {
  const alvo = normalizar(nome);
  const lista: OpcaoFoto[] = [];
  if (fotoCatalogo && !ehSemFoto(fotoCatalogo)) lista.push({ url: fotoCatalogo, miniatura: fotoCatalogo, fonte: 'Deezer Oficial' });
  const res = await searchArtistMedia(nome).catch(() => null);
  // Homônimos no Deezer (vários "Oasis"): o servidor põe o de mais fãs primeiro; só ele entra
  let deezerAceito = false;
  res?.photos
    .filter((p) => !/acervo|unsplash/i.test(p.source) && !/unsplash\.com/i.test(p.url) && !ehSemFoto(p.url))
    .filter((p) => {
      if (/deezer/i.test(p.source)) {
        if (deezerAceito || normalizar(p.title.replace(/\s*\(Deezer.*\)\s*$/i, '')) !== alvo) return false;
        deezerAceito = true;
        return true;
      }
      if (/wikip/i.test(p.source)) {
        // Busca direta na Wikipédia (sem descrição da página): só com qualificador musical, ex. "Oasis (band)"
        const t = p.title.replace(/\s*-\s*Foto Oficial\s*$/i, '');
        const q = /\(([^)]*)\)\s*$/.exec(t)?.[1] || '';
        return QUALIFICADOR_MUSICAL.test(q) && normalizar(t.replace(/\s*\([^)]*\)/g, '')) === alvo;
      }
      if (/wikimedia/i.test(p.source)) {
        const i = p.title.indexOf(' - ');
        if (i < 0) return normalizar(p.title.replace(/\s*\([^)]*\)/g, '')) === alvo; // retrato do servidor (já filtrado por descrição)
        return normalizar(p.title.slice(i + 3)).includes(alvo); // foto de show: nome do artista no arquivo
      }
      return false;
    })
    .forEach((p) => {
      if (!lista.some((o) => o.url === p.url)) lista.push({ url: p.url, miniatura: p.thumbUrl || p.url, fonte: p.source });
    });
  return lista.slice(0, 12);
};

/** Melhor foto do artista para a atualização em lote: catálogo → /api/artist-search (só nome exato). Lança erro se a busca falhar. */
export const melhorFotoDoArtista = async (nome: string, fotoCatalogo?: string): Promise<{ url: string; fonte: string } | null> => {
  if (fotoCatalogo && !ehSemFoto(fotoCatalogo)) return { url: fotoCatalogo, fonte: 'Deezer Oficial' };
  // Falha de rede vira erro (não "sem foto"), para o admin saber que vale tentar de novo
  const r = await fetch(`/api/artist-search?q=${encodeURIComponent(nome)}`);
  if (!r.ok) throw new Error('busca');
  const d = await r.json();
  if (!d.bestPhotoUrl) return null;
  const s = (d.artists || []).find((a: { photoUrl?: string }) => a.photoUrl === d.bestPhotoUrl)?.source;
  return { url: d.bestPhotoUrl, fonte: s === 'wikimedia' ? 'Wikimedia Commons' : 'Deezer Oficial' };
};
