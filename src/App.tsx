import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Table,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ShowItem, ArtistItem, CardTemplateConfig } from './types';
import { dbService } from './services/db';
import { generateSampleDataset } from './services/sampleData';
import { Navbar, ActiveTab } from './components/Navbar';
import { CardStudio } from './components/CardStudio';
import { PhotoManager } from './components/PhotoManager';
import { ShowsTable } from './components/ShowsTable';
import { CsvUploaderModal } from './components/CsvUploaderModal';
import { BatchExportModal } from './components/BatchExportModal';
import { consolidateArtists, normalizeArtistKey } from './utils/artistUtils';
import { searchCatalogApi } from './services/catalogService';

// Canonical verified high-res artist portraits to auto-repair base collisions
const VERIFIED_CANONICAL_ARTIST_PHOTOS: Record<string, string> = {
  charliebrownjr: 'https://cdn-images.dzcdn.net/images/artist/1a2e562dde23cdbd9abea4bae13eb4fc/1000x1000-000000-80-0-0.jpg',
  charliebrownjunior: 'https://cdn-images.dzcdn.net/images/artist/1a2e562dde23cdbd9abea4bae13eb4fc/1000x1000-000000-80-0-0.jpg',
  raimundos: 'https://cdn-images.dzcdn.net/images/artist/5c751567df18d06962a6107f68761bde/1000x1000-000000-80-0-0.jpg',
  blackeyedpeas: 'https://cdn-images.dzcdn.net/images/artist/4230c9807b45b78df8ce1255ca5ca594/1000x1000-000000-80-0-0.jpg',
  theblackeyedpeas: 'https://cdn-images.dzcdn.net/images/artist/4230c9807b45b78df8ce1255ca5ca594/1000x1000-000000-80-0-0.jpg',
  titas: 'https://cdn-images.dzcdn.net/images/artist/88d6b914b1667b49742d46b8d8f5857e/1000x1000-000000-80-0-0.jpg',
  goatpenis: 'https://cdn-images.dzcdn.net/images/artist/64db57f459c033807b457cd4203192e1/1000x1000-000000-80-0-0.jpg',
  neymatogrosso: 'https://cdn-images.dzcdn.net/images/artist/b17c2f6d2f3484f93cb7003ae3fc8676/1000x1000-000000-80-0-0.jpg',
  zecapagodinho: 'https://cdn-images.dzcdn.net/images/artist/5b8f8888bdf20b41aaae11f3f40d9b4c/1000x1000-000000-80-0-0.jpg',
  loshermanos: 'https://cdn-images.dzcdn.net/images/artist/683ebdfa666e8574044ffca6f2d56a73/1000x1000-000000-80-0-0.jpg',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [shows, setShows] = useState<ShowItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [photosMap, setPhotosMap] = useState<Map<string, string>>(new Map());
  const [selectedShow, setSelectedShow] = useState<ShowItem | null>(null);
  const [preselectedArtist, setPreselectedArtist] = useState<ArtistItem | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // Admin permission toggle for CSV import

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState(false);
  const [highlightArtistCode, setHighlightArtistCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialCsvFile, setInitialCsvFile] = useState<File | null>(null);
  const [isEmptyStateDragging, setIsEmptyStateDragging] = useState(false);

  // Card Studio config shared for batch export
  const [cardConfig, setCardConfig] = useState<CardTemplateConfig>({
    templateId: 'modern-stage',
    aspectRatio: '9:16',
    visualMode: 'artist-photo',
    accentColor: '#2FB8BA',
    tagline: 'TURNÊ NACIONAL',
    showShowCode: true,
    showUserHandle: true,
    userHandle: '@toboi',
    showLocationBadge: true,
    showDateHighlight: true,
    contrastOverlay: 40,
    customBadgeText: 'INGRESSO\nVERIFICADO',
  });

  // Load sample dataset
  const handleLoadSample = useCallback(async () => {
    try {
      const sample = generateSampleDataset();
      await dbService.clearAll();
      await dbService.saveShowsBatch(sample.shows, true);
      await dbService.saveArtists(sample.artists);
      await dbService.batchUpdateArtistPhotos(sample.photosMap);

      setShows(sample.shows);
      setArtists(sample.artists);
      setPhotosMap(sample.photosMap);
      setSelectedShow(null);
    } catch (err) {
      console.error('Erro ao popular dados de exemplo:', err);
    }
  }, []);

  // Load existing data from IndexedDB or seed with sample
  const loadDatabaseData = useCallback(async () => {
    try {
      setIsLoading(true);
      const dbShows = await dbService.getAllShows(0);
      const dbArtists = await dbService.getAllArtists();

      if (dbShows.length > 0) {
        // Build photos map in one fast batch
        const storedPhotos = await dbService.getAllPhotos();
        const pMap = new Map<string, string>(storedPhotos);

        // Auto-repair any known swapped, mismatched or corrupted photos in database
        const repairUpdates = new Map<string, string>();
        for (const artist of dbArtists) {
          const norm = normalizeArtistKey(artist.artistName);
          const canonical = norm ? VERIFIED_CANONICAL_ARTIST_PHOTOS[norm] : undefined;
          if (canonical) {
            const currentPhoto = pMap.get(artist.artistCode) || (norm ? pMap.get(norm) : undefined) || artist.photoUrl;
            const isMismatched =
              !currentPhoto ||
              // Charlie Brown Jr. having Ney Matogrosso / Batuque cover
              (norm.includes('charlie') && currentPhoto.includes('batuque')) ||
              // Raimundos having Zeca Pagodinho's photo
              (norm.includes('raimundos') && currentPhoto.includes('5b8f8888bdf20b41aaae11f3f40d9b4c')) ||
              // Black Eyed Peas having Los Hermanos' photo
              (norm.includes('blackeyed') && currentPhoto.includes('683ebdfa666e8574044ffca6f2d56a73')) ||
              // Or not having canonical verified photo for these specific bands
              ((norm.includes('charlie') || norm.includes('raimundos') || norm.includes('blackeyed')) && currentPhoto !== canonical);

            if (isMismatched) {
              repairUpdates.set(artist.artistCode, canonical);
              if (norm) repairUpdates.set(norm, canonical);
              artist.photoUrl = canonical;
              artist.photoSource = 'auto';
            }
          }
        }

        if (repairUpdates.size > 0) {
          await dbService.batchUpdateArtistPhotos(repairUpdates);
          repairUpdates.forEach((url, code) => pMap.set(code, url));
        }

        // Consolidate artists strictly by unique artist name
        const consolidated = consolidateArtists(dbArtists, dbShows, pMap);

        setShows(dbShows);
        setArtists(consolidated);
        setSelectedShow(null);

        // Ensure every artist in consolidated list has photo mapped by code AND normalized name
        for (const artist of consolidated) {
          const normName = normalizeArtistKey(artist.artistName);
          const photo = artist.photoUrl || pMap.get(artist.artistCode) || (normName ? pMap.get(normName) : undefined);
          if (photo) {
            pMap.set(artist.artistCode, photo);
            if (normName) pMap.set(normName, photo);
          }
        }

        // Safely map show artistCodes to photo ONLY if matching normalized artist name has a photo
        for (const show of dbShows) {
          const normName = normalizeArtistKey(show.artistName);
          const photo = normName ? pMap.get(normName) : undefined;
          if (photo) {
            pMap.set(show.artistCode, photo);
          }
        }

        setPhotosMap(pMap);
      } else {
        // First-time visit: To protect the catalog against bulk extraction/scraping,
        // we do NOT dump the entire CSV into client-side IndexedDB.
        // Instead, we fetch only the initial featured preview via the protected server API.
        try {
          const catalogRes = await searchCatalogApi({ limit: 10 });
          const previewArtists: ArtistItem[] = catalogRes.artists.map((a) => ({
            artistCode: a.artistCode,
            artistName: a.artistName,
            photoUrl: a.photoUrl,
            featuredPosterUrl: a.featuredPosterUrl,
            showsCount: a.showsCount,
            updatedAt: Date.now(),
          }));

          const pMap = new Map<string, string>();
          previewArtists.forEach((a) => {
            if (a.photoUrl) {
              pMap.set(a.artistCode, a.photoUrl);
              const norm = normalizeArtistKey(a.artistName);
              if (norm) pMap.set(norm, a.photoUrl);
            }
          });

          setArtists(previewArtists);
          setShows([]);
          setPhotosMap(pMap);
          setSelectedShow(null);
        } catch (apiErr) {
          console.warn('Erro ao carregar prévia do catálogo:', apiErr);
          setArtists([]);
          setShows([]);
          setPhotosMap(new Map());
        }
      }
    } catch (err) {
      console.error('Erro ao carregar banco de dados:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Ensure non-admins are restricted to the studio tab
  useEffect(() => {
    if (!isAdmin && (activeTab === 'photos' || activeTab === 'shows')) {
      setActiveTab('studio');
    }
  }, [isAdmin, activeTab]);

  // Prevent default window file dropping (which navigates away in browsers)
  // and seamlessly catch dropped CSV files anywhere to open the import modal
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        const name = file.name.toLowerCase();
        const isCsvLike =
          name.endsWith('.csv') ||
          name.endsWith('.txt') ||
          file.type.includes('csv') ||
          file.type.includes('text') ||
          file.type.includes('excel');

        if (isCsvLike) {
          setInitialCsvFile(file);
          setIsCsvModalOpen(true);
        }
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Update single artist photo across all shows of this band
  const handleUpdateArtistPhoto = async (
    artistCode: string,
    photoUrl: string,
    source: 'upload' | 'url' | 'sample' | 'auto',
    artistName?: string
  ) => {
    // 1. Find the target artist and their normalized name
    let targetName = artistName ? artistName.trim().toLowerCase() : '';
    if (!targetName) {
      const currentArtist = artists.find((a) => a.artistCode === artistCode);
      if (currentArtist) {
        targetName = currentArtist.artistName.trim().toLowerCase();
      } else {
        const currentShow = shows.find((s) => s.artistCode === artistCode);
        if (currentShow) {
          targetName = currentShow.artistName.trim().toLowerCase();
        }
      }
    }

    // 2. Collect all artist codes that belong to this artist (same artistCode or same normalized name)
    const matchingCodes = new Set<string>();
    if (artistCode) matchingCodes.add(artistCode);
    if (targetName) {
      artists.forEach((a) => {
        if (a.artistName.trim().toLowerCase() === targetName) {
          matchingCodes.add(a.artistCode);
        }
      });
      shows.forEach((s) => {
        if (s.artistName.trim().toLowerCase() === targetName) {
          matchingCodes.add(s.artistCode);
        }
      });
    }

    // 3. Persist to DB for all matching codes and target name
    for (const code of matchingCodes) {
      await dbService.updateArtistPhoto(code, photoUrl, source);
    }
    if (targetName) {
      await dbService.updateArtistPhoto(targetName, photoUrl, source);
    }

    // 4. Update photosMap state with all matching artist codes and normalized name
    setPhotosMap((prev) => {
      const next = new Map(prev);
      matchingCodes.forEach((code) => next.set(code, photoUrl));
      if (targetName) {
        next.set(targetName, photoUrl);
      }
      return next;
    });

    // 5. Update artists list state
    setArtists((prev) => {
      let matched = false;
      const updated = prev.map((a) => {
        if (
          matchingCodes.has(a.artistCode) ||
          (targetName && a.artistName.trim().toLowerCase() === targetName)
        ) {
          matched = true;
          return { ...a, photoUrl, photoSource: source };
        }
        return a;
      });
      if (!matched && targetName) {
        updated.push({
          artistCode: artistCode || `ART-${targetName.replace(/[^a-z0-9]/g, '_').toUpperCase()}`,
          artistName: artistName || targetName,
          photoUrl,
          photoSource: source,
          showsCount: shows.filter((s) => s.artistName.trim().toLowerCase() === targetName).length || 1,
          updatedAt: Date.now(),
        });
      }
      return updated;
    });
  };

  // Remove artist photo
  const handleRemoveArtistPhoto = async (artistCode: string): Promise<void> => {
    await dbService.deletePhoto(artistCode);
    const targetArtist = artists.find((a) => a.artistCode === artistCode);
    const normName = targetArtist ? normalizeArtistKey(targetArtist.artistName) : '';
    if (normName) {
      await dbService.deletePhoto(normName);
    }

    setPhotosMap((prev) => {
      const next = new Map(prev);
      next.delete(artistCode);
      if (normName) next.delete(normName);
      return next;
    });

    setArtists((prev) =>
      prev.map((a) => {
        if (a.artistCode === artistCode || (normName && normalizeArtistKey(a.artistName) === normName)) {
          return {
            ...a,
            photoUrl: undefined,
            photoSource: undefined,
          };
        }
        return a;
      })
    );
  };

  // Update single show poster
  const handleUpdateShowPoster = async (showIdOrCode: string, posterUrl: string) => {
    await dbService.updateShowPoster(showIdOrCode, posterUrl);
    setShows((prev) =>
      prev.map((s) => (s.id === showIdOrCode || s.showCode === showIdOrCode || s.artistCode === showIdOrCode ? { ...s, posterUrl } : s))
    );
    setSelectedShow((prev) => {
      if (prev && (prev.id === showIdOrCode || prev.showCode === showIdOrCode || prev.artistCode === showIdOrCode)) {
        return { ...prev, posterUrl };
      }
      return prev;
    });
  };

  // Batch update photos
  const handleBatchUpdatePhotos = async (matchedMap: Map<string, string>): Promise<number> => {
    const updatedCount = await dbService.batchUpdateArtistPhotos(matchedMap);

    setPhotosMap((prev) => {
      const next = new Map(prev);
      matchedMap.forEach((url, code) => next.set(code, url));
      return next;
    });

    setArtists((prev) =>
      prev.map((a) => {
        if (matchedMap.has(a.artistCode)) {
          return {
            ...a,
            photoUrl: matchedMap.get(a.artistCode),
            photoSource: 'upload',
          };
        }
        return a;
      })
    );

    return updatedCount;
  };

  // Clear all data
  const handleClearAll = async () => {
    if (confirm('Deseja realmente limpar todos os shows e fotos carregados?')) {
      await dbService.clearAll();
      setShows([]);
      setArtists([]);
      setPhotosMap(new Map());
      setSelectedShow(null);
    }
  };

  // Select show for card and switch to studio
  const handleSelectShowForCard = (show: ShowItem) => {
    setSelectedShow(show);
    const matchedArtist = artists.find((a) => a.artistCode === show.artistCode);
    if (matchedArtist) {
      setPreselectedArtist(matchedArtist);
    }
    setActiveTab('studio');
  };

  // Global search: choose artist
  const handleSelectArtistFromGlobalSearch = (artist: ArtistItem) => {
    setPreselectedArtist(artist);
    const artistShows = shows.filter((s) => s.artistCode === artist.artistCode);
    if (artistShows.length === 1) {
      setSelectedShow(artistShows[0]);
    } else {
      setSelectedShow(null);
    }
    setActiveTab('studio');
  };

  // Global search: choose show
  const handleSelectShowFromGlobalSearch = (show: ShowItem) => {
    setSelectedShow(show);
    const matchedArtist = artists.find((a) => a.artistCode === show.artistCode);
    if (matchedArtist) {
      setPreselectedArtist(matchedArtist);
    }
    setActiveTab('studio');
  };

  // Navigate to photo manager focusing on artist (admin only)
  const handleOpenPhotoManager = (artistCode?: string) => {
    if (!isAdmin) return;
    if (artistCode) {
      setHighlightArtistCode(artistCode);
      setTimeout(() => setHighlightArtistCode(null), 4000);
    }
    setActiveTab('photos');
  };

  // On import CSV complete
  const handleImportComplete = (newShows: ShowItem[], newArtists: ArtistItem[]) => {
    const consolidated = consolidateArtists(newArtists, newShows);
    setShows(newShows);
    setArtists(consolidated);
    setPhotosMap(new Map());
    setSelectedShow(null);
    setActiveTab('photos'); // Direct user to photos base right after CSV upload!
  };

  const photosCount = artists.filter((a) => photosMap.has(a.artistCode) || Boolean(a.photoUrl)).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showsCount={shows.length}
        artistsCount={artists.length}
        photosCount={photosCount}
        shows={shows}
        artists={artists}
        photosMap={photosMap}
        onSelectArtist={handleSelectArtistFromGlobalSearch}
        onSelectShow={handleSelectShowFromGlobalSearch}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onLoadSample={handleLoadSample}
        onClearAll={handleClearAll}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-300">Carregando catálogo de shows e base de fotos...</p>
          </div>
        ) : shows.length === 0 ? (
          /* Empty State: Prompt CSV Upload or Demo (supports drag and drop) */
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEmptyStateDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              if (!isEmptyStateDragging) setIsEmptyStateDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsEmptyStateDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEmptyStateDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                setInitialCsvFile(file);
                setIsCsvModalOpen(true);
              }
            }}
            className={`max-w-2xl mx-auto text-center py-16 px-6 rounded-3xl border transition-all space-y-6 ${
              isEmptyStateDragging
                ? 'bg-[#2FB8BA]/15 border-[#2FB8BA] ring-4 ring-[#2FB8BA]/30 shadow-2xl scale-[1.01]'
                : 'bg-slate-900/60 border-slate-800 shadow-2xl'
            }`}
          >
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-inner transition-all ${
                isEmptyStateDragging
                  ? 'bg-[#2FB8BA] text-[#100C1F] animate-bounce'
                  : 'bg-gradient-to-tr from-amber-500/20 to-amber-500/5 text-amber-400 border border-amber-500/30'
              }`}
            >
              <FileSpreadsheet className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {isEmptyStateDragging ? 'Solte o CSV para Importar!' : 'Importe sua Base de Shows'}
              </h2>
              <p className="text-sm text-[#B3AE9F] max-w-lg mx-auto">
                {isEmptyStateDragging
                  ? 'O catálogo de shows será processado e indexado instantaneamente.'
                  : 'Arraste seu arquivo CSV diretamente aqui ou clique no botão abaixo para selecionar.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {isAdmin ? (
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <UploadCloud className="w-5 h-5" />
                  <span>Importar Planilha CSV</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed"
                  title="Importação restrita a administradores"
                >
                  <UploadCloud className="w-5 h-5 text-slate-600" />
                  <span>Importar CSV (Apenas Admin)</span>
                </button>
              )}

              <button
                onClick={handleLoadSample}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Carregar Demonstração (Shows Brasileiros)</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* TAB: Estúdio de Cards */}
            {activeTab === 'studio' && (
              <CardStudio
                shows={shows}
                artists={artists}
                selectedShow={selectedShow}
                onSelectShow={setSelectedShow}
                photosMap={photosMap}
                onOpenPhotoManager={handleOpenPhotoManager}
                onOpenBatchExport={() => setIsBatchExportModalOpen(true)}
                onUpdateArtistPhoto={handleUpdateArtistPhoto}
                onUpdateShowPoster={handleUpdateShowPoster}
                preselectedArtist={preselectedArtist}
                onClearPreselectedArtist={() => setPreselectedArtist(null)}
              />
            )}

            {/* TAB: Base de Fotos - Apenas Administradores */}
            {activeTab === 'photos' && isAdmin && (
              <PhotoManager
                artists={artists}
                photosMap={photosMap}
                onUpdateArtistPhoto={handleUpdateArtistPhoto}
                onRemoveArtistPhoto={handleRemoveArtistPhoto}
                onBatchUpdatePhotos={handleBatchUpdatePhotos}
                isAdmin={isAdmin}
                onNavigateToShowCard={async (code, posterUrl) => {
                  let show = shows.find((s) => s.artistCode === code);
                  if (!show) {
                    const artistShows = await dbService.getShowsByArtist(code);
                    if (artistShows.length > 0) {
                      show = artistShows[0];
                    }
                  }
                  if (show) {
                    if (posterUrl) {
                      show = { ...show, posterUrl };
                      await handleUpdateShowPoster(show.id || show.showCode, posterUrl);
                    }
                    setSelectedShow(show);
                    setActiveTab('studio');
                  } else {
                    const artist = artists.find((a) => a.artistCode === code);
                    if (artist) {
                      setPreselectedArtist(artist);
                      setActiveTab('studio');
                    }
                  }
                }}
                highlightArtistCode={highlightArtistCode}
              />
            )}

            {/* TAB: Catálogo de Shows - Apenas Administradores */}
            {activeTab === 'shows' && isAdmin && (
              <ShowsTable
                shows={shows}
                artists={artists}
                photosMap={photosMap}
                onSelectShowForCard={handleSelectShowForCard}
                onOpenPhotoManager={handleOpenPhotoManager}
              />
            )}
          </div>
        )}
      </main>

      {/* CSV Uploader Modal */}
      <CsvUploaderModal
        isOpen={isCsvModalOpen}
        onClose={() => {
          setIsCsvModalOpen(false);
          setInitialCsvFile(null);
        }}
        onImportComplete={handleImportComplete}
        onLoadSampleData={handleLoadSample}
        initialFile={initialCsvFile}
      />

      {/* Batch Export ZIP Modal */}
      <BatchExportModal
        isOpen={isBatchExportModalOpen}
        onClose={() => setIsBatchExportModalOpen(false)}
        shows={shows}
        photosMap={photosMap}
        config={cardConfig}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          ShowCard Studio • Otimizado para catálogos de grande escala com persistência local IndexedDB.
        </p>
      </footer>
    </div>
  );
}
