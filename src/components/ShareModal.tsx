import React, { useState } from 'react';
import { X, Copy, Download, Check, Share2, Camera, Globe, RefreshCw } from 'lucide-react';
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

type Network = 'instagram' | 'facebook';

const NETWORKS: Record<Network, { label: string; hint: string; url: (appUrl: string) => string; tip: string }> = {
  instagram: {
    label: 'Instagram',
    hint: 'Stories ou feed',
    url: () => 'https://www.instagram.com/',
    tip: 'Imagem baixada. No Instagram, toque em + (post ou Story) e escolha a imagem do Livvo.',
  },
  facebook: {
    label: 'Facebook',
    hint: 'Post no seu perfil',
    url: (appUrl) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`,
    tip: 'Imagem baixada. No Facebook, anexe a imagem do Livvo ao post.',
  },
};

/** O navegador consegue mandar a imagem direto para os apps (celular)? */
const canShareFiles = () => {
  try {
    if (!navigator.share || !navigator.canShare) return false;
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'livvo.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  show,
  cardTitle,
  onDownloadPng,
  onGeneratePng,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [busy, setBusy] = useState<Network | 'native' | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayTitle = cardTitle || show?.artistName || 'Show Oficial';
  const appUrl = window.location.origin;
  const fileName = `livvo_${displayTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
  const shareText = `Eu fui! ${displayTitle} no meu passaporte de shows Livvo.`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).catch(() => undefined);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Celular: abre a folha de compartilhamento com a imagem (Instagram e Facebook aparecem nela).
  // Computador: baixa a imagem, copia para a área de transferência e abre a rede social.
  const handleNetwork = async (net: Network) => {
    if (!onGeneratePng) return;
    setTip(null);
    const mobile = canShareFiles();
    // A aba é aberta já no clique para o navegador não bloquear o pop-up
    const tab = mobile ? null : window.open('about:blank', '_blank');
    try {
      setBusy(net);
      const blob = await onGeneratePng();
      if (!blob) {
        tab?.close();
        return;
      }
      if (mobile) {
        const file = new File([blob], fileName, { type: 'image/png' });
        await navigator.share({ files: [file], title: displayTitle, text: shareText });
        onClose();
        return;
      }
      downloadBlob(blob);
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch {
        /* sem permissão de área de transferência: o download já resolve */
      }
      if (tab) tab.location.href = NETWORKS[net].url(appUrl);
      setTip(NETWORKS[net].tip);
    } catch (e) {
      tab?.close();
      console.warn('Erro ao compartilhar:', e);
    } finally {
      setBusy(null);
    }
  };

  const handleNativeShare = async () => {
    try {
      setBusy('native');
      if (onGeneratePng && canShareFiles()) {
        const blob = await onGeneratePng();
        if (blob) {
          await navigator.share({
            files: [new File([blob], fileName, { type: 'image/png' })],
            title: displayTitle,
            text: shareText,
          });
          onClose();
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: displayTitle, text: shareText, url: appUrl });
        onClose();
      } else {
        handleCopyLink();
      }
    } catch (e) {
      console.warn('Erro ao compartilhar:', e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div
        className="lv-studio bg-[#171226] rounded-[10px] max-w-md w-full shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <div className="lv-strip">
          <span>Livvo · Compartilhar</span>
          <span className="truncate max-w-[55%]">{displayTitle}</span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="share-title" className="lv-display text-[22px] text-[#ECE5D1]">
                Compartilhar
              </h3>
              <p className="text-[13px] text-[#B3AE9F] mt-1">Escolha onde postar seu card em alta resolução.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#8A8577] hover:text-[#ECE5D1] transition-colors cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Redes */}
          <div className="border-t border-dashed border-[#282141]">
            {(Object.keys(NETWORKS) as Network[]).map((net) => {
              const n = NETWORKS[net];
              const Icon = net === 'instagram' ? Camera : Globe;
              return (
                <button
                  key={net}
                  type="button"
                  onClick={() => handleNetwork(net)}
                  disabled={busy !== null}
                  className="lv-show w-full text-left"
                  style={{ gridTemplateColumns: '36px minmax(0,1fr) auto' }}
                >
                  <span className="w-9 h-9 rounded-full border border-[#4FDCDE] flex items-center justify-center text-[#4FDCDE] shrink-0">
                    {busy === net ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-[#ECE5D1]">{n.label}</span>
                    <span className="block lv-mono text-[11px] text-[#8A8577]">{n.hint}</span>
                  </span>
                  <Share2 className="lv-show-go w-4 h-4" />
                </button>
              );
            })}
          </div>

          {tip && (
            <p className="lv-mono text-[11.5px] text-[#4FDCDE] border-l-2 border-[#4FDCDE] pl-3" role="status">
              {tip}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={onDownloadPng} className="lv-btn lv-btn--cream">
              <Download className="w-4 h-4" />
              <span>Baixar PNG</span>
            </button>
            <button type="button" onClick={handleNativeShare} disabled={busy !== null} className="lv-btn lv-btn--cyan">
              <Share2 className="w-4 h-4" />
              <span>Mais opções</span>
            </button>
          </div>

          <button type="button" onClick={handleCopyLink} className="lv-link mx-auto flex">
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link copiado' : 'Copiar link do app'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
