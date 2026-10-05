import React from 'react';
import { X, Sparkles, Award } from 'lucide-react';
import { FanStats, CollectedTicket } from '../services/walletService';
import { LivvoLogo } from './LivvoLogo';
import { LivvoTicketIcon } from './LivvoTicketIcon';

interface TourWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: FanStats;
  tickets: CollectedTicket[];
  userHandle?: string;
}

export const TourWrappedModal: React.FC<TourWrappedModalProps> = ({
  isOpen,
  onClose,
  stats,
  tickets,
  userHandle = '@toboi',
}) => {
  if (!isOpen) return null;

  // Fundo do card: foto (ou pôster) do artista mais assistido
  const topKey = stats.topArtist?.name?.trim().toLowerCase();
  const topTicket = topKey
    ? tickets.find((t) => t.artistName.trim().toLowerCase() === topKey && (t.photoUrl || t.posterUrl))
    : undefined;
  const topImage = topTicket?.photoUrl || topTicket?.posterUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#171226] border border-[#282141] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <div className="flex items-center justify-between border-b border-[#282141] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FFD60A]" />
            <h3 className="text-base font-black text-[#ECE5D1]">Tour Wrapped de Fã</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#1E1833] text-[#8A8577] hover:text-[#ECE5D1]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`border border-[#2FB8BA]/30 rounded-2xl p-5 space-y-4 bg-cover bg-center ${
            topImage ? 'min-h-[340px] flex flex-col justify-between' : 'bg-[#120E22]'
          }`}
          style={
            topImage
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(16,12,31,0.55) 0%, rgba(16,12,31,0.35) 40%, rgba(16,12,31,0.92) 100%), url("${topImage}")`,
                }
              : undefined
          }
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LivvoLogo className="w-8 h-8" />
              <span className="font-mono text-xs font-bold text-[#4FDCDE]">{userHandle}</span>
            </div>
            <span className="text-[10px] font-mono text-[#FFD60A] font-black uppercase">Resumo Oficial</span>
          </div>

          <div className="text-center py-2 space-y-1">
            <span className="text-3xl font-black text-[#ECE5D1] [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
              {stats.totalShows} Shows Ao Vivo
            </span>
            <p className="text-xs text-[#ECE5D1]/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
              {stats.uniqueArtists} artistas diferentes em {stats.uniqueCities} cidades
            </p>
          </div>

          {stats.topArtist && (
            <div className="bg-[#100C1F]/80 p-3 rounded-xl border border-[#282141] flex items-center justify-between">
              <span className="text-xs text-[#8A8577]">Artista Mais Assistido:</span>
              <span className="text-xs font-black text-[#FFD60A]">{stats.topArtist.name} ({stats.topArtist.count}x)</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#282141] text-[10px] font-mono text-[#8A8577]">
            <span className="flex items-center gap-1">
              <LivvoTicketIcon className="w-3.5 h-3.5 text-[#2FB8BA]" />
              <span>Livvo Wrapped {new Date().getFullYear()}</span>
            </span>
            <span className="text-[#FFD60A] font-bold">{stats.levelTitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
