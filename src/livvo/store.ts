import { useSyncExternalStore } from 'react';
import { guestService } from '../services/guestService';
import { INTERESSES_DEMO, MEMORIAS_DEMO, PERFIL_DEMO, type DimensaoId, type PerfilDemo } from './data/demo';

/**
 * Estado do usuário na prévia livvo-final (memórias, interesses e preferências).
 *
 * Nesta prévia tudo fica no navegador (localStorage), como no restante do app A.
 * No site final, cada item abaixo é uma tabela do banco de B; os nomes dos campos
 * já seguem o modelo de registro de B (show → presença → notas → setor → com quem → foto → relato → visibilidade).
 */

export type Visibilidade = 'privado' | 'seguidores' | 'publico';
export type Interesse = 'quero_ir' | 'tenho_ingresso';

/** Escada de verificação (substitui o selo "ingresso verificado"). */
export type Verificacao = 'registrado' | 'com_foto' | 'com_ingresso' | 'presenca_confirmada';

export interface Memoria {
  id: string;
  showId: string;
  criadaEm: number;
  atualizadaEm: number;
  notaShow?: number; // 0,5 a 5
  notaOrganizacao?: number; // 0,5 a 5
  dimensoes?: Partial<Record<DimensaoId, number>>;
  setor?: string;
  comQuem?: string[];
  fotoUrl?: string;
  ingressoAnexado?: boolean;
  presencaConfirmadaPor?: string;
  relato?: string;
  visibilidade: Visibilidade;
  origem: 'demo' | 'usuario';
}

interface Estado {
  versao: 1;
  memorias: Memoria[];
  interesses: Record<string, Interesse>;
  /** Mostrar pessoas, números e resenhas de exemplo (desligue para ver os estados vazios reais). */
  exemplos: boolean;
  /** Notas da organização dadas neste mês (para a missão de memória). */
  notasOrgNoMes: { mes: string; ids: string[] };
  /** Pessoas seguidas (@usuario). */
  seguindo?: string[];
}

const CHAVE = 'livvo_final_v1';
const EVENTO = 'livvo-final-change';
export const VISIBILIDADE_PADRAO: Visibilidade = 'seguidores';

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

const estadoDemo = (): Estado => {
  const agora = Date.now();
  return {
    versao: 1,
    memorias: MEMORIAS_DEMO.map(([showId, nota], i) => ({
      id: `m-${showId}`,
      showId,
      criadaEm: agora - i * 1000,
      atualizadaEm: agora - i * 1000,
      notaShow: nota ?? undefined,
      visibilidade: VISIBILIDADE_PADRAO,
      origem: 'demo',
    })),
    interesses: { ...INTERESSES_DEMO },
    exemplos: true,
    notasOrgNoMes: { mes: mesAtual(), ids: [] },
    seguindo: [],
  };
};

const ler = (): Estado | null => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const e = JSON.parse(bruto) as Estado;
    return e?.versao === 1 ? e : null;
  } catch {
    return null;
  }
};

let estado: Estado = ler() ?? estadoDemo();

// Primeira visita: entra na conta de demonstração para a prévia já abrir com a história do Marcelo.
try {
  if (!localStorage.getItem(CHAVE)) {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    if (!guestService.isLoggedIn()) guestService.login('demonstracao@livvomusic.com.br');
  }
} catch {
  /* sem armazenamento: vale só nesta sessão */
}

const salvar = (novo: Estado) => {
  estado = novo;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(novo));
  } catch {
    /* sem espaço: segue só na memória */
  }
  window.dispatchEvent(new Event(EVENTO));
};

const assinar = (fn: () => void) => {
  window.addEventListener(EVENTO, fn);
  const off = guestService.onChange(fn);
  return () => {
    window.removeEventListener(EVENTO, fn);
    off();
  };
};

// Snapshot estável: só muda de referência quando o estado ou o login mudam.
let ultimo: { estado: Estado; logado: boolean } = { estado, logado: guestService.isLoggedIn() };
const foto = () => {
  const logado = guestService.isLoggedIn();
  if (ultimo.estado !== estado || ultimo.logado !== logado) ultimo = { estado, logado };
  return ultimo;
};

export interface Livvo {
  logado: boolean;
  perfil: PerfilDemo;
  memorias: Memoria[];
  interesses: Record<string, Interesse>;
  exemplos: boolean;
  notasOrgNoMes: string[];
  seguindo: string[];
  memoriaDoShow: (showId: string) => Memoria | undefined;
}

export const useLivvo = (): Livvo => {
  const { estado: e, logado } = useSyncExternalStore(assinar, foto, foto);
  return {
    logado,
    perfil: PERFIL_DEMO,
    memorias: logado ? e.memorias : [],
    interesses: logado ? e.interesses : {},
    exemplos: e.exemplos,
    notasOrgNoMes: e.notasOrgNoMes.mes === mesAtual() ? e.notasOrgNoMes.ids : [],
    seguindo: logado ? e.seguindo || [] : [],
    memoriaDoShow: (showId) => (logado ? e.memorias.find((m) => m.showId === showId) : undefined),
  };
};

export const nivelVerificacao = (m: Memoria): Verificacao => {
  if (m.presencaConfirmadaPor) return 'presenca_confirmada';
  if (m.ingressoAnexado) return 'com_ingresso';
  if (m.fotoUrl) return 'com_foto';
  return 'registrado';
};

export const ROTULO_VERIFICACAO: Record<Verificacao, string> = {
  registrado: 'Registrado',
  com_foto: 'Com foto',
  com_ingresso: 'Com ingresso',
  presenca_confirmada: 'Presença confirmada',
};

/** Ações. Todas exigem login; sem login, abrem a tela de entrar. */
export const livvo = {
  exigirLogin(): boolean {
    if (guestService.isLoggedIn()) return true;
    guestService.requestLogin();
    return false;
  },

  /** "Eu fui": cria a memória (ou devolve a existente). */
  registrar(showId: string, dados: Partial<Pick<Memoria, 'notaShow' | 'notaOrganizacao'>> = {}): Memoria | null {
    if (!this.exigirLogin()) return null;
    const existente = estado.memorias.find((m) => m.showId === showId);
    if (existente) return existente;
    const agora = Date.now();
    const m: Memoria = {
      id: `m-${showId}-${agora.toString(36)}`,
      showId,
      criadaEm: agora,
      atualizadaEm: agora,
      visibilidade: VISIBILIDADE_PADRAO,
      origem: 'usuario',
      ...dados,
    };
    const interesses = { ...estado.interesses };
    delete interesses[showId];
    salvar({ ...estado, memorias: [m, ...estado.memorias], interesses });
    return m;
  },

  atualizar(memoriaId: string, patch: Partial<Omit<Memoria, 'id' | 'showId' | 'origem'>>) {
    if (!this.exigirLogin()) return;
    let notasOrg = estado.notasOrgNoMes.mes === mesAtual() ? estado.notasOrgNoMes.ids : [];
    const memorias = estado.memorias.map((m) => {
      if (m.id !== memoriaId) return m;
      if (patch.notaOrganizacao !== undefined && m.notaOrganizacao === undefined && !notasOrg.includes(m.id)) {
        notasOrg = [...notasOrg, m.id];
      }
      return { ...m, ...patch, atualizadaEm: Date.now() };
    });
    salvar({ ...estado, memorias, notasOrgNoMes: { mes: mesAtual(), ids: notasOrg } });
  },

  remover(memoriaId: string) {
    if (!this.exigirLogin()) return;
    salvar({ ...estado, memorias: estado.memorias.filter((m) => m.id !== memoriaId) });
  },

  definirInteresse(showId: string, valor: Interesse | null) {
    if (!this.exigirLogin()) return;
    const interesses = { ...estado.interesses };
    if (valor) interesses[showId] = valor;
    else delete interesses[showId];
    salvar({ ...estado, interesses });
  },

  alternarSeguir(usuario: string) {
    if (!this.exigirLogin()) return;
    const atual = estado.seguindo || [];
    const seguindo = atual.includes(usuario) ? atual.filter((u) => u !== usuario) : [...atual, usuario];
    salvar({ ...estado, seguindo });
  },

  alternarExemplos() {
    salvar({ ...estado, exemplos: !estado.exemplos });
  },

  restaurarDemonstracao() {
    salvar({ ...estadoDemo(), exemplos: estado.exemplos });
    if (!guestService.isLoggedIn()) guestService.login('demonstracao@livvomusic.com.br');
  },

  comecarDoZero() {
    salvar({ ...estadoDemo(), memorias: [], interesses: {}, exemplos: estado.exemplos });
  },

  entrar() {
    guestService.requestLogin();
  },

  sair() {
    guestService.logout();
  },
};
