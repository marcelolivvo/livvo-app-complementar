import { hash } from '../format';
import type { Show } from './catalog';
import type { Memoria } from '../store';
import { DIMENSOES, PESSOAS_EXEMPLO, RESENHA_ORGANIZACAO, RESENHA_SHOW, type DimensaoId, type PessoaExemplo } from './demo';

/**
 * Comunidade de EXEMPLO, gerada de forma determinística a partir do ID do show.
 * Serve só para mostrar como as telas ficam com gente dentro; tudo aparece marcado "exemplo"
 * e pode ser desligado no menu da conta (para ver os estados vazios reais).
 */

/** Amostra mínima para mostrar notas médias na prévia (proposta; o plano sugere 30 para relatórios B2B). */
export const MIN_AMOSTRA_NOTAS = 3;

const CASAS_GRANDES = /est[aá]dio|allianz|morumb|arena|parque|campo de marte|jockey|aut[oó]dromo|maracan|mineir|fonte nova|nilton santos|memorial/i;

const rnd = (seed: string, n: number) => hash(`${seed}:${n}`);

export interface ResenhaExemplo {
  pessoa: PessoaExemplo;
  notaShow: number;
  notaOrganizacao: number;
  dimensoes: Array<{ id: DimensaoId; rotulo: string; positiva: boolean }>;
  texto: string;
  setor?: string;
}

export interface SocialShow {
  /** Quantas pessoas registraram (passado) ou querem ir (futuro). Inclui você, se for o caso. */
  registros: number;
  pessoas: PessoaExemplo[];
  resenhas: ResenhaExemplo[];
  media?: { show: number; organizacao: number; amostra: number };
  dimensoesMaisCitadas: Array<{ rotulo: string; positiva: boolean }>;
}

const VAZIO: SocialShow = { registros: 0, pessoas: [], resenhas: [], dimensoesMaisCitadas: [] };

const meia = (v: number) => Math.round(v * 2) / 2;

export const socialDoShow = (show: Show, exemplos: boolean, minha?: Memoria): SocialShow => {
  const minhaConta = minha ? 1 : 0;
  if (!exemplos) {
    const media =
      minha?.notaShow !== undefined && minha?.notaOrganizacao !== undefined && MIN_AMOSTRA_NOTAS <= 1
        ? { show: minha.notaShow, organizacao: minha.notaOrganizacao, amostra: 1 }
        : undefined;
    return { ...VAZIO, registros: minhaConta, media };
  }

  const h = rnd(show.id, 0);
  const grande = CASAS_GRANDES.test(show.casa);
  // ~1 em 5 shows fica sem ninguém (para mostrar o estado "seja a primeira pessoa")
  if (h % 5 === 0 && !show.exemplo) return { ...VAZIO, registros: minhaConta };
  const base = grande ? 40 + (h % 260) : 2 + (h % 46);
  const registros = base + minhaConta;

  const qtdPessoas = Math.min(PESSOAS_EXEMPLO.length, Math.min(base, 3 + (rnd(show.id, 1) % 6)));
  const inicio = rnd(show.id, 2) % PESSOAS_EXEMPLO.length;
  const pessoas = Array.from({ length: qtdPessoas }, (_, i) => PESSOAS_EXEMPLO[(inicio + i * 3) % PESSOAS_EXEMPLO.length]!);

  if (show.exemplo) return { registros, pessoas, resenhas: [], dimensoesMaisCitadas: [] };

  const qtdResenhas = Math.min(pessoas.length, base >= 3 ? 1 + (rnd(show.id, 3) % 3) : 0);
  const resenhas: ResenhaExemplo[] = pessoas.slice(0, qtdResenhas).map((pessoa, i) => {
    const r = rnd(show.id, 10 + i);
    const notaShow = meia(3.5 + (r % 4) * 0.5); // 3,5 a 5
    const notaOrganizacao = meia(2 + ((r >>> 3) % 7) * 0.5); // 2 a 5
    const d1 = DIMENSOES[(r >>> 5) % DIMENSOES.length]!;
    const d2 = DIMENSOES[(r >>> 9) % DIMENSOES.length]!;
    const dims = [d1, d2]
      .filter((d, k, arr) => arr.findIndex((x) => x.id === d.id) === k)
      .map((d) => ({ id: d.id, rotulo: d.rotulo, positiva: notaOrganizacao >= 3.5 }));
    const texto = `${RESENHA_SHOW[r % RESENHA_SHOW.length]} ${RESENHA_ORGANIZACAO[(r >>> 4) % RESENHA_ORGANIZACAO.length]}`;
    const setores = grande ? ['Pista', 'Pista Premium', 'Cadeira inferior', 'Arquibancada'] : ['Pista', 'Mezanino', 'Camarote'];
    return { pessoa, notaShow, notaOrganizacao, dimensoes: dims, texto, setor: setores[(r >>> 7) % setores.length] };
  });

  // Notas médias: resenhas + avaliações sem texto (amostra) + a sua, se houver.
  const amostraExtra = Math.max(0, Math.floor(base * 0.4));
  const amostra = resenhas.length + amostraExtra + (minha?.notaShow !== undefined ? 1 : 0);
  let media: SocialShow['media'];
  if (amostra >= MIN_AMOSTRA_NOTAS && resenhas.length) {
    const ms = resenhas.reduce((s, x) => s + x.notaShow, 0) / resenhas.length;
    const mo = resenhas.reduce((s, x) => s + x.notaOrganizacao, 0) / resenhas.length;
    const ajusteShow = ((rnd(show.id, 4) % 5) - 2) * 0.1;
    const ajusteOrg = ((rnd(show.id, 5) % 5) - 2) * 0.1;
    media = {
      show: Math.min(5, Math.max(1, ms + ajusteShow)),
      organizacao: Math.min(5, Math.max(1, mo + ajusteOrg)),
      amostra,
    };
  }

  const contagem = new Map<string, { rotulo: string; pos: number; neg: number }>();
  resenhas.forEach((r) =>
    r.dimensoes.forEach((d) => {
      const c = contagem.get(d.id) || { rotulo: d.rotulo, pos: 0, neg: 0 };
      if (d.positiva) c.pos++;
      else c.neg++;
      contagem.set(d.id, c);
    }),
  );
  const dimensoesMaisCitadas = Array.from(contagem.values())
    .sort((a, b) => b.pos + b.neg - (a.pos + a.neg))
    .slice(0, 3)
    .map((c) => ({ rotulo: c.rotulo, positiva: c.pos >= c.neg }));

  return { registros, pessoas, resenhas, media, dimensoesMaisCitadas };
};

/** Atividade de exemplo para o Início: pessoas fictícias registrando shows recentes do catálogo. */
export const atividadeExemplo = (shows: Show[], quantidade = 3) => {
  const passados = shows.filter((s) => !s.exemplo).slice(0, 60);
  if (!passados.length) return [];
  const dia = new Date().toDateString();
  return Array.from({ length: quantidade }, (_, i) => {
    const r = rnd(dia, i);
    const show = passados[(r % passados.length + i * 7) % passados.length]!;
    const pessoa = PESSOAS_EXEMPLO[(r >>> 3) % PESSOAS_EXEMPLO.length]!;
    return { pessoa, show, notaShow: meia(3.5 + ((r >>> 6) % 4) * 0.5), horas: 1 + ((r >>> 9) % 20) };
  });
};
