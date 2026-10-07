import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, Check, Compass, Plus } from 'lucide-react';
import { ehFuturo, useCatalogo, type Catalogo, type Show } from '../data/catalog';
import { atividadeExemplo } from '../data/social';
import { dataCartao, dataCurta, dataLonga, dataParaTs, diasAte, hojeTs, nota, quando } from '../format';
import { Link } from '../router';
import { calcularPassaporte, type Passaporte } from '../stats';
import { livvo, useLivvo, type Livvo } from '../store';
import { Avatar, Bilhete, CaixaData, CardShow, Discos, Grupo, IngressoContorno, Linha, Picotes, Poster, Stub, TagExemplo, avisar } from '../ui';

/* Cartão de momento: um só pedido por vez ---------------------------------------------
 * Prioridade (plano de fusão, 6.4): amanhã tem show → como foi? → neste dia → faltam poucos dias
 * → complete essa história. Visual: ingresso em contorno ciano da Carteira do Estúdio.
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
    <IngressoContorno
      ativo
      rotulo="Momento"
      canhoto={
        <Link to={`/show/${show.id}`} aria-label={`Abrir ${show.artista}`}>
          <Poster show={show} />
        </Link>
      }
    >
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

      <div className="mt-4">
        {m.tipo === 'completar' ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Discos
              rotulo={`Nota da organização para ${show.artista}`}
              tamanho={28}
              onChange={(v) => {
                livvo.atualizar(m.memoriaId, { notaOrganizacao: v });
                avisar(`Organização: ${nota(v)}. Próxima memória`);
              }}
            />
            <span className="lv-meta">{m.faltam > 1 ? `${m.faltam} memórias sem essa nota` : 'É a última que falta'}</span>
          </div>
        ) : m.tipo === 'como_foi' ? (
          <Stub icone={Check} to={`/show/${show.id}`}>
            Eu fui
          </Stub>
        ) : (
          <Link to={`/show/${show.id}`} className="lv-link">
            {m.tipo === 'neste_dia' ? 'Ver memória' : 'Ver show'} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </IngressoContorno>
  );
};

/* Passaporte (resumo): a página de identificação da Wallet do Estúdio -------------------- */

export const textoFaltam = (pass: Passaporte) =>
  pass.proximaFaixa ? (
    <>
      Faltam <b className="text-[#ECE5D1]">{pass.faltam}</b> {pass.faltam === 1 ? 'show' : 'shows'} para o nível {pass.proximaFaixa}
    </>
  ) : (
    <>Você chegou ao nível mais alto: {pass.faixa}</>
  );

export const CamposPassaporte: React.FC<{ pass: Passaporte }> = ({ pass }) => (
  <dl className="lv-fields">
    <div>
      <dt>Shows</dt>
      <dd className="lv-num">{pass.shows}</dd>
      <span>{pass.primeiroShow ? `desde ${new Date(pass.primeiroShow.ts).getFullYear()}` : ' '}</span>
    </div>
    <div>
      <dt>Artistas</dt>
      <dd className="lv-num">{pass.artistas}</dd>
      <span title={pass.artistaMaisVisto?.nome}>{pass.artistaMaisVisto ? `mais visto: ${pass.artistaMaisVisto.nome}` : ' '}</span>
    </div>
    <div>
      <dt>Cidades</dt>
      <dd className="lv-num">{pass.cidades}</dd>
      <span>{pass.estados === 1 ? 'em 1 estado' : `em ${pass.estados} estados`}</span>
    </div>
  </dl>
);

export const ProgressoFaixa: React.FC<{ pass: Passaporte }> = ({ pass }) => (
  <div className="max-w-[620px]">
    <Picotes feitos={Math.round(pass.progresso * 24)} />
    <div className="mt-2.5 flex items-center justify-between gap-3 text-[13px] text-[#B3AE9F]">
      <span>{textoFaltam(pass)}</span>
      <span className="lv-mono text-[12px] text-[#4FDCDE]">{Math.round(pass.progresso * 100)}%</span>
    </div>
  </div>
);

const ResumoPassaporte: React.FC<{ pass: Passaporte; lv: Livvo }> = ({ pass, lv }) => {
  const desde = dataCartao(dataParaTs(lv.perfil.noLivvoDesde));
  return (
    <Bilhete
      rotulo="Seu Passaporte"
      esquerda={
        <>
          Livvo · <b>Passaporte de fã</b>
        </>
      }
      direita={
        <>
          Titular <b>@{lv.perfil.usuario}</b>
        </>
      }
    >
      <div className="lv-pad">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="lv-display lv-titulo-teal text-[26px] sm:text-[30px]">Seu Passaporte</h2>
            <p className="lv-meta mt-1">
              {lv.perfil.nome} · no Livvo desde {desde.mes.toLowerCase()} {desde.ano}
            </p>
          </div>
          <span className="lv-tag lv-tag--cream">{pass.faixa}</span>
        </div>
        <div className="mt-6">
          <CamposPassaporte pass={pass} />
        </div>
        <div className="mt-6">
          <ProgressoFaixa pass={pass} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Stub icone={BookOpen} cor="teal" to="/minha-historia">
            Minha História
          </Stub>
        </div>
      </div>
    </Bilhete>
  );
};

/* Missões de memória (completar o que foi vivido, nunca "vá a mais shows") ----------------- */

const Missoes: React.FC<{ pass: Passaporte; lv: Livvo }> = ({ pass, lv }) => {
  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const feitas = Math.min(3, lv.notasOrgNoMes.length);
  const primeira = pass.semNotaOrganizacao[0];
  return (
    <section aria-label="Missões de memória">
      <Grupo titulo={`Missões de ${mes}`} />
      <div className="lv-challenge" data-on={feitas >= 3}>
        <span className="lv-box" aria-hidden="true">
          {feitas >= 3 && <Check className="w-3.5 h-3.5" strokeWidth={3.2} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="lv-h3">Avalie a organização de 3 shows</h3>
            <span className="lv-mono text-[12px] text-[#4FDCDE] shrink-0">{feitas}/3</span>
          </div>
          <p className="lv-meta mt-1">Ajuda o próximo fã que vai à mesma casa.</p>
          <Picotes total={3} feitos={feitas} fino className="mt-3 max-w-[260px]" />
          {feitas < 3 && primeira && (
            <Link to={`/show/${primeira.show.id}?avaliar=org`} className="lv-link mt-3">
              Começar por {primeira.show.artista} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="lv-challenge" data-on="false">
        <span className="lv-box" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="lv-h3">Resgate um show antigo</h3>
          <p className="lv-meta mt-1">
            {pass.primeiroShow
              ? `Seu primeiro show registrado é de ${new Date(pass.primeiroShow.ts).getFullYear()}. Teve algum antes?`
              : 'Comece pelo primeiro show que você lembra.'}
          </p>
          <Link to="/registrar" className="lv-link mt-3">
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
    <section aria-label="Sua agenda">
      <Grupo titulo="Sua agenda" extra={itens.some((i) => i.show.exemplo) ? <TagExemplo texto="Datas de exemplo" /> : undefined} />
      {itens.map(({ show, tipo }) => (
        <Linha
          key={show.id}
          to={`/show/${show.id}`}
          inicio={<CaixaData ts={show.ts} />}
          titulo={show.artista}
          sub={`${show.casa} · ${show.cidade}`}
          nota={quando(show.ts)}
          fim={<span className="lv-tag lv-tag--cyan">{tipo === 'tenho_ingresso' ? 'Tenho ingresso' : 'Quero ir'}</span>}
        />
      ))}
    </section>
  );
};

/* Página --------------------------------------------------------------------------------- */

const Visitante: React.FC<{ cat: Catalogo | null }> = ({ cat }) => {
  const recentes = cat ? cat.shows.filter((s) => !ehFuturo(s)).slice(0, 8) : [];
  return (
    <div>
      <Bilhete
        esquerda={
          <>
            Livvo · <b>Bem-vindo</b>
          </>
        }
        direita="Nº ———"
      >
        <div className="lv-stage px-5 py-10 sm:px-10 sm:py-14">
          <div className="lv-kicker lv-kicker--cyan">Registre · Avalie · Colecione</div>
          <h1 className="lv-h1 mt-3 max-w-2xl">Sua história através dos seus shows.</h1>
          <p className="lv-sub mt-4 max-w-xl">
            Registre os shows que você viveu, avalie o show e a organização, e guarde cada noite como um ingresso para colecionar e compartilhar.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Stub icone={Plus} onClick={() => livvo.entrar()}>
              Comece pela sua história
            </Stub>
            <Stub icone={Compass} cor="cream" to="/explorar">
              Explorar shows
            </Stub>
          </div>
        </div>
      </Bilhete>
      <p className="lv-meta mt-3">A página de entrada completa (landing) chega na parte 4 desta prévia.</p>
      <Grupo
        titulo="Shows recentes"
        extra={
          <Link to="/explorar" className="lv-link">
            Ver todos
          </Link>
        }
      />
      <div className="lv-scroller mt-4">
        {recentes.map((s) => (
          <CardShow key={s.id} show={s} />
        ))}
      </div>
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
            <Bilhete esquerda={<>Livvo · <b>Comece por aqui</b></>}>
              <div className="lv-stage p-6 sm:p-8">
                <h2 className="lv-h2">Qual foi o último show que você viu?</h2>
                <p className="lv-sub mt-2">Procure pelo artista e toque em Eu fui. Seus shows antigos contam também.</p>
                <Stub icone={Plus} to="/registrar" className="mt-5">
                  Registrar meu primeiro show
                </Stub>
              </div>
            </Bilhete>
          ) : null}
        </div>

        {pass.shows > 0 && (
          <div className="mt-8">
            <ResumoPassaporte pass={pass} lv={lv} />
          </div>
        )}

        {pass.shows > 0 && <Missoes pass={pass} lv={lv} />}
      </div>

      <aside className="lv-home-side min-w-0 min-[1100px]:pt-[60px]" aria-label="Agenda e atividade">
        {catalogo && <Agenda cat={catalogo} lv={lv} />}

        {vemAi.length > 0 && (
          <section aria-label="Vem aí">
            <Grupo titulo="Vem aí" extra={<TagExemplo texto="Datas de exemplo" />} />
            {vemAi.slice(0, 4).map(({ show, vezes }) => (
              <Linha
                key={show.id}
                to={`/show/${show.id}`}
                inicio={<CaixaData ts={show.ts} />}
                titulo={show.artista}
                sub={`${show.casa} · ${show.cidade}`}
                nota={`Você viu ${vezes === 1 ? '1 vez' : `${vezes} vezes`}`}
              />
            ))}
          </section>
        )}

        <section aria-label="Atividade">
          <Grupo titulo="Quem você segue" extra={atividade.length > 0 ? <TagExemplo /> : undefined} />
          {atividade.length > 0 ? (
            atividade.map(({ pessoa, show, notaShow, horas }) => (
              <Linha
                key={`${pessoa.usuario}-${show.id}`}
                to={`/show/${show.id}`}
                avatar
                inicio={<Avatar nome={pessoa.nome} tamanho={38} />}
                titulo={
                  <>
                    {pessoa.nome} <span className="font-semibold text-[#B3AE9F]">registrou</span> {show.artista}
                  </>
                }
                sub={`${show.casa} · há ${horas} h`}
                nota={<Discos valor={notaShow} tamanho={13} rotulo="Nota do show" />}
              />
            ))
          ) : (
            <div className="py-4">
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
