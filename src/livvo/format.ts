/** Datas, textos e números no padrão do Livvo (pt-BR). */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const DIA_MS = 86_400_000;

/** dd/mm/aaaa → timestamp da meia-noite local. */
export const dataParaTs = (ddmmaaaa: string): number => {
  const [d, m, a] = ddmmaaaa.split('/').map(Number);
  return new Date(a, (m || 1) - 1, d || 1).getTime();
};

export const tsParaData = (ts: number): string => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const hojeTs = (): number => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/** Dias de `ts` em relação a hoje (negativo = passado). */
export const diasAte = (ts: number): number => Math.round((ts - hojeTs()) / DIA_MS);

export const somarDias = (ts: number, dias: number): number => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias).getTime();
};

/** "23 nov 2025" */
export const dataCurta = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]} ${d.getFullYear()}`;
};

/** "domingo, 23 de novembro de 2025" */
export const dataLonga = (ts: number): string => {
  const d = new Date(ts);
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};

/** "dom · 23 nov" */
export const dataCartao = (ts: number): { dia: string; mes: string; ano: string; semana: string } => {
  const d = new Date(ts);
  return {
    dia: String(d.getDate()).padStart(2, '0'),
    mes: MESES_CURTOS[d.getMonth()],
    ano: String(d.getFullYear()),
    semana: DIAS_CURTOS[d.getDay()],
  };
};

/** "Novembro de 2025" */
export const mesAno = (ts: number): string => {
  const d = new Date(ts);
  const m = MESES[d.getMonth()];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} de ${d.getFullYear()}`;
};

export const nomeDiaSemana = (i: number) => DIAS[i];

/** Texto relativo para shows futuros: "hoje", "amanhã", "em 10 dias". */
export const quando = (ts: number): string => {
  const n = diasAte(ts);
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  if (n === -1) return 'ontem';
  if (n > 1) return `em ${n} dias`;
  const anos = Math.floor(-n / 365);
  if (anos >= 1) return anos === 1 ? 'há 1 ano' : `há ${anos} anos`;
  const meses = Math.floor(-n / 30);
  if (meses >= 1) return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
  return `há ${-n} dias`;
};

/** Remove acentos e caixa, para busca. */
export const normalizar = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .trim();

/** Nota de 0,5 a 5 com vírgula: 4,5 · 3,0 */
export const nota = (n: number): string => n.toFixed(1).replace('.', ',');

export const plural = (n: number, um: string, varios: string): string => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;

/** Hash estável (FNV-1a) para dados de exemplo determinísticos. */
export const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Iniciais para avatar: "Marcelo Ferreira" → "MF". */
export const iniciais = (nome: string): string =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

/**
 * Nome do arquivo das imagens de compartilhar (decisão do Edmir de 09/10/2026, depois do teste de usabilidade):
 * `Livvo_Artista_DDMMAA.png`, com o nome do artista sem acentos e com `_` no lugar de espaços e símbolos.
 * Ex.: Dave Matthews Band em 11/12/2013 → `Livvo_Dave_Matthews_Band_111213.png`; Racionais MC’s → `Livvo_Racionais_MCs_010225.png`.
 */
export const nomeArquivoShow = (artista: string, data: string, extensao = 'png'): string => {
  const nome =
    artista
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['\u2019`]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Show';
  const [dd = '00', mm = '00', aaaa = '0000'] = data.split('/');
  return `Livvo_${nome}_${dd.padStart(2, '0')}${mm.padStart(2, '0')}${aaaa.slice(-2)}.${extensao}`;
};
