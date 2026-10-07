import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useCatalogo } from '../data/catalog';
import { nota } from '../format';
import { Link } from '../router';
import { calcularPassaporte } from '../stats';
import { livvo, useLivvo } from '../store';
import { CaixaData, Discos, TagProxima } from '../ui';
import { ResumoPassaporte } from './Inicio';

/**
 * Minha História — versão provisória da parte 1: números do Passaporte e a lista de memórias.
 * Na parte 3 vira o Passaporte completo (credencial, abas Ingressos, Números, Coleção, Agenda e Listas).
 */
export const MinhaHistoria: React.FC = () => {
  const { catalogo } = useCatalogo();
  const lv = useLivvo();
  const pass = useMemo(() => calcularPassaporte(lv.memorias, catalogo), [lv.memorias, catalogo]);

  const porAno = useMemo(() => {
    const grupos: Array<{ ano: string; itens: typeof pass.memoriasComShow }> = [];
    pass.memoriasComShow.forEach((x) => {
      const ano = x.show.data.slice(-4);
      const g = grupos[grupos.length - 1];
      if (g && g.ano === ano) g.itens.push(x);
      else grupos.push({ ano, itens: [x] });
    });
    return grupos;
  }, [pass]);

  if (!lv.logado) {
    return (
      <div className="lv-card p-8 text-center max-w-xl mx-auto">
        <h1 className="lv-h2">Sua história começa aqui.</h1>
        <p className="lv-sub mt-2">Entre para guardar os shows que você viveu e ver o seu Passaporte crescer.</p>
        <button type="button" className="lv-btn lv-btn--cyan mt-6" onClick={() => livvo.entrar()}>
          Entrar no Livvo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[880px]">
      <div className="lv-kicker lv-kicker--cyan">Minha História</div>
      <h1 className="lv-h1 mt-1">Seu Passaporte</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="lv-meta">Versão provisória. Credencial, coleção e números completos chegam na</span>
        <TagProxima parte={3} />
      </div>

      {!catalogo ? (
        <div className="lv-skel mt-6" style={{ height: 220 }} aria-busy="true" />
      ) : pass.shows === 0 ? (
        <div className="lv-card mt-6 p-8 text-center">
          <h2 className="lv-h2">Nenhum show por aqui ainda.</h2>
          <p className="lv-sub mt-2">Comece pelo último show que você viu. Os antigos contam também.</p>
          <Link to="/registrar" className="lv-btn lv-btn--cyan mt-6">
            <Plus className="w-4 h-4" strokeWidth={3} /> Registrar show
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <ResumoPassaporte pass={pass} lv={lv} semLink />
          </div>
          {porAno.map((g) => (
            <section key={g.ano} aria-label={g.ano}>
              <div className="lv-divider-month">
                <h2 className="lv-num text-[22px] text-[#ECE5D1]">{g.ano}</h2>
                <span className="lv-meta">{g.itens.length === 1 ? '1 show' : `${g.itens.length} shows`}</span>
              </div>
              <div className="lv-card p-1.5">
                {g.itens.map(({ memoria, show }) => (
                  <Link key={memoria.id} to={`/show/${show.id}`} className="lv-row2">
                    <CaixaData ts={show.ts} />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-[14.5px] truncate">{show.artista}</div>
                      <div className="lv-meta truncate">
                        {show.casa} · {show.cidade}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {memoria.notaShow !== undefined ? (
                        <span className="inline-flex items-center gap-2">
                          <Discos valor={memoria.notaShow} tamanho={13} rotulo="Nota do show" className="hidden sm:inline-flex" />
                          <span className="lv-nota-num text-[15px]">{nota(memoria.notaShow)}</span>
                        </span>
                      ) : (
                        <span className="lv-tag lv-tag--next">Sem nota</span>
                      )}
                      {memoria.notaOrganizacao === undefined && <div className="lv-meta mt-1 text-[11.5px]">Falta a organização</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
};
