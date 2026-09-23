import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { toPng } from 'html-to-image';
import { Archive, CheckCircle2, RefreshCw } from 'lucide-react';
import { ShowItem, CardTemplateConfig } from '../types';
import { EventCard } from './EventCard';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: ShowItem[];
  photosMap: Map<string, string>;
  config: CardTemplateConfig;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  shows,
  photosMap,
  config,
}) => {
  const [exportScope, setExportScope] = useState<'with-photo' | 'first-20' | 'first-50' | 'all'>('with-photo');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalToExport, setTotalToExport] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Hidden rendering container
  const renderContainerRef = useRef<HTMLDivElement>(null);
  const [currentRenderShow, setCurrentRenderShow] = useState<ShowItem | null>(null);

  if (!isOpen) return null;

  // Filter shows based on scope
  const getSelectedShows = (): ShowItem[] => {
    let filtered = shows;
    if (exportScope === 'with-photo') {
      filtered = shows.filter((s) => photosMap.has(s.artistCode));
    }
    if (exportScope === 'first-20') return filtered.slice(0, 20);
    if (exportScope === 'first-50') return filtered.slice(0, 50);
    if (exportScope === 'with-photo') return filtered.slice(0, 50); // safety cap per zip batch
    return filtered.slice(0, 50);
  };

  const targetShows = getSelectedShows();

  const handleStartBatchExport = async () => {
    if (targetShows.length === 0) return;
    setIsExporting(true);
    setProgress(0);
    setTotalToExport(targetShows.length);
    setIsDone(false);

    const zip = new JSZip();
    const folder = zip.folder('cards_shows_livvo');

    try {
      for (let i = 0; i < targetShows.length; i++) {
        const show = targetShows[i];
        setCurrentRenderShow(show);

        // Wait a frame for React to mount the card in the hidden container
        await new Promise((resolve) => setTimeout(resolve, 150));

        if (renderContainerRef.current) {
          const cardEl = renderContainerRef.current.firstElementChild as HTMLElement;
          if (cardEl) {
            const dataUrl = await toPng(cardEl, {
              pixelRatio: 2,
              cacheBust: true,
            });

            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
            const safeArtist = show.artistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const safeCity = show.city.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `livvo_card_${safeArtist}_${safeCity}_${show.showCode}.png`;

            folder?.file(fileName, base64Data, { base64: true });
          }
        }

        setProgress(i + 1);
      }

      // Generate Zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `livvo_cards_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setIsDone(true);
    } catch (err) {
      console.error('Erro no lote:', err);
    } finally {
      setIsExporting(false);
      setCurrentRenderShow(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      {/* Hidden container for off-screen rendering during zip generation */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" ref={renderContainerRef}>
        {currentRenderShow && (
          <EventCard
            show={currentRenderShow}
            photoUrl={photosMap.get(currentRenderShow.artistCode) || null}
            config={config}
            isExporting={true}
          />
        )}
      </div>

      <div className="bg-[#171226] border border-[#282141] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#282141] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2FB8BA]/10 text-[#4FDCDE]">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#ECE5D1] text-base">Exportar Cards em Lote</h3>
              <p className="text-xs text-[#B3AE9F]">Gere e baixe múltiplos cards com a marca Livvo em ZIP.</p>
            </div>
          </div>
          {!isExporting && (
            <button onClick={onClose} className="text-[#B3AE9F] hover:text-[#ECE5D1]">
              ✕
            </button>
          )}
        </div>

        {!isExporting && !isDone && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#ECE5D1] block">
                Selecione o escopo da exportação:
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#1E1833] border border-[#282141] cursor-pointer hover:bg-[#282141] text-xs text-[#ECE5D1]">
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'with-photo'}
                    onChange={() => setExportScope('with-photo')}
                    className="text-[#2FB8BA] focus:ring-0"
                  />
                  <div>
                    <span className="font-bold block">Apenas Shows com Foto de Artista</span>
                    <span className="text-[11px] text-[#B3AE9F]">
                      Garante que todos os cards gerados tenham imagem oficial do artista.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#1E1833] border border-[#282141] cursor-pointer hover:bg-[#282141] text-xs text-[#ECE5D1]">
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'first-20'}
                    onChange={() => setExportScope('first-20')}
                    className="text-[#2FB8BA] focus:ring-0"
                  />
                  <div>
                    <span className="font-bold block">Primeiros 20 Shows</span>
                    <span className="text-[11px] text-[#B3AE9F]">
                      Lote rápido para testes e validação gráfica.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#1E1833] border border-[#282141] cursor-pointer hover:bg-[#282141] text-xs text-[#ECE5D1]">
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'first-50'}
                    onChange={() => setExportScope('first-50')}
                    className="text-[#2FB8BA] focus:ring-0"
                  />
                  <div>
                    <span className="font-bold block">Lote de 50 Shows</span>
                    <span className="text-[11px] text-[#B3AE9F]">
                      Gera 50 cards em alta definição empacotados no arquivo ZIP.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#2FB8BA]/10 border border-[#2FB8BA]/30 text-[#4FDCDE] text-xs">
              Serão renderizados <strong>{targetShows.length} cards</strong> com o template{' '}
              <strong className="text-[#ECE5D1] uppercase">{config.templateId}</strong> ({config.aspectRatio}).
            </div>

            <button
              onClick={handleStartBatchExport}
              disabled={targetShows.length === 0}
              className="w-full py-3 rounded-xl font-extrabold text-xs bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/20 transition-all disabled:opacity-40"
            >
              Iniciar Renderização e Gerar ZIP
            </button>
          </div>
        )}

        {isExporting && (
          <div className="text-center py-6 space-y-4">
            <RefreshCw className="w-12 h-12 text-[#2FB8BA] animate-spin mx-auto" />
            <div>
              <h4 className="font-bold text-[#ECE5D1] text-base">Gerando Cards em Alta Resolução...</h4>
              <p className="text-xs text-[#B3AE9F]">
                Renderizando card {progress} de {totalToExport}
              </p>
            </div>
            <div className="w-full bg-[#100C1F] h-2.5 rounded-full overflow-hidden border border-[#282141]">
              <div
                className="bg-[#2FB8BA] h-full transition-all duration-150 rounded-full"
                style={{ width: `${(progress / Math.max(1, totalToExport)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {isDone && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#2FB8BA]/15 text-[#22E3E6] border border-[#2FB8BA]/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-[#ECE5D1] text-base">Arquivo ZIP Criado e Baixado!</h4>
              <p className="text-xs text-[#B3AE9F]">
                Foram gerados e salvos {totalToExport} cards com sucesso.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#1E1833] hover:bg-[#282141] text-[#ECE5D1] transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
