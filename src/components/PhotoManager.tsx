import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Search,
  FolderArchive,
  Link,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ArtistItem, ImageMatchResult } from '../types';
import {
  matchFilesAgainstArtists,
  matchZipAgainstArtists,
  fileToDataUrl,
} from '../services/imageMatcher';
import { autoFetchArtistPhoto } from '../services/artistPhotoService';
import { MediaSearchModal } from './MediaSearchModal';

interface PhotoManagerProps {
  artists: ArtistItem[];
  photosMap: Map<string, string>;
  onUpdateArtistPhoto: (artistCode: string, photoUrl: string, source: 'upload' | 'url' | 'sample' | 'auto') => Promise<void>;
  onBatchUpdatePhotos: (matchedMap: Map<string, string>) => Promise<number>;
  onNavigateToShowCard: (artistCode: string, posterUrl?: string) => void;
  highlightArtistCode?: string | null;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  artists,
  photosMap,
  onUpdateArtistPhoto,
  onBatchUpdatePhotos,
  onNavigateToShowCard,
  highlightArtistCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with-photo' | 'without-photo'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResults, setMatchResults] = useState<ImageMatchResult[] | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);

  // Auto-fetching state
  const [isBatchAutoFetching, setIsBatchAutoFetching] = useState(false);
  const [batchAutoProgress, setBatchAutoProgress] = useState<{ current: number; total: number; found: number } | null>(null);
  const [singleAutoFetchingCode, setSingleAutoFetchingCode] = useState<string | null>(null);

  // Single URL modal state
  const [urlModalArtist, setUrlModalArtist] = useState<ArtistItem | null>(null);
  const [inputUrl, setInputUrl] = useState('');

  // Online Media Search Modal state (Deezer / Apple Music)
  const [searchModalArtist, setSearchModalArtist] = useState<ArtistItem | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const [singleUploadTargetCode, setSingleUploadTargetCode] = useState<string | null>(null);

  // Stats calculation
  const totalArtists = artists.length;
  const artistsWithPhoto = artists.filter((a) => photosMap.has(a.artistCode) || Boolean(a.photoUrl)).length;
  const artistsWithoutPhoto = totalArtists - artistsWithPhoto;
  const coveragePercent = totalArtists > 0 ? Math.round((artistsWithPhoto / totalArtists) * 100) : 0;

  // Filtered artists
  const filteredArtists = artists.filter((a) => {
    const hasPhoto = photosMap.has(a.artistCode) || Boolean(a.photoUrl);
    if (filterMode === 'with-photo' && !hasPhoto) return false;
    if (filterMode === 'without-photo' && hasPhoto) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        a.artistName.toLowerCase().includes(q) ||
        a.artistCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Multi-file upload
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      const fileArray = Array.from(files);
      const isZip = fileArray.length === 1 && fileArray[0].name.toLowerCase().endsWith('.zip');

      let matchedMap: Map<string, string>;
      let results: ImageMatchResult[];

      if (isZip) {
        const res = await matchZipAgainstArtists(fileArray[0], artists);
        matchedMap = res.matchedMap;
        results = res.results;
      } else {
        const res = await matchFilesAgainstArtists(fileArray, artists);
        matchedMap = res.matchedMap;
        results = res.results;
      }

      if (matchedMap.size > 0) {
        await onBatchUpdatePhotos(matchedMap);
      }

      setMatchResults(results);
      setShowMatchModal(true);
    } catch (err) {
      console.error('Erro ao associar imagens:', err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  // Handle Single Image Upload
  const handleSingleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !singleUploadTargetCode) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      await onUpdateArtistPhoto(singleUploadTargetCode, dataUrl, 'upload');
    } catch (err) {
      console.error('Erro ao carregar foto:', err);
    } finally {
      setSingleUploadTargetCode(null);
      if (singleFileInputRef.current) singleFileInputRef.current.value = '';
    }
  };

  // Handle URL Save
  const handleSaveUrl = async () => {
    if (!urlModalArtist || !inputUrl.trim()) return;
    try {
      await onUpdateArtistPhoto(urlModalArtist.artistCode, inputUrl.trim(), 'url');
      setUrlModalArtist(null);
      setInputUrl('');
    } catch (err) {
      console.error('Erro ao salvar URL:', err);
    }
  };

  // Batch Auto Fetch from Deezer / Web for all artists without photo
  const handleBatchAutoFetchPhotos = async () => {
    const missing = artists.filter((a) => !photosMap.has(a.artistCode) && !a.photoUrl);
    if (missing.length === 0) return;

    setIsBatchAutoFetching(true);
    setBatchAutoProgress({ current: 0, total: missing.length, found: 0 });

    const matchedMap = new Map<string, string>();

    for (let i = 0; i < missing.length; i++) {
      const art = missing[i];
      try {
        const result = await autoFetchArtistPhoto(art.artistName);
        if (result && result.photoUrl) {
          matchedMap.set(art.artistCode, result.photoUrl);
        }
      } catch (e) {
        console.warn('Erro ao buscar foto para', art.artistName, e);
      }
      setBatchAutoProgress({
        current: i + 1,
        total: missing.length,
        found: matchedMap.size,
      });
      // Small pause to prevent rate limiting
      await new Promise((r) => setTimeout(r, 120));
    }

    if (matchedMap.size > 0) {
      await onBatchUpdatePhotos(matchedMap);
    }

    setTimeout(() => {
      setIsBatchAutoFetching(false);
      setBatchAutoProgress(null);
    }, 2500);
  };

  // Single Auto Fetch for one artist
  const handleSingleAutoFetchPhoto = async (artist: ArtistItem) => {
    setSingleAutoFetchingCode(artist.artistCode);
    try {
      const res = await autoFetchArtistPhoto(artist.artistName);
      if (res && res.photoUrl) {
        await onUpdateArtistPhoto(artist.artistCode, res.photoUrl, 'auto');
      }
    } catch (e) {
      console.warn('Erro ao buscar foto para', artist.artistName, e);
    } finally {
      setSingleAutoFetchingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={zipInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        accept=".zip,application/zip"
        className="hidden"
      />
      <input
        type="file"
        ref={singleFileInputRef}
        onChange={handleSingleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Banner: Metrics & Batch Association */}
      <div className="bg-[#171226] rounded-3xl p-6 border border-[#282141] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#2FB8BA]/10 text-[#4FDCDE]">
                <ImageIcon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-[#ECE5D1]">
                  Base de Fotos dos Artistas
                </h2>
                <p className="text-xs text-[#B3AE9F]">
                  Associe fotos individuais ou em lote (ZIP) ao código exclusivo de cada artista.
                </p>
              </div>
            </div>

            {/* Coverage Meter */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <div>
                <span className="text-xs text-[#B3AE9F] block font-medium">Total de Artistas</span>
                <span className="text-2xl font-extrabold text-[#ECE5D1] font-mono">
                  {totalArtists.toLocaleString()}
                </span>
              </div>

              <div className="border-l border-[#282141] pl-6">
                <span className="text-xs text-[#4FDCDE] block font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22E3E6]" /> Com Foto Vinculada
                </span>
                <span className="text-2xl font-extrabold text-[#22E3E6] font-mono">
                  {artistsWithPhoto.toLocaleString()}{' '}
                  <span className="text-xs text-[#B3AE9F] font-normal">({coveragePercent}%)</span>
                </span>
              </div>

              <div className="border-l border-[#282141] pl-6">
                <span className="text-xs text-[#FFD60A] block font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FFD60A]" /> Sem Foto
                </span>
                <span className="text-2xl font-extrabold text-[#FFD60A] font-mono">
                  {artistsWithoutPhoto.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Batch Actions Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="batch-auto-fetch-btn"
              onClick={handleBatchAutoFetchPhotos}
              disabled={isBatchAutoFetching || isProcessing || artistsWithoutPhoto === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-extrabold text-sm bg-[#FFD60A] hover:bg-[#FFE14D] text-[#100C1F] shadow-lg shadow-[#FFD60A]/20 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              title="Busca fotos oficiais de todos os artistas sem foto via API pública do Deezer"
            >
              {isBatchAutoFetching ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#100C1F]" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#100C1F]" />
              )}
              <span>
                {isBatchAutoFetching
                  ? `Buscando (${batchAutoProgress?.current}/${batchAutoProgress?.total})...`
                  : 'Buscar Fotos Automáticas (Deezer)'}
              </span>
            </button>

            <button
              id="batch-upload-images-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isBatchAutoFetching}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-extrabold text-sm bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#100C1F]" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Importar Fotos</span>
            </button>

            <button
              id="batch-upload-zip-btn"
              onClick={() => zipInputRef.current?.click()}
              disabled={isProcessing || isBatchAutoFetching}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm bg-[#1E1833] hover:bg-[#282141] text-[#ECE5D1] border border-[#282141] active:scale-95 transition-all disabled:opacity-50"
              title="Importar arquivo ZIP com fotos nomeadas com o código ou nome do artista"
            >
              <FolderArchive className="w-4 h-4 text-[#2FB8BA]" />
              <span>Importar ZIP</span>
            </button>
          </div>
        </div>

        {/* Association Guide Tooltip & Automation Button */}
        <div className="mt-4 pt-4 border-t border-[#282141] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#B3AE9F]">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#FFD60A] shrink-0 mt-0.5" />
            <span>
              <strong>Associação Automática:</strong> Nomeie os arquivos pelo código do artista (ex: <code className="text-[#4FDCDE] font-mono bg-[#1E1833] px-1.5 py-0.5 rounded">ART-001.jpg</code>) ou inclua coluna de link no CSV.
            </span>
          </div>
          <button
            onClick={() => setShowAutomationModal(true)}
            className="text-xs font-bold text-[#2FB8BA] hover:text-[#22E3E6] underline shrink-0 cursor-pointer"
          >
            Como automatizar a base de fotos?
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#171226] p-4 rounded-2xl border border-[#282141]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8577]" />
          <input
            type="text"
            placeholder="Buscar por artista ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1E1833] border border-[#282141] rounded-xl text-xs text-[#ECE5D1] placeholder-[#8A8577] focus:outline-none focus:border-[#2FB8BA]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-[#2FB8BA] text-[#100C1F] shadow-md'
                : 'bg-[#1E1833] text-[#B3AE9F] hover:bg-[#282141] hover:text-[#ECE5D1]'
            }`}
          >
            Todos ({totalArtists})
          </button>
          <button
            onClick={() => setFilterMode('with-photo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'with-photo'
                ? 'bg-[#22E3E6] text-[#100C1F] shadow-md'
                : 'bg-[#1E1833] text-[#B3AE9F] hover:bg-[#282141] hover:text-[#ECE5D1]'
            }`}
          >
            Com Foto ({artistsWithPhoto})
          </button>
          <button
            onClick={() => setFilterMode('without-photo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'without-photo'
                ? 'bg-[#FFD60A] text-[#100C1F] shadow-md'
                : 'bg-[#1E1833] text-[#B3AE9F] hover:bg-[#282141] hover:text-[#ECE5D1]'
            }`}
          >
            Sem Foto ({artistsWithoutPhoto})
          </button>
        </div>
      </div>

      {/* Artists Grid */}
      {filteredArtists.length === 0 ? (
        <div className="text-center py-16 bg-[#171226] rounded-3xl border border-[#282141]">
          <ImageIcon className="w-12 h-12 mx-auto text-[#8A8577] mb-3" />
          <p className="text-[#B3AE9F] font-medium text-sm">Nenhum artista encontrado para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredArtists.map((artist) => {
            const photoUrl = photosMap.get(artist.artistCode) || artist.photoUrl;
            const isHighlighted = highlightArtistCode === artist.artistCode;

            return (
              <div
                key={artist.artistCode}
                id={`artist-card-${artist.artistCode}`}
                className={`group relative flex flex-col bg-[#171226] rounded-2xl border transition-all overflow-hidden ${
                  isHighlighted
                    ? 'border-[#2FB8BA] ring-2 ring-[#2FB8BA]/50 shadow-[#2FB8BA]/20 shadow-xl'
                    : 'border-[#282141] hover:border-[#2FB8BA]/40'
                }`}
              >
                {/* Photo Thumbnail or Fallback */}
                <div className="relative aspect-[4/3] w-full bg-[#100C1F] overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={artist.artistName}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#100C1F] to-[#171226]">
                      <ImageIcon className="w-8 h-8 text-[#8A8577] mb-2" />
                      <span className="text-[11px] font-semibold text-[#8A8577] uppercase tracking-wider">
                        Sem Foto Cadastrada
                      </span>
                    </div>
                  )}

                  {/* Status Tag */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#100C1F]/80 backdrop-blur-md text-[#4FDCDE] border border-[#282141]">
                      {artist.artistCode}
                    </span>
                  </div>

                  {photoUrl && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2FB8BA] text-[#100C1F] shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Foto OK
                      </span>
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[#ECE5D1] text-sm truncate" title={artist.artistName}>
                      {artist.artistName}
                    </h3>
                    <p className="text-[11px] text-[#B3AE9F]">
                      {artist.showsCount} {artist.showsCount === 1 ? 'show catalogado' : 'shows catalogados'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#282141]">
                    <button
                      onClick={() => setSearchModalArtist(artist)}
                      className="px-2 py-1.5 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#100C1F] text-[11px] font-extrabold flex items-center gap-1 transition-all shadow cursor-pointer"
                      title="Buscar mídias online no Deezer e Apple Music (Pôsteres e Fotos)"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Online</span>
                    </button>

                    <button
                      onClick={() => {
                        setSingleUploadTargetCode(artist.artistCode);
                        singleFileInputRef.current?.click();
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-[#1E1833] hover:bg-[#282141] text-[#ECE5D1] border border-[#282141] transition-colors text-center"
                      title="Fazer upload de foto do seu computador"
                    >
                      Upload
                    </button>

                    <button
                      onClick={() => {
                        setUrlModalArtist(artist);
                        setInputUrl(photoUrl || '');
                      }}
                      className="p-1.5 rounded-xl bg-[#1E1833] hover:bg-[#282141] text-[#B3AE9F] border border-[#282141] transition-colors"
                      title="Inserir link URL de imagem"
                    >
                      <Link className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onNavigateToShowCard(artist.artistCode)}
                      className="p-1.5 rounded-xl bg-[#2FB8BA]/10 hover:bg-[#2FB8BA]/20 text-[#4FDCDE] border border-[#2FB8BA]/20 transition-colors"
                      title="Gerar Card deste Artista"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Matching Results Modal */}
      {showMatchModal && matchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#171226] border border-[#282141] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#282141] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22E3E6]" />
                <h3 className="font-bold text-[#ECE5D1] text-base">Resultado da Associação Automática</h3>
              </div>
              <button
                onClick={() => setShowMatchModal(false)}
                className="text-[#B3AE9F] hover:text-[#ECE5D1] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#B3AE9F]">
                Processamos <strong>{matchResults.length}</strong> arquivos de imagem:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {matchResults.map((r, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      r.status === 'success'
                        ? 'bg-[#2FB8BA]/10 border-[#2FB8BA]/40 text-[#4FDCDE]'
                        : 'bg-[#1E1833] border-[#282141] text-[#8A8577]'
                    }`}
                  >
                    <span className="truncate max-w-[200px] font-mono text-[11px]">{r.fileName}</span>
                    {r.status === 'success' ? (
                      <span className="font-semibold text-[11px] text-[#22E3E6]">
                        → {r.artistName} ({r.artistCode})
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#FFD60A]">Sem correspondência</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowMatchModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] transition-colors"
            >
              Concluir e Voltar
            </button>
          </div>
        </div>
      )}

      {/* Automation Guide Modal */}
      {showAutomationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#171226] border border-[#282141] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#282141] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#2FB8BA]/10 text-[#4FDCDE]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#ECE5D1] text-base">
                    Como Alimentar e Automatizar a Base de Fotos
                  </h3>
                  <p className="text-xs text-[#B3AE9F]">
                    Três métodos comprovados para associar fotos a milhares de artistas sem trabalho manual.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutomationModal(false)}
                className="text-[#B3AE9F] hover:text-[#ECE5D1] text-lg p-1.5 rounded-xl hover:bg-[#1E1833]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Method 1 */}
              <div className="p-4 rounded-2xl bg-[#1E1833] border border-[#282141] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2FB8BA] text-[#100C1F] font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-[#ECE5D1] text-sm">Upload em Lote via Arquivo ZIP (Mais Prático)</h4>
                </div>
                <p className="text-xs text-[#B3AE9F] leading-relaxed">
                  Coloque todas as fotos dos artistas em uma pasta no seu computador. Renomeie cada imagem com o <strong>código exclusivo do artista</strong> (ex: <code className="text-[#4FDCDE] font-mono">ART-001.jpg</code>, <code className="text-[#4FDCDE] font-mono">10542.png</code>) ou com o <strong>nome do artista</strong> (ex: <code className="text-[#4FDCDE] font-mono">Jorge e Mateus.jpg</code>).
                </p>
                <div className="p-3 bg-[#100C1F] rounded-xl text-[11px] text-[#B3AE9F]">
                  Comprima a pasta gerando um arquivo <code className="text-[#2FB8BA]">.zip</code> e clique no botão <strong>"Importar ZIP (.zip)"</strong> acima. O sistema descompacta na memória do navegador e faz o match automático de cada foto com o código do artista!
                </div>
              </div>

              {/* Method 2 */}
              <div className="p-4 rounded-2xl bg-[#1E1833] border border-[#282141] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2FB8BA] text-[#100C1F] font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-[#ECE5D1] text-sm">Coluna de Link Direto no CSV (100% Automático)</h4>
                </div>
                <p className="text-xs text-[#B3AE9F] leading-relaxed">
                  Se você já possui as fotos hospedadas (ex: Google Drive público, Cloudinary, AWS S3, Imgur ou CDN da sua empresa), adicione uma coluna chamada <code className="text-[#4FDCDE] font-mono">foto_url</code> no seu arquivo CSV de shows.
                </p>
                <div className="p-3 bg-[#100C1F] rounded-xl text-[11px] text-[#B3AE9F]">
                  Ao importar o CSV no Livvo Show Card, selecione a coluna no mapeamento. Todos os artistas já entrarão no catálogo com suas fotos oficiais vinculadas instantaneamente.
                </div>
              </div>

              {/* Method 3 */}
              <div className="p-4 rounded-2xl bg-[#1E1833] border border-[#282141] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FFD60A] text-[#100C1F] font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="font-bold text-[#ECE5D1] text-sm">Automação Externa via Script (Spotify / Deezer API)</h4>
                </div>
                <p className="text-xs text-[#B3AE9F] leading-relaxed">
                  Você pode rodar um script rápido em Python ou Node.js que percorre os nomes dos artistas do seu CSV, consulta uma API pública de música (como a <strong>API pública do Deezer</strong>, que não exige cadastro nem cartão) e baixa a foto oficial já salva como <code className="text-[#4FDCDE] font-mono">[codigo_artista].jpg</code>.
                </p>
                <div className="p-2.5 bg-[#100C1F] rounded-xl text-[11px] font-mono text-[#ECE5D1] overflow-x-auto">
                  Endpoint gratuito Deezer: <br />
                  <span className="text-[#2FB8BA]">https://api.deezer.com/search/artist?q=NOME_DO_ARTISTA</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAutomationModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      {urlModalArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#171226] border border-[#282141] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#282141] pb-3">
              <h3 className="font-bold text-[#ECE5D1] text-sm">
                Vincular URL da Imagem • {urlModalArtist.artistName}
              </h3>
              <button
                onClick={() => setUrlModalArtist(null)}
                className="text-[#B3AE9F] hover:text-[#ECE5D1]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#B3AE9F]">Link direto da foto (JPG, PNG, WEBP):</label>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full px-3 py-2 bg-[#1E1833] border border-[#282141] rounded-xl text-xs text-[#ECE5D1] focus:outline-none focus:border-[#2FB8BA]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUrlModalArtist(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#B3AE9F] hover:text-[#ECE5D1]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUrl}
                disabled={!inputUrl.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] disabled:opacity-40"
              >
                Salvar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Media Search Modal for Artist */}
      {searchModalArtist && (
        <MediaSearchModal
          isOpen={Boolean(searchModalArtist)}
          onClose={() => setSearchModalArtist(null)}
          artist={searchModalArtist}
          selectedShow={null}
          onSelectPhoto={async (code, url) => {
            await onUpdateArtistPhoto(code, url, 'auto');
            setSearchModalArtist(null);
          }}
          onSelectPoster={async (_codeOrId, url) => {
            await onUpdateArtistPhoto(searchModalArtist.artistCode, url, 'auto');
            onNavigateToShowCard(searchModalArtist.artistCode, url);
            setSearchModalArtist(null);
          }}
          initialTab="photos"
        />
      )}
    </div>
  );
};
