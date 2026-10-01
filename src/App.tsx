import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { CardStudio } from './components/CardStudio';
import { ShowsTable } from './components/ShowsTable';
import { TicketWallet } from './components/TicketWallet';
import { CsvUploaderModal } from './components/CsvUploaderModal';
import { ShowItem, ArtistItem, CardTemplateConfig } from './types';
import { dbService } from './services/db';
import { walletService } from './services/walletService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'studio' | 'table' | 'wallet'>('studio');
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

    if (loadedShows.length > 0 && !selectedShow) {
      setSelectedShow(loadedShows[0]);
    }

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
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
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
        onOpenUploader={() => setIsUploaderOpen(true)}
        onLoadSample={handleLoadSample}
        onClearAll={handleClearAll}
        walletCount={walletTickets.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {currentTab === 'studio' && (
          <CardStudio
            shows={shows}
            artists={artists}
            selectedShow={selectedShow}
            selectedArtist={selectedArtist}
            onSelectShow={setSelectedShow}
            onSelectArtist={setSelectedArtist}
            onGoToWallet={() => setCurrentTab('wallet')}
            initialConfig={initialStudioConfig}
          />
        )}

        {currentTab === 'table' && (
          <ShowsTable
            shows={shows}
            onSelectShowForStudio={handleSelectShowForStudio}
            onOpenUploader={() => setIsUploaderOpen(true)}
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
