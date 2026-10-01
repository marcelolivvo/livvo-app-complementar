import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { walletService, CollectedTicket, FanStats, AchievementBadge, FanMedalTier, WeeklyChallenge } from '../services/walletService';
import { ShowItem, CardTemplateConfig } from '../types';
import { TourWrappedModal } from './TourWrappedModal';
import { FanMedalShareModal } from './FanMedalShareModal';
import { LivvoTicketIcon } from './LivvoTicketIcon';
import { TransparentTicketItem } from './TransparentTicketItem';
import { FanMedalIllustration } from './MedalIllustrations';
import { cleanDateOnly } from '../utils/dateUtils';
import { cleanCityOnly } from '../utils/stateUtils';

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
  const [medalsFilter, setMedalsFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [activeTicketIndex, setActiveTicketIndex] = useState<number | null>(0);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [isMedalShareOpen, setIsMedalShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshWallet = () => {
    const list = walletService.getTickets();
    setTickets(list);
    setStats(walletService.getStats());
    setBadges(walletService.getBadges());
    setMedals(walletService.getFanMedals());
    setChallenges(walletService.getWeeklyChallenges());
  };

  useEffect(() => {
    refreshWallet();
  }, []);

  const handleToggleChallenge = (challengeId: string) => {
    const isNowCompleted = walletService.toggleChallengeCompletion(challengeId);
    refreshWallet();
    if (isNowCompleted) {
      setToastMessage('🎯 Desafio concluído! Você ganhou +1 ponto de avanço bônus para subir de nível e desbloquear novas medalhas!');
    } else {
      setToastMessage('Meta redefinida para acompanhamento!');
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Section: Fan Passport & Level Header */}
      <div className="bg-[#171226] border border-[#282141] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2FB8BA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FFD60A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[#282141] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2FB8BA] via-[#4FDCDE] to-[#ECE5D1] p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full bg-[#100C1F] rounded-2xl flex items-center justify-center text-2xl font-black">
                <LivvoTicketIcon className="w-8 h-8 text-[#2FB8BA]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-[#4FDCDE]">
                  {userHandle || '@fa'}
                </span>
                {stats?.nextMedal && (
                  <span className="text-[10px] font-mono text-[#8A8577]">
                    (Faltam {Math.max(0, stats.nextMedal.minShows - stats.totalShows)} shows para {stats.nextMedal.name})
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#ECE5D1] tracking-tight mt-1">
                Passaporte Oficial de Shows
              </h2>
              <p className="text-xs text-[#8A8577] mt-0.5">
                Coleção de experiências, festivais e lembranças ao vivo no Brasil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap w-full lg:w-auto justify-end">
            {/* Campo de Nível separado: elemento div com label 'Nível' / 'Nível de Fã' acima do box, e número + nome centralizados e destacados no box idêntico ao botão Livvo Wallet */}
            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 min-w-[170px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8577]">
                Nível de Fã
              </span>
              <div
                className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 shadow-sm text-center relative overflow-hidden"
                style={{
                  backgroundColor: `${stats?.currentMedal?.metalColor || '#2FB8BA'}15`,
                  color: stats?.currentMedal?.metalColor || '#4FDCDE',
                  borderColor: `${stats?.currentMedal?.metalColor || '#2FB8BA'}40`,
                }}
              >
                {/* Subtle shimmer sweep on header level box */}
                {stats && stats.level > 0 && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep" />
                  </div>
                )}
                <span className={`relative z-10 ${stats && stats.level === 5 ? 'animate-legend-glow' : ''}`}>
                  {stats?.currentMedal?.icon || '🥉'}
                </span>
                <span className="font-mono font-black text-sm relative z-10">{stats?.level ?? 0}</span>
                <span className="opacity-50 relative z-10">-</span>
                <span className="truncate relative z-10">{stats?.levelTitle ?? 'Novo Fã'}</span>
              </div>

              {/* Barra de progresso visual abaixo dos níveis de fã */}
              {stats && (
                <div className="w-full space-y-1 pt-0.5">
                  <div className="w-full bg-[#100C1F] h-1.5 rounded-full overflow-hidden border border-[#282141]">
                    <div
                      className="bg-gradient-to-r from-[#2FB8BA] via-[#4FDCDE] to-[#FFD60A] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${stats.nextMedal ? stats.nextLevelProgress : 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-right">
                    {stats.nextMedal ? (
                      <span className="text-[#8A8577]">
                        Faltam{' '}
                        <strong className="text-[#FFD60A] font-bold">
                          {Math.max(0, stats.nextMedal.minShows - stats.effectiveShows)}
                        </strong>{' '}
                        {Math.max(0, stats.nextMedal.minShows - stats.effectiveShows) === 1 ? 'show' : 'shows'} para o Nível{' '}
                        <strong className="text-[#ECE5D1] font-bold">
                          {stats.nextMedal.name.replace(/^Fã\s+/, '')}
                        </strong>
                        {stats.bonusShowsFromChallenges > 0 && (
                          <span className="text-[#2FB8BA] font-bold"> (+{stats.bonusShowsFromChallenges} bônus)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#FFD60A] font-bold">Lenda Viva Atingida! 👑</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons: Gerar Meu Wrapped and + Novo below it */}
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[170px]">
              <button
                onClick={() => setIsWrappedOpen(true)}
                disabled={tickets.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] shadow-lg shadow-black/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#100C1F]" />
                <span>Gerar Meu Wrapped</span>
              </button>

              <button
                onClick={onGoToStudio}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black bg-[#2FB8BA] hover:bg-[#22E3E6] text-[#100C1F] border border-[#2FB8BA] shadow-md shadow-[#2FB8BA]/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#100C1F]" />
                <span>Novo Show</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6">
            <div className="bg-[#100C1F]/60 border border-[#282141] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8A8577] uppercase">Shows Salvos</span>
                <LivvoTicketIcon className="w-4 h-4 text-[#2FB8BA]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#ECE5D1] mt-1">
                {stats.totalShows}
              </div>
              <div className="text-[10px] text-[#4FDCDE] mt-1 font-mono">
                {stats.estimatedHours}h de música ao vivo
              </div>
            </div>

            <div className="bg-[#100C1F]/60 border border-[#282141] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8A8577] uppercase">Artistas Vistos</span>
                <Music className="w-4 h-4 text-[#4FDCDE]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#ECE5D1] mt-1">
                {stats.uniqueArtists}
              </div>
              <div className="text-[10px] text-[#8A8577] mt-1 truncate">
                {stats.topArtist ? `Top: ${stats.topArtist.name}` : 'Nenhum ainda'}
              </div>
            </div>

            <div className="bg-[#100C1F]/60 border border-[#282141] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8A8577] uppercase">Estados Visitados</span>
                <MapPin className="w-4 h-4 text-[#FFD60A]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#ECE5D1] mt-1">
                {stats.uniqueStates}
              </div>
              <div className="text-[10px] text-[#FFD60A] mt-1 font-mono">
                {stats.uniqueCities} cidades
              </div>
            </div>

            <div className="bg-[#100C1F]/60 border border-[#282141] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8A8577] uppercase">Nível & Medalha</span>
                <Trophy className="w-4 h-4 text-[#FFD60A]" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-[#ECE5D1]">
                  Nv {stats.level}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-lg border truncate"
                  style={{
                    color: stats.currentMedal?.metalColor || '#FFD60A',
                    borderColor: `${stats.currentMedal?.metalColor || '#FFD60A'}40`,
                    backgroundColor: `${stats.currentMedal?.metalColor || '#FFD60A'}10`,
                  }}
                >
                  {stats.levelTitle}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#1E1833] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-[#2FB8BA] via-[#4FDCDE] to-[#FFD60A] h-full transition-all duration-500"
                  style={{ width: `${stats.nextLevelProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono mt-1 gap-1">
                <span className="text-[#8A8577] truncate">
                  {stats.nextMedal
                    ? `Faltam ${Math.max(0, stats.nextMedal.minShows - stats.effectiveShows)} ${
                        Math.max(0, stats.nextMedal.minShows - stats.effectiveShows) === 1 ? 'show' : 'shows'
                      } para o Nível ${stats.nextMedal.name.replace(/^Fã\s+/, '')}${stats.bonusShowsFromChallenges > 0 ? ` (+${stats.bonusShowsFromChallenges} bônus)` : ''}`
                    : 'Nível Máximo de Fã!'}
                </span>
                <span className="text-[#FFD60A] font-bold shrink-0">{stats.nextLevelProgress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Challenge Banner Callout */}
        {challenges.length > 0 && (
          <div className="relative z-10 mt-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#171226] via-[#1E1833] to-[#171226] border border-[#2FB8BA]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2FB8BA] to-[#4FDCDE] text-[#100C1F] flex items-center justify-center text-lg font-black shrink-0 shadow-md">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4FDCDE]">
                    Desafios Mensais
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30">
                    {challenges.filter((c) => c.completed).length}/{challenges.length} Concluídos
                  </span>
                  <span className="text-[10px] text-[#8A8577]">
                    • Renova a cada mês
                  </span>
                </div>
                <p className="text-xs font-bold text-[#ECE5D1] mt-0.5">
                  {challenges.find((c) => !c.completed)?.title || 'Parabéns! Todos os desafios deste mês foram concluídos!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTabRight('challenges')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#2FB8BA] shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
            >
              <span>Ver Metas Mensais</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#2FB8BA]" />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left = Apple Wallet Stack, Right = Badges Mural */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Apple Wallet 3D Stack of Tickets) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#ECE5D1] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2FB8BA]" />
              <span>Carteira de Ingressos ({tickets.length})</span>
            </h3>
            <span className="text-xs text-[#8A8577]">
              Clique para abrir ou editar no Estúdio
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="bg-[#171226] border border-[#282141] rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1E1833] border border-[#282141] flex items-center justify-center mx-auto shadow-md">
                <LivvoTicketIcon className="w-8 h-8 text-[#2FB8BA]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#ECE5D1]">
                  Sua carteira está vazia
                </h4>
                <p className="text-xs text-[#8A8577] max-w-sm mx-auto mt-1">
                  Crie seus primeiros ingressos no Estúdio e clique em "Salvar o Passaporte" para construir seu acervo pessoal.
                </p>
              </div>
              <button
                onClick={onGoToStudio}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2FB8BA] text-[#100C1F] font-bold text-xs hover:bg-[#22E3E6] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ir para o Estúdio</span>
              </button>
            </div>
          ) : (
            /* Transparent Tickets List matching 07-transparente-contorno-ciano.webp */
            <div className="space-y-4 pb-12">
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

        {/* Right Column: Fan Level Medals System & Achievements */}
        <div className="lg:col-span-5 space-y-4">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#171226] border border-[#282141] p-1.5 rounded-2xl">
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={() => setActiveTabRight('medals')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTabRight === 'medals'
                    ? 'bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#2FB8BA] shadow-md shadow-black/20'
                    : 'text-[#8A8577] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span className="truncate">Medalhas ({medals.filter((m) => m.unlocked).length}/5)</span>
              </button>

              <button
                onClick={() => setActiveTabRight('challenges')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer relative ${
                  activeTabRight === 'challenges'
                    ? 'bg-[#2FB8BA] text-[#100C1F] shadow-md shadow-[#2FB8BA]/15'
                    : 'text-[#8A8577] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span className="truncate">Desafios ({challenges.filter((c) => c.completed).length}/{challenges.length})</span>
                {challenges.some((c) => !c.completed) && (
                  <span className="w-2 h-2 rounded-full bg-[#FFD60A] animate-pulse absolute top-1.5 right-1.5" />
                )}
              </button>

              <button
                onClick={() => setActiveTabRight('badges')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTabRight === 'badges'
                    ? 'bg-[#FFD60A] text-[#100C1F] shadow-md shadow-[#FFD60A]/15'
                    : 'text-[#8A8577] hover:text-[#ECE5D1] hover:bg-[#1E1833]'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span className="truncate">Conquistas ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: GALERIA DE MEDALHAS & NÍVEIS DE FÃ */}
          {activeTabRight === 'medals' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Header da Galeria com Filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#171226]/80 border border-[#282141] p-3 rounded-2xl">
                <div>
                  <h4 className="text-xs font-black text-[#ECE5D1] uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#FFD60A]" />
                    <span>Galeria de Medalhas</span>
                  </h4>
                  <p className="text-[10px] text-[#8A8577]">
                    {medals.filter((m) => m.unlocked).length} de 5 medalhas oficiais conquistadas
                  </p>
                </div>

                {/* Duas fileiras de dois: em cima "Todas" e "Compartilhar", embaixo "Desbloqueadas" e "Bloqueadas" */}
                <div className="grid grid-cols-2 gap-1.5 shrink-0 w-full sm:w-auto">
                  {/* Fileira de Cima 1: Todas */}
                  <button
                    onClick={() => setMedalsFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      medalsFilter === 'all'
                        ? 'bg-[#2FB8BA] text-[#100C1F] shadow-sm'
                        : 'bg-[#100C1F] text-[#8A8577] hover:text-[#ECE5D1] border border-[#282141]'
                    }`}
                  >
                    Todas ({medals.length})
                  </button>

                  {/* Fileira de Cima 2: Compartilhar */}
                  <button
                    onClick={() => setIsMedalShareOpen(true)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] transition-all cursor-pointer shadow-sm"
                    title="Compartilhar card com suas medalhas nas redes sociais"
                  >
                    <Share2 className="w-3 h-3 text-[#100C1F]" />
                    <span>Compartilhar</span>
                  </button>

                  {/* Fileira de Baixo 1: Desbloqueadas */}
                  <button
                    onClick={() => setMedalsFilter('unlocked')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      medalsFilter === 'unlocked'
                        ? 'bg-[#2FB8BA] text-[#100C1F] shadow-sm'
                        : 'bg-[#100C1F] text-[#8A8577] hover:text-[#ECE5D1] border border-[#282141]'
                    }`}
                  >
                    Desbloqueadas ({medals.filter((m) => m.unlocked).length})
                  </button>

                  {/* Fileira de Baixo 2: Bloqueadas */}
                  <button
                    onClick={() => setMedalsFilter('locked')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      medalsFilter === 'locked'
                        ? 'bg-[#2FB8BA] text-[#100C1F] shadow-sm'
                        : 'bg-[#100C1F] text-[#8A8577] hover:text-[#ECE5D1] border border-[#282141]'
                    }`}
                  >
                    Bloqueadas ({medals.filter((m) => !m.unlocked).length})
                  </button>
                </div>
              </div>

              {/* Trilha Visual das 5 Medalhas */}
              <div className="bg-[#100C1F]/60 border border-[#282141] rounded-2xl p-3">
                <div className="text-[10px] font-mono text-[#8A8577] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Trilha de Conquistas</span>
                  <span className="text-[#FFD60A] font-bold">
                    {medals.filter((m) => m.unlocked).length}/5 Medalhas
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {medals.map((m) => {
                    const isCurrent = stats && stats.level === m.level;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          m.unlocked
                            ? 'bg-[#171226] border-[#2FB8BA]/40 shadow-sm'
                            : 'bg-[#100C1F]/40 border-[#282141] opacity-60'
                        } ${isCurrent ? 'ring-2 ring-[#FFD60A] shadow-md shadow-[#FFD60A]/10' : ''}`}
                      >
                        <FanMedalIllustration
                          medalId={m.id}
                          level={m.level}
                          unlocked={m.unlocked}
                          className="w-10 h-10 shrink-0"
                        />
                        <span
                          className="text-[9px] font-mono font-black mt-1 uppercase truncate w-full"
                          style={{ color: m.unlocked ? m.metalColor : '#8A8577' }}
                        >
                          {m.name.replace(/^Fã\s+/, '')}
                        </span>
                        <span className="text-[8px] font-mono text-[#8A8577]">
                          {m.minShows} {m.minShows === 1 ? 'show' : 'shows'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Medal Tier Spotlight */}
              {stats && (
                <div
                  className="rounded-3xl border p-4 sm:p-5 relative overflow-hidden shadow-xl"
                  style={{
                    borderColor: `${stats.currentMedal?.metalColor || '#FFD60A'}40`,
                    background: `linear-gradient(135deg, ${stats.currentMedal?.metalColor || '#FFD60A'}12 0%, #171226 100%)`,
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Medalha sem box ao redor - fundo totalmente transparente */}
                    <div className="shrink-0 flex items-center justify-center">
                      <FanMedalIllustration
                        medalId={stats.currentMedal?.id}
                        level={stats.level}
                        unlocked={true}
                        className="w-16 h-16 sm:w-18 sm:h-18 shrink-0"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8577]">
                            Medalha Atual
                          </span>
                          {stats.level > 0 && (
                            <span
                              className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider border"
                              style={{
                                backgroundColor: `${stats.currentMedal?.metalColor}20`,
                                color: stats.currentMedal?.metalColor,
                                borderColor: `${stats.currentMedal?.metalColor}40`,
                              }}
                            >
                              Nível {stats.level}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setIsMedalShareOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] shadow-sm transition-all cursor-pointer shrink-0"
                          title="Compartilhar card com suas medalhas nas redes sociais"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#100C1F]" />
                          <span>Compartilhar</span>
                        </button>
                      </div>
                      <h4
                        className="text-lg font-black tracking-tight mt-0.5 truncate"
                        style={{ color: stats.currentMedal?.metalColor || '#ECE5D1' }}
                      >
                        {stats.levelTitle}
                      </h4>
                      <p className="text-xs text-[#8A8577] mt-0.5 line-clamp-1">
                        {stats.totalShows === 0
                          ? 'Salve seu 1º show para desbloquear a Medalha Fã Bronze!'
                          : `${stats.totalShows} ${stats.totalShows === 1 ? 'show registrado' : 'shows registrados'} na sua trajetória musical`}
                      </p>
                    </div>
                  </div>

                  {/* Next Medal Unlock Goal with prominent progress bar */}
                  {stats.nextMedal ? (
                    <div className="mt-4 pt-3 border-t border-[#282141]/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8A8577] flex items-center gap-1.5">
                          <span>Próximo nível:</span>
                          <strong className="text-[#ECE5D1]">{stats.nextMedal.name}</strong>
                          <span>{stats.nextMedal.icon}</span>
                        </span>
                        <span className="font-mono font-bold text-[#FFD60A]">
                          {stats.totalShows} / {stats.nextMedal.minShows} shows
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-[#100C1F] h-2 rounded-full overflow-hidden border border-[#282141]">
                        <div
                          className="bg-gradient-to-r from-[#2FB8BA] via-[#4FDCDE] to-[#FFD60A] h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((stats.totalShows / stats.nextMedal.minShows) * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#ECE5D1]">
                          Faltam{' '}
                          <strong className="text-[#FFD60A] text-xs font-bold">
                            {Math.max(0, stats.nextMedal.minShows - stats.totalShows)}
                          </strong>{' '}
                          {Math.max(0, stats.nextMedal.minShows - stats.totalShows) === 1 ? 'show' : 'shows'} para o Nível{' '}
                          <strong className="text-[#ECE5D1] font-bold">
                            {stats.nextMedal.name.replace(/^Fã\s+/, '')}
                          </strong>
                        </span>
                        <span className="text-[#FFD60A] font-bold">{stats.nextLevelProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-[#282141]/80 text-xs text-[#FFD60A] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Parabéns! Você atingiu o nível máximo de lenda dos festivais!</span>
                    </div>
                  )}

                  {/* Share Card Action Bar */}
                  <div className="mt-3.5 pt-3 border-t border-[#282141]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-[11px] text-[#8A8577] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
                      <span>Poste seu card oficial de conquistas nas redes sociais</span>
                    </span>
                    <button
                      onClick={() => setIsMedalShareOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[#ECE5D1] hover:bg-[#FFFFFF] text-[#100C1F] shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Share2 className="w-4 h-4 text-[#100C1F]" />
                      <span>Compartilhar Conquistas</span>
                    </button>
                  </div>
                </div>
              )}

              {/* All 5 Fan Medals Cards (with filter) */}
              <div className="space-y-2.5">
                {medals
                  .filter((medal) => {
                    if (medalsFilter === 'unlocked') return medal.unlocked;
                    if (medalsFilter === 'locked') return !medal.unlocked;
                    return true;
                  })
                  .map((medal) => {
                    const progressPct = Math.min(
                      100,
                      Math.round((tickets.length / medal.minShows) * 100)
                    );
                    const missingShows = Math.max(0, medal.minShows - tickets.length);

                    return (
                      <div
                        key={medal.id}
                        className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                          medal.unlocked
                            ? 'bg-[#171226] shadow-lg'
                            : 'bg-[#100C1F]/50 border-[#282141]/70 opacity-70 hover:opacity-90'
                        }`}
                        style={{
                          borderColor: medal.unlocked ? `${medal.metalColor}50` : undefined,
                          boxShadow: medal.unlocked
                            ? `0 6px 20px ${medal.metalColor}15`
                            : undefined,
                        }}
                      >
                        {/* Ambient background light for unlocked medals */}
                        {medal.unlocked && (
                          <div
                            className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20"
                            style={{ backgroundColor: medal.metalColor }}
                          />
                        )}

                        <div className="flex items-center gap-3.5 sm:gap-4 relative z-10">
                          {/* Medalha sem box ao redor - fundo totalmente transparente */}
                          <div className="shrink-0 flex items-center justify-center">
                            <FanMedalIllustration
                              medalId={medal.id}
                              level={medal.level}
                              unlocked={medal.unlocked}
                              className="w-16 h-16 sm:w-18 sm:h-18 shrink-0"
                            />
                          </div>

                          {/* Medal Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5
                                className="text-sm font-black truncate"
                                style={{ color: medal.unlocked ? medal.metalColor : '#ECE5D1' }}
                              >
                                {medal.name}
                              </h5>

                              {medal.unlocked ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Desbloqueado</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-[#8A8577] bg-[#1E1833] border border-[#282141] flex items-center gap-1 shrink-0">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>{medal.minShows} Shows</span>
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-[#8A8577] mt-0.5 line-clamp-1">
                              {medal.description}
                            </p>

                            {/* Progress or Unlock State */}
                            <div className="mt-2">
                              {medal.unlocked ? (
                                <div className="text-[10px] font-mono text-[#4FDCDE] flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-[#2FB8BA]" />
                                  <span>Medalha visual ativa na Livvo Wallet</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="w-full bg-[#100C1F] h-1.5 rounded-full overflow-hidden border border-[#282141]">
                                    <div
                                      className="bg-gradient-to-r from-[#2FB8BA] to-[#FFD60A] h-full rounded-full transition-all duration-300"
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8A8577]">
                                    <span>{tickets.length}/{medal.minShows} shows registrados</span>
                                    <span className="text-[#FFD60A] font-bold">
                                      Faltam {missingShows} {missingShows === 1 ? 'show' : 'shows'} para o Nível {medal.name.replace(/^Fã\s+/, '')}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: DESAFIOS SEMANAIS (METAS PARA SUBIR DE NÍVEL MAIS RÁPIDO) */}
          {activeTabRight === 'challenges' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Header com Status Semanal & Timer */}
              <div className="bg-gradient-to-br from-[#171226] via-[#1E1833] to-[#120E22] border border-[#2FB8BA]/40 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#2FB8BA]/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between gap-2 relative z-10 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2FB8BA] to-[#4FDCDE] text-[#100C1F] flex items-center justify-center font-black text-lg shadow-md shrink-0">
                      🎯
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#ECE5D1] uppercase tracking-wide flex items-center gap-1.5">
                        <span>Desafios Mensais</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30">
                          Mês Ativo
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#8A8577]">
                        Cumpra metas para subir de nível mais rápido e acelerar novas medalhas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#100C1F] border border-[#282141] text-[10px] font-mono text-[#8A8577]">
                    <Clock className="w-3 h-3 text-[#2FB8BA]" />
                    <span>Novas metas a cada mês</span>
                  </div>
                </div>

                {/* Progress across weekly challenges */}
                <div className="relative z-10 space-y-1.5 pt-1 border-t border-[#282141]/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8A8577]">
                      Progresso: <strong className="text-[#ECE5D1]">{challenges.filter(c => c.completed).length} de {challenges.length} metas concluídas</strong>
                    </span>
                    <span className="text-[#2FB8BA] font-bold">
                      {Math.round((challenges.filter(c => c.completed).length / Math.max(1, challenges.length)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#100C1F] h-2 rounded-full overflow-hidden border border-[#282141]">
                    <div
                      className="bg-gradient-to-r from-[#2FB8BA] via-[#4FDCDE] to-[#FFD60A] h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.round((challenges.filter(c => c.completed).length / Math.max(1, challenges.length)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Challenge Cards List */}
              <div className="space-y-2.5">
                {challenges.map((ch) => {
                  const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));

                  return (
                    <div
                      key={ch.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                        ch.completed
                          ? 'bg-[#171226] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                          : 'bg-[#100C1F]/60 border-[#282141] hover:border-[#2FB8BA]/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 relative z-10">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border transition-all ${
                            ch.completed
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-[#1E1833] border-[#282141] text-[#ECE5D1]'
                          }`}
                        >
                          {ch.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : ch.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="text-xs font-black text-[#ECE5D1] leading-tight">
                                {ch.title}
                              </h5>
                              <p className="text-[11px] text-[#8A8577] mt-0.5 leading-snug">
                                {ch.description}
                              </p>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                                ch.completed
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/30'
                              }`}
                            >
                              {ch.completed ? 'Concluído' : ch.rewardBadge}
                            </span>
                          </div>

                          {/* Progress Bar & Status */}
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-[#8A8577]">
                                Progresso: <strong className="text-[#ECE5D1]">{ch.current}/{ch.target}</strong>
                              </span>
                              <span className={ch.completed ? 'text-emerald-400 font-bold' : 'text-[#FFD60A] font-bold'}>
                                {ch.completed ? 'Recompensa Ativa' : `Faltam ${Math.max(0, ch.target - ch.current)}`}
                              </span>
                            </div>

                            <div className="w-full bg-[#100C1F] h-1.5 rounded-full overflow-hidden border border-[#282141]">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  ch.completed
                                    ? 'bg-emerald-400'
                                    : 'bg-gradient-to-r from-[#2FB8BA] to-[#FFD60A]'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Action CTA & Quick Complete Toggle */}
                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#282141]/50 mt-1">
                              <button
                                onClick={() => handleToggleChallenge(ch.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                  ch.completed
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-[#100C1F] text-[#8A8577] hover:text-[#ECE5D1] border border-[#282141] hover:border-[#2FB8BA]/40'
                                }`}
                                title="Marcar ou alternar conclusão da meta"
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${ch.completed ? 'text-emerald-400' : 'text-[#8A8577]'}`} />
                                <span>{ch.completed ? 'Meta Atingida' : 'Marcar Concluída'}</span>
                              </button>

                              {!ch.completed && (
                                <button
                                  onClick={onGoToStudio}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold bg-[#1E1833] hover:bg-[#282141] text-[#2FB8BA] border border-[#2FB8BA]/30 hover:border-[#2FB8BA] transition-all cursor-pointer"
                                >
                                  <span>{ch.actionPrompt}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: OUTRAS CONQUISTAS DESBLOQUEÁVEIS */}
          {activeTabRight === 'badges' && (
            <div className="bg-[#171226] border border-[#282141] rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 animate-in fade-in duration-200">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                    badge.unlocked
                      ? 'bg-[#1E1833] border-[#FFD60A]/40 shadow-lg shadow-[#FFD60A]/5'
                      : 'bg-[#100C1F]/40 border-[#282141]/60 opacity-50'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      badge.unlocked
                        ? 'bg-[#FFD60A]/15 border border-[#FFD60A]/30 text-[#FFD60A]'
                        : 'bg-[#1E1833] border border-[#282141] text-[#8A8577]'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[#ECE5D1] truncate">
                        {badge.title}
                      </h5>
                      {badge.unlocked ? (
                        <span className="text-[10px] font-black text-[#FFD60A] uppercase tracking-wider">
                          Desbloqueado
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#8A8577]">
                          Bloqueado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8A8577] mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
