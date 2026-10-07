import React, { useEffect, useRef, useState } from 'react';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
import type { Show } from './data/catalog';
import { aplicarDuotone, carregarParaCanvas, recorte45 } from './fotos';
import { dataCartao, dataLonga, nota } from './format';
import type { Memoria } from './store';
import { BARRAS, CONTORNO_INGRESSO, PALHETA, avisar, paletaDoArtista, useImagemDoPoster } from './ui';
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
const linhasDoNome = (c: CanvasRenderingContext2D, nome: string, largura: number, tamanhoInicial: number) => {
  for (let t = tamanhoInicial; t >= 40; t -= 4) {
    c.font = `400 ${t}px "Alfa Slab One", Georgia, serif`;
    const palavras = nome.split(/\s+/);
    const linhas: string[] = [];
    let atual = '';
    let coube = true;
    for (const p of palavras) {
      const teste = atual ? `${atual} ${p}` : p;
      if (c.measureText(teste).width <= largura) atual = teste;
      else {
        if (!atual) {
          coube = false;
          break;
        }
        linhas.push(atual);
        atual = p;
      }
    }
    if (atual) linhas.push(atual);
    if (coube && linhas.length <= 3 && linhas.every((l) => c.measureText(l).width <= largura)) return { linhas, tamanho: t };
  }
  return { linhas: [nome], tamanho: 40 };
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
) => {
  const p = paletaDoArtista(show.artistaId || show.artista);
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
  c.fillStyle = CIANO;
  c.font = `700 ${Math.round(w * 0.036)}px Barlow, sans-serif`;
  c.textAlign = 'left';
  c.fillText(`@${usuario}`, x + m, y + m + w * 0.165);
  // data e UF
  const d = dataCartao(show.ts);
  c.textAlign = 'right';
  c.fillStyle = fg;
  c.font = `700 ${Math.round(w * 0.11)}px RAYDIS, "Alfa Slab One", sans-serif`;
  c.fillText(d.dia, x + w - m, y + m);
  c.font = `700 ${Math.round(w * 0.044)}px Barlow, sans-serif`;
  c.fillText(`${d.mes} ${d.ano}`.toUpperCase(), x + w - m, y + m + w * 0.115);
  c.fillText(show.uf.toUpperCase(), x + w - m, y + m + w * 0.17);
  // nome e casa
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const { linhas, tamanho } = linhasDoNome(c, show.artista, w - 2 * m, Math.round(w * 0.16));
  const baseCasa = y + h - m;
  c.font = `600 ${Math.round(w * 0.042)}px Barlow, sans-serif`;
  c.fillStyle = fg;
  c.globalAlpha = 0.85;
  c.fillText(show.casa.toUpperCase().slice(0, 40), x + m, baseCasa);
  c.globalAlpha = 1;
  c.font = `400 ${tamanho}px "Alfa Slab One", Georgia, serif`;
  linhas
    .slice()
    .reverse()
    .forEach((l, i) => c.fillText(l, x + m, baseCasa - w * 0.06 - i * tamanho * 0.98));
  c.restore();
};

/** Um ingresso de nota (mesmo desenho do componente de notas), preenchido 0, metade ou inteiro. */
const desenharIngresso = (c: CanvasRenderingContext2D, x: number, y: number, escala: number, fill: 0 | 0.5 | 1) => {
  c.save();
  c.translate(x, y);
  c.scale(escala, escala);
  const contorno = new Path2D(CONTORNO_INGRESSO);
  if (fill) {
    c.save();
    if (fill === 0.5) {
      c.beginPath();
      c.rect(0, 0, 10, 30);
      c.clip();
    }
    c.fillStyle = OFF;
    c.fill(contorno);
    c.restore();
  }
  c.strokeStyle = fill ? TEAL : '#3A3159';
  c.lineWidth = 1.7;
  c.lineJoin = 'round';
  c.stroke(contorno);
  const detalhe = fill ? TEAL : '#3A3159';
  c.fillStyle = detalhe;
  BARRAS.forEach(([bx, bw]) => c.fillRect(bx, 4.4, bw, 6.6));
  c.setLineDash([1.2, 1.3]);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(4.6, 15);
  c.lineTo(15.6, 15);
  c.strokeStyle = detalhe;
  c.stroke();
  c.setLineDash([]);
  c.fill(new Path2D(PALHETA));
  c.restore();
};

const desenharNota = (c: CanvasRenderingContext2D, rotulo: string, valor: number | undefined, x: number, y: number) => {
  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.fillStyle = '#B3AE9F';
  c.font = '600 30px Barlow, sans-serif';
  c.fillText(rotulo.toUpperCase().split('').join(' '), x, y);
  for (let i = 1; i <= 5; i++) {
    const v = valor || 0;
    const fill: 0 | 0.5 | 1 = v >= i ? 1 : v >= i - 0.5 ? 0.5 : 0;
    desenharIngresso(c, x + (i - 1) * 62, y + 46, 2.6, fill);
  }
  if (valor !== undefined) {
    c.fillStyle = AMARELO;
    c.font = '700 64px RAYDIS, "Alfa Slab One", sans-serif';
    c.fillText(nota(valor), x + 5 * 62 + 14, y + 52);
  }
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

export const gerarImagem = async (opcoes: {
  show: Show;
  memoria: Memoria;
  usuario: string;
  imagem: Imagem;
  formato: Formato;
}): Promise<Blob> => {
  const { show, memoria, usuario, imagem, formato } = opcoes;
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
  const pw = stories ? 820 : 660;
  const ph = pw * 1.25;
  const px = (W - pw) / 2;
  const py = stories ? 170 : 70;
  await desenharPoster(c, show, imagem, usuario, px, py, pw, ph);
  c.strokeStyle = '#3A3159';
  c.lineWidth = 2;
  retArredondado(c, px, py, pw, ph, 26);
  c.stroke();

  // carimbo "Eu fui"
  c.save();
  c.translate(px + pw - 40, py + ph + 4);
  c.rotate((-6 * Math.PI) / 180);
  c.strokeStyle = CIANO;
  c.lineWidth = 5;
  c.font = '700 34px Barlow, sans-serif';
  const carimbo = 'EU FUI';
  const cw = c.measureText(carimbo).width + 48;
  c.fillStyle = INK;
  retArredondado(c, -cw, -34, cw, 68, 8);
  c.fill();
  c.stroke();
  c.fillStyle = CIANO;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(carimbo, -cw / 2, 1);
  c.restore();

  // notas
  const ny = py + ph + (stories ? 90 : 56);
  const nx = stories ? 130 : 110;
  desenharNota(c, 'Nota do show', memoria.notaShow, nx, ny);
  if (stories) desenharNota(c, 'Organização', memoria.notaOrganizacao, nx, ny + 170);
  else desenharNota(c, 'Organização', memoria.notaOrganizacao, W / 2 + 30, ny);

  // data por extenso
  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.fillStyle = OFF;
  c.font = `500 ${stories ? 34 : 28}px Barlow, sans-serif`;
  const linhaData = `${dataLonga(show.ts)} · ${show.cidade}`;
  c.fillText(linhaData.charAt(0).toUpperCase() + linhaData.slice(1), nx, stories ? ny + 360 : ny + 150);

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
export const BotaoCompartilhar: React.FC<{ show: Show; memoria: Memoria; usuario: string; className?: string }> = ({
  show,
  memoria,
  usuario,
  className = '',
}) => {
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
      const blob = await gerarImagem({ show, memoria, usuario, imagem: imagem ? { url: imagem.url, tratada: imagem.tratada } : null, formato });
      const nome = `Livvo_${show.artista.replace(/[^\w]+/g, '_')}_${formato === 'stories' ? 'Stories' : 'Feed'}.png`;
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
      <button type="button" className="lv-ghost" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <Share2 className="w-4 h-4" /> Compartilhar
      </button>
      {aberto && (
        <div className="lv-menu lv-menu--cima" role="menu" aria-label="Compartilhar">
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
