import React, { forwardRef } from 'react';
import { Calendar, MapPin, Building2, Music, Sparkles, Ticket } from 'lucide-react';
import { ShowItem, CardTemplateConfig } from '../types';
import { cleanDateOnly } from '../utils/dateUtils';
import { cleanCityOnly } from '../utils/stateUtils';
import { LivvoLogo } from './LivvoLogo';
import { LivvoTicketIcon } from './LivvoTicketIcon';

interface EventCardProps {
  show?: ShowItem | null;
  artistName?: string | null;
  photoUrl?: string | null;
  posterUrl?: string | null;
  config: CardTemplateConfig;
  className?: string;
  isExporting?: boolean;
}

export const EventCard = forwardRef<HTMLDivElement, EventCardProps>(
  ({ show, artistName, photoUrl, posterUrl, config, className = '' }, ref) => {
    const {
      templateId,
      aspectRatio,
      visualMode = 'artist-photo',
      accentColor = '#2FB8BA', // Default Teal Livvo
      tagline = '',
      showShowCode = true,
      showUserHandle = true,
      userHandle = '@toboi',
      showLocationBadge = true,
      showVenueBadge = true,
      showDateHighlight = true,
      contrastOverlay = 40,
      customBadgeText = 'INGRESSO VERIFICADO',
    } = config;

    // Determine whether to show poster or artist photo
    const isPosterMode = visualMode === 'show-poster';
    const effectiveImageUrl = isPosterMode
      ? posterUrl || show?.posterUrl || photoUrl
      : photoUrl || posterUrl || show?.posterUrl;

    const hasPhoto = Boolean(effectiveImageUrl);
    const displayArtistName = show?.artistName || artistName || '';
    const displayTourName = show?.tourName || '';

    // Photo Filters CSS calculation
    const getPhotoFilterStyle = () => {
      switch (config.photoFilter) {
        case 'noir':
          return 'filter grayscale contrast-125 brightness-95';
        case 'duotone':
          return 'filter grayscale contrast-150 brightness-90';
        case 'vibrant':
          return 'filter saturate-200 contrast-110';
        case 'grain':
          return 'filter contrast-115 brightness-95';
        case 'cyber':
          return 'filter contrast-130 brightness-110 hue-rotate-15 saturate-150';
        default:
          return '';
      }
    };

    // Calculate Stamp data (Eu Fui, Countdown, VIP Pass, etc.)
    const stampData = React.useMemo(() => {
      const type = config.stampType;
      if (!type || type === 'none') return null;

      if (type === 'eu-fui') {
        return {
          title: 'EU FUI!',
          subtitle: 'PRESENÇA HISTÓRICA',
          color: '#FFD60A',
        };
      }
      if (type === 'historico') {
        return {
          title: 'SHOW HISTÓRICO',
          subtitle: 'PATRIMÔNIO AO VIVO',
          color: '#FFD60A',
        };
      }
      if (type === 'saudade') {
        return {
          title: 'SHOW DA VIDA',
          subtitle: 'MEMÓRIA INESQUECÍVEL',
          color: '#ff5c5c',
        };
      }
      if (type === 'vip') {
        return {
          title: 'VIP PASS',
          subtitle: 'ACESSO EXCLUSIVO',
          color: '#4FDCDE',
        };
      }
      if (type === 'countdown') {
        // Try parsing show date
        let countdownText = 'EM BREVE';
        if (show?.date) {
          const parts = show.date.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
          if (parts) {
            const showDateObj = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
            const now = new Date();
            const diffDays = Math.ceil((showDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
              countdownText = `FALTAM ${diffDays}D`;
            } else if (diffDays === 0) {
              countdownText = 'É HOJE!';
            } else {
              const yearsAgo = Math.floor(Math.abs(diffDays) / 365);
              countdownText = yearsAgo >= 1 ? `HÁ ${yearsAgo} ANOS` : 'PRESENÇA';
            }
          }
        }
        return {
          title: countdownText,
          subtitle: 'SHOW OFICIAL',
          color: '#2FB8BA',
        };
      }
      return null;
    }, [config.stampType, show?.date]);

    // Collector Gamification Data for Card
    const collectorData = React.useMemo(() => {
      if (!config.showCollectorBadge) return null;
      const rarity = config.collectorRarity || 'gold';
      const edition = config.collectorEdition || '#042';

      switch (rarity) {
        case 'legendary':
          return {
            label: 'COLECIONADOR LIVVO',
            rarityText: 'RARIDADE LENDÁRIA',
            editionText: `EDIÇÃO ${edition}`,
            badgeBg: 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600',
            textColor: 'text-amber-100',
            borderColor: 'border-amber-400/80',
            glowColor: 'rgba(245, 158, 11, 0.45)',
            icon: '👑',
          };
        case 'diamond':
          return {
            label: 'COLECIONADOR LIVVO',
            rarityText: 'RARIDADE DIAMANTE',
            editionText: `EDIÇÃO ${edition}`,
            badgeBg: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600',
            textColor: 'text-cyan-100',
            borderColor: 'border-cyan-400/80',
            glowColor: 'rgba(34, 227, 230, 0.45)',
            icon: '⚡',
          };
        case 'platinum':
          return {
            label: 'COLECIONADOR LIVVO',
            rarityText: 'RARIDADE PLATINA',
            editionText: `EDIÇÃO ${edition}`,
            badgeBg: 'bg-gradient-to-r from-slate-400 via-slate-300 to-zinc-500',
            textColor: 'text-slate-950 font-black',
            borderColor: 'border-white/80',
            glowColor: 'rgba(255, 255, 255, 0.4)',
            icon: '💎',
          };
        case 'classic':
          return {
            label: 'COLECIONADOR LIVVO',
            rarityText: 'EDIÇÃO VINTAGE',
            editionText: `SÉRIE ${edition}`,
            badgeBg: 'bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900',
            textColor: 'text-amber-200',
            borderColor: 'border-amber-600/70',
            glowColor: 'rgba(180, 83, 9, 0.35)',
            icon: '🎟️',
          };
        case 'gold':
        default:
          return {
            label: 'COLECIONADOR LIVVO',
            rarityText: 'RARIDADE OURO',
            editionText: `EDIÇÃO ${edition}`,
            badgeBg: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600',
            textColor: 'text-amber-950 font-black',
            borderColor: 'border-yellow-300/90',
            glowColor: 'rgba(255, 214, 10, 0.55)',
            icon: '✨',
          };
      }
    }, [config.showCollectorBadge, config.collectorRarity, config.collectorEdition]);

    // Aspect ratio CSS classes (restored to original generous dimensions so card is not small)
    const getRatioClass = () => {
      switch (aspectRatio) {
        case '9:16':
          return 'aspect-[9/16] w-full max-w-[460px] sm:max-w-[480px]';
        case '1:1':
          return 'aspect-square w-full max-w-[500px] sm:max-w-[520px]';
        case '4:5':
          return 'aspect-[4/5] w-full max-w-[480px] sm:max-w-[500px]';
        case '16:9':
          return 'aspect-[16/9] w-full max-w-[680px] sm:max-w-[720px]';
        default:
          return 'aspect-[9/16] w-full max-w-[460px] sm:max-w-[480px]';
      }
    };

    // Font Family selection
    const getFontFamilyStyle = () => {
      switch (config.fontFamily) {
        case 'impact':
          return "'Oswald', 'Impact', sans-serif";
        case 'serif':
          return "'Playfair Display', Georgia, serif";
        case 'mono':
          return "'Space Mono', monospace";
        case 'vintage':
          return "'Bebas Neue', 'Trebuchet MS', sans-serif";
        case 'sans':
        default:
          return "'Plus Jakarta Sans', system-ui, sans-serif";
      }
    };

    // Card font sizes: 'small' | 'medium' | 'large' (large = original standard size)
    const fontSize = config.fontSize || 'large';
    const artistHeadingClasses =
      fontSize === 'small'
        ? 'text-xl sm:text-2xl'
        : fontSize === 'medium'
        ? 'text-2xl sm:text-4xl'
        : 'text-3xl sm:text-5xl';

    const tourSizeClasses =
      fontSize === 'small'
        ? 'text-[9px]'
        : fontSize === 'medium'
        ? 'text-[11px]'
        : 'text-xs';

    const dateTextClasses =
      fontSize === 'small'
        ? 'text-xs sm:text-sm'
        : fontSize === 'medium'
        ? 'text-sm sm:text-base'
        : 'text-base sm:text-lg';

    // Nome do Lugar (2º box embaixo da data): reduzido em 50% conforme solicitado
    const venueTextClasses =
      fontSize === 'small'
        ? 'text-[7px] sm:text-[8px]'
        : fontSize === 'medium'
        ? 'text-[8px] sm:text-[9px]'
        : 'text-[9px] sm:text-[10px]';

    const cityTextClasses =
      fontSize === 'small'
        ? 'text-xs sm:text-sm'
        : fontSize === 'medium'
        ? 'text-sm sm:text-base'
        : 'text-base sm:text-lg';

    // Artist Name & Tour Title Block
    const renderArtistNameBlock = (isCentered = false) => (
      <div className={`space-y-1.5 ${isCentered ? 'text-center' : ''}`}>
        {displayTourName && (
          <div className={`flex items-center gap-1.5 mb-1.5 ${isCentered ? 'justify-center' : ''}`}>
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
            <span
              className={`${tourSizeClasses} uppercase font-extrabold tracking-widest drop-shadow-sm truncate`}
              style={{ color: accentColor }}
            >
              {displayTourName}
            </span>
          </div>
        )}

        {displayArtistName ? (
          templateId === 'festival-bold' ? (
            <h1
              className={`${artistHeadingClasses} font-black uppercase tracking-tight text-[#ECE5D1] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] break-words`}
              style={{ fontFamily: getFontFamilyStyle() }}
            >
              {displayArtistName}
            </h1>
          ) : templateId === 'minimal-editorial' ? (
            <h1
              className={`${artistHeadingClasses} font-light tracking-wide text-[#ECE5D1] leading-tight uppercase`}
              style={{ fontFamily: config.fontFamily ? getFontFamilyStyle() : "'Playfair Display', serif" }}
            >
              {displayArtistName}
            </h1>
          ) : templateId === 'neon-tour' ? (
            <h1
              className={`${artistHeadingClasses} font-black uppercase tracking-tighter text-[#ECE5D1] leading-none`}
              style={{
                fontFamily: getFontFamilyStyle(),
                textShadow: `0 0 15px ${accentColor}90, 0 0 30px ${accentColor}50`,
              }}
            >
              {displayArtistName}
            </h1>
          ) : (
            <h1
              className={`${artistHeadingClasses} font-black uppercase tracking-tight text-[#ECE5D1] leading-tight drop-shadow-lg break-words`}
              style={{ fontFamily: getFontFamilyStyle() }}
            >
              {displayArtistName}
            </h1>
          )
        ) : (
          <div className="py-2 select-none">
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#8A8577]/60 block">
              Selecione um Artista
            </span>
          </div>
        )}

        {/* Accent Divider: Only show if an artist is selected */}
        {displayArtistName && (
          <div
            className={`h-1 w-20 rounded-full ${isCentered ? 'mx-auto' : ''}`}
            style={{ backgroundColor: accentColor }}
          />
        )}
      </div>
    );

    return (
      <div
        ref={ref}
        id={show?.showCode ? `card-${show.showCode}` : 'card-livvo-stage'}
        className={`relative overflow-hidden select-none bg-[#100C1F] text-[#ECE5D1] shadow-2xl rounded-2xl transition-all ${getRatioClass()} ${className}`}
        style={{
          fontFamily: getFontFamilyStyle(),
        }}
      >
        {/* Background Image Layer - 100% card coverage without side margins */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          {hasPhoto ? (
            <>
              <img
                src={effectiveImageUrl!}
                alt={displayArtistName || 'Livvo Show Card'}
                className={`absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center transform scale-100 transition-transform duration-500 ${getPhotoFilterStyle()}`}
                crossOrigin="anonymous"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.getAttribute('crossorigin')) {
                    target.removeAttribute('crossorigin');
                    target.src = effectiveImageUrl!;
                  }
                }}
              />
              {/* Duotone tint overlay */}
              {config.photoFilter === 'duotone' && (
                <div
                  className="absolute inset-0 mix-blend-color opacity-70 pointer-events-none"
                  style={{ backgroundColor: accentColor }}
                />
              )}
              {/* Film Grain Texture overlay */}
              {config.photoFilter === 'grain' && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#100C1F] via-[#171226] to-[#1E1833] flex items-center justify-center p-8">
              <div className="text-center opacity-30">
                <Music className="w-24 h-24 mx-auto mb-4 text-[#B3AE9F]" />
                <p className="text-sm font-semibold tracking-widest uppercase text-[#ECE5D1]">
                  {displayArtistName
                    ? (isPosterMode ? 'Pôster pendente' : 'Foto pendente')
                    : 'Aguardando seleção de artista'}
                </p>
                {show?.artistCode && <p className="text-xs text-[#8A8577]">Código: {show.artistCode}</p>}
              </div>
            </div>
          )}

          {/* Contrast & Vignette Overlays based on template */}
          {templateId === 'modern-stage' && (
            <>
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#100C1F] via-[#100C1F]/70 to-[#100C1F]/30"
                style={{ opacity: contrastOverlay / 100 + 0.3 }}
              />
              <div
                className="absolute inset-0 bg-radial-at-t from-transparent via-[#100C1F]/40 to-[#100C1F]/90"
              />
              <div
                className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#100C1F]/90 to-transparent"
              />
            </>
          )}

          {templateId === 'festival-bold' && (
            <>
              <div
                className="absolute inset-0 bg-[#100C1F]"
                style={{ opacity: Math.max(0.45, contrastOverlay / 100) }}
              />
              <div
                className="absolute inset-0 mix-blend-multiply opacity-50"
                style={{ backgroundColor: accentColor }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100C1F] via-[#100C1F]/80 to-transparent" />
            </>
          )}

          {templateId === 'minimal-editorial' && (
            <>
              <div
                className="absolute inset-0 bg-[#100C1F]/65"
                style={{ opacity: contrastOverlay / 100 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100C1F] via-[#100C1F]/70 to-[#100C1F]/30" />
              <div className="absolute inset-3 border border-[#4FDCDE]/20 pointer-events-none" />
            </>
          )}

          {templateId === 'neon-tour' && (
            <>
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#1E1833]/60 via-[#100C1F]/85 to-[#100C1F]"
                style={{ opacity: contrastOverlay / 100 + 0.2 }}
              />
              <div
                className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />
              <div
                className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-30 bg-[#22E3E6] pointer-events-none"
              />
            </>
          )}

          {templateId === 'ticket-pass' && (
            <>
              <div
                className="absolute inset-0 bg-[#100C1F]/85"
                style={{ opacity: contrastOverlay / 100 + 0.2 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100C1F] via-[#171226]/60 to-[#100C1F]/50" />
            </>
          )}

          {/* Holographic Prismatic Foil Sheen */}
          {config.showHologram && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-50 transition-opacity hover:opacity-75 z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(255,0,128,0.25) 0%, rgba(0,255,255,0.3) 25%, rgba(255,215,0,0.3) 50%, rgba(0,255,128,0.3) 75%, rgba(128,0,255,0.25) 100%)',
                backgroundSize: '200% 200%',
              }}
            />
          )}
        </div>

        {/* Retro Stamp / Carimbo (Eu Fui, Countdown, VIP Pass) */}
        {stampData && (
          <div
            className="absolute top-20 right-5 sm:right-6 z-30 pointer-events-none transform -rotate-12 border-2 border-dashed px-3 py-1 rounded-lg text-center backdrop-blur-xs shadow-2xl animate-in zoom-in-75 duration-300"
            style={{
              borderColor: stampData.color,
              color: stampData.color,
              backgroundColor: 'rgba(16, 12, 31, 0.7)',
            }}
          >
            <div className="text-xs sm:text-sm font-black tracking-widest leading-tight uppercase font-mono drop-shadow">
              {stampData.title}
            </div>
            <div className="text-[7.5px] font-bold tracking-wider mt-0.5 opacity-90 uppercase">
              {stampData.subtitle}
            </div>
          </div>
        )}

        {/* Content Layer */}
        <div className="relative z-10 h-full w-full flex flex-col justify-between p-6 sm:p-7">
          {/* Top Section Container */}
          <div className="flex flex-col gap-4">
            {/* Top Bar: Livvo Squircle Brand Logo & User Handle / Status */}
            <div className="flex items-start justify-between gap-3">
              {/* Left side: Livvo Teal Squircle Logo (+50% larger) + Tagline / @nomedousuario */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <LivvoLogo className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg" />
                  {tagline && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md bg-[#100C1F]/70 border border-white/10"
                      style={{ color: accentColor }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{tagline}</span>
                    </span>
                  )}
                </div>

                {showUserHandle && (
                  <span className="text-[11px] tracking-wider text-[#4FDCDE] font-mono font-bold pl-0.5">
                    {userHandle || '@toboi'}
                  </span>
                )}
              </div>

              {/* Right side: Custom Status Badge & Show Code */}
              <div className="flex flex-col items-end gap-1">
                <div
                  className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-[#100C1F] shadow-lg text-center min-w-[72px]"
                  style={{ backgroundColor: accentColor }}
                >
                  {customBadgeText === 'INGRESSO VERIFICADO' ? (
                    <div className="leading-tight py-0.5">
                      <div>INGRESSO</div>
                      <div>VERIFICADO</div>
                    </div>
                  ) : (
                    <span>{customBadgeText}</span>
                  )}
                </div>

                {/* SHOW Code: ONLY rendered when a show is chosen and has a showCode */}
                {showShowCode && show?.showCode && (
                  <span className="text-[10px] tracking-wider text-[#B3AE9F] font-mono pr-0.5">
                    SHOW: <strong className="text-[#ECE5D1]">{show.showCode}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* ARTIST NAME AT TOP (if artistNamePosition === 'top') */}
            {config.artistNamePosition === 'top' && (
              <div className="pt-2">
                {renderArtistNameBlock(false)}
              </div>
            )}
          </div>

          {/* ARTIST NAME IN MIDDLE (if artistNamePosition === 'middle') */}
          {config.artistNamePosition === 'middle' && (
            <div className="my-auto py-4">
              {renderArtistNameBlock(true)}
            </div>
          )}

          {/* Bottom Block: Artist Name (if bottom) + Event Data Info Box */}
          <div className="flex flex-col gap-3 mt-auto">
            {/* ARTIST NAME AT BOTTOM (Default: 'bottom' or undefined) */}
            {(!config.artistNamePosition || config.artistNamePosition === 'bottom') && (
              renderArtistNameBlock(false)
            )}

            {/* Event Info Box: Reduced by 50% horizontally, containing Date, Venue (Local) and City */}
            <div className="backdrop-blur-md bg-[#171226]/85 rounded-xl p-2.5 sm:p-3 border border-[#282141] shadow-2xl flex flex-col gap-2 w-1/2 max-w-[50%]">
              {/* 1. Date */}
              {showDateHighlight && (
                <div className="flex items-center gap-2">
                  <div
                    className="p-1 sm:p-1.5 rounded-lg bg-[#282141] flex items-center justify-center shrink-0 border border-[#4FDCDE]/20"
                    style={{ color: show?.date ? accentColor : '#8A8577' }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 text-center">
                    <span className={`${dateTextClasses} font-extrabold ${show?.date ? 'text-[#ECE5D1]' : 'text-[#8A8577]/60'} tracking-tight leading-tight block truncate text-center`}>
                      {show?.date ? cleanDateOnly(show.date) : '-- / -- / ----'}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Venue / Casa de Show (Between Date and City, with exactly the same size & style) */}
              {showVenueBadge && (
                <div className={`flex items-center gap-2 ${showDateHighlight ? 'pt-1.5 border-t border-[#282141]' : ''}`}>
                  <div
                    className="p-1 sm:p-1.5 rounded-lg bg-[#282141] flex items-center justify-center shrink-0 border border-[#4FDCDE]/20"
                    style={{ color: show?.venue ? accentColor : '#8A8577' }}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 text-center">
                    <div className={`${venueTextClasses} font-extrabold tracking-tight ${show?.venue ? 'text-[#ECE5D1]' : 'text-[#8A8577]/60'} truncate leading-tight text-center`} title={show?.venue}>
                      {show?.venue || 'Indisponível'}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. City (Only city name, state is excluded from card) */}
              {showLocationBadge && (
                <div className={`flex items-center gap-2 ${(showDateHighlight || showVenueBadge) ? 'pt-1.5 border-t border-[#282141]' : ''}`}>
                  <div
                    className="p-1 sm:p-1.5 rounded-lg bg-[#282141] flex items-center justify-center shrink-0 border border-[#4FDCDE]/20"
                    style={{ color: show?.city ? accentColor : '#8A8577' }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 text-center">
                    <div className={`${cityTextClasses} font-extrabold tracking-wide ${show?.city ? 'text-[#2FB8BA]' : 'text-[#8A8577]/60'} truncate leading-tight text-center`}>
                      {show?.city ? cleanCityOnly(show.city) : 'Indisponível'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Badges Bar: Sector, Companion, Favorite Song, Setlist */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Ticket Sector Badge */}
              {config.ticketSector && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg backdrop-blur-md bg-[#100C1F]/90 border border-[#FFD60A]/30 text-[10px] text-[#ECE5D1] shadow">
                  <LivvoTicketIcon className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
                  <span className="font-black uppercase tracking-wider text-[#FFD60A]">{config.ticketSector}</span>
                </div>
              )}

              {/* Companion Handle Badge */}
              {config.companionHandle && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg backdrop-blur-md bg-[#100C1F]/90 border border-[#282141] text-[10px] text-[#ECE5D1] shadow">
                  <span className="text-xs">👥</span>
                  <span className="text-[#8A8577]">Com</span>
                  <span className="font-mono font-bold text-[#4FDCDE]">{config.companionHandle}</span>
                </div>
              )}

              {/* Favorite Song Badge */}
              {config.favoriteSong && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg backdrop-blur-md bg-[#100C1F]/90 border border-[#282141] text-[10px] text-[#ECE5D1] shadow max-w-[220px]">
                  <Music className="w-3 h-3 text-[#2FB8BA] shrink-0 animate-pulse" />
                  <span className="text-[#8A8577] font-bold uppercase tracking-wider">Faixa:</span>
                  <span className="truncate font-bold text-[#4FDCDE]">"{config.favoriteSong}"</span>
                </div>
              )}

              {/* Setlist Highlights */}
              {config.setlistHighlights && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg backdrop-blur-md bg-[#100C1F]/80 border border-[#282141] text-[9.5px] text-[#B3AE9F] shadow max-w-[260px]">
                  <Sparkles className="w-3 h-3 text-[#FFD60A] shrink-0" />
                  <span className="truncate font-mono">{config.setlistHighlights}</span>
                </div>
              )}
            </div>

            {/* Official Collector Gamification Badge on the Card */}
            {collectorData && (
              <div
                className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl border shadow-xl backdrop-blur-md ${collectorData.badgeBg} ${collectorData.borderColor} animate-in zoom-in-95 duration-300 w-full max-w-[340px]`}
                style={{
                  boxShadow: `0 4px 20px ${collectorData.glowColor}`,
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{collectorData.icon}</span>
                  <div className="min-w-0 flex flex-col leading-tight">
                    <span className={`text-[9.5px] font-black uppercase tracking-wider truncate ${collectorData.textColor}`}>
                      {collectorData.label}
                    </span>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/90">
                      {collectorData.rarityText}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 px-2 py-0.5 rounded-md bg-black/40 border border-white/20 text-[9px] font-mono font-black text-white">
                  {collectorData.editionText}
                </div>
              </div>
            )}

            {/* Ticket Pass Footer or Brand Tag */}
            {templateId === 'ticket-pass' ? (
              <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-[#282141] text-xs font-mono text-[#B3AE9F]">
                <div className="flex items-center gap-1.5">
                  <LivvoTicketIcon className="w-4 h-4 text-[#2FB8BA]" />
                  <span className="text-[#ECE5D1]">LIVVO PASS OFICIAL</span>
                </div>
                <div className="tracking-widest font-mono text-[10px] text-[#4FDCDE]">
                  ||| | | |||| | || | ||| ||
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1 pt-0.5">
                <span
                  className="font-bold tracking-wider text-xs sm:text-sm text-[#ECE5D1]"
                  style={{ fontFamily: "'Bebas Neue', 'Trebuchet MS', sans-serif" }}
                >
                  Livvo Virtual Poster
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8577]">
                  {config.showCollectorBadge ? 'Item de Colecionador Autêntico' : 'Registro Personalizado'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EventCard.displayName = 'EventCard';
