import React, { useState } from 'react';
import { AtSign, ChevronDown, MapPin, Music, X } from 'lucide-react';
import { PERSONALIZACAO_PADRAO, type Personalizacao } from './store';
import { IconeIngressoNota as IconeNota, NotaIngresso } from './ui';

/**
 * Painel "Personalizar" da memória (revisão 5, 07/10/2026). Abre na coluna da direita da página do show,
 * no lugar das informações, com as opções em linhas que abrem e fecham (drop box), como no Livvo Virtual Poster (A).
 * A prévia é ao vivo no pôster/ingresso da esquerda; nada é gravado até "Salvar".
 *
 * 09/10/2026 (decisão do Edmir depois do teste de usabilidade com a Gabriela): no app ficam só faixa, setor,
 * com quem, a nota, o @ e a casa de show. Carimbo de presença, cor, fonte, tamanho e posição do nome e a frase
 * ficam só no Estúdio (ver CAMPOS_SO_NO_ESTUDIO em store.ts).
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
  rascunho: RascunhoPersonalizacao;
  mudar: (r: RascunhoPersonalizacao) => void;
  salvar: () => void;
  fechar: () => void;
  alterado: boolean;
  comQuem: string[];
  /** Notas já dadas a este show; sem nenhuma, a linha "Nota no card" não aparece. */
  notas: { show?: number; organizacao?: number };
}> = ({ rascunho, mudar, salvar, fechar, alterado, comQuem, notas }) => {
  const [aberta, setAberta] = useState<string | null>('faixa');
  const alternar = (id: string) => setAberta((a) => (a === id ? null : id));
  const p = rascunho.perso;
  const set = (patch: Partial<Personalizacao>) => mudar({ ...rascunho, perso: { ...p, ...patch } });
  const temNota = Boolean(notas.show || notas.organizacao);

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

      <div className="lv-group mt-5">Memória do show</div>
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
      {temNota && (
        <Linha id="nota" aberta={aberta} alternar={alternar} icone={<IconeNota />} titulo="Nota no card" valor={p.mostrarNota ? 'Mostrar' : 'Esconder'}>
          <Interruptor
            rotulo="Mostrar a nota"
            desc="No ingresso e nas imagens de compartilhar."
            ligado={p.mostrarNota}
            mudar={(mostrarNota) => set({ mostrarNota })}
          />
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5">
            {notas.show ? (
              <span className="inline-flex items-center gap-2">
                <span className="lv-label">Show</span>
                <NotaIngresso valor={notas.show} tamanho={13} rotulo="Nota do show" />
              </span>
            ) : null}
            {notas.organizacao ? (
              <span className="inline-flex items-center gap-2">
                <span className="lv-label">Organização</span>
                <NotaIngresso valor={notas.organizacao} tamanho={13} rotulo="Nota da organização" />
              </span>
            ) : null}
          </div>
        </Linha>
      )}

      <div className="lv-group mt-6">Identificação</div>
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
