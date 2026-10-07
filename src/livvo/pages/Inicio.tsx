import React, { useMemo } from 'react';
import { ArrowRight, Compass, History, Plus } from 'lucide-react';
import { ehFuturo, useCatalogo, type Catalogo, type Show } from '../data/catalog';
import { atividadeExemplo } from '../data/social';
import { dataCartao, dataCurta, dataLonga, dataParaTs, diasAte, hojeTs, nota, plural, quando } from '../format';
import { Link } from '../router';
import { calcularPassaporte, type Passaporte } from '../stats';
import { livvo, useLivvo, type Livvo } from '../store';
import { Avatar, CaixaData, CardShow, Discos, Picotes, Poster, TagExemplo, avisar } from '../ui';

/* Cartão de momento: um só pedido por vez ---------------------------------------------
 * Prioridade (plano de fusão, 6.4): amanhã tem show → como foi? → neste dia → faltam poucos dias
 * → complete essa história.
 */

type Momento =
  | { tipo: 'amanha'; show: Show }
  | { tipo: 'como_foi'; show: Show }
  | { tipo: 'neste_dia'; show: Show; anos: number }
  | { tipo: 'contagem'; show: Show; dias: number }
  | { tipo: 'completar'; show: Show; memoriaId: string; faltam: number };

const escolherMomento = (lv: Livvo, cat: Catalogo, pass: Passaporte): Momento | null => {
  const comInteresse = Object.keys(lv.interesses)
    .map((id) => cat.porId.get(id))
    .filter((s): s is Show => Boolean(s))
    .sort((a, b) => a.ts - b.ts);

  const amanha = comInteresse.find((s) => diasAte(s.ts) === 1);
  if (amanha) return { tipo: 'amanha', show: amanha };

  const comoFoi = comInteresse.find((s) => diasAte(s.ts) <= 0 && diasAte(s.ts) >= -3 && !lv.memoriaDoShow(s.id));
  if (comoFoi) return { tipo: 'como_foi', show: comoFoi };

  const hoje = new Date(hojeTs());
  const aniversario = pass.memoriasComShow.find(({ show }) => {
    const d = new Date(show.ts);
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() < hoje.getFullYear();
  });
  if (aniversario) return { tipo: 'neste_dia', show: aniversario.show, anos: hoje.getFullYear() - new Date(aniversario.show.ts).getFullYear() };

  const perto = comInteresse.find((s) => diasAte(s.ts) > 1 && diasAte(s.ts) <= 3);
  if (perto) return { tipo: 'contagem', show: perto, dias: diasAte(perto.ts) };

  const pendente = pass.semNotaOrganizacao[0];
  if (pendente) return { tipo: 'completar', show: pendente.show, memoriaId: pendente.memoria.id, faltam: pass.semNotaOrganizacao.length };

  return null;
};

const CartaoMomento: React.FC<{ m: Momento }> = ({ m }) => {
  const { show } = m;
  const titulo =
    m.tipo === 'amanha'
      ? `Amanhã tem ${show.artista}`
      : m.tipo === 'como_foi'
        ? `Como foi ${show.artista}?`
        : m.tipo === 'neste_dia'
          ? `Neste dia, há ${m.anos === 1 ? '1 ano' : `${m.anos} anos`}`
          : m.tipo === 'contagem'
            ? `Faltam ${m.dias} dias para ${show.artista}`
            : 'Complete essa história';
  const kicker =
    m.tipo === 'completar' ? 'Falta pouco' : m.tipo === 'neste_dia' ? 'Neste dia' : m.tipo === 'como_foi' ? 'Ontem teve show' : 'Sua agenda';

  return (
    <section className="lv-tix lv-tix--h" aria-label="Momento">
      <div className="lv-tix-body lv-stage flex gap-4 sm:gap-5">
        <div className="w-[92px] sm:w-[120px] shrink-0">
          <Poster show={show} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="lv-kicker lv-kicker--cyan">{kicker}</div>
          <h2 className="lv-h2 mt-1.5">{titulo}</h2>
          {m.tipo === 'neste_dia' ? (
            <p className="lv-sub mt-1.5">
              <b className="text-[#ECE5D1]">{show.artista}</b> · {show.casa} · {show.cidade}. Você estava lá.
            </p>
          ) : m.tipo === 'completar' ? (
            <p className="lv-sub mt-1.5">
              Que nota você dá à organização do show de <b className="text-[#ECE5D1]">{show.artista}</b> ({show.casa}, {dataCurta(show.ts)})?
            </p>
          ) : (
            <p className="lv-sub mt-1.5">
              {show.casa} · {show.cidade} · {dataCurta(show.ts)}
            </p>
          )}
        </div>
      </div>
      <div className="lv-tix-stub">
        {m.tipo === 'completar' ? (
          <>
            <div className="lv-kicker">Nota da organização</div>
            <div className="mt-2">
              <Discos
                rotulo={`Nota da organização para ${show.artista}`}
                tamanho={28}
                onChange={(v) => {
                  livvo.atualizar(m.memoriaId, { notaOrganizacao: v });
                  avisar(`Organização: ${nota(v)}. Próxima memória`);
                }}
              />
            </div>
            <p className="lv-meta mt-2">{m.faltam > 1 ? `${m.faltam} memórias sem essa nota` : 'É a última que falta'}</p>
          </>
        ) : m.tipo === 'como_foi' ? (
          <Link to={`/show/${show.id}`} className="lv-btn lv-btn--cyan">
            Eu fui
          </Link>
        ) : (
          <Link to={`/show/${show.id}`} className="lv-ghost">
            {m.tipo === 'neste_dia' ? 'Ver memória' : 'Ver show'} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  );
};

/* Resumo do Passaporte ------------------------------------------------------------------ */

export const ResumoPassaporte: React.FC<{ pass: Passaporte; lv: Livvo; semLink?: boolean }> = ({ pass, lv, semLink }) => (
  <section className="lv-card overflow-hidden" aria-label="Seu Passaporte">
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Avatar nome={lv.perfil.nome} tamanho={46} />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[15px] truncate">{lv.perfil.nome}</div>
          <div className="lv-meta">
            @{lv.perfil.usuario} · No Livvo desde {(() => {
              const d = dataCartao(dataParaTs(lv.perfil.noLivvoDesde));
              return `${d.mes} ${d.ano}`;
            })()}
          </div>
        </div>
        <span className="lv-tag lv-tag--cream">{pass.faixa}</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          [pass.shows, 'Shows'],
          [pass.artistas, 'Artistas'],
          [pass.cidades, 'Cidades'],
        ].map(([n, r]) => (
          <div key={r as string}>
            <div className="lv-num text-[44px] sm:text-[52px] text-[#ECE5D1]">{n}</div>
            <div className="lv-kicker mt-1.5">{r}</div>
          </div>
        ))}
      </div>
      {pass.proximaFaixa && (
        <div className="mt-6">
          <Picotes total={24} feitos={Math.round(pass.progresso * 24)} />
          <p className="lv-meta mt-2">
            {pass.faltam === 1
              ? `Mais 1 show na sua história e você chega ao ${pass.proximaFaixa}.`
              : `Mais ${pass.faltam} shows na sua história e você chega ao ${pass.proximaFaixa}.`}{' '}
            Shows antigos contam.
          </p>
        </div>
      )}
    </div>
    <div className="border-t border-dashed border-[#3A3159] px-5 sm:px-6 py-3 flex items-center justify-between gap-3">
      {pass.artistaMaisVisto ? (
        <span className="lv-meta truncate">
          Mais visto: <b className="text-[#ECE5D1]">{pass.artistaMaisVisto.nome}</b>, {pass.artistaMaisVisto.vezes} vezes
        </span>
      ) : (
        <span />
      )}
      {!semLink && (
        <Link to="/minha-historia" className="lv-link shrink-0">
          Minha História <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  </section>
);

/* Missões de memória (completar o que foi vivido, nunca "vá a mais shows") ----------------- */

const Missoes: React.FC<{ pass: Passaporte; lv: Livvo }> = ({ pass, lv }) => {
  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const feitas = Math.min(3, lv.notasOrgNoMes.length);
  const primeira = pass.semNotaOrganizacao[0];
  return (
    <section className="lv-section" aria-label="Missões de memória">
      <div className="lv-section-head">
        <h2 className="lv-h2">Missões de {mes}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="lv-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="lv-h3">Avalie a organização de 3 shows</div>
              <p className="lv-meta mt-1">Ajuda o próximo fã que vai à mesma casa.</p>
            </div>
            <span className="lv-num text-[22px] text-[#4FDCDE] shrink-0">{feitas}/3</span>
          </div>
          <Picotes total={3} feitos={feitas} className="mt-4" />
          {feitas < 3 && primeira && (
            <Link to={`/show/${primeira.show.id}?avaliar=org`} className="lv-link mt-4">
              Começar por {primeira.show.artista} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {feitas >= 3 && <p className="text-[13px] font-bold text-[#4FDCDE] mt-4">Missão cumprida.</p>}
        </div>
        <div className="lv-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="lv-h3">Resgate um show antigo</div>
              <p className="lv-meta mt-1">
                {pass.primeiroShow
                  ? `Seu primeiro show registrado é de ${new Date(pass.primeiroShow.ts).getFullYear()}. Teve algum antes?`
                  : 'Comece pelo primeiro show que você lembra.'}
              </p>
            </div>
            <History className="w-6 h-6 text-[#4FDCDE] shrink-0" />
          </div>
          <Link to="/registrar" className="lv-link mt-4">
            Procurar pelo artista <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

/* Agenda --------------------------------------------------------------------------------- */

const Agenda: React.FC<{ cat: Catalogo; lv: Livvo }> = ({ cat, lv }) => {
  const itens = Object.entries(lv.interesses)
    .map(([id, tipo]) => ({ show: cat.porId.get(id), tipo }))
    .filter((x): x is { show: Show; tipo: 'quero_ir' | 'tenho_ingresso' } => Boolean(x.show) && ehFuturo(x.show!))
    .sort((a, b) => a.show.ts - b.show.ts);
  if (!itens.length) return null;
  return (
    <section className="lv-section" aria-label="Sua agenda">
      <div className="lv-section-head">
        <h2 className="lv-h2">Sua agenda</h2>
        {itens.some((i) => i.show.exemplo) && <TagExemplo texto="Datas de exemplo" />}
      </div>
      <div className="lv-card p-1.5">
        {itens.map(({ show, tipo }) => (
          <Link key={show.id} to={`/show/${show.id}`} className="lv-row2">
            <CaixaData ts={show.ts} />
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-[14.5px] truncate">{show.artista}</div>
              <div className="lv-meta truncate">
                {show.casa} · {show.cidade}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="lv-tag lv-tag--cyan">{tipo === 'tenho_ingresso' ? 'Tenho ingresso' : 'Quero ir'}</span>
              <div className="lv-meta mt-1">{quando(show.ts)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* Página --------------------------------------------------------------------------------- */

const Visitante: React.FC<{ cat: Catalogo | null }> = ({ cat }) => {
  const recentes = cat ? cat.shows.filter((s) => !ehFuturo(s)).slice(0, 8) : [];
  return (
    <div>
      <section className="lv-tix">
        <div className="lv-tix-body lv-stage px-5 py-10 sm:px-10 sm:py-14">
          <div className="lv-kicker lv-kicker--cyan">Registre · Avalie · Colecione</div>
          <h1 className="lv-h1 mt-3 max-w-2xl">Sua história através dos seus shows.</h1>
          <p className="lv-sub mt-4 max-w-xl">
            Registre os shows que você viveu, avalie o show e a organização, e guarde cada noite como um ingresso para colecionar e compartilhar.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" className="lv-btn lv-btn--cyan" onClick={() => livvo.entrar()}>
              Comece pela sua história
            </button>
            <Link to="/explorar" className="lv-ghost !py-[14px]">
              <Compass className="w-4 h-4" /> Explorar shows
            </Link>
          </div>
        </div>
      </section>
      <p className="lv-meta mt-3">A página de entrada completa (landing) chega na parte 4 desta prévia.</p>
      <section className="lv-section">
        <div className="lv-section-head">
          <h2 className="lv-h2">Shows recentes</h2>
          <Link to="/explorar" className="lv-link">
            Ver todos
          </Link>
        </div>
        <div className="lv-scroller">
          {recentes.map((s) => (
            <CardShow key={s.id} show={s} />
          ))}
        </div>
      </section>
    </div>
  );
};

export const Inicio: React.FC = () => {
  const { catalogo } = useCatalogo();
  const lv = useLivvo();
  const pass = useMemo(() => calcularPassaporte(lv.memorias, catalogo), [lv.memorias, catalogo]);
  const momento = useMemo(() => (catalogo ? escolherMomento(lv, catalogo, pass) : null), [lv, catalogo, pass]);
  const atividade = useMemo(() => (catalogo && lv.exemplos ? atividadeExemplo(catalogo.shows) : []), [catalogo, lv.exemplos]);

  const vemAi = useMemo(() => {
    if (!catalogo) return [];
    const vistos = new Map<string, number>();
    pass.memoriasComShow.forEach(({ show }) => vistos.set(show.artistaId, (vistos.get(show.artistaId) || 0) + 1));
    return catalogo.shows
      .filter((s) => ehFuturo(s) && vistos.has(s.artistaId) && !lv.interesses[s.id])
      .sort((a, b) => a.ts - b.ts)
      .map((s) => ({ show: s, vezes: vistos.get(s.artistaId)! }));
  }, [catalogo, pass, lv.interesses]);

  if (!lv.logado) return <Visitante cat={catalogo} />;

  const hoje = dataLonga(hojeTs());
  const primeiroNome = lv.perfil.nome.split(' ')[0];

  return (
    <div className="lv-home">
      <div className="min-w-0">
        <div className="lv-kicker">{hoje}</div>
        <h1 className="lv-h1 mt-1.5">Oi, {primeiroNome}.</h1>

        <div className="mt-6">
          {!catalogo ? (
            <div className="lv-skel" style={{ height: 168 }} aria-busy="true" />
          ) : momento ? (
            <CartaoMomento key={`${momento.tipo}-${momento.show.id}`} m={momento} />
          ) : pass.shows === 0 ? (
            <section className="lv-tix">
              <div className="lv-tix-body lv-stage p-6 sm:p-8">
                <div className="lv-kicker lv-kicker--cyan">Comece por aqui</div>
                <h2 className="lv-h2 mt-1.5">Qual foi o último show que você viu?</h2>
                <p className="lv-sub mt-2">Procure pelo artista e toque em Eu fui. Seus shows antigos contam também.</p>
                <Link to="/registrar" className="lv-btn lv-btn--cyan mt-5">
                  <Plus className="w-4 h-4" strokeWidth={3} /> Registrar meu primeiro show
                </Link>
              </div>
            </section>
          ) : null}
        </div>

        {pass.shows > 0 && (
          <div className="lv-section">
            <ResumoPassaporte pass={pass} lv={lv} />
          </div>
        )}

        {pass.shows > 0 && <Missoes pass={pass} lv={lv} />}
      </div>

      <aside className="lv-home-side min-w-0 min-[1100px]:pt-[76px]" aria-label="Agenda e atividade">
        {catalogo && <Agenda cat={catalogo} lv={lv} />}

        {vemAi.length > 0 && (
          <section className="lv-section" aria-label="Vem aí">
            <div className="lv-section-head">
              <h2 className="lv-h2">Vem aí</h2>
              <TagExemplo texto="Datas de exemplo" />
            </div>
            <div className="lv-card p-1.5">
              {vemAi.slice(0, 4).map(({ show, vezes }) => (
                <Link key={show.id} to={`/show/${show.id}`} className="lv-row2">
                  <CaixaData ts={show.ts} />
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-[14.5px] truncate">{show.artista}</div>
                    <div className="lv-meta truncate">
                      {show.casa} · {show.cidade}
                    </div>
                    <div className="text-[12px] font-bold text-[#4FDCDE] mt-0.5">Você viu {vezes === 1 ? '1 vez' : `${vezes} vezes`}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="lv-section" aria-label="Atividade">
          <div className="lv-section-head">
            <h2 className="lv-h2">Quem você segue</h2>
            {atividade.length > 0 && <TagExemplo />}
          </div>
          {atividade.length > 0 ? (
            <div className="lv-card p-1.5">
              {atividade.map(({ pessoa, show, notaShow, horas }) => (
                <Link key={`${pessoa.usuario}-${show.id}`} to={`/show/${show.id}`} className="lv-row2 !items-start">
                  <Avatar nome={pessoa.nome} tamanho={38} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] leading-snug">
                      <b>{pessoa.nome}</b> registrou <b>{show.artista}</b>
                    </div>
                    <div className="lv-meta truncate mt-0.5">
                      {show.casa} · há {horas} h
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="lv-kicker !text-[10.5px]">Show</span>
                      <Discos valor={notaShow} tamanho={13} rotulo="Nota do show" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="lv-card p-5">
              <p className="lv-sub">Siga quem foi aos mesmos shows que você e veja o que essas pessoas estão vivendo.</p>
              <Link to="/explorar?fui=1" className="lv-link mt-3">
                Ver os shows em que você foi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
};
