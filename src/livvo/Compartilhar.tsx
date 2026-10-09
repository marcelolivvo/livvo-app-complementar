import React, { useEffect, useRef, useState } from 'react';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
import type { Show } from './data/catalog';
import { MAPA_DUOTONE_PESSOA, aplicarDuotone, carregarParaCanvas, recorte45 } from './fotos';
import { dataCartao, dataLonga, nomeArquivoShow, nota } from './format';
import { PERSONALIZACAO_PADRAO, personalizacaoDe, type Memoria, type Personalizacao } from './store';
import {
  CARIMBOS,
  COR_DESTAQUE,
  ESCALA_TAMANHO,
  ESTRELA,
  FAMILIA_FONTE,
  INGRESSO_ESTRELA,
  INGRESSO_PICOTE,
  avisar,
  fotoDaPessoa,
  linhaDetalhes,
  nomeAceitaRaydis,
  paletaDoArtista,
  useImagemDoPoster,
  type DetalhesCard,
} from './ui';
import { CAMINHO_INGRESSO, H as H_ING, RECORTE_R, RECORTE_X, W as W_ING, tamanhoNomeIngresso } from './Ingresso';
import { hash } from './format';

/**
 * Compartilhar uma memória (decisões de 07/10/2026): Instagram (Stories e Feed), Facebook, WhatsApp e link.
 *
 * O site não consegue postar direto no Instagram: o Livvo gera a imagem pronta (1080 × 1920 para Stories,
 * 1080 × 1350 para Feed) com o pôster, o logo, o @ da pessoa, as notas e o endereço do site. No celular
 * abre o menu do aparelho (a pessoa escolhe o Instagram); no computador a imagem é baixada.
 * O Facebook abre a janela de compartilhar com o link do show.
 */

type Formato = 'stories' | 'feed';

/** Marcas dos destinos (o Lucide 1.x não tem ícones de marca), no mesmo traço dos ícones Lucide. */
const Instagram: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);
const Facebook: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M13.5 21v-7.5H16l.5-3h-3V9c0-.9.4-1.5 1.6-1.5H16.6V5a12 12 0 0 0-2-.2c-2 0-3.6 1.2-3.6 3.6v2.1H8.6v3H11V21" />
  </svg>
);
type Imagem = { url: string; tratada: boolean } | null;

const INK = '#100C1F';
const CIANO = '#4FDCDE';
const TEAL = '#2FB8BA';
const OFF = '#ECE5D1';
const AMARELO = '#FFD60A';
const SITE = 'livvomusic.com.br';

const carregar = (src: string) =>
  new Promise<HTMLImageElement>((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => erro(new Error('imagem'));
    i.src = src;
  });

const retArredondado = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};

/** Quebra o nome do artista em até 3 linhas, diminuindo a fonte até caber. */
const fonteCanvas = (perso: Personalizacao, nome: string, t: number) => {
  const f = perso.fonte === 'raydis' && !nomeAceitaRaydis(nome) ? 'alfa' : perso.fonte;
  const peso = f === 'alfa' ? 400 : f === 'raydis' ? 700 : 800;
  return { css: `${peso} ${t}px ${FAMILIA_FONTE[f]}`, caixaAlta: f === 'barlow' };
};

/** Quebra o nome do artista palavra por palavra (nunca no meio da palavra), diminuindo a fonte até caber. */
const linhasDoNome = (
  c: CanvasRenderingContext2D,
  nome: string,
  largura: number,
  tamanhoInicial: number,
  perso: Personalizacao = PERSONALIZACAO_PADRAO,
  maxLinhas = 3,
) => {
  const texto = fonteCanvas(perso, nome, 10).caixaAlta ? nome.toUpperCase() : nome;
  for (let t = tamanhoInicial; t >= 24; t -= 3) {
    c.font = fonteCanvas(perso, nome, t).css;
    const palavras = texto.split(/\s+/);
    const linhas: string[] = [];
    let atual = '';
    let coube = true;
    for (const p of palavras) {
      const teste = atual ? `${atual} ${p}` : p;
      if (c.measureText(teste).width <= largura) atual = teste;
      else {
        if (!atual || c.measureText(p).width > largura) {
          coube = false;
          break;
        }
        linhas.push(atual);
        atual = p;
      }
    }
    if (atual) linhas.push(atual);
    if (coube && linhas.length <= maxLinhas && linhas.every((l) => c.measureText(l).width <= largura)) return { linhas, tamanho: t };
  }
  c.font = fonteCanvas(perso, nome, 24).css;
  return { linhas: texto.split(/\s+/), tamanho: 24 };
};

/** Carimbo de presença no canvas (mesmo desenho do componente Carimbo). */
const desenharCarimbo = (c: CanvasRenderingContext2D, tipo: Personalizacao['carimbo'], cx: number, cy: number, escala: number, angulo = -12) => {
  if (tipo === 'nenhum') return;
  const k = CARIMBOS[tipo];
  c.save();
  c.translate(cx, cy);
  c.rotate((angulo * Math.PI) / 180);
  const ft = Math.round(34 * escala);
  const fs = Math.round(17 * escala);
  c.font = `800 ${ft}px Barlow, sans-serif`;
  const l1 = c.measureText(k.titulo.split('').join('\u200A')).width;
  c.font = `700 ${fs}px Barlow, sans-serif`;
  const l2 = c.measureText(k.sub.toUpperCase()).width;
  const w = Math.max(l1, l2) + 40 * escala;
  const h = ft + fs + 34 * escala;
  c.fillStyle = 'rgba(16,12,31,0.78)';
  retArredondado(c, -w / 2, -h / 2, w, h, 10 * escala);
  c.fill();
  c.setLineDash([10 * escala, 7 * escala]);
  c.strokeStyle = k.cor;
  c.lineWidth = 4 * escala;
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = k.cor;
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.font = `800 ${ft}px Barlow, sans-serif`;
  c.fillText(k.titulo, 0, -h / 2 + 13 * escala);
  c.font = `700 ${fs}px Barlow, sans-serif`;
  c.fillText(k.sub.toUpperCase(), 0, -h / 2 + 13 * escala + ft + 6 * escala);
  c.restore();
};

/** Pôster do show desenhado no canvas (mesma regra visual do componente Poster). */
const desenharPoster = async (
  c: CanvasRenderingContext2D,
  show: Pick<Show, 'artista' | 'artistaId' | 'casa' | 'uf' | 'ts'>,
  imagem: Imagem,
  usuario: string,
  x: number,
  y: number,
  w: number,
  h: number,
  perso: Personalizacao = PERSONALIZACAO_PADRAO,
  detalhes?: DetalhesCard,
) => {
  const p = paletaDoArtista(show.artistaId || show.artista);
  const dest = COR_DESTAQUE[perso.cor];
  c.save();
  retArredondado(c, x, y, w, h, 26);
  c.clip();
  let comFoto = false;
  if (imagem) {
    try {
      const img = await carregarParaCanvas(imagem.url);
      const { sx, sy, sw, sh } = recorte45(img.naturalWidth, img.naturalHeight);
      c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      if (!imagem.tratada) aplicarDuotone(c, x, y, w, h);
      comFoto = true;
    } catch {
      comFoto = false; // fonte não liberou a foto: usa o pôster gerado
    }
  }
  const bg = comFoto ? INK : p.bg;
  const acc = comFoto ? CIANO : p.acc;
  const fg = comFoto ? OFF : p.fg;
  if (!comFoto) {
    c.fillStyle = bg;
    c.fillRect(x, y, w, h);
    // "sol" halftone do pôster gerado
    const hs = hash(show.artistaId || show.artista);
    const cx = x + w * ((55 + (hs % 35)) / 100);
    const cy = y + h * ((-42 + ((hs >>> 6) % 30)) / 100) + w * 0.65;
    const passo = w * 0.026;
    const raio = w * 0.65;
    c.fillStyle = acc;
    for (let py = y; py < y + h; py += passo) {
      for (let px = x; px < x + w; px += passo) {
        const dist = Math.hypot(px - cx, py - cy) / raio;
        const k = dist < 0.4 ? 1 : dist < 0.98 ? 1 - (dist - 0.4) / 0.58 : 0;
        if (k <= 0.02) continue;
        c.beginPath();
        c.arc(px + passo / 2, py + passo / 2, passo * 0.36 * Math.sqrt(k), 0, Math.PI * 2);
        c.fill();
      }
    }
  } else {
    // textura leve de retícula e escurecido em cima e embaixo
    c.fillStyle = 'rgba(16,12,31,0.22)';
    const passo = w * 0.014;
    for (let py = y; py < y + h; py += passo) for (let px = x; px < x + w; px += passo) c.fillRect(px, py, 1.4, 1.4);
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(16,12,31,0.6)');
    g.addColorStop(0.26, 'rgba(16,12,31,0)');
    g.addColorStop(0.5, 'rgba(16,12,31,0)');
    g.addColorStop(0.94, 'rgba(16,12,31,0.9)');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
  }
  // logo + @
  const m = w * 0.055;
  try {
    const logo = await carregar('/livvo/livvo-icon-256.png');
    c.drawImage(logo, x + m, y + m, w * 0.15, w * 0.15);
  } catch {
    /* sem logo: segue */
  }
  c.textBaseline = 'top';
  c.textAlign = 'left';
  let yTopo = y + m + w * 0.165;
  if (perso.mostrarUsuario && usuario) {
    c.fillStyle = CIANO;
    c.font = `700 ${Math.round(w * 0.036)}px Barlow, sans-serif`;
    c.fillText(`@${usuario}`, x + m, yTopo);
    yTopo += w * 0.05;
  }
  if (perso.frase.trim()) {
    c.fillStyle = dest;
    c.font = `700 ${Math.round(w * 0.033)}px Barlow, sans-serif`;
    c.fillText(perso.frase.trim().toUpperCase(), x + m, yTopo + w * 0.006);
  }
  // data e UF
  const d = dataCartao(show.ts);
  c.textAlign = 'right';
  c.fillStyle = fg;
  c.font = `700 ${Math.round(w * 0.11)}px RAYDIS, "Alfa Slab One", sans-serif`;
  c.fillText(d.dia, x + w - m, y + m);
  c.font = `700 ${Math.round(w * 0.044)}px Barlow, sans-serif`;
  c.fillText(`${d.mes} ${d.ano}`.toUpperCase(), x + w - m, y + m + w * 0.115);
  c.fillText(show.uf.toUpperCase(), x + w - m, y + m + w * 0.17);
  // nome, traço, casa e detalhes (posição: em cima, no meio ou embaixo)
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const base = Math.round(w * 0.16 * ESCALA_TAMANHO[perso.tamanho]);
  const { linhas, tamanho } = linhasDoNome(c, show.artista, w - 2 * m, base, perso);
  const faixa = perso.faixa.trim();
  const extra = linhaDetalhes(perso, detalhes);
  const fsCasa = Math.round(w * 0.042);
  const fsExtra = Math.round(w * 0.036);
  const altNome = linhas.length * tamanho * 0.98;
  const altBloco = altNome + w * 0.045 + (perso.mostrarCasa ? fsCasa * 1.4 : 0) + (faixa ? fsExtra * 1.45 : 0) + (extra ? fsExtra * 1.45 : 0);
  const topoBloco =
    perso.posicao === 'cima' ? y + w * 0.4 : perso.posicao === 'meio' ? y + h * 0.58 - altBloco / 2 : y + h - m - altBloco;
  c.font = fonteCanvas(perso, show.artista, tamanho).css;
  c.fillStyle = fg;
  linhas.forEach((l, i) => c.fillText(l, x + m, topoBloco + tamanho * 0.82 + i * tamanho * 0.98));
  let yy = topoBloco + altNome + w * 0.012;
  c.fillStyle = dest;
  c.fillRect(x + m, yy, w * 0.16, Math.max(3, w * 0.009));
  yy += w * 0.03;
  c.textBaseline = 'top';
  if (perso.mostrarCasa) {
    c.font = `600 ${fsCasa}px Barlow, sans-serif`;
    c.fillStyle = dest;
    c.fillText(show.casa.toUpperCase().slice(0, 40), x + m, yy);
    yy += fsCasa * 1.4;
  }
  c.font = `600 ${fsExtra}px Barlow, sans-serif`;
  c.fillStyle = fg;
  if (faixa) {
    c.fillText(`\u266A ${faixa}`, x + m, yy);
    yy += fsExtra * 1.45;
  }
  if (extra) c.fillText(extra, x + m, yy);
  // carimbo de presença
  if (perso.carimbo !== 'nenhum') {
    const cyC = perso.posicao === 'baixo' ? y + w * 0.44 : y + h - w * 0.16;
    desenharCarimbo(c, perso.carimbo, x + w - m - w * 0.26, cyC, w / 820);
  }
  c.restore();
};

/** Um ingresso de nota (mesmo desenho do componente de notas): Teal, apagado ou metade esquerda Teal. */
const desenharIngresso = (c: CanvasRenderingContext2D, x: number, y: number, escala: number, fill: 0 | 0.5 | 1) => {
  const tracar = (cor: string) => {
    c.save();
    c.strokeStyle = cor;
    c.lineWidth = 1.7;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.save();
    c.translate(12, 12);
    c.rotate((-45 * Math.PI) / 180);
    c.translate(-12, -12);
    c.stroke(new Path2D(INGRESSO_ESTRELA));
    c.stroke(new Path2D(INGRESSO_PICOTE));
    c.restore();
    c.lineWidth = 1.5;
    c.stroke(new Path2D(ESTRELA));
    c.restore();
  };
  c.save();
  c.translate(x, y);
  c.scale(escala, escala);
  if (fill === 1) tracar(TEAL);
  else {
    tracar('#3A3159');
    if (fill === 0.5) {
      c.save();
      c.beginPath();
      c.rect(0, 0, 12, 24);
      c.clip();
      tracar(TEAL);
      c.restore();
    }
  }
  c.restore();
};

/** Nota na imagem de compartilhar (09/10/2026): um ingresso e o número ao lado. Só é chamada quando há nota. */
const desenharNota = (c: CanvasRenderingContext2D, rotulo: string, valor: number, x: number, y: number) => {
  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.fillStyle = '#B3AE9F';
  c.font = '600 30px Barlow, sans-serif';
  c.fillText(rotulo.toUpperCase().split('').join(' '), x, y);
  desenharIngresso(c, x, y + 40, 2.6, 1);
  c.fillStyle = AMARELO;
  c.font = '700 64px RAYDIS, "Alfa Slab One", sans-serif';
  c.fillText(nota(valor), x + 64 + 14, y + 52);
};

/** Largura ocupada por `desenharNota` (rótulo ou ingresso + número, o que for maior). */
const larguraNota = (c: CanvasRenderingContext2D, rotulo: string, valor: number) => {
  c.font = '600 30px Barlow, sans-serif';
  const wRotulo = c.measureText(rotulo.toUpperCase().split('').join(' ')).width;
  c.font = '700 64px RAYDIS, "Alfa Slab One", sans-serif';
  return Math.max(wRotulo, 64 + 14 + c.measureText(nota(valor)).width);
};

const garantirFontes = async () => {
  try {
    await Promise.all([
      document.fonts.load('400 80px "Alfa Slab One"'),
      document.fonts.load('700 80px RAYDIS'),
      document.fonts.load('500 30px Barlow'),
      document.fonts.load('600 30px Barlow'),
      document.fonts.load('700 30px Barlow'),
    ]);
  } catch {
    /* sem as fontes: o canvas usa as alternativas */
  }
};

/** Ingresso da memória desenhado no canvas (mesmo desenho do componente IngressoMemoria, 960 × 352). */
const desenharIngressoMemoria = async (
  c: CanvasRenderingContext2D,
  show: Pick<Show, 'artista' | 'artistaId' | 'casa' | 'cidade' | 'uf' | 'ts'>,
  imagem: Imagem,
  usuario: string,
  memoria: Pick<Memoria, 'notaShow'>,
  perso: Personalizacao,
  detalhes: DetalhesCard | undefined,
  x: number,
  y: number,
  k: number,
) => {
  const dest = COR_DESTAQUE[perso.cor];
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  const contorno = new Path2D(CAMINHO_INGRESSO);
  c.fillStyle = INK;
  c.fill(contorno);
  // canhoto com foto
  const fx = 16;
  const fy = 16;
  const fw = RECORTE_X - 40;
  const fh = H_ING - 32;
  c.save();
  retArredondado(c, fx, fy, fw, fh, 12);
  c.clip();
  c.fillStyle = '#171226';
  c.fillRect(fx, fy, fw, fh);
  let temFoto = false;
  if (imagem) {
    try {
      const img = await carregarParaCanvas(imagem.url);
      temFoto = true;
      const r = fw / fh;
      const ir = img.naturalWidth / img.naturalHeight;
      const sw = ir > r ? img.naturalHeight * r : img.naturalWidth;
      const sh = ir > r ? img.naturalHeight : img.naturalWidth / r;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = Math.max(0, (img.naturalHeight - sh) * 0.28);
      c.drawImage(img, sx, sy, sw, sh, fx, fy, fw, fh);
      // o duotone trabalha em pixels reais do canvas
      if (!imagem.tratada) {
        const t = c.getTransform();
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        aplicarDuotone(c, t.e + fx * t.a, t.f + fy * t.d, fw * t.a, fh * t.d);
        c.restore();
      }
    } catch {
      /* sem foto: fica o fundo */
    }
  }
  if (!temFoto) {
    // sem foto liberada: retícula Teal, como no pôster gerado
    c.fillStyle = TEAL;
    for (let py = fy; py < fy + fh; py += 9) {
      for (let px = fx; px < fx + fw; px += 9) {
        const dist = Math.hypot(px - (fx + fw * 0.7), py - (fy + fh * 0.2)) / (fw * 0.95);
        const kk = dist < 0.3 ? 1 : dist < 0.75 ? 1 - (dist - 0.3) / 0.45 : 0;
        if (kk <= 0.03) continue;
        c.beginPath();
        c.arc(px + 4.5, py + 4.5, 3.1 * Math.sqrt(kk), 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  const g = c.createLinearGradient(0, fy, 0, fy + fh);
  g.addColorStop(0, 'rgba(16,12,31,0.6)');
  g.addColorStop(0.34, 'rgba(16,12,31,0)');
  g.addColorStop(0.52, 'rgba(16,12,31,0)');
  g.addColorStop(1, 'rgba(16,12,31,0.92)');
  c.fillStyle = g;
  c.fillRect(fx, fy, fw, fh);
  c.restore();
  try {
    const logo = await carregar('/livvo/livvo-icon-256.png');
    c.drawImage(logo, fx + 14, fy + 14, 52, 52);
  } catch {
    /* segue sem logo */
  }
  c.textAlign = 'left';
  c.textBaseline = 'top';
  if (perso.mostrarUsuario && usuario) {
    c.fillStyle = CIANO;
    c.font = '700 13px Barlow, sans-serif';
    c.fillText(`@${usuario}`, fx + 14, fy + 72);
  }
  const d = dataCartao(show.ts);
  c.fillStyle = CIANO;
  c.font = '700 10.5px Barlow, sans-serif';
  c.fillText('D A T A', fx + 16, fy + fh - 66);
  c.fillStyle = OFF;
  c.font = '700 44px RAYDIS, "Alfa Slab One", sans-serif';
  c.fillText(d.dia, fx + 16, fy + fh - 52);
  const wd = c.measureText(d.dia).width;
  c.font = '700 15px Barlow, sans-serif';
  c.fillText(`${d.mes} ${d.ano}`.toUpperCase(), fx + 16 + wd + 8, fy + fh - 30);
  // contorno e picote por cima
  c.strokeStyle = TEAL;
  c.lineWidth = 3;
  c.lineJoin = 'round';
  c.stroke(contorno);
  c.setLineDash([8, 9]);
  c.beginPath();
  c.moveTo(RECORTE_X, RECORTE_R + 8);
  c.lineTo(RECORTE_X, H_ING - RECORTE_R - 8);
  c.stroke();
  c.setLineDash([]);
  // corpo
  const bx = RECORTE_X + 38;
  const bw = W_ING - bx - 34;
  c.fillStyle = dest;
  c.font = '700 12px Barlow, sans-serif';
  c.fillText((perso.frase.trim() || 'Livvo · Ingresso de memória').toUpperCase(), bx, 26);
  const { tamanho: tIni, largura } = tamanhoNomeIngresso(show.artista, perso);
  const { linhas, tamanho } = linhasDoNome(c, show.artista, largura, tIni, perso, 2);
  const faixa = perso.faixa.trim();
  const extra = linhaDetalhes(perso, detalhes);
  const altNome = linhas.length * tamanho * 1.02 + 14 + (faixa || extra ? 26 : 0);
  const areaTopo = 56;
  const areaBase = H_ING - 20 - 44 - 60;
  const topo = perso.posicao === 'cima' ? areaTopo : perso.posicao === 'meio' ? (areaTopo + areaBase - altNome) / 2 : areaBase - altNome;
  c.fillStyle = OFF;
  c.font = fonteCanvas(perso, show.artista, tamanho).css;
  c.textBaseline = 'alphabetic';
  linhas.forEach((l, i) => c.fillText(l, bx, topo + tamanho * 0.85 + i * tamanho * 1.02));
  let yy = topo + linhas.length * tamanho * 1.02 + 6;
  c.fillStyle = dest;
  c.fillRect(bx, yy, 96, 4);
  yy += 14;
  c.textBaseline = 'top';
  if (faixa || extra) {
    c.font = '600 14px Barlow, sans-serif';
    c.fillStyle = OFF;
    c.fillText([faixa ? `\u266A ${faixa}` : '', extra].filter(Boolean).join('  ·  ').slice(0, 70), bx, yy);
  }
  // local e cidade
  const ly = H_ING - 20 - 44 - 50;
  c.font = '700 10.5px Barlow, sans-serif';
  c.fillStyle = '#8A8577';
  const cx2 = perso.mostrarCasa ? bx + bw * 0.6 : bx;
  if (perso.mostrarCasa) {
    c.fillText('L O C A L', bx, ly);
    c.font = '700 17px Barlow, sans-serif';
    c.fillStyle = OFF;
    c.fillText(show.casa.slice(0, 30), bx, ly + 16);
    c.strokeStyle = '#3A3159';
    c.lineWidth = 1.5;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(cx2 - 18, ly);
    c.lineTo(cx2 - 18, ly + 38);
    c.stroke();
    c.setLineDash([]);
    c.font = '700 10.5px Barlow, sans-serif';
    c.fillStyle = '#8A8577';
  }
  c.fillText('C I D A D E', cx2, ly);
  c.font = '700 17px Barlow, sans-serif';
  c.fillStyle = dest;
  c.fillText(`${show.cidade} · ${show.uf}`.slice(0, 26), cx2, ly + 16);
  // rodapé: nota e site
  const ry = H_ING - 20 - 32;
  c.strokeStyle = '#3A3159';
  c.lineWidth = 1.5;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.moveTo(bx, ry);
  c.lineTo(bx + bw, ry);
  c.stroke();
  c.setLineDash([]);
  // 09/10/2026: um ingresso e o número; sem nota (ou com "Mostrar a nota" desligado) fica só o site
  if (perso.mostrarNota && memoria.notaShow) {
    c.font = '700 10.5px Barlow, sans-serif';
    c.fillStyle = '#8A8577';
    c.fillText('N O T A', bx, ry + 13);
    desenharIngresso(c, bx + 52, ry + 8, 0.8, 1);
    c.fillStyle = AMARELO;
    c.font = '700 18px RAYDIS, "Alfa Slab One", sans-serif';
    c.fillText(nota(memoria.notaShow), bx + 52 + 21 + 6, ry + 9);
  }
  c.textAlign = 'right';
  c.fillStyle = OFF;
  c.font = '700 12px Barlow, sans-serif';
  c.fillText(SITE, bx + bw, ry + 13);
  c.restore();
  if (perso.carimbo !== 'nenhum') desenharCarimbo(c, perso.carimbo, x + (W_ING - 30 - 110) * k, y + 52 * k, (k * 16) / 34, -8);
};

export const gerarImagem = async (opcoes: {
  show: Show;
  memoria: Memoria;
  usuario: string;
  imagem: Imagem;
  formato: Formato;
  perso?: Personalizacao;
  detalhes?: DetalhesCard;
}): Promise<Blob> => {
  const { show, memoria, usuario, imagem, formato, detalhes } = opcoes;
  const perso = opcoes.perso || personalizacaoDe(memoria);
  await garantirFontes();
  const W = 1080;
  const H = formato === 'stories' ? 1920 : 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d', { willReadFrequently: true });
  if (!c) throw new Error('canvas');
  // fundo com retícula leve
  c.fillStyle = INK;
  c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(79,220,222,0.07)';
  for (let y = 0; y < H; y += 18) for (let x = 0; x < W; x += 18) c.fillRect(x, y, 2, 2);

  const stories = formato === 'stories';
  let fimArte: number;
  if (perso.formato === 'ingresso') {
    // ingresso horizontal: 1000 px de largura, centralizado
    const k = 1000 / W_ING;
    const iy = stories ? 360 : 150;
    await desenharIngressoMemoria(c, show, imagem, usuario, memoria, perso, detalhes, (W - 1000) / 2, iy, k);
    fimArte = iy + H_ING * k + (stories ? 60 : 30);
  } else {
    const pw = stories ? 820 : 660;
    const ph = pw * 1.25;
    const px = (W - pw) / 2;
    const py = stories ? 170 : 70;
    await desenharPoster(c, show, imagem, usuario, px, py, pw, ph, perso, detalhes);
    c.strokeStyle = '#3A3159';
    c.lineWidth = 2;
    retArredondado(c, px, py, pw, ph, 26);
    c.stroke();
    fimArte = py + ph;
  }
  const py = 0;
  const ph = fimArte;

  // notas (09/10/2026): só as que existem, e só com "Mostrar a nota" ligado; a data sobe quando não há notas.
  // Notas e data centralizadas na largura da imagem (decisão do Edmir de 09/10/2026).
  const ny = py + ph + (stories ? 90 : 56);
  const notas: Array<[string, number]> = [];
  if (perso.mostrarNota && memoria.notaShow) notas.push(['Nota do show', memoria.notaShow]);
  if (perso.mostrarNota && memoria.notaOrganizacao) notas.push(['Organização', memoria.notaOrganizacao]);
  const larguras = notas.map(([rotulo, valor]) => larguraNota(c, rotulo, valor));
  if (stories) {
    // uma embaixo da outra, numa coluna centralizada
    const x0 = (W - Math.max(0, ...larguras)) / 2;
    notas.forEach(([rotulo, valor], i) => desenharNota(c, rotulo, valor, x0, ny + i * 170));
  } else {
    // lado a lado, o grupo centralizado
    const vao = 120;
    let x = (W - (larguras.reduce((a, b) => a + b, 0) + vao * Math.max(0, notas.length - 1))) / 2;
    notas.forEach(([rotulo, valor], i) => {
      desenharNota(c, rotulo, valor, x, ny);
      x += larguras[i] + vao;
    });
  }
  const yData = notas.length === 0 ? ny : stories ? ny + notas.length * 170 + 20 : ny + 150;

  // data por extenso, centralizada
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillStyle = OFF;
  c.font = `500 ${stories ? 34 : 28}px Barlow, sans-serif`;
  const linhaData = `${dataLonga(show.ts)} · ${show.cidade}`;
  c.fillText(linhaData.charAt(0).toUpperCase() + linhaData.slice(1), W / 2, yData);

  // rodapé com o site (#12: o endereço em todo card)
  c.textAlign = 'center';
  c.fillStyle = CIANO;
  c.font = '700 36px Barlow, sans-serif';
  c.fillText(SITE, W / 2, H - (stories ? 150 : 70));
  if (stories) {
    c.fillStyle = '#8A8577';
    c.font = '500 30px Barlow, sans-serif';
    c.fillText('Sua história através dos seus shows', W / 2, H - 100);
  }
  return new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error('png'))), 'image/png'));
};

const baixarOuCompartilhar = async (blob: Blob, nome: string, destino: string) => {
  const arquivo = new File([blob], nome, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  const toque = window.matchMedia('(pointer: coarse)').matches;
  if (toque && nav.share && nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo] });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  avisar(`Imagem baixada. Abra o Instagram e publique no ${destino}.`);
};

/** Botão "Compartilhar" com as opções (fica no canto inferior direito da Sua memória). */
export const BotaoCompartilhar: React.FC<{
  show: Show;
  memoria: Memoria;
  usuario: string;
  /** Personalização em uso (a imagem sai igual ao que está na tela). */
  perso?: Personalizacao;
  detalhes?: DetalhesCard;
  /** Botão Teal sob o pôster (07/10/2026); o menu abre para baixo. */
  botao?: boolean;
  className?: string;
}> = ({ show, memoria, usuario, perso, detalhes, botao, className = '' }) => {
  const [aberto, setAberto] = useState(false);
  const [gerando, setGerando] = useState<Formato | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const imagem = useImagemDoPoster(show);
  const url = `${window.location.origin}/show/${show.id}`;
  const d = dataCartao(show.ts);
  const texto = `Eu fui: ${show.artista} · ${show.casa}, ${show.cidade} · ${d.dia} ${d.mes.toLowerCase()} ${d.ano}. Minha história no Livvo:`;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const instagram = async (formato: Formato) => {
    if (gerando) return;
    setGerando(formato);
    try {
      const blob = await gerarImagem({
        show,
        memoria,
        usuario,
        imagem: imagem ? { url: imagem.url, tratada: imagem.tratada } : null,
        formato,
        perso: perso || personalizacaoDe(memoria),
        detalhes,
      });
      const nome = nomeArquivoShow(show.artista, show.data);
      await baixarOuCompartilhar(blob, nome, formato === 'stories' ? 'Stories' : 'Feed');
      setAberto(false);
    } catch {
      avisar('Não deu para gerar a imagem agora.');
    } finally {
      setGerando(null);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      avisar('Link copiado');
    } catch {
      avisar('Não deu para copiar. Use o endereço da barra do navegador.');
    }
    setAberto(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className={botao ? 'lv-btn lv-btn--stub lv-btn--teal w-full whitespace-nowrap' : 'lv-ghost'}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        <Share2 className="w-4 h-4 shrink-0" strokeWidth={botao ? 2.2 : 2} /> <span>Compartilhar</span>
      </button>
      {aberto && (
        <div className={`lv-menu ${botao ? 'lv-menu--baixo' : 'lv-menu--cima'}`} role="menu" aria-label="Compartilhar">
          <div className="lv-kicker px-2.5 pt-1 pb-1">Instagram</div>
          <button type="button" className="lv-menu-item" role="menuitem" onClick={() => instagram('stories')} disabled={Boolean(gerando)}>
            <Instagram /> {gerando === 'stories' ? 'Gerando imagem…' : 'Stories (imagem 9:16)'}
          </button>
          <button type="button" className="lv-menu-item" role="menuitem" onClick={() => instagram('feed')} disabled={Boolean(gerando)}>
            <Instagram /> {gerando === 'feed' ? 'Gerando imagem…' : 'Feed (imagem 4:5)'}
          </button>
          <div className="lv-menu-sep" />
          <a
            className="lv-menu-item"
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
          >
            <Facebook /> Facebook
          </a>
          <a
            className="lv-menu-item"
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
          >
            <MessageCircle /> WhatsApp
          </a>
          <button type="button" className="lv-menu-item" role="menuitem" onClick={copiar}>
            <Copy /> Copiar link
          </button>
          <p className="lv-meta px-2.5 pt-2 pb-1 leading-snug">
            No celular, a imagem abre no menu do aparelho para você escolher o Instagram. No computador, ela é baixada.
          </p>
        </div>
      )}
    </div>
  );
};

/* Compartilhar "Você e {pessoa}" (revisão 7) ------------------------------------------------
 * Imagem com as duas fotos (a sua da Credencial ou a retícula com iniciais), "N shows juntos" (ou em comum)
 * e os ingressos dos shows mais recentes de vocês, com o endereço do site.
 */
const desenharFotoPessoa = async (c: CanvasRenderingContext2D, nome: string, foto: string | null, x: number, y: number, w: number, h: number) => {
  c.save();
  retArredondado(c, x, y, w, h, 18);
  c.clip();
  let ok = false;
  if (foto) {
    try {
      const img = await carregar(foto);
      const { sx, sy, sw, sh } = recorte45(img.naturalWidth, img.naturalHeight);
      c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      aplicarDuotone(c, x, y, w, h, MAPA_DUOTONE_PESSOA); // pessoas em ciano (09/10/2026)
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    const p = paletaDoArtista(nome);
    c.fillStyle = p.bg;
    c.fillRect(x, y, w, h);
    const hs = hash(nome);
    const cx = x + w * ((30 + (hs % 50)) / 100);
    const cy = y + h * ((10 + ((hs >>> 5) % 40)) / 100);
    const passo = w * 0.07;
    c.fillStyle = p.acc;
    for (let py = y; py < y + h; py += passo)
      for (let px = x; px < x + w; px += passo) {
        const dist = Math.hypot(px - cx, py - cy) / (w * 0.9);
        const k = dist < 0.25 ? 1 : dist < 0.75 ? 1 - (dist - 0.25) / 0.5 : 0;
        if (k <= 0.03) continue;
        c.beginPath();
        c.arc(px + passo / 2, py + passo / 2, passo * 0.36 * Math.sqrt(k), 0, Math.PI * 2);
        c.fill();
      }
    c.fillStyle = p.fg;
    c.font = `400 ${Math.round(w * 0.3)}px "Alfa Slab One", Georgia, serif`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const ini = nome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p2) => p2[0]!.toUpperCase())
      .join('');
    c.fillText(ini, x + w * 0.09, y + h - w * 0.09);
  }
  c.restore();
  c.strokeStyle = 'rgba(79,220,222,0.5)';
  c.lineWidth = 3;
  retArredondado(c, x, y, w, h, 18);
  c.stroke();
};

export const gerarImagemJuntos = async (opcoes: {
  voce: { nome: string; usuario: string; foto: string | null };
  outra: { nome: string; usuario: string };
  shows: Array<Pick<Show, 'artista' | 'casa' | 'cidade' | 'ts'>>;
  modo: 'juntos' | 'comum';
  formato: Formato;
}): Promise<Blob> => {
  const { voce, outra, shows, modo, formato } = opcoes;
  await garantirFontes();
  const W = 1080;
  const H = formato === 'stories' ? 1920 : 1350;
  const stories = formato === 'stories';
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d', { willReadFrequently: true });
  if (!c) throw new Error('canvas');
  c.fillStyle = INK;
  c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(79,220,222,0.07)';
  for (let y = 0; y < H; y += 18) for (let x = 0; x < W; x += 18) c.fillRect(x, y, 2, 2);
  try {
    const logo = await carregar('/livvo/livvo-icon-256.png');
    c.drawImage(logo, 80, stories ? 110 : 60, 110, 110);
  } catch {
    /* segue sem logo */
  }
  // as duas fotos
  const fw = stories ? 300 : 230;
  const fh = fw * 1.25;
  const fy = stories ? 300 : 210;
  const gap = 40;
  const fx = (W - (2 * fw + gap)) / 2;
  await desenharFotoPessoa(c, voce.nome, voce.foto, fx, fy, fw, fh);
  await desenharFotoPessoa(c, outra.nome, fotoDaPessoa(outra.nome), fx + fw + gap, fy, fw, fh);
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillStyle = CIANO;
  c.font = '700 30px Barlow, sans-serif';
  c.fillText(`@${voce.usuario}`, fx + fw / 2, fy + fh + 18);
  c.fillText(`@${outra.usuario}`, fx + fw + gap + fw / 2, fy + fh + 18);
  // título e número
  let y = fy + fh + (stories ? 110 : 80);
  c.fillStyle = OFF;
  c.font = `400 ${stories ? 84 : 68}px "Alfa Slab One", Georgia, serif`;
  c.fillText(`Você e ${outra.nome.split(' ')[0]}`, W / 2, y);
  y += stories ? 112 : 88;
  c.fillStyle = AMARELO;
  c.font = `700 ${stories ? 96 : 76}px RAYDIS, "Alfa Slab One", sans-serif`;
  const n = String(shows.length);
  c.font = `700 ${stories ? 96 : 76}px RAYDIS, "Alfa Slab One", sans-serif`;
  const wn = c.measureText(n).width;
  c.font = `700 ${stories ? 44 : 36}px Barlow, sans-serif`;
  const rot = modo === 'comum' ? (shows.length === 1 ? 'SHOW EM COMUM' : 'SHOWS EM COMUM') : shows.length === 1 ? 'SHOW JUNTOS' : 'SHOWS JUNTOS';
  const wr = c.measureText(rot).width;
  const x0 = (W - (wn + 22 + wr)) / 2;
  c.textAlign = 'left';
  c.fillStyle = AMARELO;
  c.font = `700 ${stories ? 96 : 76}px RAYDIS, "Alfa Slab One", sans-serif`;
  c.fillText(n, x0, y);
  c.fillStyle = OFF;
  c.font = `700 ${stories ? 44 : 36}px Barlow, sans-serif`;
  c.fillText(rot, x0 + wn + 22, y + (stories ? 34 : 26));
  // ingressos dos shows mais recentes
  y += stories ? 150 : 110;
  const lista = shows.slice().sort((a, b) => b.ts - a.ts).slice(0, stories ? 5 : 3);
  const lx = 110;
  const lw = W - 220;
  const lh = stories ? 104 : 92;
  for (const s of lista) {
    c.strokeStyle = TEAL;
    c.lineWidth = 3;
    retArredondado(c, lx, y, lw, lh, 18);
    c.stroke();
    c.setLineDash([6, 7]);
    c.beginPath();
    c.moveTo(lx + 190, y + 12);
    c.lineTo(lx + 190, y + lh - 12);
    c.stroke();
    c.setLineDash([]);
    const d = dataCartao(s.ts);
    c.textAlign = 'center';
    c.fillStyle = OFF;
    c.font = '700 44px RAYDIS, "Alfa Slab One", sans-serif';
    c.fillText(d.dia, lx + 95, y + 12);
    c.font = '700 22px Barlow, sans-serif';
    c.fillText(`${d.mes} ${d.ano}`.toUpperCase(), lx + 95, y + 60);
    c.textAlign = 'left';
    c.font = '400 36px "Alfa Slab One", Georgia, serif';
    let nome = s.artista;
    while (c.measureText(nome).width > lw - 240 && nome.length > 4) nome = nome.slice(0, -2);
    if (nome !== s.artista) nome = `${nome.trimEnd()}…`;
    c.fillText(nome, lx + 220, y + 14);
    c.fillStyle = '#B3AE9F';
    c.font = '600 24px Barlow, sans-serif';
    c.fillText(`${s.casa} · ${s.cidade}`.slice(0, 48), lx + 220, y + 58);
    y += lh + 18;
  }
  if (shows.length > lista.length) {
    c.textAlign = 'center';
    c.fillStyle = '#8A8577';
    c.font = '600 28px Barlow, sans-serif';
    c.fillText(`e mais ${shows.length - lista.length} no Livvo`, W / 2, y + 4);
  }
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillStyle = CIANO;
  c.font = '700 36px Barlow, sans-serif';
  c.fillText(SITE, W / 2, H - (stories ? 150 : 70));
  if (stories) {
    c.fillStyle = '#8A8577';
    c.font = '500 30px Barlow, sans-serif';
    c.fillText('Sua história através dos seus shows', W / 2, H - 100);
  }
  return new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error('png'))), 'image/png'));
};

/** Botão "Compartilhar" da janela de shows juntos / em comum. */
export const BotaoCompartilharJuntos: React.FC<{
  voce: { nome: string; usuario: string; foto: string | null };
  outra: { nome: string; usuario: string };
  shows: Array<Pick<Show, 'artista' | 'casa' | 'cidade' | 'ts'>>;
  modo: 'juntos' | 'comum';
  className?: string;
}> = ({ voce, outra, shows, modo, className = '' }) => {
  const [aberto, setAberto] = useState(false);
  const [gerando, setGerando] = useState<Formato | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const url = `${window.location.origin}/`;
  const texto = `Eu e @${outra.usuario}: ${shows.length} ${modo === 'comum' ? (shows.length === 1 ? 'show em comum' : 'shows em comum') : shows.length === 1 ? 'show juntos' : 'shows juntos'} no Livvo.`;
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), setAberto(false));
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc, true);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc, true);
    };
  }, [aberto]);
  const instagram = async (formato: Formato) => {
    if (gerando) return;
    setGerando(formato);
    try {
      const blob = await gerarImagemJuntos({ voce, outra, shows, modo, formato });
      await baixarOuCompartilhar(blob, `Livvo_${voce.usuario}_e_${outra.usuario}_${formato === 'stories' ? 'Stories' : 'Feed'}.png`, formato === 'stories' ? 'Stories' : 'Feed');
      setAberto(false);
    } catch {
      avisar('Não deu para gerar a imagem agora.');
    } finally {
      setGerando(null);
    }
  };
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" className="lv-btn lv-btn--stub lv-btn--teal whitespace-nowrap" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <Share2 className="w-4 h-4 shrink-0" strokeWidth={2.2} /> <span>Compartilhar</span>
      </button>
      {aberto && (
        <div className="lv-menu lv-menu--baixo" role="menu" aria-label="Compartilhar">
          <div className="lv-kicker px-2.5 pt-1 pb-1">Instagram</div>
          <button type="button" className="lv-menu-item" role="menuitem" onClick={() => instagram('stories')} disabled={Boolean(gerando)}>
            <Instagram /> {gerando === 'stories' ? 'Gerando imagem…' : 'Stories (imagem 9:16)'}
          </button>
          <button type="button" className="lv-menu-item" role="menuitem" onClick={() => instagram('feed')} disabled={Boolean(gerando)}>
            <Instagram /> {gerando === 'feed' ? 'Gerando imagem…' : 'Feed (imagem 4:5)'}
          </button>
          <div className="lv-menu-sep" />
          <a
            className="lv-menu-item"
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
          >
            <Facebook /> Facebook
          </a>
          <a className="lv-menu-item" role="menuitem" href={`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}>
            <MessageCircle /> WhatsApp
          </a>
          <p className="lv-meta px-2.5 pt-2 pb-1 leading-snug">No celular, a imagem abre no menu do aparelho para você escolher o Instagram. No computador, ela é baixada.</p>
        </div>
      )}
    </div>
  );
};
