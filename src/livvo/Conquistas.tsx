import React, { useMemo, useState } from 'react';
import { evaluateStickers, sortStickers, type StickerState } from '../services/stickerService';
import { paraIngressosA } from './HistoricoWrapped';
import type { Passaporte } from './stats';

type Filtro = 'all' | StickerState['status'];

const FILTROS: Array<{ id: Filtro; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'unlocked', label: 'Conquistadas' },
  { id: 'locked', label: 'A conquistar' },
  { id: 'soon', label: 'Em breve' },
];

/** Coleção do Passaporte: arquivos Color oficiais com transparência, sem cards. */
export const MinhasConquistas: React.FC<{ pass: Passaporte; fechar: () => void }> = ({ pass, fechar }) => {
  const [filtro, setFiltro] = useState<Filtro>('all');
  const stickers = useMemo(() => sortStickers(evaluateStickers(paraIngressosA(pass.memoriasComShow))), [pass]);
  const conquistadas = stickers.filter((sticker) => sticker.status === 'unlocked').length;
  const visiveis = stickers.filter((sticker) => filtro === 'all' || sticker.status === filtro);

  return (
    <section id="minhas-conquistas" className="lv-hist lv-conquistas" aria-label="Minhas Conquistas">
      <div className="lv-strip">
        <span>Livvo · Minhas Conquistas</span>
        <button type="button" onClick={fechar} className="lv-hist-close">Fechar</button>
      </div>
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="lv-display text-[clamp(22px,4vw,32px)] text-[#ECE5D1]">Minhas Conquistas</h2>
            <p className="lv-sub mt-2">{conquistadas} de {stickers.length} conquistadas</p>
          </div>
          <div className="lv-conquistas-filtros" role="group" aria-label="Filtrar conquistas">
            {FILTROS.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {visiveis.length ? (
          <div className="lv-conquistas-grid mt-7">
            {visiveis.map((sticker) => (
              <figure
                key={sticker.slug}
                className="lv-conquista"
                data-status={sticker.status}
                title={`${sticker.name} · ${sticker.criterion}`}
              >
                <img src={sticker.image} alt={sticker.name} loading="lazy" width="128" height="128" />
                <figcaption>{sticker.name}</figcaption>
                <span className="lv-conquista-status">
                  {sticker.status === 'unlocked'
                    ? 'Conquistada'
                    : sticker.status === 'soon'
                      ? 'Em breve'
                      : `${sticker.current}/${sticker.target}`}
                </span>
              </figure>
            ))}
          </div>
        ) : (
          <p className="lv-sub py-8">Nenhuma conquista nesta seleção.</p>
        )}
      </div>
    </section>
  );
};
