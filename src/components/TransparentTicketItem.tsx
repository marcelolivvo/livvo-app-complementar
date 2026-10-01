import React, { useRef, useState, useEffect } from 'react';
import { Calendar, MapPin, Building2, ExternalLink, Trash2 } from 'lucide-react';
import { CollectedTicket } from '../services/walletService';
import { cleanDateOnly } from '../utils/dateUtils';
import { cleanCityOnly } from '../utils/stateUtils';
import { LivvoTicketIcon } from './LivvoTicketIcon';

interface TransparentTicketItemProps {
  ticket: CollectedTicket;
  isActive: boolean;
  onToggleActive: () => void;
  onOpenInStudio: (ticket: CollectedTicket) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
}

export const TransparentTicketItem: React.FC<TransparentTicketItemProps> = ({
  ticket,
  isActive,
  onToggleActive,
  onOpenInStudio,
  onRemove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 560, height: 185 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { width, height } = dimensions;
  // Stub width: ~28% of total ticket width (clamped for responsiveness)
  const notchX = Math.round(Math.max(100, Math.min(175, width * 0.28)));
  const notchR = 16; // 16px radius for the semicircular cutouts
  const cornerR = 24; // 24px radius for rounded ticket corners

  // SVG path matching 07-transparente-contorno-ciano.webp
  const ticketPath = `
    M ${cornerR},0
    L ${notchX - notchR},0
    A ${notchR},${notchR} 0 0,0 ${notchX + notchR},0
    L ${width - cornerR},0
    A ${cornerR},${cornerR} 0 0,1 ${width},${cornerR}
    L ${width},${height - cornerR}
    A ${cornerR},${cornerR} 0 0,1 ${width - cornerR},${height}
    L ${notchX + notchR},${height}
    A ${notchR},${notchR} 0 0,0 ${notchX - notchR},${height}
    L ${cornerR},${height}
    A ${cornerR},${cornerR} 0 0,1 0,${height - cornerR}
    L 0,${cornerR}
    A ${cornerR},${cornerR} 0 0,1 ${cornerR},0
    Z
  `;

  return (
    <div
      ref={containerRef}
      onClick={onToggleActive}
      className={`relative w-full min-h-[175px] sm:min-h-[185px] transition-all duration-300 cursor-pointer group select-none ${
        isActive ? 'scale-[1.01]' : 'hover:scale-[1.005]'
      }`}
    >
      {/* 1. Transparent Ticket Contour SVG with Neon Cyan Stroke */}
      <svg
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{
          filter: isActive
            ? 'drop-shadow(0 0 10px rgba(79, 220, 222, 0.6)) drop-shadow(0 0 20px rgba(79, 220, 222, 0.25))'
            : 'drop-shadow(0 0 5px rgba(79, 220, 222, 0.35))',
        }}
      >
        {/* Outer ticket perimeter with top/bottom semicircle cutouts */}
        <path
          d={ticketPath}
          fill="none"
          stroke="#4FDCDE"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Perforated tear line (picote) between the two notches */}
        <line
          x1={notchX}
          y1={notchR + 3}
          x2={notchX}
          y2={height - notchR - 3}
          stroke="#4FDCDE"
          strokeWidth="2.5"
          strokeDasharray="5 5"
        />
      </svg>

      {/* 2. Primeira Parte do Ticket (Antes do Picote): Foto do Artista */}
      <div
        className="absolute left-0 top-0 bottom-0 p-2 sm:p-2.5 overflow-hidden flex items-center justify-center"
        style={{ width: `${notchX}px` }}
      >
        <div className="w-full h-full rounded-l-[18px] rounded-r-md overflow-hidden bg-[#100C1F]/40 border border-[#282141]/60 relative">
          {ticket.photoUrl ? (
            <img
              src={ticket.photoUrl}
              alt={ticket.artistName}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#171226] to-[#100C1F]">
              <LivvoTicketIcon className="w-8 h-8 text-[#2FB8BA] mb-1" />
              <span className="text-[10px] text-[#ECE5D1] font-mono leading-tight truncate w-full">
                {ticket.artistName}
              </span>
            </div>
          )}

          {/* Vignette on photo bottom */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* EU FUI Badge */}
          {ticket.stampType === 'eu-fui' && (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[#FFD60A]/20 text-[#FFD60A] border border-[#FFD60A]/40 backdrop-blur-xs">
                EU FUI
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Segunda Parte do Ticket (Depois do Picote): Dados e Botões nos outros espaços */}
      <div
        className="absolute top-0 bottom-0 right-0 p-3 sm:p-4 pl-4 sm:pl-5 flex flex-col justify-between"
        style={{ left: `${notchX}px` }}
      >
        {/* Linha Superior: Nome do Artista, Turnê e Código */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-black text-[#ECE5D1] truncate leading-tight tracking-tight">
                {ticket.artistName}
              </h4>
              {ticket.stampType && ticket.stampType !== 'none' && ticket.stampType !== 'eu-fui' && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#2FB8BA]/15 text-[#4FDCDE] border border-[#2FB8BA]/30">
                  {ticket.stampType.toUpperCase()}
                </span>
              )}
            </div>

            {ticket.tourName ? (
              <p className="text-xs text-[#4FDCDE] font-semibold truncate mt-0.5">
                {ticket.tourName}
              </p>
            ) : (
              <p className="text-[11px] text-[#8A8577] truncate mt-0.5">
                Lembrança Personalizada do Show
              </p>
            )}
          </div>

          {/* Código do Show */}
          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono font-bold text-[#8A8577] px-2 py-0.5 rounded-lg border border-[#282141] bg-[#100C1F]/60">
              {ticket.showCode}
            </span>
          </div>
        </div>

        {/* Linha Central: Data, Local (Venue) e Cidade */}
        <div className="grid grid-cols-3 gap-2 my-1 text-xs">
          {/* Data */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-[#2FB8BA] shrink-0" />
            <span className="font-mono font-bold text-[#ECE5D1] truncate text-[11px] sm:text-xs">
              {cleanDateOnly(ticket.date)}
            </span>
          </div>

          {/* Local */}
          <div className="flex items-center gap-1.5 min-w-0" title={ticket.venue}>
            <Building2 className="w-3.5 h-3.5 text-[#4FDCDE] shrink-0" />
            <span className="text-[#B3AE9F] truncate text-[11px] sm:text-xs">
              {ticket.venue || 'Local a confirmar'}
            </span>
          </div>

          {/* Cidade */}
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
            <span className="text-[#ECE5D1] font-semibold truncate text-[11px] sm:text-xs">
              {cleanCityOnly(ticket.city)}
            </span>
          </div>
        </div>

        {/* Linha Inferior: Indicador Oficial e Botões de Ação */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#282141]/40">
          <div className="text-[10px] text-[#8A8577] font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FB8BA] animate-pulse" />
            <span>Ingresso Oficial Livvo</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInStudio(ticket);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
              title="Abrir ingresso no Estúdio"
            >
              <span>Abrir no Estúdio</span>
              <ExternalLink className="w-3 h-3 text-[#100C1F]" />
            </button>

            <button
              onClick={(e) => onRemove(ticket.id, e)}
              className="p-1.5 rounded-xl bg-[#100C1F]/60 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
              title="Remover ingresso da carteira"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
