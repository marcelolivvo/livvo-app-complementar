import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Award, Bell, X } from 'lucide-react';
import type { StickerState } from '../services/stickerService';
import { avaliarConquistas } from './conquistasLogic';
import { useCatalogo, type Show } from './data/catalog';
import { atividadeDeQuemSegue } from './data/social';
import type { PessoaExemplo } from './data/demo';
import { Link, navigate } from './router';
import { calcularPassaporte } from './stats';
import { useLivvo } from './store';
import { Avatar, Discos, TagExemplo } from './ui';

/**
 * Novidades (revisão 11, 07/10/2026):
 * - item 13: aviso animado quando uma nova Conquista é desbloqueada;
 * - item 14: "O que quem você segue está vivendo" no sino (ponto + painel) e no Início (o que é novo
 *   desde a última visita). Nesta prévia a atividade vem da comunidade de exemplo.
 */

/* Atividade de quem você segue ------------------------------------------------------------ */

const CHAVE_VISTA = 'livvo_final_atividade_vista_v1';
const EVENTO_VISTA = 'livvo-atividade-vista';

const lerVista = (): number => {
  try {
    return Number(localStorage.getItem(CHAVE_VISTA)) || 0;
  } catch {
    return 0;
  }
};

/** Momento da última vez que a atividade foi vista (0 = nunca). */
export const lerVistaAgora = lerVista;

/** Marca a atividade como vista agora (apaga o ponto do sino). */
export const marcarAtividadeVista = () => {
  try {
    localStorage.setItem(CHAVE_VISTA, String(Date.now()));
  } catch {
    /* sem armazenamento: o ponto volta na próxima visita */
  }
  window.dispatchEvent(new Event(EVENTO_VISTA));
};

const assinarVista = (fn: () => void) => {
  window.addEventListener(EVENTO_VISTA, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(EVENTO_VISTA, fn);
    window.removeEventListener('storage', fn);
  };
};
export const useAtividadeVista = () => useSyncExternalStore(assinarVista, lerVista, lerVista);

export interface ItemAtividade {
  pessoa: PessoaExemplo;
  show: Show;
  notaShow: number;
  /** Momento do registro (fixo no dia, para "novo desde a última visita" não mudar a cada minuto). */
  em: number;
}

/** Atividade de quem você segue, com horário fixo no dia (a comunidade de exemplo muda a cada dia). */
export const useAtividade = (quantidade = 9): ItemAtividade[] => {
  const { catalogo } = useCatalogo();
  const { logado, exemplos, seguindo } = useLivvo();
  return useMemo(() => {
    if (!catalogo || !logado || !exemplos) return [];
    const base = new Date();
    base.setHours(6, 0, 0, 0);
    const agora = Date.now();
    return atividadeDeQuemSegue(catalogo.shows, seguindo, quantidade)
      .map(({ pessoa, show, notaShow, horas }) => ({ pessoa, show, notaShow, em: base.getTime() - horas * 3600e3 }))
      .filter((x) => x.em <= agora)
      .sort((a, b) => b.em - a.em);
  }, [catalogo, logado, exemplos, seguindo, quantidade]);
};

export const haQuanto = (em: number) => {
  const h = Math.floor((Date.now() - em) / 3600e3);
  if (h < 1) return 'agora há pouco';
  if (h < 24) return `há ${h} h`;
  return h < 48 ? 'ontem' : `há ${Math.floor(h / 24)} dias`;
};

/** Sino do cabeçalho: ponto quando há atividade nova e painel com o que quem você segue está vivendo. */
export const SinoAtividade: React.FC<{ alertasAtivo: boolean }> = ({ alertasAtivo }) => {
  const { logado } = useLivvo();
  const itens = useAtividade();
  const vista = useAtividadeVista();
  const novos = itens.filter((x) => x.em > vista).length;
  const [aberto, setAberto] = useState(false);
  // O que era novo quando o painel abriu continua marcado enquanto ele está aberto
  const [vistaAoAbrir, setVistaAoAbrir] = useState(vista);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const abrir = () => {
    if (aberto) return setAberto(false);
    setVistaAoAbrir(vista);
    setAberto(true);
    if (novos) marcarAtividadeVista();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="lv-iconbtn lv-sino"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-current={alertasAtivo ? 'page' : undefined}
        aria-label={novos ? `Novidades: ${novos} ${novos === 1 ? 'nova' : 'novas'} de quem você segue` : 'Novidades e alertas'}
        onClick={abrir}
      >
        <Bell className="w-5 h-5" />
        {novos > 0 && <span className="lv-sino-ponto" aria-hidden="true" />}
      </button>
      {aberto && (
        <div className="lv-menu lv-painel-ativ" role="dialog" aria-label="O que quem você segue está vivendo">
          <div className="flex items-start justify-between gap-3 px-2.5 pt-2">
            <div className="min-w-0">
              <div className="lv-kicker lv-kicker--cyan">Novidades</div>
              <div className="font-extrabold text-[15px] leading-snug mt-1">O que quem você segue está vivendo</div>
            </div>
            {itens.length > 0 && <TagExemplo />}
          </div>
          {!logado ? (
            <p className="lv-meta px-2.5 py-3">Entre para ver o que quem você segue está vivendo.</p>
          ) : itens.length === 0 ? (
            <p className="lv-meta px-2.5 py-3">Siga quem foi aos mesmos shows que você e veja aqui o que essas pessoas estão vivendo.</p>
          ) : (
            <ul className="lv-painel-lista">
              {itens.slice(0, 6).map((x) => {
                const novo = x.em > vistaAoAbrir;
                return (
                  <li key={`${x.pessoa.usuario}-${x.show.id}`}>
                    <Link to={`/show/${x.show.id}`} className="lv-painel-item" data-novo={novo || undefined} onClick={() => setAberto(false)}>
                      <Avatar nome={x.pessoa.nome} tamanho={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] leading-snug">
                          <b>{x.pessoa.nome}</b> <span className="text-[#B3AE9F]">registrou</span> <b>{x.show.artista}</b>
                        </span>
                        <span className="lv-meta block truncate">
                          {x.show.casa} · {haQuanto(x.em)}
                        </span>
                      </span>
                      {novo ? <span className="lv-tag lv-tag--cyan shrink-0">Novo</span> : <Discos valor={x.notaShow} tamanho={11} rotulo="Nota do show" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="lv-menu-sep" />
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 pb-1.5">
            <Link to="/comunidade" className="lv-link !text-[13px]" onClick={() => setAberto(false)}>
              Ver na Comunidade
            </Link>
            <Link to="/alertas" className="lv-link !text-[13px] !text-[#B3AE9F]" onClick={() => setAberto(false)}>
              Alertas de shows
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/* Aviso de nova Conquista ------------------------------------------------------------------- */

const CHAVE_CONQUISTAS = 'livvo_final_conquistas_vistas_v1';
const lerConquistasVistas = (): string[] | null => {
  try {
    const bruto = localStorage.getItem(CHAVE_CONQUISTAS);
    return bruto ? (JSON.parse(bruto) as string[]) : null;
  } catch {
    return null;
  }
};
const gravarConquistasVistas = (slugs: string[]) => {
  try {
    localStorage.setItem(CHAVE_CONQUISTAS, JSON.stringify(slugs));
  } catch {
    /* sem armazenamento: só não avisa */
  }
};

/**
 * Observa as memórias e avisa quando um registro novo (um show a mais) desbloqueia conquistas.
 * Restaurar a demonstração ou zerar a conta não dispara aviso: só o registro de 1 show.
 */
export const AvisoConquista: React.FC = () => {
  const { catalogo } = useCatalogo();
  const lv = useLivvo();
  const pass = useMemo(() => calcularPassaporte(lv.memorias, catalogo), [lv.memorias, catalogo]);
  const anterior = useRef<number | null>(null);
  const [aviso, setAviso] = useState<StickerState[] | null>(null);

  useEffect(() => {
    if (!catalogo || !lv.logado) {
      anterior.current = null;
      return;
    }
    const desbloqueadas = avaliarConquistas(pass).filter((s) => s.status === 'unlocked');
    const vistas = lerConquistasVistas();
    const antes = anterior.current;
    anterior.current = pass.shows;
    gravarConquistasVistas(desbloqueadas.map((s) => s.slug));
    if (vistas === null || antes === null || pass.shows !== antes + 1) return;
    const novas = desbloqueadas.filter((s) => !vistas.includes(s.slug));
    if (novas.length) setAviso(novas);
  }, [pass, catalogo, lv.logado]);

  useEffect(() => {
    if (!aviso) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAviso(null);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aviso]);

  if (!aviso) return null;
  const [principal, ...outras] = aviso;
  return (
    <div className="lv-conq-aviso-fundo" role="dialog" aria-modal="true" aria-labelledby="lv-conq-aviso-titulo" onMouseDown={(e) => e.target === e.currentTarget && setAviso(null)}>
      <div className="lv-conq-aviso">
        <button type="button" className="lv-iconbtn lv-conq-aviso-x" aria-label="Fechar" onClick={() => setAviso(null)}>
          <X className="w-5 h-5" />
        </button>
        <div className="lv-kicker lv-kicker--cyan">Nova conquista</div>
        <div className="lv-conq-aviso-palco" aria-hidden="true">
          <span className="lv-conq-aviso-raios" />
          <img src={principal!.image} alt="" width={168} height={168} />
        </div>
        <h2 id="lv-conq-aviso-titulo" className="lv-display text-[28px] leading-tight text-[#ECE5D1]">
          {principal!.name}
        </h2>
        <p className="lv-meta mt-1.5">{principal!.criterion}</p>
        {outras.length > 0 && (
          <p className="lv-sub mt-3">
            E mais {outras.length === 1 ? '1 conquista' : `${outras.length} conquistas`}: {outras.map((s) => s.name).join(', ')}.
          </p>
        )}
        <div className="mt-6 grid gap-2.5 w-full max-w-[300px] mx-auto">
          <button
            type="button"
            className="lv-btn lv-btn--stub lv-btn--cyan w-full whitespace-nowrap"
            onClick={() => {
              setAviso(null);
              navigate('/minha-historia?ver=conquistas');
            }}
          >
            <Award className="w-4 h-4 shrink-0" strokeWidth={2.2} /> <span>Ver Minhas Conquistas</span>
          </button>
          <button type="button" className="lv-link justify-center" onClick={() => setAviso(null)}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
