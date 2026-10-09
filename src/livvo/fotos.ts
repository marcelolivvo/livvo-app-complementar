import { useEffect, useState } from 'react';
import { searchArtistMedia } from '../services/artistPhotoService';

/**
 * Fotos do Livvo final: pôsteres e ingressos com foto padronizada.
 *
 * Padrão (decisões do Edmir em 07/10/2026): toda foto, venha de onde vier, passa pelo mesmo tratamento
 * antes de entrar num pôster ou ingresso: corte 4:5 e duotone suave nas cores da marca (sombras em
 * Preto Profundo, meios-tons em Teal, luzes em Off-white), mantendo os detalhes da imagem, com uma
 * textura leve de retícula por cima (no CSS). Assim fotos tiradas de qualquer jeito ficam com a mesma cara.
 *
 * Foto automática: todo artista busca sozinho a foto principal (`/api/foto-artista`), exibida com o
 * mesmo duotone por um filtro SVG (`#lv-duotone`, em AppShell). Prioridade no pôster: foto da pessoa
 * (memória) → foto definida pelo admin → foto automática → pôster gerado pelos dados.
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

/** Versão do tratamento. Fotos salvas com o halftone antigo (sem `v`) são ignoradas. */
export const VERSAO_TRATAMENTO = 2;

export interface FotoSalva {
  v?: number;
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
  const bruto = ((await tx('readonly', (s) => s.get(chave)).catch(() => undefined)) as FotoSalva | undefined) || null;
  const v = bruto && bruto.v === VERSAO_TRATAMENTO ? bruto : null;
  cache.set(chave, v);
  return v;
};

export const salvarFoto = async (chave: string, dados: FotoSalva) => {
  const foto = { ...dados, v: VERSAO_TRATAMENTO };
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

/** Mapa de cores do duotone suave (luminância 0 → 1). Igual ao filtro SVG `#lv-duotone`. */
export const MAPA_DUOTONE: Array<[number, number, number]> = [
  [16, 12, 31], // Preto Profundo
  [26, 44, 64],
  [40, 116, 128],
  [112, 198, 196],
  [236, 229, 209], // Off-white
];

/**
 * Duotone das PESSOAS (fãs, usuários e a sua foto), decisão do Edmir de 09/10/2026: o mesmo tratamento dos
 * artistas, mas do Preto Profundo direto ao Ciano #4FDCDE, sem o creme. Artista = pôster (creme); fã = plateia
 * na luz do palco (ciano). Igual ao filtro SVG `#lv-duotone-pessoa`.
 */
export const MAPA_DUOTONE_PESSOA: Array<[number, number, number]> = [
  [16, 12, 31], // Preto Profundo
  [18, 38, 60],
  [28, 104, 122],
  [79, 220, 222], // Ciano
  [196, 246, 244],
];

type Mapa = Array<[number, number, number]>;

/** Valores `tableValues` do filtro SVG para um canal (0 = R, 1 = G, 2 = B). */
export const tabelaDuotone = (canal: 0 | 1 | 2, mapa: Mapa = MAPA_DUOTONE) => mapa.map((c) => (c[canal] / 255).toFixed(3)).join(' ');

const corDuotone = (l: number, mapa: Mapa = MAPA_DUOTONE): [number, number, number] => {
  const x = Math.min(1, Math.max(0, l)) * (mapa.length - 1);
  const i = Math.min(mapa.length - 2, Math.floor(x));
  const t = x - i;
  const a = mapa[i]!;
  const b = mapa[i + 1]!;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
};

/** Aplica o duotone suave numa área do canvas (com contraste automático leve, sem esmagar detalhes). */
export const aplicarDuotone = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mapa: Mapa = MAPA_DUOTONE) => {
  const img = ctx.getImageData(x, y, w, h); // lança erro se a imagem não for liberada (CORS)
  const d = img.data;
  const n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = (0.2126 * d[i * 4]! + 0.7152 * d[i * 4 + 1]! + 0.0722 * d[i * 4 + 2]!) / 255;
  // níveis entre os percentis 1 e 99, só para fotos muito lavadas ou muito escuras
  const amostra = Array.from(lum.filter((_, i) => i % 7 === 0)).sort((a, b) => a - b);
  const baixo = amostra[Math.floor(amostra.length * 0.01)] ?? 0;
  const alto = amostra[Math.floor(amostra.length * 0.99)] ?? 1;
  const faixa = Math.max(0.35, alto - baixo);
  for (let i = 0; i < n; i++) {
    const c = corDuotone((lum[i]! - baixo) / faixa, mapa);
    d[i * 4] = c[0];
    d[i * 4 + 1] = c[1];
    d[i * 4 + 2] = c[2];
  }
  ctx.putImageData(img, x, y);
};

/** Recorte 4:5 centralizado, puxado para cima (rostos costumam ficar no terço superior). */
export const recorte45 = (larg: number, alt: number) => {
  const alvo = LARGURA / ALTURA;
  let sw = larg;
  let sh = alt;
  let sx = 0;
  let sy = 0;
  if (sw / sh > alvo) {
    sw = sh * alvo;
    sx = (larg - sw) / 2;
  } else {
    sh = sw / alvo;
    sy = (alt - sh) * 0.3;
  }
  return { sx, sy, sw, sh };
};

export const carregarParaCanvas = async (origem: Blob | string): Promise<HTMLImageElement> =>
  carregarImagem(typeof origem === 'string' ? viaServidor(origem) : await lerArquivo(origem));

/**
 * Aplica o padrão Livvo a uma imagem (arquivo ou endereço) e devolve um JPEG 640 × 800 em data URL:
 * corte 4:5 e duotone suave nas cores da marca.
 */
export const padronizar = async (origem: Blob | string): Promise<string> => {
  const img = await carregarParaCanvas(origem);
  const out = document.createElement('canvas');
  out.width = LARGURA;
  out.height = ALTURA;
  const c = out.getContext('2d', { willReadFrequently: true });
  if (!c) throw new Error('canvas');
  const { sx, sy, sw, sh } = recorte45(img.naturalWidth, img.naturalHeight);
  c.drawImage(img, sx, sy, sw, sh, 0, 0, LARGURA, ALTURA);
  aplicarDuotone(c, 0, 0, LARGURA, ALTURA);
  return out.toDataURL('image/jpeg', 0.86);
};

/* Foto automática do artista ------------------------------------------------------------ */

const CHAVE_AUTO = 'livvo_fotos_auto_v1';
const VALIDADE_AUTO = 3 * 24 * 3600 * 1000;
type Auto = { url: string | null; fonte: string | null; em: number };
let autoGuardadas: Record<string, Auto> | null = null;
const lerAuto = (): Record<string, Auto> => {
  if (autoGuardadas) return autoGuardadas;
  try {
    autoGuardadas = JSON.parse(localStorage.getItem(CHAVE_AUTO) || '{}') as Record<string, Auto>;
  } catch {
    autoGuardadas = {};
  }
  return autoGuardadas;
};
const gravarAuto = (nome: string, a: Auto) => {
  const todas = lerAuto();
  todas[nome] = a;
  try {
    localStorage.setItem(CHAVE_AUTO, JSON.stringify(todas));
  } catch {
    /* sem espaço: fica só nesta sessão */
  }
};

const pedidosAuto = new Map<string, Promise<Auto | null>>();
let emAndamento = 0;
const fila: Array<() => void> = [];
const comVaga = <T,>(fn: () => Promise<T>): Promise<T> =>
  new Promise((ok, erro) => {
    const rodar = () => {
      emAndamento++;
      fn()
        .then(ok, erro)
        .finally(() => {
          emAndamento--;
          fila.shift()?.();
        });
    };
    if (emAndamento < 4) rodar();
    else fila.push(rodar);
  });

/** Foto principal do artista (Deezer ou Wikimedia, só o artista certo), com cache no navegador. */
export const fotoAutomatica = (nome: string): Promise<Auto | null> => {
  const chave = nome.trim().toLowerCase();
  const guardada = lerAuto()[chave];
  if (guardada && Date.now() - guardada.em < VALIDADE_AUTO) return Promise.resolve(guardada);
  let p = pedidosAuto.get(chave);
  if (!p) {
    p = comVaga(async () => {
      const r = await fetch(`/api/foto-artista?nome=${encodeURIComponent(nome)}`);
      if (!r.ok) return null; // falha de rede: tenta de novo numa próxima visita
      const d = (await r.json()) as { url: string | null; fonte: string | null };
      const a: Auto = { url: d.url && !ehSemFoto(d.url) ? d.url : null, fonte: d.fonte, em: Date.now() };
      gravarAuto(chave, a);
      return a;
    }).catch(() => null);
    pedidosAuto.set(chave, p);
  }
  return p;
};

export const useFotoAutomatica = (nome: string | undefined, ativo = true): Auto | null => {
  const chave = nome?.trim().toLowerCase();
  const [a, setA] = useState<Auto | null>(() => (chave ? lerAuto()[chave] || null : null));
  useEffect(() => {
    if (!nome || !ativo) return;
    let vivo = true;
    fotoAutomatica(nome).then((r) => vivo && setA(r));
    return () => {
      vivo = false;
    };
  }, [nome, ativo]);
  return a;
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
