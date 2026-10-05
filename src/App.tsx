import React, { useState, useEffect, useMemo } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { CardStudio } from './components/CardStudio';
import { ShowsTable } from './components/ShowsTable';
import { LivvoB2B } from './components/LivvoB2B';
import { TicketWallet } from './components/TicketWallet';
import { PhotoManager } from './components/PhotoManager';
import { CsvUploaderModal } from './components/CsvUploaderModal';
import { ShowItem, ArtistItem, CardTemplateConfig } from './types';
import { dbService } from './services/db';
import { walletService } from './services/walletService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ActiveTab>('studio');
  const [shows, setShows] = useState<ShowItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [selectedShow, setSelectedShow] = useState<ShowItem | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ArtistItem | null>(null);
  const [initialStudioConfig, setInitialStudioConfig] = useState<CardTemplateConfig | undefined>();
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  useEffect(() => {
    const loadedShows = dbService.getAllShows();
    const loadedArtists = dbService.getAllArtists();
    setShows(loadedShows);
    setArtists(loadedArtists);

    // O Estúdio abre vazio: o fã escolhe o artista (sem banda pré-selecionada)

    // Seed wallet if fresh
    const photosMap = new Map<string, string>();
    loadedArtists.forEach((a) => a.photoUrl && photosMap.set(a.artistCode, a.photoUrl));

    walletService.seedInitialWallet(loadedShows, photosMap, {
      templateId: 'modern-stage',
      aspectRatio: '9:16',
      visualMode: 'artist-photo',
      fontSize: 'large',
      artistNamePosition: 'bottom',
      fontFamily: 'sans',
      accentColor: '#2FB8BA',
      tagline: 'SHOW OFICIAL',
      showShowCode: true,
      showUserHandle: true,
      userHandle: '@toboi',
      showLocationBadge: true,
      showVenueBadge: true,
      showDateHighlight: true,
      contrastOverlay: 40,
      customBadgeText: 'INGRESSO VERIFICADO',
    });
  }, []);

  const photosMap = useMemo(() => {
    const map = new Map<string, string>();
    artists.forEach((a) => {
      if (a.photoUrl) map.set(a.artistCode, a.photoUrl);
    });
    return map;
  }, [artists]);

  const handleSelectShowForStudio = (show: ShowItem) => {
    setSelectedShow(show);
    const matched = artists.find((a) => a.artistCode === show.artistCode);
    if (matched) setSelectedArtist(matched);
    setCurrentTab('studio');
  };

  const handleSelectTicketForStudio = (show: ShowItem, config: CardTemplateConfig) => {
    setSelectedShow(show);
    setInitialStudioConfig(config);
    const matched = artists.find((a) => a.artistCode === show.artistCode);
    if (matched) setSelectedArtist(matched);
    setCurrentTab('studio');
  };

  const handleImportShows = (newShows: ShowItem[]) => {
    dbService.saveCustomShows(newShows);
    setShows(dbService.getAllShows());
  };

  const handleLoadSample = () => {
    localStorage.removeItem('livvo_custom_shows_v1');
    const loadedShows = dbService.getAllShows();
    const loadedArtists = dbService.getAllArtists();
    setShows(loadedShows);
    setArtists(loadedArtists);
    if (loadedShows.length > 0) setSelectedShow(loadedShows[0]);
  };

  const handleClearAll = () => {
    localStorage.removeItem('livvo_custom_shows_v1');
    localStorage.removeItem('livvo_wallet_tickets_v1');
    setShows([]);
    setArtists([]);
    setSelectedShow(null);
    setSelectedArtist(null);
  };

  const walletTickets = walletService.getTickets();

  return (
    <div className="min-h-screen bg-[#100C1F] text-[#ECE5D1] flex flex-col font-sans">
      <Navbar
        activeTab={currentTab}
        setActiveTab={setCurrentTab}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        showsCount={shows.length}
        artistsCount={artists.length}
        photosCount={photosMap.size}
        shows={shows}
        artists={artists}
        photosMap={photosMap}
        onSelectShow={handleSelectShowForStudio}
        onSelectArtist={(a) => {
          setSelectedArtist(a);
          const firstShow = shows.find((s) => s.artistCode === a.artistCode);
          if (firstShow) setSelectedShow(firstShow);
          setCurrentTab('studio');
        }}
        onOpenCsvModal={() => setIsUploaderOpen(true)}
        onOpenUploader={() => setIsUploaderOpen(true)}
        onLoadSample={handleLoadSample}
        onClearAll={handleClearAll}
        walletCount={walletTickets.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {currentTab === 'b2b' && <LivvoB2B />}

        {currentTab === 'studio' && (
          <CardStudio
            shows={shows}
            artists={artists}
            selectedShow={selectedShow}
            selectedArtist={selectedArtist}
            photosMap={photosMap}
            onSelectShow={setSelectedShow}
            onSelectArtist={setSelectedArtist}
            onGoToWallet={() => setCurrentTab('wallet')}
            onOpenPhotoManager={() => setCurrentTab('photos')}
            onUpdateArtistPhoto={async (artistCode, photoUrl, source) => {
              const matched = artists.find((a) => a.artistCode === artistCode);
              if (matched) {
                dbService.saveCustomArtist({ ...matched, photoUrl, photoSource: source, updatedAt: Date.now() });
                setArtists(dbService.getAllArtists());
              }
            }}
            initialConfig={initialStudioConfig}
          />
        )}

        {(currentTab === 'shows' || currentTab === 'table') && (
          <ShowsTable
            shows={shows}
            onSelectShowForStudio={handleSelectShowForStudio}
            onOpenUploader={() => setIsUploaderOpen(true)}
          />
        )}

        {currentTab === 'photos' && (
          <PhotoManager
            artists={artists}
            photosMap={photosMap}
            onUpdateArtistPhoto={async (artistCode, photoUrl, source) => {
              const matched = artists.find((a) => a.artistCode === artistCode);
              if (matched) {
                dbService.saveCustomArtist({ ...matched, photoUrl, photoSource: source, updatedAt: Date.now() });
                setArtists(dbService.getAllArtists());
              }
            }}
            onBatchUpdatePhotos={async (matchedMap) => {
              let updatedCount = 0;
              matchedMap.forEach((photoUrl, artistCode) => {
                const matched = artists.find((a) => a.artistCode === artistCode);
                if (matched) {
                  dbService.saveCustomArtist({ ...matched, photoUrl, photoSource: 'auto', updatedAt: Date.now() });
                  updatedCount++;
                }
              });
              setArtists(dbService.getAllArtists());
              return updatedCount;
            }}
            onNavigateToShowCard={(artistCode) => {
              const matchedArtist = artists.find((a) => a.artistCode === artistCode);
              if (matchedArtist) setSelectedArtist(matchedArtist);
              const matchedShow = shows.find((s) => s.artistCode === artistCode);
              if (matchedShow) setSelectedShow(matchedShow);
              setCurrentTab('studio');
            }}
          />
        )}

        {currentTab === 'wallet' && (
          <TicketWallet
            onSelectTicketForStudio={handleSelectTicketForStudio}
            onGoToStudio={() => setCurrentTab('studio')}
            userHandle="@toboi"
          />
        )}
      </main>

      <CsvUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onImportShows={handleImportShows}
      />
    </div>
  );
};
