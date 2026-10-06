import React, { useState, useEffect } from 'react';
import { PassportIcon } from './PassportIcon';
import {
  Ticket,
  Trophy,
  Sparkles,
  MapPin,
  Calendar,
  Share2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Plus,
  Layers,
  Award,
  Music,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Target,
  Zap,
  Flame,
  Clock,
  Check,
  Camera,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import { walletService, CollectedTicket, FanStats, AchievementBadge, FanMedalTier, WeeklyChallenge } from '../services/walletService';
import { ShowItem, CardTemplateConfig } from '../types';
import { TourWrappedModal } from './TourWrappedModal';
import { FanMedalShareModal } from './FanMedalShareModal';
import { MyHistory } from './MyHistory';
import { LivvoCredencialCard, exportarCredencialPNG } from './LivvoCredencialCard';
import { LivvoTicketIcon } from './LivvoTicketIcon';
import { TransparentTicketItem } from './TransparentTicketItem';
import { FanMedalIllustration } from './MedalIllustrations';
import { cleanDateOnly } from '../utils/dateUtils';
import { cleanCityOnly } from '../utils/stateUtils';
import { evaluateStickers, nextStickerFor, takeNewlyUnlocked, sortStickers, StickerState } from '../services/stickerService';

interface TicketWalletProps {
  onSelectTicketForStudio: (show: ShowItem, config: CardTemplateConfig) => void;
  onGoToStudio: () => void;
  userHandle: string;
}

export const TicketWallet: React.FC<TicketWalletProps> = ({
  onSelectTicketForStudio,
  onGoToStudio,
  userHandle,
}) => {
  const [tickets, setTickets] = useState<CollectedTicket[]>([]);
  const [stats, setStats] = useState<FanStats | null>(null);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [medals, setMedals] = useState<FanMedalTier[]>([]);
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [activeTabRight, setActiveTabRight] = useState<'medals' | 'challenges' | 'badges'>('medals');
  const [medalsFilter, setMedalsFilter] = useState<'all' | 'unlocked' | 'locked'>('unlocked');
  const [activeTicketIndex, setActiveTicketIndex] = useState<number | null>(0);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMedalShareOpen, setIsMedalShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerState[]>([]);
  const [toastSticker, setToastSticker] = useState<StickerState | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem('livvo_user_photo_v1');
    } catch {
      return null;
    }
  });
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  // Nome de exibição do titular (salvo no aparelho, como a foto)
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('livvo_user_name_v1') || '';
    } catch {
      return '';
    }
  });
  const handleNameChange = (v: string) => {
    const clean = v.replace(/\s+/g, ' ').slice(0, 40);
    setUserName(clean);
    try {
      localStorage.setItem('livvo_user_name_v1', clean.trim());
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  };
  // Nº de cadastro no Livvo: virá do cadastro; até lá, número de teste (padrão 16)
  const memberNumber = (() => {
    try {
      const n = Number(localStorage.getItem('livvo_member_number_v1'));
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 16;
    } catch {
      return 16;
    }
  })();
  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Foto da credencial: mantém a proporção e a transparência (foto recortada fica sobre a
        // moldura off-white; foto comum entra na moldura). Lado maior até 1024 px para a qualidade
        // da credencial; se o aparelho não tiver espaço, tenta 640 px.
        const salvar = (lado: number): string | null => {
          const k = Math.min(1, lado / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * k));
          const h = Math.max(1, Math.round(img.height * k));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0, w, h);
          let transparente = false;
          try {
            const d = ctx.getImageData(0, 0, w, h).data;
            for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 250) { transparente = true; break; }
          } catch {
            /* sem leitura de pixels: trata como foto comum */
          }
          let url: string;
          if (transparente) {
            url = canvas.toDataURL('image/webp', 0.9);
            if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/png');
          } else {
            url = canvas.toDataURL('image/jpeg', 0.88);
          }
          try {
            localStorage.setItem('livvo_user_photo_v1', url);
          } catch {
            if (lado > 640) return salvar(640); // sem espaço: tenta menor
            setToastMessage('A foto aparece agora, mas o aparelho está sem espaço para guardá-la: ela some ao recarregar.');
            setTimeout(() => setToastMessage(null), 5000);
            return url;
          }
          return url;
        };
        const url = salvar(1024);
        if (url) setUserPhoto(url);
      };
      img.onerror = () => {
        // Ex.: HEIC do iPhone no Chrome — o navegador não consegue abrir o arquivo
        setToastMessage('Não foi possível abrir esta foto. Envie em JPG ou PNG (fotos HEIC do iPhone não abrem em todos os navegadores).');
        setTimeout(() => setToastMessage(null), 5000);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  // Compartilhar credencial: PNG transparente em resolução cheia (2239 x 3605, com o brilho)
  const [gerandoCredencial, setGerandoCredencial] = useState(false);
  const compartilharCredencial = async () => {
    if (!stats || gerandoCredencial) return;
    setGerandoCredencial(true);
    try {
      const blob = await exportarCredencialPNG(dadosCredencial());
      const nomeArq = `Livvo_Credencial_${(userHandle || 'fa').replace(/^@/, '').replace(/[^\w.-]+/g, '') || 'fa'}.png`;
      const arquivo = new File([blob], nomeArq, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [arquivo] })) {
        await nav.share({ files: [arquivo], title: 'Minha credencial Livvo' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nomeArq;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setToastMessage('Não foi possível gerar a credencial agora.');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } finally {
      setGerandoCredencial(false);
    }
  };
  const dadosCredencial = () => ({
    nome: (userName || (userHandle || '').replace(/^@/, '')).trim(),
    usuario: userHandle || '@fa',
    shows: stats?.totalShows ?? 0,
    numero: memberNumber,
    desde: stats?.oldestShowYear,
    foto: userPhoto,
    nivel: stats?.levelTitle,
  });
  const [stickerFilter, setStickerFilter] = useState<'all' | 'unlocked' | 'locked' | 'soon'>('unlocked');

  const refreshWallet = () => {
    const list = walletService.getTickets();
    setTickets(list);
    setStats(walletService.getStats());
    setBadges(walletService.getBadges());
    setMedals(walletService.getFanMedals());
    setChallenges(walletService.getWeeklyChallenges());
    const st = evaluateStickers(list);
    setStickers(st);
    const fresh = takeNewlyUnlocked(st);
    if (fresh.length > 0) {
      setToastSticker(fresh[0]);
      setToastMessage(
        fresh.length === 1
          ? `Sticker desbloqueado: ${fresh[0].name}`
          : `${fresh.length} stickers desbloqueados, entre eles ${fresh[0].name}`
      );
      setTimeout(() => {
        setToastMessage(null);
        setToastSticker(null);
      }, 4500);
    }
  };

  useEffect(() => {
    refreshWallet();
  }, []);

  const handleToggleChallenge = (challengeId: string) => {
    const isNowCompleted = walletService.toggleChallengeCompletion(challengeId);
    refreshWallet();
    if (isNowCompleted) {
      setToastMessage('Desafio concluído. Você ganhou 1 show de bônus para subir de nível.');
    } else {
      setToastMessage('Meta desmarcada.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja remover este ingresso da sua carteira?')) {
      walletService.removeTicket(id);
      refreshWallet();
      setActiveTicketIndex(null);
    }
  };

  const handleOpenInStudio = (ticket: CollectedTicket) => {
    const showItem: ShowItem = {
      id: ticket.id,
      showCode: ticket.showCode,
      artistCode: ticket.artistName,
      artistName: ticket.artistName,
      tourName: ticket.tourName,
      venue: ticket.venue,
      city: ticket.city,
      state: ticket.state,
      date: ticket.date,
      posterUrl: ticket.posterUrl,
    };
    onSelectTicketForStudio(showItem, ticket.config);
  };

  // ---- Dados derivados para a página de identificação do passaporte ----
  const unlockedMedals = medals.filter((m) => m.unlocked).length;
  const doneChallenges = challenges.filter((c) => c.completed).length;
  const unlockedStickers = stickers.filter((x) => x.status === 'unlocked').length;
  const soonStickers = stickers.filter((x) => x.status === 'soon').length;
  // Desafio do mês -> família de stickers que ele aproxima
  const CHALLENGE_FAMILIES: Record<string, string[]> = {
    shows: ['eu-tava-la', 'pegou-o-ritmo', 'agenda-lotada', 'patrimonio-da-plateia', 'lenda-do-ao-vivo'],
    artists: ['prazer-proximo-show', 'segui-o-som', 'figurinha-carimbada', 'sei-ate-as-pausas'],
    cities: ['proxima-parada-show', 'mala-de-role', 'mini-turne-pessoal', 'cruzei-a-divisa', 'gps-do-bis', 'rota-do-bis'],
  };
  const missingNext = stats?.nextMedal ? Math.max(0, stats.nextMedal.minShows - stats.effectiveShows) : 0;
  const challengePct = Math.round((doneChallenges / Math.max(1, challenges.length)) * 100);

  // Linha de leitura mecânica (estilo zona MRZ de passaporte), gerada só com dados reais
  const mrzSafe = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '<');
  const pad = (v: string, n = 44) => (v + '<'.repeat(n)).slice(0, n);
  const handleClean = mrzSafe((userHandle || 'FA').replace(/^@/, ''));
  const mrzLine1 = pad(`P<LIVVO<<${handleClean}`);
  const mrzLine2 = stats
    ? pad(
        `NV${stats.level}<${mrzSafe(stats.levelTitle)}<<SH${String(stats.totalShows).padStart(3, '0')}<AR${String(
          stats.uniqueArtists
        ).padStart(3, '0')}<UF${String(stats.uniqueStates).padStart(2, '0')}`
      )
    : pad('');

  const ticks = (pct: number, n = 24) =>
    Array.from({ length: n }).map((_, i) => <span key={i} data-on={i < Math.round((pct / 100) * n)} />);

  const filteredMedals = medals.filter((m) =>
    medalsFilter === 'unlocked' ? m.unlocked : medalsFilter === 'locked' ? !m.unlocked : true
  );

  return (
    <div className="lv-studio space-y-5 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* PÁGINA DE IDENTIFICAÇÃO DO PASSAPORTE                                     */}
      {/* ========================================================================= */}
      <section className="lv-ticket">
        <div className="lv-strip">
          <span>Livvo · Passaporte de fã</span>
          <span>
            Titular <b>{userHandle || '@fa'}</b>
          </span>
        </div>

        <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-8 lg:gap-12">
          {/* Dados do titular */}
          <div className="min-w-0 space-y-7">
            <div className="flex items-start gap-4">
              <PassportIcon className="w-11 h-11 text-[#4FDCDE] shrink-0 mt-1" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="lv-display text-[clamp(24px,5vw,38px)] text-[#2FB8BA]">Passaporte Oficial de Shows</h2>
                <p className="text-[14px] text-[#B3AE9F] mt-1.5">
                  Cada show que você salva no Estúdio vira um carimbo aqui.
                </p>
              </div>
            </div>

            {/* Titular: foto + @usuario */}
            <div className="flex items-center gap-4">
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
              <div className="min-w-0">
                <label htmlFor="lv-titular-nome" className="lv-eyebrow">
                  Titular · Nome
                </label>
                <input
                  id="lv-titular-nome"
                  type="text"
                  value={userName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={(e) => handleNameChange(e.target.value.trim())}
                  placeholder="Seu nome"
                  autoComplete="name"
                  maxLength={40}
                  className="lv-name-input lv-display"
                />
                <div className="lv-mono text-[13px] text-[#4FDCDE] truncate">{userHandle || '@fa'}</div>
              </div>
            </div>

            {stats && (
              <dl className="lv-fields">
                <div>
                  <dt>Shows</dt>
                  <dd className="lv-num">{stats.totalShows}</dd>
                  <span>{stats.estimatedHours}h ao vivo</span>
                </div>
                <div>
                  <dt>Artistas</dt>
                  <dd className="lv-num">{stats.uniqueArtists}</dd>
                  <span className="truncate">{stats.topArtist ? `mais visto: ${stats.topArtist.name}` : 'nenhum ainda'}</span>
                </div>
                {/* #3: cidades e estados juntos, com a mesma regra em todo o app */}
                <div>
                  <dt>Cidades</dt>
                  <dd className="lv-num">{stats.uniqueCities}</dd>
                  <span>
                    em {stats.uniqueStates} {stats.uniqueStates === 1 ? 'estado' : 'estados'}
                  </span>
                </div>
              </dl>
            )}

            {stats && (
              <div className="space-y-2 max-w-[560px]">
                <div
                  className="lv-ticks"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={stats.nextLevelProgress}
                  aria-label="Progresso até o próximo nível"
                >
                  {ticks(stats.nextMedal ? stats.nextLevelProgress : 100)}
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-[#B3AE9F]">
                    {stats.nextMedal ? (
                      <>
                        Falta{missingNext === 1 ? '' : 'm'} <strong className="text-[#ECE5D1]">{missingNext}</strong>{' '}
                        {missingNext === 1 ? 'show' : 'shows'} para o nível {stats.nextMedal.name.replace(/^Fã\s+/, '')}
                        {stats.bonusShowsFromChallenges > 0 && (
                          <span className="text-[#4FDCDE]"> · +{stats.bonusShowsFromChallenges} bônus de desafios</span>
                        )}
                      </>
                    ) : (
                      'Nível máximo: Lenda Viva'
                    )}
                  </span>
                  <span className="lv-mono text-[#4FDCDE] shrink-0">
                    {stats.nextMedal ? `${stats.nextLevelProgress}%` : '100%'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = !isHistoryOpen;
                  setIsHistoryOpen(next);
                  if (next) {
                    setTimeout(() => document.getElementById('minha-historia')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                  }
                }}
                aria-expanded={isHistoryOpen}
                aria-controls="minha-historia"
                className="lv-btn lv-btn--stub lv-btn--teal"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Minha história</span>
                <ChevronDown className={`w-4 h-4 -ml-4 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsWrappedOpen(true)}
                disabled={tickets.length === 0}
                className="lv-btn lv-btn--stub lv-btn--cream"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar meu Wrapped</span>
              </button>
              <button type="button" onClick={onGoToStudio} className="lv-btn lv-btn--stub lv-btn--cyan">
                <Plus className="w-4 h-4" />
                <span>Novo show</span>
              </button>
            </div>
          </div>

          {/* Credencial Backstage no lugar do box Nível de fã (teste DRAFT, com os dados do usuário) */}
          {stats && (
            <div className="lv-badge-slot">
              <div className="lv-cred-wrap">
                <LivvoCredencialCard className="lv-badge-img lv-credencial" {...dadosCredencial()} />
                {/* Área da foto: toque para adicionar/trocar; sem foto, mostra o convite */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="lv-cred-photo"
                  data-empty={!userPhoto}
                  aria-label={userPhoto ? 'Trocar a foto da credencial' : 'Adicionar sua foto à credencial'}
                >
                  {!userPhoto && (
                    <span>
                      <Camera className="w-5 h-5" />
                      Adicionar sua foto
                    </span>
                  )}
                </button>
              </div>
              <span className="lv-eyebrow">Credencial teste · com os seus dados</span>
              <button type="button" onClick={compartilharCredencial} disabled={gerandoCredencial} className="lv-link">
                <Share2 className="w-3.5 h-3.5" />
                <span>{gerandoCredencial ? 'Gerando credencial…' : 'Compartilhar credencial'}</span>
              </button>
              <button type="button" onClick={() => photoInputRef.current?.click()} className="lv-link lv-photo-mobile">
                <Camera className="w-3.5 h-3.5" />
                <span>{userPhoto ? 'Trocar foto' : 'Adicionar foto'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Minha História: seção fixa dentro do passaporte, aberta pelo botão */}
        {isHistoryOpen && (
          <div id="minha-historia" className="lv-hist">
            <div className="lv-strip">
              <span>Livvo · Minha história</span>
              <button type="button" onClick={() => setIsHistoryOpen(false)} className="lv-hist-close">
                Fechar
              </button>
            </div>
            <div className="p-5 sm:p-8">
              <h3 className="lv-display text-[clamp(22px,4vw,32px)] text-[#ECE5D1] mb-2">Minha história</h3>
              <MyHistory tickets={tickets} />
            </div>
          </div>
        )}

        {/* Zona de leitura mecânica */}
        <div className="lv-mrz-row">
          <div className="lv-mrz" aria-hidden="true">
            <div>{mrzLine1}</div>
            <div>{mrzLine2}</div>
          </div>
          <div className="lv-mrz-photo">
            <button type="button" onClick={() => photoInputRef.current?.click()} className="lv-link">
              <Camera className="w-3.5 h-3.5" />
              <span>{userPhoto ? 'Trocar foto' : 'Adicionar foto'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CARTEIRA (ingressos) · PICOTE · CANHOTO (medalhas, desafios, conquistas)   */}
      {/* ========================================================================= */}
      <section className="lv-ticket lg:grid lg:grid-cols-[minmax(0,1fr)_28px_minmax(0,460px)]">
        {/* Carteira de ingressos (fundo pontilhado igual ao palco do Estúdio) */}
        <div className="lv-stage px-2 py-5 sm:p-7 min-w-0">
          <div className="flex items-end justify-between gap-3 border-b border-[#282141] pb-3 mb-5 mx-3 sm:mx-0">
            <h3 className="lv-display text-[24px] text-[#ECE5D1]">
              Carteira de ingressos <span className="lv-num text-[#4FDCDE] text-[24px] ml-1">{tickets.length}</span>
            </h3>
            <span className="hidden sm:inline lv-mono text-[11px] text-[#8A8577]">Toque para abrir ou editar no Estúdio</span>
          </div>

          {tickets.length === 0 ? (
            <div className="lv-empty">
              <LivvoTicketIcon className="w-10 h-10 text-[#4FDCDE]" />
              <h4 className="lv-display text-[20px] text-[#ECE5D1]">Sua carteira está vazia</h4>
              <p className="text-[13px] text-[#B3AE9F] max-w-sm">
                Monte um poster no Estúdio e toque em &quot;Salvar ingresso&quot;. Ele aparece aqui como o primeiro carimbo do
                seu passaporte.
              </p>
              <button type="button" onClick={onGoToStudio} className="lv-btn lv-btn--cyan">
                <Plus className="w-4 h-4" />
                <span>Ir para o Estúdio</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t, idx) => (
                <TransparentTicketItem
                  key={t.id}
                  ticket={t}
                  isActive={activeTicketIndex === idx}
                  onToggleActive={() => setActiveTicketIndex(activeTicketIndex === idx ? null : idx)}
                  onOpenInStudio={handleOpenInStudio}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lv-perf" aria-hidden="true" />

        {/* Canhoto */}
        <div className="p-5 sm:p-7 min-w-0">
          <div className="lv-tabs" role="tablist" aria-label="Seções do passaporte">
            <button
              type="button"
              role="tab"
              aria-selected={activeTabRight === 'medals'}
              data-on={activeTabRight === 'medals'}
              onClick={() => setActiveTabRight('medals')}
            >
              Medalhas <span className="lv-mono">{unlockedMedals}/5</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTabRight === 'challenges'}
              data-on={activeTabRight === 'challenges'}
              onClick={() => setActiveTabRight('challenges')}
            >
              Desafios{' '}
              <span className="lv-mono">
                {doneChallenges}/{challenges.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTabRight === 'badges'}
              data-on={activeTabRight === 'badges'}
              onClick={() => setActiveTabRight('badges')}
            >
              Stickers{' '}
              <span className="lv-mono">
                {unlockedStickers}/{stickers.length}
              </span>
            </button>
          </div>

          {/* MEDALHAS: página de carimbos */}
          {activeTabRight === 'medals' && (
            <div className="pt-6 space-y-6">
              <div className="lv-stamps">
                {medals.map((m) => {
                  const isCurrent = !!stats && stats.level === m.level;
                  return (
                    <div key={m.id} className="lv-stamp" data-on={m.unlocked} data-current={isCurrent}>
                      <div className="lv-stamp-ring">
                        <FanMedalIllustration medalId={m.id} level={m.level} unlocked={m.unlocked} className="w-11 h-11" />
                      </div>
                      <span className="lv-stamp-name">{m.name.replace(/^Fã\s+/, '')}</span>
                      <span className="lv-stamp-req">
                        {m.minShows} {m.minShows === 1 ? 'show' : 'shows'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="lv-seg" role="group" aria-label="Filtrar medalhas">
                  {(
                    [
                      ['unlocked', `Carimbadas`],
                      ['locked', `A conquistar`],
                      ['all', `Todas`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      data-on={medalsFilter === id}
                      aria-pressed={medalsFilter === id}
                      onClick={() => setMedalsFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setIsMedalShareOpen(true)} className="lv-link">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar medalhas</span>
                </button>
              </div>

              <div>
                {filteredMedals.map((medal) => {
                  const pct = Math.min(100, Math.round((tickets.length / medal.minShows) * 100));
                  const missing = Math.max(0, medal.minShows - tickets.length);
                  return (
                    <div key={medal.id} className="lv-medal-row" data-on={medal.unlocked}>
                      <FanMedalIllustration
                        medalId={medal.id}
                        level={medal.level}
                        unlocked={medal.unlocked}
                        className="w-12 h-12 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h5 className="text-[14px] font-bold text-[#ECE5D1] truncate">{medal.name}</h5>
                          <span className="lv-mono text-[11px] shrink-0 text-[#8A8577]">
                            {medal.unlocked ? (
                              <span className="text-[#4FDCDE] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                carimbada
                              </span>
                            ) : (
                              `faltam ${missing}`
                            )}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#8A8577] mt-0.5 line-clamp-1">{medal.description}</p>
                        {!medal.unlocked && (
                          <div className="lv-ticks lv-ticks--thin mt-2" aria-hidden="true">
                            {ticks(pct)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredMedals.length === 0 && (
                  <p className="text-[13px] text-[#8A8577] py-6">Nenhuma medalha neste filtro.</p>
                )}
              </div>
            </div>
          )}

          {/* DESAFIOS DO MÊS */}
          {activeTabRight === 'challenges' && (
            <div className="pt-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="lv-display text-[20px] text-[#ECE5D1]">Desafios do mês</h4>
                  <span className="lv-mono text-[11px] text-[#8A8577] inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    renova todo mês
                  </span>
                </div>
                <p className="text-[12.5px] text-[#B3AE9F]">
                  Cada meta concluída vale como bônus para subir de nível mais rápido.
                </p>
                <div className="lv-ticks" aria-hidden="true">
                  {ticks(challengePct)}
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#B3AE9F]">
                    <strong className="text-[#ECE5D1]">{doneChallenges}</strong> de {challenges.length} metas concluídas
                  </span>
                  <span className="lv-mono text-[#4FDCDE]">{challengePct}%</span>
                </div>
              </div>

              <div>
                {challenges.map((ch) => {
                  const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
                  return (
                    <div key={ch.id} className="lv-challenge" data-on={ch.completed}>
                      <button
                        type="button"
                        onClick={() => handleToggleChallenge(ch.id)}
                        className="lv-box"
                        aria-pressed={ch.completed}
                        title={ch.completed ? 'Desmarcar meta' : 'Marcar meta como concluída'}
                      >
                        {ch.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h5 className="text-[13.5px] font-bold text-[#ECE5D1] leading-snug">{ch.title}</h5>
                          <span className="lv-mono text-[11px] text-[#8A8577] shrink-0">
                            {ch.current}/{ch.target}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#8A8577] mt-0.5 leading-snug">{ch.description}</p>
                        {(() => {
                          const fams = CHALLENGE_FAMILIES[ch.category];
                          const nx = fams ? nextStickerFor(stickers, fams) : undefined;
                          if (!nx) return null;
                          return (
                            <button
                              type="button"
                              className="lv-sticker-link"
                              onClick={() => setActiveTabRight('badges')}
                              title="Ver no álbum de stickers"
                            >
                              <img src={nx.image} alt="" className="w-8 h-8" loading="lazy" />
                              <span>
                                Aproxima do sticker <strong>{nx.name}</strong>
                              </span>
                              <span className="lv-mono">
                                {nx.current}/{nx.target}
                              </span>
                            </button>
                          );
                        })()}
                        <div className="lv-ticks lv-ticks--thin mt-2.5" aria-hidden="true">
                          {ticks(pct)}
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-2 text-[11.5px]">
                          <span className="lv-mono text-[#8A8577]">
                            {ch.completed ? 'meta atingida' : `recompensa: ${ch.rewardBadge}`}
                          </span>
                          {!ch.completed && (
                            <button type="button" onClick={onGoToStudio} className="lv-link text-[12px]">
                              <span>{ch.actionPrompt}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÁLBUM DE STICKERS (coleção de teste, ainda não aprovada) */}
          {activeTabRight === 'badges' && (
            <div className="pt-6">
              <div className="space-y-1.5">
                <h4 className="lv-display text-[22px] text-[#ECE5D1]">Álbum de stickers</h4>
                <div className="lv-tally">
                  <div>
                    <span>Colados</span>
                    <strong className="lv-num">{unlockedStickers}</strong>
                  </div>
                  <div>
                    <span>A conquistar</span>
                    <strong className="lv-num">{stickers.length - unlockedStickers - soonStickers}</strong>
                  </div>
                </div>
                <div className="lv-seg mt-3" role="group" aria-label="Filtrar stickers">
                  {(
                    [
                      ['unlocked', 'Colados'],
                      ['locked', 'A conquistar'],
                      ['soon', 'Em breve'],
                      ['all', 'Todos'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      data-on={stickerFilter === id}
                      aria-pressed={stickerFilter === id}
                      onClick={() => setStickerFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {(() => {
                const list = sortStickers(stickers).filter((x) => stickerFilter === 'all' || x.status === stickerFilter);
                if (list.length === 0) {
                  return (
                    <p className="text-[13px] text-[#8A8577] py-8">
                      {stickerFilter === 'unlocked'
                        ? 'Nenhum sticker colado ainda. Salve um show no Estúdio para ganhar o primeiro.'
                        : 'Nenhum sticker nesta seleção.'}
                    </p>
                  );
                }
                return (
                  <div className="lv-album mt-5">
                    {list.map((st) => (
                      <div key={st.slug} className="lv-sticker" data-status={st.status}>
                        <img src={st.image} alt={st.name} loading="lazy" />
                        <span className="lv-sticker-name">{st.name}</span>
                        <span className="lv-sticker-crit">{st.criterion}</span>
                        <span className="lv-sticker-state">
                          {st.status === 'unlocked'
                            ? st.unlockedOn
                              ? `colado em ${st.unlockedOn}`
                              : 'colado'
                            : st.status === 'soon'
                              ? 'em breve'
                              : `${st.current}/${st.target}`}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {toastMessage && (
        <div className="lv-toast flex items-center gap-3" role="status" aria-live="polite">
          {toastSticker && <img src={toastSticker.image} alt="" className="w-10 h-10 shrink-0" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tour Wrapped Modal */}
      {stats && (
        <TourWrappedModal
          isOpen={isWrappedOpen}
          onClose={() => setIsWrappedOpen(false)}
          stats={stats}
          tickets={tickets}
          userHandle={userHandle}
        />
      )}

      {/* Fan Medal Share Modal */}
      {stats && (
        <FanMedalShareModal
          isOpen={isMedalShareOpen}
          onClose={() => setIsMedalShareOpen(false)}
          stats={stats}
          medals={medals}
          userHandle={userHandle}
        />
      )}
    </div>
  );
};
