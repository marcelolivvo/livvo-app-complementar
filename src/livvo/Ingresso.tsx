import React, { useState } from 'react';
import { Music } from 'lucide-react';
import type { Show } from './data/catalog';
import { dataCartao, nota } from './format';
import type { Memoria, Personalizacao } from './store';
import {
  COR_DESTAQUE,
  Carimbo,
  Discos,
  ESCALA_TAMANHO,
  FAMILIA_FONTE,
  LARGURA_LETRA,
  linhaDetalhes,
  nomeAceitaRaydis,
  useImagemDoPoster,
  type DetalhesCard,
} from './ui';

/**
 * Formato "Ingresso" da memória (revisão 5, 07/10/2026): o Ingresso Retrô do Livvo Virtual Poster (A),
 * com o mesmo contorno (furos em cima e embaixo, picote e canhoto com foto, 960 × 352), adaptado à identidade:
 * rótulos em Barlow (sem DM Mono), logo Livvo, foto com o duotone suave e só os carimbos de presença.
 * O nome nunca é cortado: se não cabe numa linha, vai palavra por palavra para a segunda.
 * É desenhado em tamanho fixo e escalado pelo `RetroTicketStage` do A.
 */
export const W = 960;
export const H = 352;
export const RECORTE_X = 272;
export const RECORTE_R = 27;
const CANTO = 22;
const TRACO = 3;
const TEAL = '#2FB8BA';
const CIANO = '#4FDCDE';
const OFF = '#ECE5D1';
const DIM = '#8A8577';
const INK = '#100C1F';
const BARLOW = "'Barlow', sans-serif";

const s = TRACO / 2;
export const CAMINHO_INGRESSO = `M ${CANTO},${s} L ${RECORTE_X - RECORTE_R},${s} A ${RECORTE_R},${RECORTE_R} 0 0,0 ${RECORTE_X + RECORTE_R},${s} L ${W - CANTO},${s} A ${CANTO - s},${CANTO - s} 0 0,1 ${W - s},${CANTO} L ${W - s},${H - CANTO} A ${CANTO - s},${CANTO - s} 0 0,1 ${W - CANTO},${H - s} L ${RECORTE_X + RECORTE_R},${H - s} A ${RECORTE_R},${RECORTE_R} 0 0,0 ${RECORTE_X - RECORTE_R},${H - s} L ${CANTO},${H - s} A ${CANTO - s},${CANTO - s} 0 0,1 ${s},${H - CANTO} L ${s},${CANTO} A ${CANTO - s},${CANTO - s} 0 0,1 ${CANTO},${s} Z`;

/** Largura útil do nome no corpo do ingresso (menos o espaço do carimbo, quando há). */
export const larguraNome = (comCarimbo: boolean) => W - RECORTE_X - 38 - 34 - (comCarimbo ? 110 : 0);

/** Tamanho do nome no ingresso: a palavra mais longa cabe numa linha e o nome todo em até duas. */
export const tamanhoNomeIngresso = (nome: string, perso: Pick<Personalizacao, 'fonte' | 'tamanho' | 'carimbo'>) => {
  const fonte = perso.fonte === 'raydis' && !nomeAceitaRaydis(nome) ? 'alfa' : perso.fonte;
  const k = LARGURA_LETRA[fonte];
  const largura = larguraNome(perso.carimbo !== 'nenhum');
  const maior = Math.max(...nome.split(/\s+/).map((p) => p.length), 1);
  const base = (fonte === 'barlow' ? 70 : 60) * ESCALA_TAMANHO[perso.tamanho];
  const porPalavra = largura / (maior * k);
  const porNome = (1.9 * largura) / (nome.length * k);
  return { tamanho: Math.floor(Math.min(base, porPalavra, porNome)), fonte, largura };
};

export const IngressoMemoria: React.FC<{
  show: Pick<Show, 'id' | 'artista' | 'artistaId' | 'casa' | 'cidade' | 'uf' | 'ts'>;
  memoria?: Pick<Memoria, 'notaShow' | 'notaOrganizacao'>;
  usuario?: string;
  perso: Personalizacao;
  detalhes?: DetalhesCard;
}> = ({ show, memoria, usuario, perso, detalhes }) => {
  const imagem = useImagemDoPoster(show);
  const [falhou, setFalhou] = useState<string | null>(null);
  const foto = imagem?.url && imagem.url !== falhou ? imagem.url : undefined;
  const d = dataCartao(show.ts);
  const dest = COR_DESTAQUE[perso.cor];
  const { tamanho, fonte } = tamanhoNomeIngresso(show.artista, perso);
  const comCarimbo = perso.carimbo !== 'nenhum';
  const extra = linhaDetalhes(perso, detalhes);
  const faixa = perso.faixa.trim();
  const justificar = perso.posicao === 'cima' ? 'flex-start' : perso.posicao === 'meio' ? 'center' : 'flex-end';

  return (
    <div className="lv-ingresso-memoria relative select-none" style={{ width: W, height: H, color: OFF, fontFamily: BARLOW }} aria-hidden="true">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
        <path d={CAMINHO_INGRESSO} fill={INK} stroke={TEAL} strokeWidth={TRACO} strokeLinejoin="round" />
        <line x1={RECORTE_X} y1={RECORTE_R + 8} x2={RECORTE_X} y2={H - RECORTE_R - 8} stroke={TEAL} strokeWidth={3} strokeDasharray="8 9" />
      </svg>

      {/* Canhoto: foto, logo, @ e data */}
      <div className="absolute overflow-hidden" style={{ left: 16, top: 16, width: RECORTE_X - 40, height: H - 32, borderRadius: 12, background: '#171226' }}>
        {foto ? (
          <img
            src={foto}
            alt=""
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover ${imagem?.tratada ? '' : 'lv-poster-photo--duo'}`}
            style={{ objectPosition: '50% 28%' }}
            onError={() => setFalhou(foto)}
          />
        ) : (
          <div className="absolute inset-0 lv-ingresso-halftone" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(16,12,31,0.6) 0%, rgba(16,12,31,0) 34%, rgba(16,12,31,0) 52%, rgba(16,12,31,0.92) 100%)' }}
        />
        <div className="absolute" style={{ left: 14, top: 14 }}>
          <img src="/livvo/livvo-icon-128.png" alt="" width={52} height={52} style={{ borderRadius: 12, boxShadow: '0 3px 10px rgba(0,0,0,0.35)' }} />
          {usuario && perso.mostrarUsuario && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: CIANO }}>@{usuario}</div>}
        </div>
        <div className="absolute" style={{ left: 16, right: 16, bottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', color: CIANO }}>DATA</div>
          <div className="flex items-baseline" style={{ gap: 8, marginTop: 2 }}>
            <span style={{ fontFamily: "'RAYDIS', 'Alfa Slab One', sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 0.95 }}>{d.dia}</span>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {d.mes} {d.ano}
            </span>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="absolute flex flex-col" style={{ left: RECORTE_X + 38, right: 34, top: 24, bottom: 20 }}>
        <div className="flex items-start justify-between" style={{ gap: 16, minHeight: 22 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: dest, maxWidth: 380 }}>
            {perso.frase.trim() || 'Livvo · Ingresso de memória'}
          </span>
        </div>

        <div className="flex-1 flex flex-col min-w-0" style={{ justifyContent: justificar, paddingTop: 8, paddingBottom: 8, paddingRight: comCarimbo ? 110 : 0 }}>
          <div
            className="lv-ingresso-nome"
            style={{
              fontFamily: FAMILIA_FONTE[fonte],
              fontWeight: fonte === 'alfa' ? 400 : fonte === 'raydis' ? 700 : 800,
              fontSize: tamanho,
              lineHeight: 1.02,
              textTransform: fonte === 'barlow' ? 'uppercase' : undefined,
            }}
          >
            {show.artista}
          </div>
          <span style={{ display: 'block', width: 96, height: 4, background: dest, marginTop: 10 }} />
          {(faixa || extra) && (
            <div className="flex items-center" style={{ gap: 8, marginTop: 10, fontSize: 14, fontWeight: 600, color: OFF, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {faixa && (
                <>
                  <Music style={{ width: 15, height: 15, color: dest, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{faixa}</span>
                </>
              )}
              {faixa && extra && <span style={{ color: DIM }}>·</span>}
              {extra && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{extra}</span>}
            </div>
          )}
        </div>

        <div className="grid" style={{ gridTemplateColumns: perso.mostrarCasa ? 'minmax(0,1.5fr) minmax(0,1fr)' : 'minmax(0,1fr)', marginBottom: 12 }}>
          {perso.mostrarCasa && (
            <div style={{ paddingRight: 18, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', color: DIM }}>LOCAL</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{show.casa}</div>
            </div>
          )}
          <div style={{ paddingLeft: perso.mostrarCasa ? 18 : 0, borderLeft: perso.mostrarCasa ? '1.5px dashed #3A3159' : undefined, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.18em', color: DIM }}>CIDADE</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: dest, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {show.cidade} · {show.uf}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ borderTop: '1.5px dashed #3A3159', paddingTop: 10, gap: 12 }}>
          <span className="flex items-center" style={{ gap: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', color: DIM }}>NOTA</span>
            <Discos valor={memoria?.notaShow} tamanho={16} rotulo="Nota do show" />
            {memoria?.notaShow !== undefined && <span className="lv-nota-num" style={{ fontSize: 18 }}>{nota(memoria.notaShow)}</span>}
          </span>
          <span className="flex items-center" style={{ gap: 7, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: OFF }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: CIANO, display: 'inline-block' }} />
            livvomusic.com.br
          </span>
        </div>
      </div>

      {comCarimbo && <Carimbo tipo={perso.carimbo} className="absolute lv-carimbo--ingresso" style={{ right: 30, top: 22, fontSize: 16, zIndex: 3 }} />}
    </div>
  );
};
