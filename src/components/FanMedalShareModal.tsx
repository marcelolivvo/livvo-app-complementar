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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#171226] border border-[#282141] rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[94vh] space-y-4 sm:space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#282141] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#FFD60A] to-[#FF9900] text-[#100C1F] shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#ECE5D1] flex items-center gap-2">
                <span>Compartilhar Medalhas de Fã</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2FB8BA]/15 text-[#2FB8BA] border border-[#2FB8BA]/30 font-mono">
                  {unlockedMedalsCount}/5 Conquistadas
                </span>
              </h3>
              <p className="text-xs text-[#8A8577]">
                Gere um card visual oficial com seu nível e medalhas para postar nos Stories e redes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#1E1833] text-[#8A8577] hover:text-[#ECE5D1] transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector: Stories 9:16 vs Feed 1:1 */}
        <div className="flex items-center justify-between gap-3 bg-[#100C1F]/60 border border-[#282141] p-2 rounded-2xl">
          <span className="text-xs font-bold text-[#8A8577] pl-1">Formato do Card:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAspectRatio('story')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === 'story'
                  ? 'bg-[#ECE5D1] text-[#100C1F] shadow-sm'
                  : 'bg-[#171226] text-[#8A8577] hover:text-[#ECE5D1]'
              }`}
            >
              📱 Stories (9:16)
            </button>
            <button
              onClick={() => setAspectRatio('square')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === 'square'
                  ? 'bg-[#ECE5D1] text-[#100C1F] shadow-sm'
                  : 'bg-[#171226] text-[#8A8577] hover:text-[#ECE5D1]'
              }`}
            >
              📐 Feed (1:1)
            </button>
          </div>
        </div>

        {/* Dynamic Card Stage Preview (What will be exported) */}
        <div className="flex justify-center items-center py-2 overflow-hidden bg-[#100C1F] rounded-2xl border border-[#282141] p-2 sm:p-4">
          <div
            ref={cardRef}
            className={`w-full relative overflow-hidden flex flex-col justify-between p-5 sm:p-6 rounded-3xl transition-all shadow-2xl ${
              aspectRatio === 'story'
                ? 'max-w-[360px] min-h-[580px]'
                : 'max-w-[400px] min-h-[400px]'
            }`}
            style={{
              backgroundColor: '#100C1F',
              backgroundImage: `radial-gradient(circle at top right, ${currentMedal.metalColor}25 0%, transparent 60%), radial-gradient(circle at bottom left, #2FB8BA18 0%, transparent 60%)`,
              border: `1.5px solid ${currentMedal.metalColor}50`,
            }}
          >
            {/* Header: Logo, Handle, Verified */}
            <div className="relative z-10 flex items-center justify-between border-b border-[#282141]/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2FB8BA] via-[#4FDCDE] to-[#ECE5D1] p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full bg-[#100C1F] rounded-[10px] flex items-center justify-center text-sm font-black">
                    🎟️
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-black text-[#4FDCDE]">
                      {userHandle || '@fa'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2FB8BA] animate-pulse" />
                  </div>
                  <span className="text-[9px] font-mono text-[#8A8577] uppercase tracking-wider block">
                    Livvo Fan Passport
                  </span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-xl bg-[#2FB8BA]/10 border border-[#2FB8BA]/30 text-[10px] font-mono font-bold text-[#4FDCDE] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#2FB8BA]" />
                <span>Verificado</span>
              </div>
            </div>

            {/* Central Hero: Big Current Medal & Title */}
            <div className="relative z-10 text-center py-4 space-y-2">
              <div className="inline-flex relative">
                {/* Glowing Aura */}
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-50"
                  style={{ backgroundColor: currentMedal.metalColor }}
                />

                {/* Big Medal Illustration - Fundo 100% transparente sem box ao redor */}
                <div className="relative z-10 mx-auto flex items-center justify-center">
                  <FanMedalIllustration
                    medalId={currentMedal.id}
                    level={stats.level}
                    unlocked={true}
                    className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-2xl"
                  />
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#171226] border border-[#282141]">
                  <Sparkles className="w-3 h-3 text-[#FFD60A]" />
                  <span style={{ color: currentMedal.metalColor }}>
                    Nível {stats.level} de Fã
                  </span>
                </div>

                <h4
                  className="text-xl sm:text-2xl font-black tracking-tight mt-1"
                  style={{ color: currentMedal.metalColor }}
                >
                  {stats.levelTitle}
                </h4>

                <p className="text-xs text-[#ECE5D1]/80 max-w-xs mx-auto line-clamp-2 mt-0.5">
                  {currentMedal.description}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="relative z-10 grid grid-cols-3 gap-2 bg-[#171226]/90 border border-[#282141] p-2.5 rounded-2xl text-center">
              <div>
                <span className="text-[9px] font-mono text-[#8A8577] uppercase block">
                  Shows
                </span>
                <span className="text-base sm:text-lg font-black text-[#ECE5D1]">
                  {stats.totalShows}
                </span>
              </div>
              <div className="border-x border-[#282141]">
                <span className="text-[9px] font-mono text-[#8A8577] uppercase block">
                  Artistas
                </span>
                <span className="text-base sm:text-lg font-black text-[#4FDCDE]">
                  {stats.uniqueArtists}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-[#8A8577] uppercase block">
                  Cidades
                </span>
                <span className="text-base sm:text-lg font-black text-[#FFD60A]">
                  {stats.uniqueCities}
                </span>
              </div>
            </div>

            {/* Medal Gallery Showcase (All 5 Medals Grid) */}
            <div className="relative z-10 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8577] uppercase tracking-wider">
                <span>Galeria de Medalhas</span>
                <span className="text-[#FFD60A] font-bold">
                  {unlockedMedalsCount}/5 Desbloqueadas
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                {medals.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                      m.unlocked
                        ? 'bg-[#171226] border-[#2FB8BA]/50 shadow-sm'
                        : 'bg-[#100C1F]/50 border-[#282141] opacity-50'
                    }`}
                  >
                    <FanMedalIllustration
                      medalId={m.id}
                      level={m.level}
                      unlocked={m.unlocked}
                      className="w-8 h-8 shrink-0"
                    />
                    <span
                      className="text-[8px] font-mono font-black mt-1 uppercase truncate w-full"
                      style={{ color: m.unlocked ? m.metalColor : '#8A8577' }}
                    >
                      {m.name.replace(/^Fã\s+/, '')}
                    </span>
                    {m.unlocked ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 mt-0.5" />
                    ) : (
                      <span className="text-[7px] font-mono text-[#8A8577] mt-0.5">
                        {m.minShows}s
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Next Level Goal Banner */}
            <div className="relative z-10 pt-3">
              {nextMedal ? (
                <div className="bg-[#171226]/80 border border-[#282141] p-2 rounded-xl text-center">
                  <div className="w-full bg-[#100C1F] h-1.5 rounded-full overflow-hidden border border-[#282141] mb-1">
                    <div
                      className="bg-gradient-to-r from-[#2FB8BA] via-[#4FDCDE] to-[#FFD60A] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${stats.nextLevelProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-[#8A8577]">
                    Faltam <strong className="text-[#FFD60A] font-bold">{missingForNext}</strong>{' '}
                    {missingForNext === 1 ? 'show' : 'shows'} para o Nível{' '}
                    <strong className="text-[#ECE5D1] font-bold">
                      {nextMedal.name.replace(/^Fã\s+/, '')}
                    </strong>
                  </p>
                </div>
              ) : (
                <div className="bg-[#FFD60A]/10 border border-[#FFD60A]/30 p-1.5 rounded-xl text-center text-[10px] font-mono text-[#FFD60A] font-bold">
                  👑 Nível Máximo de Lenda Atingido!
                </div>
              )}
            </div>

            {/* Footer Watermark */}
            <div className="relative z-10 pt-3 border-t border-[#282141]/60 flex items-center justify-between text-[9px] font-mono text-[#8A8577]">
              <span>Colecionado no LIVVO</span>
              <span>livvo.app/wallet</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* 1. Download PNG */}
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#2FB8BA] shadow-lg shadow-black/20 active:scale-95 transition-all cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-[#2FB8BA]" />
                <span>Baixado!</span>
              </>
            ) : isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#2FB8BA]" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#2FB8BA]" />
                <span>Baixar Card PNG</span>
              </>
            )}
          </button>

          {/* 2. Copy Image (Clipboard) */}
          <button
            onClick={handleCopyImage}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs bg-[#1E1833] hover:bg-[#282141] text-[#ECE5D1] border border-[#282141] hover:border-[#2FB8BA] active:scale-95 transition-all cursor-pointer"
            title="Copiar direto para colar nos Stories do Instagram ou WhatsApp"
          >
            {copySuccess ? (
              <>
                <Check className="w-4 h-4 text-[#2FB8BA]" />
                <span className="text-[#2FB8BA]">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#4FDCDE]" />
                <span>Copiar Imagem</span>
              </>
            )}
          </button>

          {/* 3. Native Share */}
          <button
            onClick={handleNativeShare}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] shadow-lg shadow-[#2FB8BA]/25 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#100C1F]" />
            <span>Compartilhar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
