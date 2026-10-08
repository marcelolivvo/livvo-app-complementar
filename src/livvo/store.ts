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

/** Concert Buddy marcado numa memória: vira convite; o show só entra na história da pessoa se ela aceitar. */
export type StatusMarcacao = 'pendente' | 'aceita' | 'recusada';
export interface Marcacao {
  usuario: string;
  status: StatusMarcacao;
  em: number;
}

/** Convite recebido ("Fomos juntos"): alguém marcou você num show. */
export interface Convite {
  id: string;
  de: string; // @ de quem marcou
  showId: string;
  em: number;
  status: 'pendente' | 'aceito' | 'recusado';
  exemplo?: boolean;
}

/**
 * Personalização do pôster/ingresso de uma memória (revisão 5, 07/10/2026). Vem do Livvo Virtual Poster (A),
 * só com os carimbos de presença. Vale para o pôster, o ingresso da Carteira e as imagens de compartilhar.
 */
export type FormatoMemoria = 'poster' | 'ingresso';
export type CarimboPresenca = 'nenhum' | 'eu_fui' | 'show_da_minha_vida';
export type CorDestaque = 'ciano' | 'teal' | 'offwhite';
export type FonteNome = 'alfa' | 'barlow' | 'raydis';
export interface Personalizacao {
  formato: FormatoMemoria;
  carimbo: CarimboPresenca;
  cor: CorDestaque;
  fonte: FonteNome;
  tamanho: 'p' | 'm' | 'g';
  posicao: 'cima' | 'meio' | 'baixo';
  /** Frase curta no alto do card (tagline do Estúdio). */
  frase: string;
  /** Faixa marcante do show. */
  faixa: string;
  mostrarSetor: boolean;
  mostrarComQuem: boolean;
  mostrarCasa: boolean;
  mostrarUsuario: boolean;
}
export const PERSONALIZACAO_PADRAO: Personalizacao = {
  formato: 'poster',
  carimbo: 'nenhum', // revisão 6: sem carimbo por padrão; só aparece se escolhido no Personalizar
  cor: 'ciano',
  fonte: 'alfa',
  tamanho: 'g',
  posicao: 'baixo',
  frase: '',
  faixa: '',
  mostrarSetor: true,
  mostrarComQuem: true,
  mostrarCasa: true,
  mostrarUsuario: true,
};
export const personalizacaoDe = (m?: Pick<Memoria, 'personalizacao'> | null): Personalizacao => ({ ...PERSONALIZACAO_PADRAO, ...(m?.personalizacao || {}) });

/** Quem pode marcar você como Concert Buddy. */
export type QuemPodeMarcar = 'todos' | 'seguindo' | 'ninguem';

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
  /** Concert Buddies marcados nesta memória. */
  buddies?: Marcacao[];
  fotoUrl?: string;
  ingressoAnexado?: boolean;
  presencaConfirmadaPor?: string;
  relato?: string;
  /** Pôster ou ingresso, carimbo, cor, fonte e o que aparece no card. */
  personalizacao?: Partial<Personalizacao>;
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
  /** Artistas favoritos (ids do catálogo), na ordem em que foram favoritados (revisão 7). */
  favoritos?: string[];
  /** Convites "Fomos juntos" recebidos. */
  convites?: Convite[];
  quemPodeMarcar?: QuemPodeMarcar;
  /** Marca que a comunidade de exemplo (seguindo e convites) já foi semeada nesta conta. */
  comunidadeV1?: boolean;
}

const CHAVE = 'livvo_final_v1';
const EVENTO = 'livvo-final-change';
export const VISIBILIDADE_PADRAO: Visibilidade = 'seguidores';

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

/** Convites de exemplo para a conta de demonstração ver o outro lado do Concert Buddy. */
const convitesDemo = (): Convite[] => {
  const agora = Date.now();
  return [
    { id: 'cv-1', de: 'jufreitas', showId: '5376db79', em: agora - 3 * 3600e3, status: 'pendente', exemplo: true },
    { id: 'cv-2', de: 'rafamoraes', showId: '35899db', em: agora - 26 * 3600e3, status: 'pendente', exemplo: true },
    { id: 'cv-3', de: 'helenacosta', showId: '6343aa8f', em: agora - 4 * 86400e3, status: 'pendente', exemplo: true },
  ];
};
const SEGUINDO_DEMO = ['helenacosta', 'rafamoraes', 'jufreitas', 'lucasamaral'];

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
    seguindo: [...SEGUINDO_DEMO],
    convites: convitesDemo(),
    quemPodeMarcar: 'seguindo',
    comunidadeV1: true,
  };
};

const ler = (): Estado | null => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const e = JSON.parse(bruto) as Estado;
    if (e?.versao !== 1) return null;
    // Contas criadas antes da Comunidade: semeia quem a demonstração segue e os convites de exemplo
    if (!e.comunidadeV1) {
      e.seguindo = Array.from(new Set([...(e.seguindo || []), ...SEGUINDO_DEMO]));
      e.convites = convitesDemo();
      e.quemPodeMarcar = e.quemPodeMarcar || 'seguindo';
      e.comunidadeV1 = true;
    }
    return e;
  } catch {
    return null;
  }
};

let estado: Estado = ler() ?? estadoDemo();

// Primeira visita: prepara a conta de demonstração (história do Marcelo), mas não entra sozinho.
// Desde a revisão 8, quem chega pela primeira vez vê a página de entrada do Livvo; o "Entrar" abre essa conta.
try {
  if (!localStorage.getItem(CHAVE)) {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
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
  favoritos: string[];
  convites: Convite[];
  quemPodeMarcar: QuemPodeMarcar;
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
    favoritos: logado ? e.favoritos || [] : [],
    // convites de exemplo só aparecem com a comunidade de exemplo ligada
    convites: logado ? (e.convites || []).filter((c) => e.exemplos || !c.exemplo) : [],
    quemPodeMarcar: e.quemPodeMarcar || 'seguindo',
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

  /** Favorita ou desfavorita um artista (Artistas favoritos da Minha História). */
  alternarFavorito(artistaId: string) {
    if (!this.exigirLogin()) return false;
    const atual = estado.favoritos || [];
    const agora = !atual.includes(artistaId);
    salvar({ ...estado, favoritos: agora ? [...atual, artistaId] : atual.filter((a) => a !== artistaId) });
    return agora;
  },

  /** Marca um Concert Buddy na memória (convite pendente até a pessoa aceitar). */
  marcarBuddy(memoriaId: string, usuario: string, aoAceitar?: () => void) {
    if (!this.exigirLogin()) return;
    const memorias = estado.memorias.map((m) => {
      if (m.id !== memoriaId || (m.buddies || []).some((b) => b.usuario === usuario)) return m;
      return { ...m, buddies: [...(m.buddies || []), { usuario, status: 'pendente' as const, em: Date.now() }], atualizadaEm: Date.now() };
    });
    salvar({ ...estado, memorias });
    // Prévia: as pessoas de exemplo aceitam sozinhas depois de alguns segundos (no site final, a pessoa decide)
    if (estado.exemplos && aoAceitar) {
      window.setTimeout(() => {
        const m = estado.memorias.find((x) => x.id === memoriaId);
        if (!m || !(m.buddies || []).some((b) => b.usuario === usuario && b.status === 'pendente')) return;
        salvar({
          ...estado,
          memorias: estado.memorias.map((x) =>
            x.id !== memoriaId ? x : { ...x, buddies: (x.buddies || []).map((b) => (b.usuario === usuario ? { ...b, status: 'aceita' as const } : b)) },
          ),
        });
        aoAceitar();
      }, 3500);
    }
  },

  desmarcarBuddy(memoriaId: string, usuario: string) {
    if (!this.exigirLogin()) return;
    salvar({
      ...estado,
      memorias: estado.memorias.map((m) => (m.id !== memoriaId ? m : { ...m, buddies: (m.buddies || []).filter((b) => b.usuario !== usuario) })),
    });
  },

  /** Aceitar ou recusar um convite "Fomos juntos". Aceitar cria a memória (ou liga a pessoa à que já existe). */
  responderConvite(id: string, aceitar: boolean) {
    if (!this.exigirLogin()) return;
    const convite = (estado.convites || []).find((c) => c.id === id);
    if (!convite) return;
    const convites = (estado.convites || []).map((c) => (c.id === id ? { ...c, status: aceitar ? ('aceito' as const) : ('recusado' as const) } : c));
    if (!aceitar) return salvar({ ...estado, convites });
    const agora = Date.now();
    const buddy: Marcacao = { usuario: convite.de, status: 'aceita', em: agora };
    const existente = estado.memorias.find((m) => m.showId === convite.showId);
    const memorias = existente
      ? estado.memorias.map((m) =>
          m.id !== existente.id || (m.buddies || []).some((b) => b.usuario === convite.de) ? m : { ...m, buddies: [...(m.buddies || []), buddy] },
        )
      : [
          {
            id: `m-${convite.showId}-${agora.toString(36)}`,
            showId: convite.showId,
            criadaEm: agora,
            atualizadaEm: agora,
            visibilidade: VISIBILIDADE_PADRAO,
            origem: 'usuario' as const,
            buddies: [buddy],
          },
          ...estado.memorias,
        ];
    const interesses = { ...estado.interesses };
    delete interesses[convite.showId];
    salvar({ ...estado, convites, memorias, interesses });
  },

  definirQuemPodeMarcar(valor: QuemPodeMarcar) {
    if (!this.exigirLogin()) return;
    salvar({ ...estado, quemPodeMarcar: valor });
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
