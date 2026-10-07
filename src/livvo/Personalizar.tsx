import React, { useState } from 'react';
import { AtSign, Award, ChevronDown, MapPin, Music, Palette, Quote, Ruler, Rows3, Type, X } from 'lucide-react';
import type { Show } from './data/catalog';
import { PERSONALIZACAO_PADRAO, type Personalizacao } from './store';
import { COR_DESTAQUE, ROTULO_CARIMBO, nomeAceitaRaydis } from './ui';

/**
 * Painel "Personalizar" da memória (revisão 5, 07/10/2026). Abre na coluna da direita da página do show,
 * no lugar das informações, com as opções em linhas que abrem e fecham (drop box), como no Livvo Virtual Poster (A).
 * A prévia é ao vivo no pôster/ingresso da esquerda; nada é gravado até "Salvar".
 */

export interface RascunhoPersonalizacao {
  perso: Personalizacao;
  setor: string;
}

const SETORES = ['Pista', 'Pista premium', 'Cadeira', 'Arquibancada', 'Camarote', 'Backstage'];

const Linha: React.FC<{
  id: string;
  aberta: string | null;
  alternar: (id: string) => void;
  icone: React.ReactNode;
  titulo: string;
  valor: string;
  children: React.ReactNode;
}> = ({ id, aberta, alternar, icone, titulo, valor, children }) => {
  const on = aberta === id;
  return (
    <div className="lv-row" data-open={on}>
      <button type="button" className="lv-row-head" aria-expanded={on} aria-controls={`perso-${id}`} onClick={() => alternar(id)}>
        <div>
          <div className="lv-row-icon">{icone}</div>
          <div>
            <span className="lv-row-title">{titulo}</span>
          </div>
        </div>
        <div>
          <span className="lv-row-val">{valor}</span>
          <ChevronDown className="lv-row-chev" />
        </div>
      </button>
      {on && (
        <div className="lv-row-body" id={`perso-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
};

const Opcoes = <T extends string>({
  opcoes,
  valor,
  mudar,
  colunas = 3,
}: {
  opcoes: { id: T; rotulo: string; desc?: string; desligada?: boolean; titulo?: string }[];
  valor: T;
  mudar: (v: T) => void;
  colunas?: 2 | 3;
}) => (
  <div className={`grid gap-2 ${colunas === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
    {opcoes.map((o) => (
      <button
        key={o.id}
        type="button"
        className="lv-opt p-2.5 text-left disabled:opacity-40 disabled:cursor-not-allowed"
        data-on={valor === o.id}
        aria-pressed={valor === o.id}
        disabled={o.desligada}
        title={o.titulo}
        onClick={() => mudar(o.id)}
      >
        <span className="text-[12.5px] font-bold text-[#ECE5D1] block">{o.rotulo}</span>
        {o.desc && <span className="text-[11px] text-[#8A8577] block mt-0.5 leading-snug">{o.desc}</span>}
      </button>
    ))}
  </div>
);

const Interruptor: React.FC<{ rotulo: string; ligado: boolean; mudar: (v: boolean) => void; desc?: string }> = ({ rotulo, ligado, mudar, desc }) => (
  <label className="flex items-center justify-between gap-3 py-2 cursor-pointer select-none">
    <span>
      <span className="block text-[13px] font-bold text-[#ECE5D1]">{rotulo}</span>
      {desc && <span className="block lv-meta">{desc}</span>}
    </span>
    <input type="checkbox" className="w-4 h-4 accent-[#4FDCDE] cursor-pointer" checked={ligado} onChange={(e) => mudar(e.target.checked)} />
  </label>
);

export const PainelPersonalizar: React.FC<{
  show: Pick<Show, 'artista'>;
  rascunho: RascunhoPersonalizacao;
  mudar: (r: RascunhoPersonalizacao) => void;
  salvar: () => void;
  fechar: () => void;
  alterado: boolean;
  comQuem: string[];
}> = ({ show, rascunho, mudar, salvar, fechar, alterado, comQuem }) => {
  const [aberta, setAberta] = useState<string | null>('carimbo');
  const alternar = (id: string) => setAberta((a) => (a === id ? null : id));
  const p = rascunho.perso;
  const set = (patch: Partial<Personalizacao>) => mudar({ ...rascunho, perso: { ...p, ...patch } });
  const raydisOk = nomeAceitaRaydis(show.artista);
  const tamanhos = { p: 'Pequeno', m: 'Médio', g: 'Grande' } as const;
  const posicoes = { cima: 'Em cima', meio: 'No meio', baixo: 'Embaixo' } as const;
  const fontes = { alfa: 'Alfa Slab One', barlow: 'Barlow', raydis: 'RAYDIS' } as const;
  const cores = { ciano: 'Ciano', teal: 'Teal', offwhite: 'Off-white' } as const;

  return (
    <section aria-label="Personalizar" className="lv-perso">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="lv-eyebrow !text-[#4FDCDE]">Personalizar</div>
          <p className="lv-meta mt-1">A prévia muda ao vivo. Vale para o pôster, a Carteira e as imagens de compartilhar. Pôster ou Ingresso fica acima da foto.</p>
        </div>
        <button type="button" className="lv-iconbtn shrink-0" aria-label="Fechar personalização" onClick={fechar}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="lv-group mt-5">Carimbo</div>
      <Linha id="carimbo" aberta={aberta} alternar={alternar} icone={<Award />} titulo="Carimbo de presença" valor={ROTULO_CARIMBO[p.carimbo]}>
        <Opcoes
          valor={p.carimbo}
          mudar={(carimbo) => set({ carimbo })}
          opcoes={[
            { id: 'nenhum', rotulo: 'Sem carimbo', desc: 'Padrão' },
            { id: 'eu_fui', rotulo: 'Eu fui', desc: 'Presença registrada' },
            { id: 'show_da_minha_vida', rotulo: 'Show da minha vida', desc: 'Memória inesquecível' },
          ]}
        />
      </Linha>

      <div className="lv-group mt-6">Memória do show</div>
      <Linha
        id="faixa"
        aberta={aberta}
        alternar={alternar}
        icone={<Music />}
        titulo="Faixa, setor e com quem"
        valor={[p.faixa.trim(), rascunho.setor].filter(Boolean).join(' · ') || 'Nada ainda'}
      >
        <label className="lv-campo">
          <span className="lv-label">Faixa marcante</span>
          <input className="lv-input" type="text" maxLength={40} value={p.faixa} placeholder="A música que ficou" onChange={(e) => set({ faixa: e.target.value })} />
        </label>
        <div className="lv-label mt-4">Setor</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SETORES.map((s) => (
            <button
              key={s}
              type="button"
              className="lv-opt px-2.5 py-1.5 text-[12px] font-bold"
              data-on={rascunho.setor === s}
              aria-pressed={rascunho.setor === s}
              onClick={() => mudar({ ...rascunho, setor: rascunho.setor === s ? '' : s })}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Interruptor rotulo="Mostrar o setor no card" ligado={p.mostrarSetor} mudar={(mostrarSetor) => set({ mostrarSetor })} />
          <Interruptor
            rotulo="Mostrar com quem fui"
            desc={comQuem.length ? comQuem.map((u) => `@${u}`).join(', ') : 'Marque seus Concert Buddies em "Foi com alguém?"'}
            ligado={p.mostrarComQuem}
            mudar={(mostrarComQuem) => set({ mostrarComQuem })}
          />
        </div>
      </Linha>

      <div className="lv-group mt-6">Texto e tipografia</div>
      <Linha id="fonte" aberta={aberta} alternar={alternar} icone={<Type />} titulo="Fonte do nome" valor={fontes[p.fonte]}>
        <Opcoes
          valor={p.fonte}
          mudar={(fonte) => set({ fonte })}
          opcoes={[
            { id: 'alfa', rotulo: 'Alfa Slab One', desc: 'Títulos da marca' },
            { id: 'barlow', rotulo: 'Barlow', desc: 'Caixa alta, mais compacta' },
            {
              id: 'raydis',
              rotulo: 'RAYDIS',
              desc: raydisOk ? 'Display da marca' : 'Só para nomes sem acento',
              desligada: !raydisOk,
              titulo: raydisOk ? undefined : 'A RAYDIS não tem acentos',
            },
          ]}
        />
      </Linha>
      <Linha id="tamanho" aberta={aberta} alternar={alternar} icone={<Ruler />} titulo="Tamanho do nome" valor={tamanhos[p.tamanho]}>
        <Opcoes
          valor={p.tamanho}
          mudar={(tamanho) => set({ tamanho })}
          opcoes={[
            { id: 'p', rotulo: 'Pequeno', desc: '80%' },
            { id: 'm', rotulo: 'Médio', desc: '90%' },
            { id: 'g', rotulo: 'Grande', desc: '100% (padrão)' },
          ]}
        />
        <p className="lv-meta mt-2">O nome nunca é cortado no meio: se não cabe, a palavra seguinte vai para a linha de baixo.</p>
      </Linha>
      <Linha id="posicao" aberta={aberta} alternar={alternar} icone={<Rows3 />} titulo="Posição do nome" valor={posicoes[p.posicao]}>
        <Opcoes
          valor={p.posicao}
          mudar={(posicao) => set({ posicao })}
          opcoes={[
            { id: 'cima', rotulo: 'Em cima', desc: 'Abaixo do logo' },
            { id: 'meio', rotulo: 'No meio', desc: 'Centro do card' },
            { id: 'baixo', rotulo: 'Embaixo', desc: 'Padrão' },
          ]}
        />
      </Linha>
      <Linha id="frase" aberta={aberta} alternar={alternar} icone={<Quote />} titulo="Frase no alto" valor={p.frase.trim() || 'Sem frase'}>
        <label className="lv-campo">
          <span className="lv-label">
            <span>Frase curta</span>
            <span>{p.frase.length}/28</span>
          </span>
          <input className="lv-input" type="text" maxLength={28} value={p.frase} placeholder="Ex.: Primeira fila" onChange={(e) => set({ frase: e.target.value })} />
        </label>
      </Linha>

      <div className="lv-group mt-6">Cor e identificação</div>
      <Linha id="cor" aberta={aberta} alternar={alternar} icone={<Palette />} titulo="Cor de destaque" valor={cores[p.cor]}>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(cores) as (keyof typeof cores)[]).map((c) => (
            <button key={c} type="button" className="lv-opt p-2.5 flex items-center gap-2" data-on={p.cor === c} aria-pressed={p.cor === c} onClick={() => set({ cor: c })}>
              <span className="w-4 h-4 rounded-full shrink-0 border border-[#3A3159]" style={{ background: COR_DESTAQUE[c] }} />
              <span className="text-[12.5px] font-bold text-[#ECE5D1]">{cores[c]}</span>
            </button>
          ))}
        </div>
        <p className="lv-meta mt-2">Casa de show, frase, faixa e o traço sob o nome.</p>
      </Linha>
      <Linha id="usuario" aberta={aberta} alternar={alternar} icone={<AtSign />} titulo="Seu @ no card" valor={p.mostrarUsuario ? 'Mostrar' : 'Esconder'}>
        <Interruptor rotulo="Mostrar o @ sob o logo" ligado={p.mostrarUsuario} mudar={(mostrarUsuario) => set({ mostrarUsuario })} />
      </Linha>
      <Linha id="casa" aberta={aberta} alternar={alternar} icone={<MapPin />} titulo="Casa de show" valor={p.mostrarCasa ? 'Mostrar' : 'Esconder'}>
        <Interruptor rotulo="Mostrar a casa de show" ligado={p.mostrarCasa} mudar={(mostrarCasa) => set({ mostrarCasa })} />
      </Linha>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="lv-btn lv-btn--teal" onClick={salvar} disabled={!alterado}>
          Salvar
        </button>
        <button type="button" className="lv-ghost !py-[13px]" onClick={fechar}>
          {alterado ? 'Descartar e fechar' : 'Fechar'}
        </button>
        <button type="button" className="lv-link" onClick={() => mudar({ perso: { ...PERSONALIZACAO_PADRAO, formato: p.formato }, setor: rascunho.setor })}>
          Voltar ao padrão
        </button>
      </div>
    </section>
  );
};
