import React, { useState } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import { ShowItem } from '../types';

interface CsvUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportShows: (shows: ShowItem[]) => void;
}

export const CsvUploaderModal: React.FC<CsvUploaderModalProps> = ({
  isOpen,
  onClose,
  onImportShows,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!csvContent.trim()) {
      setStatus('Por favor cole o conteúdo do CSV.');
      return;
    }
    try {
      const lines = csvContent.trim().split('\n');
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const shows: ShowItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((r) => r.trim());
        if (row.length < 3) continue;
        const artist = row[0] || 'Artista';
        const venue = row[1] || 'Local';
        const city = row[2] || 'São Paulo';
        const date = row[3] || '2024-05-10';

        shows.push({
          id: `imported_${Date.now()}_${i}`,
          showCode: `IMPORT_${i}`,
          artistCode: artist.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          artistName: artist,
          venue,
          city,
          state: row[4] || 'SP',
          date,
        });
      }

      if (shows.length > 0) {
        onImportShows(shows);
        onClose();
      } else {
        setStatus('Nenhum show válido encontrado.');
      }
    } catch (e) {
      setStatus('Erro ao processar CSV.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#171226] border border-[#282141] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282141] pb-3">
          <h3 className="text-base font-bold text-[#ECE5D1]">Importar Shows CSV</h3>
          <button onClick={onClose} className="p-1 text-[#8A8577] hover:text-[#ECE5D1]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#B3AE9F]">
          Cole o texto CSV no formato: <code>Artista, Local, Cidade, Data, UF</code>
        </p>

        <textarea
          rows={6}
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder="Coldplay, Morumbi, São Paulo, 18/03/2023, SP"
          className="w-full bg-[#100C1F] border border-[#282141] rounded-xl p-3 text-xs text-[#ECE5D1] font-mono focus:outline-none focus:border-[#2FB8BA]"
        />

        {status && <p className="text-xs text-amber-400">{status}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#8A8577] hover:text-[#ECE5D1]"
          >
            Cancelar
          </button>
          <button
            onClick={handleParse}
            className="px-5 py-2.5 rounded-xl bg-[#2FB8BA] text-[#100C1F] font-bold text-xs hover:bg-[#22E3E6]"
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
};
