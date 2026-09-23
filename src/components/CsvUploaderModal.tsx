import React, { useState, useRef, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Link,
  FileText,
} from 'lucide-react';
import { ColumnMapping, ShowItem, ArtistItem } from '../types';
import { detectColumnMapping, parseAndProcessCsv } from '../services/csvParser';
import { dbService } from '../services/db';

interface CsvUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (shows: ShowItem[], artists: ArtistItem[]) => void;
  onLoadSampleData: () => void;
  initialFile?: File | null;
}

export const CsvUploaderModal: React.FC<CsvUploaderModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  onLoadSampleData,
  initialFile,
}) => {
  const [step, setStep] = useState<'select-file' | 'map-columns' | 'processing' | 'done'>('select-file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    showCode: '',
    artistCode: '',
    artistName: '',
    venue: '',
    date: '',
    city: '',
    state: '',
    photoUrl: '',
  });

  const [processedRows, setProcessedRows] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [importedShows, setImportedShows] = useState<ShowItem[]>([]);
  const [importedArtists, setImportedArtists] = useState<ArtistItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const readWithFileReaderFallback = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const firstLine = content.replace(/^\uFEFF/, '').split(/\r\n|\n/)[0];
      if (!firstLine) {
        setErrorMessage('Arquivo CSV vazio ou ilegível');
        return;
      }
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semiCount = (firstLine.match(/;/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      let delimiter = ',';
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

      const detectedHeaders = firstLine
        .split(delimiter)
        .map((h) => h.replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);

      if (detectedHeaders.length === 0) {
        setErrorMessage('Não foi possível identificar colunas no arquivo CSV.');
        return;
      }

      setHeaders(detectedHeaders);
      const autoMap = detectColumnMapping(detectedHeaders);
      setMapping(autoMap);
      setStep('map-columns');
    };

    reader.onerror = () => {
      setErrorMessage('Erro ao ler arquivo');
    };

    reader.readAsText(file.slice(0, 10240));
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!file) return;

      setSelectedFile(file);
      setErrorMessage(null);

      // Extract headers using Papa Parse with auto-delimiter sniffing and fallback
      Papa.parse(file, {
        preview: 3,
        skipEmptyLines: 'greedy',
        header: false,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            readWithFileReaderFallback(file);
            return;
          }

          const rawHeaders = (results.data[0] as string[]) || [];
          const detectedHeaders = rawHeaders
            .map((h) =>
              String(h || '')
                .replace(/^\uFEFF/, '')
                .replace(/^["']|["']$/g, '')
                .trim()
            )
            .filter(Boolean);

          if (detectedHeaders.length === 0) {
            readWithFileReaderFallback(file);
            return;
          }

          setHeaders(detectedHeaders);
          const autoMap = detectColumnMapping(detectedHeaders);
          setMapping(autoMap);
          setStep('map-columns');
        },
        error: (err) => {
          console.warn('Papa parse preview error, using fallback:', err);
          readWithFileReaderFallback(file);
        },
      });
    },
    [readWithFileReaderFallback]
  );

  // Auto-process initialFile when passed
  useEffect(() => {
    if (initialFile && isOpen) {
      processFile(initialFile);
    }
  }, [initialFile, isOpen, processFile]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if cursor actually leaves current element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;

    if (!mapping.artistName || !mapping.venue || !mapping.city) {
      setErrorMessage('Por favor selecione as colunas principais (Artista, Local e Cidade)');
      return;
    }

    setStep('processing');
    setProcessedRows(0);
    setErrorMessage(null);

    try {
      const allShows: ShowItem[] = [];

      const result = await parseAndProcessCsv({
        file: selectedFile,
        mapping,
        onProgress: (processed, estimated) => {
          setProcessedRows(processed);
          setEstimatedTotal(estimated);
        },
        onChunkReady: async (chunk) => {
          allShows.push(...chunk);
          await dbService.saveShowsBatch(chunk, false);
        },
      });

      const artistsArray = Array.from(result.artistsMap.values());
      await dbService.saveArtists(artistsArray);

      // Save any auto-detected photo URLs
      const photoMapToSave = new Map<string, string>();
      for (const artist of artistsArray) {
        if (artist.photoUrl) {
          photoMapToSave.set(artist.artistCode, artist.photoUrl);
        }
      }
      if (photoMapToSave.size > 0) {
        await dbService.batchUpdateArtistPhotos(photoMapToSave);
      }

      setImportedShows(allShows);
      setImportedArtists(artistsArray);
      setStep('done');

      onImportComplete(allShows, artistsArray);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Falha no processamento: ${err.message || 'Erro desconhecido'}`);
      setStep('map-columns');
    }
  };

  const progressPercent = estimatedTotal > 0 ? Math.min(100, Math.round((processedRows / estimatedTotal) * 100)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          processFile(files[0]);
        }
      }}
    >
      <div className="bg-[#171226] border border-[#282141] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282141] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#2FB8BA]/10 text-[#4FDCDE] border border-[#2FB8BA]/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#ECE5D1]">Importar Catálogo de Shows (CSV)</h2>
              <p className="text-xs text-[#B3AE9F]">
                Processamento ultra-rápido com indexação contínua em IndexedDB.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#B3AE9F] hover:text-[#ECE5D1] text-lg p-2 rounded-xl hover:bg-[#1E1833] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Select File */}
        {step === 'select-file' && (
          <div className="space-y-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv,text/plain,application/vnd.ms-excel"
              className="hidden"
            />

            <div
              id="csv-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-[#2FB8BA] bg-[#2FB8BA]/20 ring-4 ring-[#2FB8BA]/30 shadow-2xl scale-[1.01]'
                  : 'border-[#282141] hover:border-[#2FB8BA] hover:bg-[#1E1833]/60'
              } group`}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                  isDragging
                    ? 'bg-[#2FB8BA] text-[#100C1F] scale-110 animate-bounce'
                    : 'bg-[#2FB8BA]/10 text-[#4FDCDE] group-hover:scale-110'
                }`}
              >
                {isDragging ? <FileSpreadsheet className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
              </div>

              <h3 className="text-base font-bold text-[#ECE5D1] mb-1">
                {isDragging
                  ? 'Solte o arquivo CSV aqui para absorver!'
                  : 'Arraste seu arquivo CSV ou clique para selecionar'}
              </h3>
              <p className="text-xs text-[#B3AE9F] max-w-md mx-auto">
                {isDragging
                  ? 'Detectando colunas e formato de delimitador automaticamente...'
                  : 'Compatível com separadores por vírgula (,), ponto e vírgula (;) ou tabulações exportadas do Excel.'}
              </p>
            </div>

            {/* Quick Demo Sample Option */}
            <div className="p-4 rounded-2xl bg-[#1E1833] border border-[#282141] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#FFD60A] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#ECE5D1]">Não tem o CSV em mãos agora?</h4>
                  <p className="text-xs text-[#B3AE9F]">
                    Carregue nossa base de demonstração com shows de grandes artistas brasileiros e fotos já vinculadas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onLoadSampleData();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FFD60A] hover:bg-[#FFE14D] text-[#100C1F] shrink-0 transition-colors shadow-md"
              >
                Carregar Demonstração
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Map Columns */}
        {step === 'map-columns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#ECE5D1]">
                  Mapeamento de Colunas ({selectedFile?.name})
                </h3>
                <p className="text-xs text-[#B3AE9F]">
                  Identificamos as colunas do seu arquivo. Ajuste se necessário.
                </p>
              </div>
              <span className="text-xs font-mono text-[#4FDCDE] bg-[#2FB8BA]/10 px-2.5 py-1 rounded-full border border-[#2FB8BA]/20">
                {headers.length} colunas encontradas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Código do Artista */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Código Exclusivo do Artista
                </label>
                <select
                  value={mapping.artistCode}
                  onChange={(e) => setMapping((p) => ({ ...p, artistCode: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Selecione a coluna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Código do Show */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Código Específico do Show
                </label>
                <select
                  value={mapping.showCode}
                  onChange={(e) => setMapping((p) => ({ ...p, showCode: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Selecione a coluna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome do Artista */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Nome do Artista
                </label>
                <select
                  value={mapping.artistName}
                  onChange={(e) => setMapping((p) => ({ ...p, artistName: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Selecione a coluna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Local do Show */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Local / Espaço
                </label>
                <select
                  value={mapping.venue}
                  onChange={(e) => setMapping((p) => ({ ...p, venue: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Selecione a coluna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dia do Show */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Dia / Data do Show
                </label>
                <select
                  value={mapping.date}
                  onChange={(e) => setMapping((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Selecione a coluna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cidade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Cidade
                </label>
                <select
                  value={mapping.city}
                  onChange={(e) => setMapping((p) => ({ ...p, city: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Selecione a coluna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Estado (UF)
                </label>
                <select
                  value={mapping.state}
                  onChange={(e) => setMapping((p) => ({ ...p, state: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Selecione a coluna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL da Foto do Artista (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4FDCDE] flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#2FB8BA]" />
                  Link da Foto do Artista (Opcional)
                </label>
                <select
                  value={mapping.photoUrl || ''}
                  onChange={(e) => setMapping((p) => ({ ...p, photoUrl: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Nenhuma (vincular depois)</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL do Pôster Oficial / Flyer do Show (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#4FDCDE] flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-[#2FB8BA]" />
                  Pôster / Flyer Oficial do Show (Opcional)
                </label>
                <select
                  value={mapping.posterUrl || ''}
                  onChange={(e) => setMapping((p) => ({ ...p, posterUrl: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Nenhum (usar foto do artista ou buscar pôster)</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome da Turnê (Opcional) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#ECE5D1] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2FB8BA]" />
                  Nome da Turnê / Tour (Opcional)
                </label>
                <select
                  value={mapping.tourName || ''}
                  onChange={(e) => setMapping((p) => ({ ...p, tourName: e.target.value }))}
                  className="w-full bg-[#1E1833] border border-[#282141] rounded-xl px-3 py-2 text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
                >
                  <option value="">Nenhum (usar padrão do show)</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#282141]">
              <button
                onClick={() => setStep('select-file')}
                className="text-xs font-bold text-[#B3AE9F] hover:text-[#ECE5D1]"
              >
                ← Escolher outro arquivo
              </button>

              <button
                onClick={handleStartImport}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/20 transition-all"
              >
                <span>Iniciar Processamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Processing */}
        {step === 'processing' && (
          <div className="text-center py-8 space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <RefreshCw className="w-20 h-20 text-[#2FB8BA] animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#ECE5D1]">Processando Catálogo de Shows...</h3>
              <p className="text-xs text-[#B3AE9F]">
                Indexando shows e extraindo artistas com códigos exclusivos.
              </p>
              <div className="text-2xl font-mono font-extrabold text-[#4FDCDE] pt-2">
                {processedRows.toLocaleString()} linhas
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#100C1F] h-2.5 rounded-full overflow-hidden border border-[#282141]">
              <div
                className="bg-[#2FB8BA] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === 'done' && (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#2FB8BA]/15 text-[#22E3E6] border border-[#2FB8BA]/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#ECE5D1]">Importação Concluída com Sucesso!</h3>
              <p className="text-xs text-[#B3AE9F]">
                Todos os shows e artistas foram indexados e gravados com segurança no navegador.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 bg-[#100C1F] rounded-2xl border border-[#282141]">
              <div>
                <span className="text-xs text-[#B3AE9F] block">Shows Catalogados</span>
                <span className="text-xl font-bold text-[#ECE5D1] font-mono">
                  {processedRows.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-[#282141]">
                <span className="text-xs text-[#B3AE9F] block">Artistas Únicos</span>
                <span className="text-xl font-bold text-[#4FDCDE] font-mono">
                  {importedArtists.length.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-extrabold text-sm bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/20 transition-all"
            >
              Abrir Estúdio & Fotos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
