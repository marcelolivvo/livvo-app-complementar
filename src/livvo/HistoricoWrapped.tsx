import React, { useMemo } from 'react';
import { MyHistory } from '../components/MyHistory';
import { TourWrappedModal } from '../components/TourWrappedModal';
import { FAN_MEDAL_TIERS, type CollectedTicket, type FanStats } from '../services/walletService';
import type { CardTemplateConfig } from '../types';
import type { Show } from './data/catalog';
import type { Passaporte } from './stats';
import { personalizacaoDe } from './store';
import { useImagemDoPoster } from './ui';

/**
 * "Meu Histórico" e "Gerar meu Wrapped" na Minha História (revisão 5, 07/10/2026): os mesmos gráficos e o
 * mesmo Wrapped do Livvo Virtual Poster (A), alimentados pelas memórias do Livvo. Este arquivo é a ponte:
 * converte memória + show no `CollectedTicket` do A e calcula o `FanStats` com a faixa do Passaporte.
 * Carregado sob demanda (só quando a pessoa abre um dos dois).
 */

const CONFIG_VAZIA = {} as CardTemplateConfig;

/** Endereço externo passa pelo /api/foto (mesmo domínio) para o html-to-image ler a foto no Wrapped. */
const viaServidor = (url: string) => (/^(data:|blob:|\/)/.test(url) ? url : `/api/foto?url=${encodeURIComponent(url)}`);

export const paraIngressosA = (memoriasComShow: Passaporte['memoriasComShow']): CollectedTicket[] =>
  memoriasComShow
    .slice()
    .sort((a, b) => a.show.ts - b.show.ts)
    .map(({ memoria, show }) => {
      const p = personalizacaoDe(memoria);
      return {
        id: memoria.id,
        showCode: show.id,
        artistName: show.artista,
        tourName: show.turne,
        venue: show.casa,
        city: show.cidade,
        state: show.uf,
        date: show.data, // dd/mm/aaaa, o formato que o historyService do A lê
        config: CONFIG_VAZIA,
        collectedAt: memoria.criadaEm,
        stampType: p.carimbo === 'eu_fui' ? 'eu-fui' : p.carimbo === 'show_da_minha_vida' ? 'saudade' : 'none',
        favoriteSong: p.faixa || undefined,
      };
    });

/** FanStats do A a partir do Passaporte (nível = faixa do Passaporte, não as medalhas do Estúdio). */
export const statsDoPassaporte = (pass: Passaporte): FanStats => {
  const medalhas = FAN_MEDAL_TIERS.map((m) => ({ ...m, unlocked: pass.shows >= m.minShows }));
  let i = 0;
  medalhas.forEach((m, k) => {
    if (pass.shows >= m.minShows) i = k;
  });
  const anos = pass.memoriasComShow.map((x) => Number(x.show.data.slice(-4))).filter(Boolean);
  return {
    totalShows: pass.shows,
    effectiveShows: pass.shows,
    bonusShowsFromChallenges: 0,
    uniqueArtists: pass.artistas,
    uniqueStates: pass.estados,
    uniqueCities: pass.cidades,
    estimatedHours: pass.shows * 2,
    oldestShowYear: anos.length ? Math.min(...anos) : undefined,
    topArtist: pass.artistaMaisVisto ? { name: pass.artistaMaisVisto.nome, count: pass.artistaMaisVisto.vezes } : undefined,
    level: pass.shows ? medalhas[i]!.level : 0,
    levelTitle: pass.faixa,
    nextLevelProgress: Math.round(pass.progresso * 100),
    currentMedal: medalhas[i]!,
    nextMedal: medalhas[i + 1],
  };
};

/** Seção "Meu Histórico" (mesmo invólucro do A: tira "Livvo · Minha história" com Fechar). */
export const MeuHistorico: React.FC<{ pass: Passaporte; fechar: () => void }> = ({ pass, fechar }) => {
  const ingressos = useMemo(() => paraIngressosA(pass.memoriasComShow), [pass]);
  return (
    <div id="meu-historico" className="lv-hist">
      <div className="lv-strip">
        <span>Livvo · Meu histórico</span>
        <button type="button" onClick={fechar} className="lv-hist-close">
          Fechar
        </button>
      </div>
      <div className="p-5 sm:p-8">
        <h3 className="lv-display text-[clamp(22px,4vw,32px)] text-[#ECE5D1] mb-2">Meu histórico</h3>
        <MyHistory tickets={ingressos} />
      </div>
    </div>
  );
};

/** Wrapped do A com a foto do artista mais visto (a mesma que aparece nos pôsteres). */
export const MeuWrapped: React.FC<{ pass: Passaporte; usuario: string; fechar: () => void }> = ({ pass, usuario, fechar }) => {
  const ingressos = useMemo(() => paraIngressosA(pass.memoriasComShow), [pass]);
  const stats = useMemo(() => statsDoPassaporte(pass), [pass]);
  const showTop: Pick<Show, 'id' | 'artista' | 'artistaId'> = useMemo(() => {
    const top = pass.artistaMaisVisto;
    const achado = top ? pass.memoriasComShow.find((x) => x.show.artistaId === top.artistaId)?.show : undefined;
    return achado || pass.ultimoShow || { id: '-', artista: '', artistaId: '' };
  }, [pass]);
  const img = useImagemDoPoster(showTop);
  const comFoto = useMemo(() => {
    if (!img?.url || !stats.topArtist) return ingressos;
    const nome = stats.topArtist.name.trim().toLowerCase();
    return ingressos.map((t) => (t.artistName.trim().toLowerCase() === nome ? { ...t, photoUrl: viaServidor(img.url) } : t));
  }, [ingressos, img?.url, stats.topArtist]);
  return <TourWrappedModal isOpen onClose={fechar} stats={stats} tickets={comFoto} userHandle={`@${usuario}`} />;
};
