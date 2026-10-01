import React, { useState, useMemo } from 'react';
import { Search, MapPin, Calendar, Building2, Plus, Sparkles, Filter } from 'lucide-react';
import { ShowItem, CardTemplateConfig } from '../types';
import { cleanDateOnly } from '../utils/dateUtils';
import { cleanCityOnly } from '../utils/stateUtils';
import { LivvoTicketIcon } from './LivvoTicketIcon';

interface ShowsTableProps {
  shows: ShowItem[];
  onSelectShowForStudio: (show: ShowItem) => void;
  onOpenUploader?: () => void;
}

export const ShowsTable: React.FC<ShowsTableProps> = ({
  shows,
  onSelectShowForStudio,
  onOpenUploader,
}) => {
  const [filterText, setFilterText] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');

  const states = useMemo(() => {
    const set = new Set<string>();
    shows.forEach((s) => s.state && set.add(s.state.toUpperCase()));
    return ['ALL', ...Array.from(set).sort()];
  }, [shows]);

  const filteredShows = useMemo(() => {
    return shows.filter((s) => {
      const matchesText =
        !filterText ||
        s.artistName.toLowerCase().includes(filterText.toLowerCase()) ||
        s.city.toLowerCase().includes(filterText.toLowerCase()) ||
        s.venue.toLowerCase().includes(filterText.toLowerCase());

      const matchesState = selectedState === 'ALL' || s.state?.toUpperCase() === selectedState;
      return matchesText && matchesState;
    });
  }, [shows, filterText, selectedState]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171226] border border-[#282141] p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-black text-[#ECE5D1] flex items-center gap-2">
            <LivvoTicketIcon className="w-6 h-6 text-[#2FB8BA]" />
            <span>Catálogo Oficial de Shows ({shows.length})</span>
          </h2>
          <p className="text-xs text-[#8A8577] mt-0.5">
            Consulte datas confirmadas e crie seus ingressos colecionáveis personalizados
          </p>
        </div>

        {onOpenUploader && (
          <button
            onClick={onOpenUploader}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] font-black text-xs transition-all shadow-lg shadow-[#2FB8BA]/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Importar Shows (CSV)</span>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#8A8577] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filtrar por artista, cidade ou local do show..."
            className="w-full bg-[#171226] border border-[#282141] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
          />
        </div>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-[#171226] border border-[#282141] text-[#ECE5D1] rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#2FB8BA] cursor-pointer"
        >
          {states.map((st) => (
            <option key={st} value={st}>
              {st === 'ALL' ? 'Todos os Estados' : `Estado: ${st}`}
            </option>
          ))}
        </select>
      </div>

      {/* Shows Table Card */}
      <div className="bg-[#171226] border border-[#282141] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#282141] bg-[#120E22]/60 text-[10px] font-mono font-bold text-[#8A8577] uppercase tracking-wider">
                <th className="py-3 px-4">Artista & Turnê</th>
                <th className="py-3 px-4">Local</th>
                <th className="py-3 px-4">Cidade / UF</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282141]/50 text-xs">
              {filteredShows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8A8577]">
                    Nenhum show encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredShows.map((show) => (
                  <tr
                    key={show.id}
                    className="hover:bg-[#1E1833]/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectShowForStudio(show)}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#ECE5D1]">
                      <div className="flex items-center gap-2">
                        <LivvoTicketIcon className="w-4 h-4 text-[#2FB8BA] shrink-0" />
                        <div>
                          <div>{show.artistName}</div>
                          {show.tourName && (
                            <div className="text-[10px] text-[#2FB8BA] font-normal">{show.tourName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#B3AE9F]">{show.venue}</td>
                    <td className="py-3.5 px-4 text-[#ECE5D1]">
                      {cleanCityOnly(show.city)}
                      {show.state ? ` - ${show.state}` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#FFD60A]">
                      {cleanDateOnly(show.date)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectShowForStudio(show);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2FB8BA]/10 hover:bg-[#2FB8BA] text-[#4FDCDE] hover:text-[#100C1F] border border-[#2FB8BA]/30 font-bold text-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Criar Card</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
