import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Music,
} from 'lucide-react';
import { ShowItem, ArtistItem } from '../types';
import { cleanDateOnly } from '../utils/dateUtils';
import { normalizeStateUF, isSameState } from '../utils/stateUtils';

interface ShowsTableProps {
  shows: ShowItem[];
  artists: ArtistItem[];
  photosMap: Map<string, string>;
  onSelectShowForCard: (show: ShowItem) => void;
  onOpenPhotoManager: (artistCode: string) => void;
}

export const ShowsTable: React.FC<ShowsTableProps> = ({
  shows,
  artists,
  photosMap,
  onSelectShowForCard,
  onOpenPhotoManager,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('ALL');
  const [filterPhoto, setFilterPhoto] = useState<'all' | 'with-photo' | 'without-photo'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Extract unique Brazilian states (consolidated UF codes e.g. 'São Paulo' -> 'SP')
  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    shows.forEach((s) => {
      const uf = normalizeStateUF(s.state);
      if (uf) set.add(uf);
    });
    return Array.from(set).sort();
  }, [shows]);

  // Filter shows
  const filteredShows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return shows.filter((s) => {
      const normName = s.artistName ? s.artistName.trim().toLowerCase() : '';
      const hasPhoto =
        photosMap.has(s.artistCode) ||
        (normName && photosMap.has(normName)) ||
        Boolean(artists.find((a) => a.artistName.trim().toLowerCase() === normName)?.photoUrl);

      if (filterPhoto === 'with-photo' && !hasPhoto) return false;
      if (filterPhoto === 'without-photo' && hasPhoto) return false;

      if (filterState !== 'ALL' && !isSameState(s.state, filterState)) return false;

      if (q) {
        return (
          s.artistName.toLowerCase().includes(q) ||
          s.venue.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.showCode.toLowerCase().includes(q) ||
          s.artistCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shows, searchTerm, filterState, filterPhoto, photosMap, artists]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredShows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedShows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShows.slice(start, start + pageSize);
  }, [filteredShows, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-[#171226] p-4 sm:p-5 rounded-2xl border border-[#282141] shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8577]" />
          <input
            type="text"
            placeholder="Buscar por artista, local, cidade, código do show..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1E1833] border border-[#282141] rounded-xl text-xs text-[#ECE5D1] placeholder-[#8A8577] focus:outline-none focus:border-[#2FB8BA]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Photo filter */}
          <select
            value={filterPhoto}
            onChange={(e) => {
              setFilterPhoto(e.target.value as any);
              setPage(1);
            }}
            className="bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
          >
            <option value="all">Todas as Fotos</option>
            <option value="with-photo">Com Foto de Artista</option>
            <option value="without-photo">Sem Foto Cadastrada</option>
          </select>

          {/* State filter */}
          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setPage(1);
            }}
            className="bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
          >
            <option value="ALL">Todos os Estados</option>
            {uniqueStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <span className="text-xs font-mono text-[#B3AE9F] pl-2">
            {filteredShows.length.toLocaleString()} shows
          </span>
        </div>
      </div>

      {/* Shows Table */}
      <div className="bg-[#171226] rounded-2xl border border-[#282141] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#ECE5D1]">
            <thead className="bg-[#100C1F] uppercase text-[10px] font-extrabold tracking-wider text-[#B3AE9F] border-b border-[#282141]">
              <tr>
                <th className="py-3 px-4">Artista</th>
                <th className="py-3 px-4">Código Artista</th>
                <th className="py-3 px-4">Status Foto</th>
                <th className="py-3 px-4">Local / Espaço</th>
                <th className="py-3 px-4">Data / Dia</th>
                <th className="py-3 px-4">Cidade / UF</th>
                <th className="py-3 px-4">Código Show</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282141]">
              {paginatedShows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8A8577]">
                    Nenhum show encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedShows.map((show) => {
                  const normName = show.artistName ? show.artistName.trim().toLowerCase() : '';
                  const photoUrl =
                    photosMap.get(show.artistCode) ||
                    (normName ? photosMap.get(normName) : undefined) ||
                    artists.find((a) => a.artistName.trim().toLowerCase() === normName)?.photoUrl;
                  const hasPhoto = Boolean(photoUrl);

                  return (
                    <tr
                      key={show.id}
                      className="hover:bg-[#1E1833]/70 transition-colors group"
                    >
                      {/* Artista */}
                      <td className="py-3 px-4 font-bold text-[#ECE5D1] flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#100C1F] shrink-0 border border-[#282141]">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={show.artistName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8A8577]">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <span className="truncate max-w-[160px]">{show.artistName}</span>
                      </td>

                      {/* Código Artista */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#4FDCDE]">
                        {show.artistCode}
                      </td>

                      {/* Status Foto */}
                      <td className="py-3 px-4">
                        {hasPhoto ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2FB8BA]/15 text-[#4FDCDE] border border-[#2FB8BA]/30">
                            <CheckCircle2 className="w-3 h-3 text-[#22E3E6]" /> Vinculada
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenPhotoManager(show.artistCode)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/20 hover:bg-[#FFD60A]/20 transition-colors"
                          >
                            <AlertCircle className="w-3 h-3" /> + Adicionar
                          </button>
                        )}
                      </td>

                      {/* Local */}
                      <td className="py-3 px-4 text-[#ECE5D1] truncate max-w-[160px]">
                        {show.venue}
                      </td>

                      {/* Data */}
                      <td className="py-3 px-4 font-mono text-[#B3AE9F] whitespace-nowrap">
                        {cleanDateOnly(show.date)}
                      </td>

                      {/* Cidade / UF */}
                      <td className="py-3 px-4">
                        <span className="text-[#ECE5D1]">{show.city}</span>{' '}
                        <strong className="text-[#4FDCDE] font-mono">({normalizeStateUF(show.state) || show.state})</strong>
                      </td>

                      {/* Código Show */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#8A8577]">
                        {show.showCode}
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectShowForCard(show)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] bg-[#2FB8BA]/10 hover:bg-[#2FB8BA]/20 text-[#4FDCDE] border border-[#2FB8BA]/30 hover:border-[#4FDCDE] transition-all active:scale-95"
                          title="Gerar Card deste Show"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#2FB8BA]" />
                          <span>Gerar Card</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#282141] flex items-center justify-between text-xs text-[#B3AE9F]">
            <span>
              Página {currentPage} de {totalPages} ({filteredShows.length.toLocaleString()} total)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-[#1E1833] hover:bg-[#282141] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECE5D1] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[#ECE5D1]">
                {currentPage}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg bg-[#1E1833] hover:bg-[#282141] disabled:opacity-30 disabled:cursor-not-allowed text-[#ECE5D1] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
