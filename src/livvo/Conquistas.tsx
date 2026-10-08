import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { StickerState } from '../services/stickerService';
import { avaliarConquistas, MIN_SHOWS_CONQUISTAS } from './conquistasLogic';
import type { Passaporte } from './stats';
import { Picotes, Stub } from './ui';

type Filtro = 'all' | StickerState['status'];

// Ordem dos filtros: decisão do Edmir de 08/10/2026, 06h18 (Conquistadas, A conquistar, Todas, Em breve)
const FILTROS: Array<{ id: Filtro; label: string }> = [
  { id: 'unlocked', label: 'Conquistadas' },
  { id: 'locked', label: 'A conquistar' },
  { id: 'all', label: 'Todas' },
  { id: 'soon', label: 'Em breve' },
];

/** Coleção do Passaporte: arquivos Color oficiais com transparência, sem cards. */
export const MinhasConquistas: React.FC<{ pass: Passaporte; fechar: () => void }> = ({ pass, fechar }) => {
  // Abre no primeiro filtro (Conquistadas)
  const [filtro, setFiltro] = useState<Filtro>('unlocked');
  const stickers = useMemo(() => avaliarConquistas(pass), [pass]);
  const conquistadas = stickers.filter((sticker) => sticker.status === 'unlocked').length;
  // N2 (06/10/2026): a primeira conquista chega com 5 shows registrados
  const faltam = Math.max(0, MIN_SHOWS_CONQUISTAS - pass.shows);
  // Antes de 5 shows os filtros somem e a galeria mostra todas
  const visiveis = stickers.filter((sticker) => faltam > 0 || filtro === 'all' || sticker.status === filtro);

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
            <p className="lv-sub mt-2">
              {faltam > 0 ? `${stickers.length} conquistas para colecionar` : `${conquistadas} de ${stickers.length} conquistadas`}
            </p>
          </div>
          {faltam === 0 && (
            <div className="lv-conquistas-filtros" role="group" aria-label="Filtrar conquistas">
              {FILTROS.map(({ id, label }) => (
                <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {faltam > 0 && (
          <div className="lv-conquistas-trava mt-6">
            <p className="lv-h3">
              {faltam === 1 ? 'Falta 1 show' : `Faltam ${faltam} shows`} para a sua primeira conquista
            </p>
            <p className="lv-meta mt-1">As conquistas começam a partir de {MIN_SHOWS_CONQUISTAS} shows registrados. Os shows antigos contam também.</p>
            <Picotes total={MIN_SHOWS_CONQUISTAS} feitos={pass.shows} className="mt-3 max-w-[280px]" />
            <Stub icone={Plus} to="/registrar" className="mt-4">
              Registrar show
            </Stub>
          </div>
        )}

        {visiveis.length ? (
          <div className="lv-conquistas-grid mt-7" data-travada={faltam > 0 || undefined}>
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
