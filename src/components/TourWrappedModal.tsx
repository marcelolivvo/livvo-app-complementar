import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Sparkles, Download, Share2, Check, RefreshCw } from 'lucide-react';
import { FanStats, CollectedTicket } from '../services/walletService';
import { LivvoLogo } from './LivvoLogo';
import { LivvoTicketIcon } from './LivvoTicketIcon';
import { useModalA11y } from '../utils/useModalA11y';
import { LIVVO_SITE } from '../utils/livvoBrand';
import { guestService } from '../services/guestService';

interface TourWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: FanStats;
  tickets: CollectedTicket[];
  userHandle?: string;
}

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

export const TourWrappedModal: React.FC<TourWrappedModalProps> = ({
  isOpen,
  onClose,
  stats,
  tickets,
  userHandle = '@toboi',
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [done, setDone] = useState<'download' | 'share' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // #20: Escape fecha, foco preso na janela e devolvido ao botão que abriu
  useModalA11y(isOpen, onClose, boxRef);

  if (!isOpen) return null;

  // Fundo do card: foto (ou pôster) do artista mais assistido
  const topKey = stats.topArtist?.name?.trim().toLowerCase();
  const topTicket = topKey
    ? tickets.find((t) => t.artistName.trim().toLowerCase() === topKey && (t.photoUrl || t.posterUrl))
    : undefined;
  const topImage = topTicket?.photoUrl || topTicket?.posterUrl;
  const year = new Date().getFullYear();
  const fileName = `Livvo_Wrapped_${(userHandle || 'fa').replace(/^@/, '').replace(/[^\w.-]+/g, '') || 'fa'}_${year}.png`;

  const makePng = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    // #12: até 3 cards sem login; o Wrapped conta como um card
    if (!guestService.allowCard(`wrapped-${year}`)) return null;
    return toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
  };

  const flash = (kind: 'download' | 'share') => {
    setDone(kind);
    setTimeout(() => setDone(null), 2500);
  };

  const handleDownload = async () => {
    setError(null);
    setBusy('download');
    try {
      const url = await makePng();
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      flash('download');
    } catch {
      setError('Não foi possível gerar a imagem agora. Tente de novo.');
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setError(null);
    setBusy('share');
    try {
      const url = await makePng();
      if (!url) return;
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: `Meu Livvo Wrapped ${year}`, text: LIVVO_SITE });
        flash('share');
      } else {
        // Sem compartilhamento nativo (ex.: computador): baixa a imagem para postar
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setError('Este navegador não abre o compartilhamento direto. A imagem foi baixada para você postar.');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError('Não foi possível compartilhar agora. Tente baixar a imagem.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lv-wrapped-title"
        tabIndex={-1}
        className="bg-[#171226] border border-[#282141] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative max-h-[calc(100vh-2rem)] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#282141] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FFD60A]" aria-hidden="true" />
            <h3 id="lv-wrapped-title" className="text-base font-black text-[#ECE5D1]">
              Tour Wrapped de Fã
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Wrapped"
            className="p-1.5 rounded-xl hover:bg-[#1E1833] text-[#8A8577] hover:text-[#ECE5D1]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Peça exportada (9:16 visual) */}
        <div
          ref={cardRef}
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
              {plural(stats.uniqueArtists, 'artista diferente', 'artistas diferentes')} ·{' '}
              {plural(stats.uniqueCities, 'cidade', 'cidades')} · {plural(stats.uniqueStates, 'estado', 'estados')}
            </p>
          </div>

          {stats.topArtist && (
            <div className="bg-[#100C1F]/80 p-3 rounded-xl border border-[#282141] flex items-center justify-between">
              <span className="text-xs text-[#8A8577]">Artista Mais Assistido:</span>
              <span className="text-xs font-black text-[#FFD60A]">
                {stats.topArtist.name} ({stats.topArtist.count}x)
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-[#282141] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8577]">
              <span className="flex items-center gap-1">
                <LivvoTicketIcon className="w-3.5 h-3.5 text-[#2FB8BA]" />
                <span>Livvo Wrapped {year}</span>
              </span>
              <span className="text-[#FFD60A] font-bold">{stats.levelTitle}</span>
            </div>
            <div className="text-center text-[10px] font-mono tracking-wider text-[#4FDCDE]">{LIVVO_SITE}</div>
          </div>
        </div>

        {/* #12: fechar o fluxo com Baixar e Compartilhar */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy !== null}
            className="lv-btn lv-btn--cream"
          >
            {busy === 'download' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : done === 'download' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{done === 'download' ? 'Baixado' : 'Baixar'}</span>
          </button>
          <button type="button" onClick={handleShare} disabled={busy !== null} className="lv-btn lv-btn--cyan">
            {busy === 'share' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : done === 'share' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>{done === 'share' ? 'Compartilhado' : 'Compartilhar'}</span>
          </button>
        </div>

        {error && (
          <p role="status" className="text-[12px] text-[#B3AE9F] text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
