import React, { useState } from 'react';
import {
  X,
  Share2,
  Instagram,
  Facebook,
  MessageCircle,
  Copy,
  Check,
  Download,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ShowItem } from '../types';
import { cleanDateOnly } from '../utils/dateUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: ShowItem | null;
  onGeneratePng: () => Promise<Blob | null>;
  onDownloadPng: () => Promise<void>;
  initialChannel?: 'instagram' | 'whatsapp' | 'facebook' | 'native' | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  show,
  onGeneratePng,
  onDownloadPng,
  initialChannel,
}) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const canUseNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  if (!isOpen || !show) return null;

  const showDate = cleanDateOnly(show.date);
  const shareText = `🎶 Confira meu card oficial do show de ${show.artistName} em ${show.city} (${showDate})! Registrado no Livvo. 🎟️ #Livvo #${show.artistName.replace(/\s+/g, '')}`;

  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Helper: Share file natively if Web Share API with files is supported
  const tryNativeShare = async (blob: Blob, title: string): Promise<boolean> => {
    try {
      const file = new File([blob], `livvo_${show.artistCode}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: shareText,
        });
        return true;
      } else if (navigator.share) {
        await navigator.share({
          title: title,
          text: shareText,
          url: window.location.href,
        });
        return true;
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Native share error or rejected:', err);
      }
    }
    return false;
  };

  // Share via Browser Web Share API directly
  const handleNativeShare = async () => {
    setIsProcessing('native');
    try {
      const blob = await onGeneratePng();
      if (blob) {
        const shared = await tryNativeShare(blob, `Card Oficial - ${show.artistName}`);
        if (shared) {
          triggerFeedback('Compartilhado com sucesso pelo navegador!');
        } else {
          await onDownloadPng();
          triggerFeedback('Card baixado! Seu navegador não suportou o envio direto do arquivo.');
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar via Web Share API:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  // Share to WhatsApp
  const handleShareWhatsApp = async () => {
    setIsProcessing('whatsapp');
    try {
      const blob = await onGeneratePng();
      if (blob) {
        const shared = await tryNativeShare(blob, `Show de ${show.artistName}`);
        if (!shared) {
          // Fallback: download PNG + copy caption + open WhatsApp with text
          await onDownloadPng();
          try {
            await navigator.clipboard.writeText(shareText);
          } catch {}
          triggerFeedback('Card baixado! Abrindo o WhatsApp para você anexar a imagem...');
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(waUrl, '_blank');
        } else {
          triggerFeedback('Card compartilhado no WhatsApp com sucesso!');
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar no WhatsApp:', err);
      triggerFeedback('Não foi possível gerar a imagem para compartilhamento.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Share to Instagram
  const handleShareInstagram = async () => {
    setIsProcessing('instagram');
    try {
      const blob = await onGeneratePng();
      if (blob) {
        const shared = await tryNativeShare(blob, `Show de ${show.artistName}`);
        if (!shared) {
          // On desktop, download card and direct to Instagram
          await onDownloadPng();
          try {
            await navigator.clipboard.writeText(shareText);
            setCopiedCaption(true);
            setTimeout(() => setCopiedCaption(false), 3000);
          } catch {}
          triggerFeedback('Card salvo em alta resolução e legenda copiada! Abra o Instagram para postar nos Stories ou Feed.');
          window.open('https://instagram.com', '_blank');
        } else {
          triggerFeedback('Card compartilhado no Instagram com sucesso!');
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar no Instagram:', err);
      triggerFeedback('Não foi possível gerar o card.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Share to Facebook
  const handleShareFacebook = async () => {
    setIsProcessing('facebook');
    try {
      const blob = await onGeneratePng();
      if (blob) {
        const shared = await tryNativeShare(blob, `Show de ${show.artistName}`);
        if (!shared) {
          await onDownloadPng();
          triggerFeedback('Card baixado! Abrindo o Facebook para você publicar seu show...');
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`;
          window.open(fbUrl, '_blank');
        } else {
          triggerFeedback('Card compartilhado no Facebook com sucesso!');
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar no Facebook:', err);
      triggerFeedback('Não foi possível gerar o card.');
    } finally {
      setIsProcessing(null);
    }
  };

  // Copy Image directly to clipboard (allows instant Ctrl+V into WhatsApp Web, Telegram, Slack, etc.)
  const handleCopyImage = async () => {
    setIsProcessing('copy-img');
    try {
      const blob = await onGeneratePng();
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        triggerFeedback('Imagem copiada para a área de transferência! Cole (Ctrl+V) diretamente no WhatsApp ou em qualquer chat.');
        setTimeout(() => setCopiedImage(false), 3000);
      } else {
        await onDownloadPng();
        triggerFeedback('Card baixado no seu dispositivo!');
      }
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      await onDownloadPng();
      triggerFeedback('Card baixado diretamente no computador.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedCaption(true);
      triggerFeedback('Legenda copiada com sucesso!');
      setTimeout(() => setCopiedCaption(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
    }
  };

  // Trigger initial channel if provided
  React.useEffect(() => {
    if (!initialChannel || !isOpen) return;
    if (initialChannel === 'native') {
      handleNativeShare();
    } else if (initialChannel === 'instagram') {
      handleShareInstagram();
    } else if (initialChannel === 'whatsapp') {
      handleShareWhatsApp();
    } else if (initialChannel === 'facebook') {
      handleShareFacebook();
    }
  }, [isOpen, initialChannel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#171226] border border-[#282141] rounded-3xl shadow-2xl p-6 text-[#ECE5D1] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#282141]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#2FB8BA]/10 border border-[#2FB8BA]/30 flex items-center justify-center text-[#2FB8BA]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#ECE5D1] leading-tight">Compartilhar Card</h2>
              <p className="text-xs text-[#B3AE9F]">
                {show.artistName} • {show.city} ({showDate})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#B3AE9F] hover:text-[#ECE5D1] hover:bg-[#282141] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedbackMessage && (
          <div className="mt-4 p-3 rounded-xl bg-[#2FB8BA]/15 border border-[#2FB8BA]/30 text-xs text-[#22E3E6] flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0 text-[#2FB8BA]" />
            <span className="leading-snug">{feedbackMessage}</span>
          </div>
        )}

        {/* Native Web Share API Banner if supported by browser */}
        {canUseNativeShare && (
          <div className="mt-4">
            <button
              onClick={handleNativeShare}
              disabled={isProcessing !== null}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#2FB8BA]/15 hover:bg-[#2FB8BA]/25 border border-[#2FB8BA]/40 transition-all text-left group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2FB8BA] flex items-center justify-center text-[#100C1F] shadow-md group-hover:scale-105 transition-transform">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-[#22E3E6] block group-hover:text-white transition-colors">
                    Menu do Navegador (Web Share API)
                  </span>
                  <span className="text-xs text-[#B3AE9F]">
                    Disparar o menu de compartilhamento nativo do sistema
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2FB8BA] pr-1">
                <span>{isProcessing === 'native' ? 'Abrindo...' : 'Disparar'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        )}

        {/* Social Share Options */}
        <div className="mt-4 space-y-3">
          {/* Instagram Button */}
          <button
            onClick={handleShareInstagram}
            disabled={isProcessing !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#FCB045]/20 hover:from-[#833AB4]/35 hover:via-[#FD1D1D]/35 hover:to-[#FCB045]/35 border border-[#FD1D1D]/30 transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-[#ECE5D1] block group-hover:text-white transition-colors">
                  Instagram
                </span>
                <span className="text-xs text-[#B3AE9F]">
                  Stories e Feed em alta resolução (300 DPI)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FCB045] pr-1">
              <span>{isProcessing === 'instagram' ? 'Preparando...' : 'Compartilhar'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            disabled={isProcessing !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center text-[#100C1F] shadow-md group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-[#ECE5D1] block group-hover:text-white transition-colors">
                  WhatsApp
                </span>
                <span className="text-xs text-[#B3AE9F]">
                  Enviar para contatos, grupos ou Status
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#25D366] pr-1">
              <span>{isProcessing === 'whatsapp' ? 'Preparando...' : 'Enviar'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Facebook Button */}
          <button
            onClick={handleShareFacebook}
            disabled={isProcessing !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 transition-all text-left group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Facebook className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-[#ECE5D1] block group-hover:text-white transition-colors">
                  Facebook
                </span>
                <span className="text-xs text-[#B3AE9F]">
                  Publicar no Feed, Stories ou Linha do Tempo
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1877F2] pr-1">
              <span>{isProcessing === 'facebook' ? 'Preparando...' : 'Publicar'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Secondary Actions: Copy Image & Download PNG */}
        <div className="mt-5 pt-4 border-t border-[#282141] grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopyImage}
            disabled={isProcessing !== null}
            className="inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#100C1F] hover:bg-[#1E1833] border border-[#282141] text-xs font-bold text-[#ECE5D1] transition-all cursor-pointer disabled:opacity-50"
          >
            {copiedImage ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2FB8BA]" />
                <span>Imagem Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#2FB8BA]" />
                <span>Copiar Imagem (Ctrl+V)</span>
              </>
            )}
          </button>

          <button
            onClick={async () => {
              setIsProcessing('download');
              try {
                await onDownloadPng();
                triggerFeedback('Card baixado com sucesso!');
              } finally {
                setIsProcessing(null);
              }
            }}
            disabled={isProcessing !== null}
            className="inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#100C1F] hover:bg-[#1E1833] border border-[#282141] text-xs font-bold text-[#ECE5D1] transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#2FB8BA]" />
            <span>Salvar no Aparelho</span>
          </button>
        </div>

        {/* Caption Box */}
        <div className="mt-4 p-3 bg-[#100C1F] rounded-xl border border-[#282141] flex items-center justify-between gap-3 text-xs">
          <div className="truncate text-[#B3AE9F] font-mono select-all">
            {shareText}
          </div>
          <button
            onClick={handleCopyCaption}
            className="shrink-0 p-1.5 rounded-lg bg-[#1E1833] hover:bg-[#282141] text-[#2FB8BA] transition-colors"
            title="Copiar texto da legenda"
          >
            {copiedCaption ? <CheckCircle2 className="w-4 h-4 text-[#2FB8BA]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
