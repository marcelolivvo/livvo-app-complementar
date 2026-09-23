import React, { forwardRef } from 'react';
import { Calendar, MapPin, Building2, Music, Sparkles, Ticket } from 'lucide-react';
import { ShowItem, CardTemplateConfig } from '../types';
import { cleanDateOnly } from '../utils/dateUtils';
import { LivvoLogo } from './LivvoLogo';

interface EventCardProps {
  show: ShowItem;
  photoUrl?: string | null;
  posterUrl?: string | null;
  config: CardTemplateConfig;
  className?: string;
  isExporting?: boolean;
}

export const EventCard = forwardRef<HTMLDivElement, EventCardProps>(
  ({ show, photoUrl, posterUrl, config, className = '' }, ref) => {
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
      ? posterUrl || show.posterUrl || photoUrl
      : photoUrl || posterUrl || show.posterUrl;

    const hasPhoto = Boolean(effectiveImageUrl);

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

    const venueTextClasses =
      fontSize === 'small'
        ? 'text-xs sm:text-sm'
        : fontSize === 'medium'
        ? 'text-sm sm:text-base'
        : 'text-base sm:text-lg';

    const cityTextClasses =
      fontSize === 'small'
        ? 'text-xs sm:text-sm'
        : fontSize === 'medium'
        ? 'text-sm sm:text-base'
        : 'text-base sm:text-lg';

    // Artist Name & Tour Title Block
    const renderArtistNameBlock = (isCentered = false) => (
      <div className={`space-y-1.5 ${isCentered ? 'text-center' : ''}`}>
        {show.tourName && (
          <div className={`flex items-center gap-1.5 mb-1.5 ${isCentered ? 'justify-center' : ''}`}>
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
            <span
              className={`${tourSizeClasses} uppercase font-extrabold tracking-widest drop-shadow-sm truncate`}
              style={{ color: accentColor }}
            >
              {show.tourName}
            </span>
          </div>
        )}

        {templateId === 'festival-bold' ? (
          <h1
            className={`${artistHeadingClasses} font-black uppercase tracking-tight text-[#ECE5D1] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] break-words`}
            style={{ fontFamily: getFontFamilyStyle() }}
          >
            {show.artistName}
          </h1>
        ) : templateId === 'minimal-editorial' ? (
          <h1
            className={`${artistHeadingClasses} font-light tracking-wide text-[#ECE5D1] leading-tight uppercase`}
            style={{ fontFamily: config.fontFamily ? getFontFamilyStyle() : "'Playfair Display', serif" }}
          >
            {show.artistName}
          </h1>
        ) : templateId === 'neon-tour' ? (
          <h1
            className={`${artistHeadingClasses} font-black uppercase tracking-tighter text-[#ECE5D1] leading-none`}
            style={{
              fontFamily: getFontFamilyStyle(),
              textShadow: `0 0 15px ${accentColor}90, 0 0 30px ${accentColor}50`,
            }}
          >
            {show.artistName}
          </h1>
        ) : (
          <h1
            className={`${artistHeadingClasses} font-black uppercase tracking-tight text-[#ECE5D1] leading-tight drop-shadow-lg break-words`}
            style={{ fontFamily: getFontFamilyStyle() }}
          >
            {show.artistName}
          </h1>
        )}

        {/* Accent Divider */}
        <div
          className={`h-1 w-20 rounded-full ${isCentered ? 'mx-auto' : ''}`}
          style={{ backgroundColor: accentColor }}
        />
      </div>
    );

    return (
      <div
        ref={ref}
        id={`card-${show.showCode}`}
        className={`relative overflow-hidden select-none bg-[#100C1F] text-[#ECE5D1] shadow-2xl rounded-2xl transition-all ${getRatioClass()} ${className}`}
        style={{
          fontFamily: getFontFamilyStyle(),
        }}
      >
        {/* Background Image Layer - 100% card coverage without side margins */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          {hasPhoto ? (
            <img
              src={effectiveImageUrl!}
              alt={show.artistName}
              className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center transform scale-100 transition-transform duration-500"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.getAttribute('crossorigin')) {
                  target.removeAttribute('crossorigin');
                  target.src = effectiveImageUrl!;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#100C1F] via-[#171226] to-[#1E1833] flex items-center justify-center p-8">
              <div className="text-center opacity-30">
                <Music className="w-24 h-24 mx-auto mb-4 text-[#B3AE9F]" />
                <p className="text-sm font-semibold tracking-widest uppercase text-[#ECE5D1]">
                  {isPosterMode ? 'Pôster pendente' : 'Foto pendente'}
                </p>
                <p className="text-xs text-[#8A8577]">Código: {show.artistCode}</p>
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
        </div>

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

                {showShowCode && (
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
                    style={{ color: accentColor }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`${dateTextClasses} font-extrabold text-[#ECE5D1] tracking-tight leading-tight block truncate`}>
                      {cleanDateOnly(show.date)}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Venue / Casa de Show (Between Date and City, with exactly the same size & style) */}
              {showVenueBadge && (
                <div className={`flex items-center gap-2 ${showDateHighlight ? 'pt-1.5 border-t border-[#282141]' : ''}`}>
                  <div
                    className="p-1 sm:p-1.5 rounded-lg bg-[#282141] flex items-center justify-center shrink-0 border border-[#4FDCDE]/20"
                    style={{ color: accentColor }}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`${venueTextClasses} font-extrabold tracking-tight text-[#ECE5D1] truncate leading-tight`} title={show.venue}>
                      {show.venue || 'Local a confirmar'}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. City */}
              {showLocationBadge && (
                <div className={`flex items-center gap-2 ${(showDateHighlight || showVenueBadge) ? 'pt-1.5 border-t border-[#282141]' : ''}`}>
                  <div
                    className="p-1 sm:p-1.5 rounded-lg bg-[#282141] flex items-center justify-center shrink-0 border border-[#4FDCDE]/20"
                    style={{ color: accentColor }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`${cityTextClasses} font-extrabold tracking-wide text-[#2FB8BA] truncate leading-tight`}>
                      {show.city || 'Brasil'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ticket Pass Footer or Brand Tag */}
            {templateId === 'ticket-pass' ? (
              <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-[#282141] text-xs font-mono text-[#B3AE9F]">
                <div className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-[#2FB8BA]" />
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
                  Registro Personalizado
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
