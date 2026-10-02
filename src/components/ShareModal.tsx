import React, { useState } from 'react';
import { X, Copy, Download, Check, Share2 } from 'lucide-react';
import { ShowItem } from '../types';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  show?: ShowItem | null;
  cardTitle?: string;
  onDownloadPng: () => Promise<void>;
  onGeneratePng?: () => Promise<Blob | null>;
  initialChannel?: 'instagram' | 'whatsapp' | 'facebook' | 'native' | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  show,
  cardTitle,
  onDownloadPng,
  onGeneratePng,
  initialChannel,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const displayTitle = cardTitle || show?.artistName || 'Show Oficial';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleNativeShare = async () => {
    try {
      setIsSharing(true);
      if (onGeneratePng && navigator.share && navigator.canShare) {
        const blob = await onGeneratePng();
        if (blob) {
          const file = new File([blob], `${displayTitle}-ticket.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: displayTitle,
              text: `Meu passaporte oficial de show: ${displayTitle}!`,
              files: [file],
            });
            onClose();
            return;
          }
        }
      }
      if (navigator.share) {
        await navigator.share({
          title: displayTitle,
          text: `Meu ingresso de show colecionado: ${displayTitle}`,
          url: window.location.href,
        });
        onClose();
      } else {
        handleCopyLink();
      }
    } catch (e) {
      console.warn('Erro ao compartilhar:', e);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#171226] border border-[#282141] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#282141] pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#2FB8BA]" />
            <h3 className="text-base font-bold text-[#ECE5D1]">Compartilhar Card Oficial</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#1E1833] text-[#8A8577] hover:text-[#ECE5D1]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#B3AE9F]">
          Compartilhe o card de <strong className="text-[#ECE5D1]">{displayTitle}</strong> em alta resolução nas suas redes sociais ou WhatsApp.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onDownloadPng}
            className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#100C1F]" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleNativeShare}
            disabled={isSharing}
            className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#100C1F]" />
            <span>Compartilhar</span>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={handleCopyLink}
            className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-[#1E1833] hover:bg-[#282141] text-[#ECE5D1] font-bold text-xs border border-[#282141] transition-all cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#2FB8BA]" />
                <span>Link Copiado para a Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#2FB8BA]" />
                <span>Copiar Link do App</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
