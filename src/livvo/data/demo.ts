/**
 * Dados da conta de demonstração e da comunidade de exemplo (prévia livvo-final).
 *
 * - Memórias: são as 25 memórias reais do Marcelo (@toboi) no livvomusic.com.br em 06/10/2026,
 *   ligadas aos IDs reais do catálogo (setlist.fm). Nota do Show copiada do site atual;
 *   a Nota da Organização não estava visível, então fica em branco (vira missão de memória).
 * - Pessoas, resenhas, contagens e shows futuros são FICTÍCIOS e aparecem marcados "exemplo".
 *   Nenhum nome ou texto de beta tester real é usado.
 */

export interface PerfilDemo {
  nome: string;
  usuario: string;
  noLivvoDesde: string; // dd/mm/aaaa
  bio: string;
  cidade: string;
  top: string[];
}

export const PERFIL_DEMO: PerfilDemo = {
  nome: 'Marcelo Ferreira',
  usuario: 'toboi',
  noLivvoDesde: '19/08/2026',
  bio: 'Viciado em música ao vivo, contando a minha história através dos meus shows.',
  cidade: 'São Paulo',
  top: ['Dave Matthews Band', 'Oasis', 'Pink Floyd'],
};

/** [showId, notaShow] — notaShow null = sem nota no site atual. */
export const MEMORIAS_DEMO: Array<[string, number | null]> = [
  ['637092b3', 5], // Biquini · Espaço Unimed · 24/07/2026
  ['7b7092a0', 3], // Nenhum de Nós · Espaço Unimed · 24/07/2026
  ['1b4df56c', 5], // Pet Shop Boys · Suhai Music Hall · 03/03/2026
  ['6b40a212', 4], // Vanguart · Audio · 30/11/2025
  ['435f27c7', 5], // Oasis · MorumBIS · 23/11/2025
  ['635aaa67', 5], // Dave Matthews Band · Parque do Ibirapuera · 08/06/2025
  ['6b5aaa6e', 5], // Dave Matthews Band · Parque do Ibirapuera · 07/06/2025
  ['135aa935', 5], // Racionais MC’s · Memorial da América Latina · 01/02/2025
  ['5b50ebc0', 5], // Lianne La Havas · Cine Joia · 24/11/2024
  ['73a8fad1', 5], // Keane · Espaço Unimed · 09/11/2024
  ['6b521ed2', 5], // Legião Urbana · Espaço Unimed · 31/08/2024
  ['23a10c13', 5], // Taylor Swift · Nilton Santos · 19/11/2023
  ['7b9c2618', 5], // Dave Matthews Band · Ginásio do Ibirapuera · 27/09/2019
  ['2be020ae', 5], // Sigur Rós · Espaço das Américas · 29/11/2017
  ['7bfcf61c', 5], // Móveis Coloniais de Acaju · Cine Joia · 22/07/2016
  ['1bf2d504', 5], // David Gilmour · Allianz Parque · 12/12/2015
  ['3c4794b', null], // Dave Matthews Band · Pepsi On Stage · 11/12/2013
  ['53c40b15', null], // Dave Matthews Band · Citibank Hall · 08/12/2013
  ['7bc40e20', 5], // Incubus · Campo de Marte · 07/12/2013
  ['6bc40e12', null], // Dave Matthews Band · Campo de Marte · 07/12/2013
  ['33d52015', null], // Dave Matthews Band · Fazenda Maeda · 10/10/2010
  ['33d52499', null], // Dave Matthews Band · HSBC Arena · 08/10/2010
  ['33d6b895', null], // Dave Matthews Band · Vivo Rio · 30/09/2008
  ['539f5399', 5], // Ben Harper & The Innocent Criminals · Jockey Club · 16/10/1998
  ['13b5e14d', null], // Dave Matthews Band · Jockey Club · 16/10/1998 (inferida das estatísticas do site atual)
];

/**
 * Shows futuros de EXEMPLO. O catálogo real (setlist.fm) só tem shows que já aconteceram,
 * então a agenda da prévia usa datas fictícias, sempre contadas a partir de hoje.
 */
export interface FuturoExemplo {
  id: string;
  artista: string;
  emDias: number;
  casa: string;
  cidade: string;
  estado: string;
  turne?: string;
}

export const FUTUROS_EXEMPLO: FuturoExemplo[] = [
  { id: 'ex-vanguart', artista: 'Vanguart', emDias: 10, casa: 'Audio', cidade: 'São Paulo', estado: 'São Paulo' },
  { id: 'ex-marina-sena', artista: 'Marina Sena', emDias: 17, casa: 'Vibra São Paulo', cidade: 'São Paulo', estado: 'São Paulo' },
  { id: 'ex-terno-rei', artista: 'Terno Rei', emDias: 24, casa: 'Cine Joia', cidade: 'São Paulo', estado: 'São Paulo' },
  { id: 'ex-nando-reis', artista: 'Nando Reis', emDias: 31, casa: 'Tokio Marine Hall', cidade: 'São Paulo', estado: 'São Paulo' },
  { id: 'ex-racionais', artista: 'Racionais MC’s', emDias: 38, casa: 'Memorial da América Latina', cidade: 'São Paulo', estado: 'São Paulo' },
  { id: 'ex-keane', artista: 'Keane', emDias: 45, casa: 'Espaço Unimed', cidade: 'São Paulo', estado: 'São Paulo' },
  { id: 'ex-paralamas', artista: 'Os Paralamas do Sucesso', emDias: 52, casa: 'Qualistage', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro' },
  { id: 'ex-gil', artista: 'Gilberto Gil', emDias: 59, casa: 'Farmasi Arena', cidade: 'Rio de Janeiro', estado: 'Rio de Janeiro' },
  { id: 'ex-anavitoria', artista: 'ANAVITÓRIA', emDias: 66, casa: 'Arena MRV', cidade: 'Belo Horizonte', estado: 'Minas Gerais' },
  { id: 'ex-lagum', artista: 'Lagum', emDias: 73, casa: 'Live Curitiba', cidade: 'Curitiba', estado: 'Paraná' },
  { id: 'ex-capital', artista: 'Capital Inicial', emDias: 80, casa: 'Arena BRB Mané Garrincha', cidade: 'Brasília', estado: 'Distrito Federal' },
  { id: 'ex-dmb', artista: 'Dave Matthews Band', emDias: 160, casa: 'Allianz Parque', cidade: 'São Paulo', estado: 'São Paulo', turne: 'Turnê de exemplo' },
];

/** Interesses de exemplo da conta de demonstração (agenda). */
export const INTERESSES_DEMO: Record<string, 'quero_ir' | 'tenho_ingresso'> = {
  'ex-vanguart': 'tenho_ingresso',
  'ex-dmb': 'quero_ir',
};

/** Pessoas de exemplo (fictícias). */
export interface PessoaExemplo {
  nome: string;
  usuario: string;
  cidade: string;
}

export const PESSOAS_EXEMPLO: PessoaExemplo[] = [
  { nome: 'Ana Ribeiro', usuario: 'ana.aovivo', cidade: 'São Paulo' },
  { nome: 'Bruno Tavares', usuario: 'brunotav', cidade: 'Rio de Janeiro' },
  { nome: 'Carla Mendes', usuario: 'carlamendes', cidade: 'São Paulo' },
  { nome: 'Diego Sato', usuario: 'diegosato', cidade: 'Curitiba' },
  { nome: 'Fernanda Lopes', usuario: 'fe.lopes', cidade: 'Belo Horizonte' },
  { nome: 'Gustavo Prado', usuario: 'gutoprado', cidade: 'São Paulo' },
  { nome: 'Helena Costa', usuario: 'helenacosta', cidade: 'Porto Alegre' },
  { nome: 'Igor Nunes', usuario: 'igornunes', cidade: 'Brasília' },
  { nome: 'Juliana Freitas', usuario: 'jufreitas', cidade: 'São Paulo' },
  { nome: 'Lucas Amaral', usuario: 'lucasamaral', cidade: 'Rio de Janeiro' },
  { nome: 'Marina Duarte', usuario: 'marinaduarte', cidade: 'Salvador' },
  { nome: 'Rafael Moraes', usuario: 'rafamoraes', cidade: 'São Paulo' },
  { nome: 'Tatiana Lima', usuario: 'tati.lima', cidade: 'Recife' },
  { nome: 'Vitor Campos', usuario: 'vitorcampos', cidade: 'Campinas' },
];

/** Trechos de resenha de exemplo, curtos e genéricos (combinados por show). */
export const RESENHA_SHOW = [
  'Setlist redondo, sem enrolação. Saí rouco.',
  'O bis valeu o ingresso inteiro.',
  'Melhor show que vi este ano, e olha que foram vários.',
  'Banda afiada e o público cantando junto do começo ao fim.',
  'Começou meio frio, mas da metade para frente foi outro show.',
  'Fiquei arrepiado na música de abertura.',
  'Show curto, mas sem nenhum momento morno.',
  'Som alto na medida e uma luz muito bonita.',
];

export const RESENHA_ORGANIZACAO = [
  'A entrada foi rápida, menos de 15 minutos na fila.',
  'Fila do bar enorme, perdi duas músicas.',
  'Saída tranquila e transporte por perto.',
  'Banheiros limpos até o final, o que é raro.',
  'Na pista o som embolava um pouco perto da grade.',
  'Equipe de segurança educada e bem sinalizado.',
  'Da arquibancada a visão do palco era ótima.',
  'Demorou para abrir os portões, todo mundo no sol.',
];

/** Dimensões opcionais de avaliação (oficiais + propostas no plano de fusão). */
export const DIMENSOES = [
  { id: 'entrada_saida', rotulo: 'Entrada e saída' },
  { id: 'seguranca', rotulo: 'Segurança' },
  { id: 'som', rotulo: 'Som' },
  { id: 'visao_palco', rotulo: 'Visão do palco' },
  { id: 'clima_publico', rotulo: 'Clima do público' },
  { id: 'bares_banheiros', rotulo: 'Bares e banheiros' },
] as const;

export type DimensaoId = (typeof DIMENSOES)[number]['id'];
