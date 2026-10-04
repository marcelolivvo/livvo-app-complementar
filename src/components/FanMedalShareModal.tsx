import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Trophy,
  Ticket,
  Music,
  MapPin,
  ShieldCheck,
  Lock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { FanStats, FanMedalTier, FAN_MEDAL_TIERS } from '../services/walletService';
import { LivvoLogo } from './LivvoLogo';
import { FanMedalIllustration } from './MedalIllustrations';

interface FanMedalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: FanStats;
  medals: FanMedalTier[];
  userHandle: string;
}

export const FanMedalShareModal: React.FC<FanMedalShareModalProps> = ({
  isOpen,
  onClose,
  stats,
  medals,
  userHandle,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story');

  if (!isOpen) return null;

  const unlockedMedalsCount = medals.filter((m) => m.unlocked).length;
  const currentMedal = stats.currentMedal || medals[0];
  const nextMedal = stats.nextMedal;
  const missingForNext = nextMedal
    ? Math.max(0, nextMedal.minShows - stats.totalShows)
    : 0;

  // Generate PNG Data URL
  const generatePngDataUrl = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      setIsExporting(true);
      return await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        quality: 0.98,
      });
    } catch (err) {
      console.error('Erro ao gerar card de medalhas:', err);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  // 1. Download PNG
  const handleDownload = async () => {
    const dataUrl = await generatePngDataUrl();
    if (!dataUrl) return;

    const link = document.createElement('a');
    const safeHandle = userHandle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `livvo_medalhas_${safeHandle || 'fa'}_${aspectRatio}.png`;
    link.href = dataUrl;
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    const dataUrl = await generatePngDataUrl();
    if (!dataUrl) return;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      handleDownload();
    }
  };

  // 3. Native Share API
  const handleNativeShare = async () => {
    const dataUrl = await generatePngDataUrl();
    if (!dataUrl) return;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'livvo_medalhas_fa.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Meu Nível de Fã no LIVVO: ${stats.levelTitle}`,
          text: `Conquistei ${unlockedMedalsCount}/5 medalhas oficiais de fã com ${stats.totalShows} shows colecionados no meu passaporte LIVVO! 🎟️✨`,
          files: [file],
        });
      } else {
        await handleCopyImage();
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  // Linha de leitura mecânica (mesma da Wallet), gerada só com dados reais
  const mrzSafe = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '<');
  const pad = (v: string, n = 44) => (v + '<'.repeat(n)).slice(0, n);
  const mrz1 = pad(`P<LIVVO<<${mrzSafe((userHandle || 'FA').replace(/^@/, ''))}`);
  const mrz2 = pad(
    `NV${stats.level}<${mrzSafe(stats.levelTitle)}<<SH${String(stats.totalShows).padStart(3, '0')}<AR${String(
      stats.uniqueArtists
    ).padStart(3, '0')}<UF${String(stats.uniqueStates).padStart(2, '0')}`
  );
  const tickCount = 24;
  const onTicks = Math.round(((nextMedal ? stats.nextLevelProgress : 100) / 100) * tickCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-in fade-in duration-200">
      <div
        className="lv-studio bg-[#171226] rounded-[10px] max-w-xl w-full shadow-2xl overflow-y-auto max-h-[94vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="medal-share-title"
      >
        <div className="lv-strip">
          <span>Livvo · Compartilhar</span>
          <span>
            <b>{unlockedMedalsCount}/5</b> carimbadas
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="medal-share-title" className="lv-display text-[24px] text-[#ECE5D1]">
                Compartilhar medalhas
              </h3>
              <p className="text-[13px] text-[#B3AE9F] mt-1">
                Um card com seu nível e suas medalhas para postar nos Stories ou no feed.
              </p>
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

          {/* Formato */}
          <div className="flex items-center justify-between gap-3">
            <span className="lv-eyebrow">Formato</span>
            <div className="lv-seg" role="group" aria-label="Formato do card">
              <button
                type="button"
                data-on={aspectRatio === 'story'}
                aria-pressed={aspectRatio === 'story'}
                onClick={() => setAspectRatio('story')}
              >
                Stories 9:16
              </button>
              <button
                type="button"
                data-on={aspectRatio === 'square'}
                aria-pressed={aspectRatio === 'square'}
                onClick={() => setAspectRatio('square')}
              >
                Feed 1:1
              </button>
            </div>
          </div>

          {/* Palco com o card que será exportado */}
          <div className="lv-stage rounded-[8px] flex justify-center items-center p-3 sm:p-6">
            <div
              ref={cardRef}
              className={`lv-share-card w-full flex flex-col justify-between ${
                aspectRatio === 'story' ? 'max-w-[360px] min-h-[600px]' : 'max-w-[400px] min-h-[400px]'
              }`}
            >
              {/* Topo: marca e titular */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <LivvoLogo className="w-9 h-9" />
                  <span className="lv-eyebrow">Passaporte de fã</span>
                </div>
                <span className="lv-mono text-[12px] text-[#4FDCDE]">{userHandle || '@fa'}</span>
              </div>

              {/* Medalha do nível atual */}
              <div className="text-center py-4">
                <FanMedalIllustration
                  medalId={currentMedal.id}
                  level={stats.level}
                  unlocked={true}
                  className={`mx-auto ${aspectRatio === 'story' ? 'w-28 h-28' : 'w-20 h-20'}`}
                />
                <div className="lv-eyebrow mt-3">Nível {stats.level} de fã</div>
                <h4 className="lv-display text-[30px] text-[#ECE5D1] mt-1">{stats.levelTitle}</h4>
                {aspectRatio === 'story' && (
                  <p className="text-[12.5px] text-[#B3AE9F] max-w-[260px] mx-auto mt-1.5 line-clamp-2">
                    {currentMedal.description}
                  </p>
                )}
              </div>

              {/* Campos */}
              <dl className="lv-fields lv-fields--card">
                <div>
                  <dt>Shows</dt>
                  <dd className="lv-num">{stats.totalShows}</dd>
                </div>
                <div>
                  <dt>Artistas</dt>
                  <dd className="lv-num">{stats.uniqueArtists}</dd>
                </div>
                <div>
                  <dt>Cidades</dt>
                  <dd className="lv-num">{stats.uniqueCities}</dd>
                </div>
              </dl>

              {/* Carimbos das 5 medalhas */}
              <div className="lv-stamps lv-stamps--card mt-5">
                {medals.map((m) => (
                  <div key={m.id} className="lv-stamp" data-on={m.unlocked} data-current={stats.level === m.level}>
                    <div className="lv-stamp-ring">
                      <FanMedalIllustration medalId={m.id} level={m.level} unlocked={m.unlocked} className="w-7 h-7" />
                    </div>
                    <span className="lv-stamp-name">{m.name.replace(/^Fã\s+/, '')}</span>
                  </div>
                ))}
              </div>

              {/* Próximo nível */}
              <div className="mt-5 space-y-1.5">
                <div className="lv-ticks lv-ticks--thin" aria-hidden="true">
                  {Array.from({ length: tickCount }).map((_, i) => (
                    <span key={i} data-on={i < onTicks} />
                  ))}
                </div>
                <p className="lv-mono text-[10.5px] text-[#8A8577]">
                  {nextMedal
                    ? `Falta${missingForNext === 1 ? '' : 'm'} ${missingForNext} ${missingForNext === 1 ? 'show' : 'shows'} para o nível ${nextMedal.name.replace(/^Fã\s+/, '')}`
                    : 'Nível máximo: Lenda Viva'}
                </p>
              </div>

              {/* Zona de leitura mecânica */}
              <div className="lv-mrz lv-mrz--card mt-4" aria-hidden="true">
                <div>{mrz1}</div>
                <div>{mrz2}</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button type="button" onClick={handleDownload} disabled={isExporting} className="lv-btn lv-btn--cream">
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Baixado</span>
                </>
              ) : isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando…</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar PNG</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isExporting}
              className="lv-ghost"
              title="Copiar para colar nos Stories ou no WhatsApp"
            >
              {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copySuccess ? 'Imagem copiada' : 'Copiar imagem'}</span>
            </button>
            <button type="button" onClick={handleNativeShare} disabled={isExporting} className="lv-btn lv-btn--cyan">
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
