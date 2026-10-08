import { evaluateStickers, sortStickers, type StickerState } from '../services/stickerService';
import type { CollectedTicket } from '../services/walletService';
import { MIN_SHOWS_FOR_STICKERS } from '../utils/livvoBrand';
import { personalizacaoDe } from './store';
import type { Passaporte } from './stats';

/**
 * Conquistas (stickers) do Livvo final. Arquivo leve: é usado pelo aviso animado do AppShell
 * (revisão 11) e pela coleção Minhas Conquistas, sem puxar os gráficos e o Wrapped.
 */

/** Memória + show no formato `CollectedTicket` do Livvo Virtual Poster (A). */
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
        config: {} as CollectedTicket['config'],
        collectedAt: memoria.criadaEm,
        stampType: p.carimbo === 'eu_fui' ? 'eu-fui' : p.carimbo === 'show_da_minha_vida' ? 'saudade' : 'none',
        favoriteSong: p.faixa || undefined,
      };
    });

/** Mínimo de shows para a primeira conquista (N2, 06/10/2026). */
export const MIN_SHOWS_CONQUISTAS = MIN_SHOWS_FOR_STICKERS;

/**
 * Estado das conquistas com a trava da N2: antes de 5 shows nenhuma aparece como conquistada
 * (as que já teriam o critério ficam "a conquistar", com a contagem até 5 shows).
 */
export const avaliarConquistas = (pass: Passaporte): StickerState[] => {
  const estados = sortStickers(evaluateStickers(paraIngressosA(pass.memoriasComShow)));
  if (pass.shows >= MIN_SHOWS_CONQUISTAS) return estados;
  return sortStickers(
    estados.map((s) =>
      s.status === 'unlocked'
        ? { ...s, status: 'locked' as const, current: Math.min(pass.shows, MIN_SHOWS_CONQUISTAS - 1), target: Math.max(s.target, MIN_SHOWS_CONQUISTAS), unlockOrder: undefined, unlockedOn: undefined }
        : s,
    ),
  );
};
