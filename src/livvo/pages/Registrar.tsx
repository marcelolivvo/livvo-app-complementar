import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, Star, X } from 'lucide-react';
import { buscarArtistas, ehFuturo, useCatalogo, type Artista, type Show } from '../data/catalog';
import { dataCartao, plural } from '../format';
import { Link, navigate, setQuery, useRoute } from '../router';
import { livvo, useLivvo, type Memoria } from '../store';
import { Modal } from '../AtualizarFoto';
import { BotaoCompartilhar } from '../Compartilhar';
import { BotaoFavoritar } from '../Favoritos';
import { Bilhete, CaixaData, CarimboFui, FotoArtista, Grupo, Linha, Poster, TagProxima, avisar } from '../ui';

/**
 * Registrar (versão da parte 1): artista → data → Eu fui, em 3 toques.
 * A parte 2 acrescenta a tela de sucesso com o Ingresso de Memória, o Avaliar em camadas
 * e o formulário "Meu show não está aqui".
 */

/**
 * Janela depois do "Eu fui" (revisão 7): o pôster padrão do show (sem carimbo) e o convite para compartilhar.
 * Dar a nota leva à página do show; "Continuar registrando" fecha e volta à lista de datas.
 */
const JanelaEuFui: React.FC<{ show: Show; memoria: Memoria; usuario: string; fechar: () => void }> = ({ show, memoria, usuario, fechar }) => {
  const d = dataCartao(show.ts);
  return (
    <Modal rotulo={`Você foi: ${show.artista}`} fechar={fechar}>
      <Bilhete
        esquerda={
          <>
            Livvo · <b>Eu fui</b>
          </>
        }
        direita={
          <button type="button" className="lv-iconbtn !w-8 !h-8 -my-2 -mr-2" aria-label="Fechar" onClick={fechar}>
            <X className="w-4 h-4" />
          </button>
        }
      >
        <div className="lv-pad grid gap-6 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:items-center">
          <div className="w-full max-w-[260px] mx-auto">
            <Poster show={show} usuario={usuario} />
          </div>
          <div className="min-w-0">
            <CarimboFui animar texto="Guardado" />
            <h2 className="lv-display text-[26px] leading-tight mt-3">{show.artista}</h2>
            <p className="lv-meta mt-1">
              {show.casa} · {show.cidade} · {d.dia} {d.mes.toLowerCase()} {d.ano}
            </p>
            <p className="lv-sub mt-4">Seu pôster está pronto. Compartilhe nos Stories, no Feed ou com quem estava lá.</p>
            <div className="mt-5 grid gap-2.5 max-w-[320px]">
              <BotaoCompartilhar show={show} memoria={memoria} usuario={usuario} botao />
              <button
                type="button"
                className="lv-btn lv-btn--stub lv-btn--cream w-full whitespace-nowrap"
                onClick={() => {
                  fechar();
                  navigate(`/show/${show.id}?avaliar=show`);
                }}
              >
                <Star className="w-4 h-4 shrink-0" strokeWidth={2.2} /> <span>Dar nota agora</span>
              </button>
              <button type="button" className="lv-link justify-center mt-1" onClick={fechar}>
                Continuar registrando
              </button>
            </div>
          </div>
        </div>
      </Bilhete>
    </Modal>
  );
};

const LinhaArtista: React.FC<{ a: Artista; vezes?: number }> = ({ a, vezes }) => {
  const passados = a.shows.filter((s) => !ehFuturo(s)).length;
  return (
    <Linha
      avatar
      onClick={() => setQuery({ artista: a.id })}
      foto
      inicio={<FotoArtista nome={a.nome} artistaId={a.id} />}
      titulo={a.nome}
      sub={`${plural(passados, 'show no catálogo', 'shows no catálogo')}${vezes ? ` · você foi a ${vezes}` : ''}`}
      fim={<ArrowRight className="w-4 h-4 lv-show-go" />}
    />
  );
};

export const Registrar: React.FC = () => {
  const { query } = useRoute();
  const { catalogo } = useCatalogo();
  const lv = useLivvo();
  const [termo, setTermo] = useState(query.get('q') || '');
  const [recentes, setRecentes] = useState<string[]>([]);
  const [janela, setJanela] = useState<{ show: Show; memoria: Memoria } | null>(null);
  const artistaId = query.get('artista');
  const artista = artistaId ? catalogo?.artistas.get(artistaId) : undefined;

  const resultados = useMemo(() => (catalogo ? buscarArtistas(catalogo, termo, 10) : []), [catalogo, termo]);

  const daHistoria = useMemo(() => {
    if (!catalogo) return [];
    const cont = new Map<string, number>();
    lv.memorias.forEach((m) => {
      const s = catalogo.porId.get(m.showId);
      if (s) cont.set(s.artistaId, (cont.get(s.artistaId) || 0) + 1);
    });
    return Array.from(cont.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, vezes]) => ({ a: catalogo.artistas.get(id)!, vezes }))
      .filter((x) => x.a);
  }, [catalogo, lv.memorias]);

  const tira = () => (
    <>
      Livvo · <b>Registrar show</b>
    </>
  );

  if (artista) {
    const passados = artista.shows.filter((s) => !ehFuturo(s));
    const fuiAqui = passados.filter((s) => lv.memoriaDoShow(s.id)).length;
    return (
      <div className="max-w-[820px]">
        <button type="button" className="lv-link text-[#B3AE9F] mb-4" onClick={() => setQuery({ artista: null })}>
          <ArrowLeft className="w-4 h-4" /> Outro artista
        </button>
        <Bilhete esquerda={tira()} direita="Passo 2 de 2">
          <div className="lv-pad">
            <div className="flex items-center gap-4">
              <FotoArtista nome={artista.nome} artistaId={artista.id} />
              <div className="min-w-0 flex-1">
                <div className="lv-kicker lv-kicker--cyan">Qual destes você viveu?</div>
                <h1 className="lv-h1 mt-1 !text-[clamp(26px,5.6vw,38px)]">{artista.nome}</h1>
                <p className="lv-meta mt-1">
                  {plural(passados.length, 'show no catálogo', 'shows no catálogo')}
                  {fuiAqui ? ` · você foi a ${fuiAqui}` : ''}
                </p>
                <BotaoFavoritar artistaId={artista.id} nome={artista.nome} className="mt-2" />
              </div>
            </div>

            <Grupo titulo="Datas" />
            {passados.map((s) => {
              const fui = Boolean(lv.memoriaDoShow(s.id));
              const d = dataCartao(s.ts);
              return (
                <Linha
                  key={s.id}
                  inicio={<CaixaData ts={s.ts} comAno />}
                  titulo={
                    <Link to={`/show/${s.id}`} className="hover:underline decoration-[#3A3159]">
                      {s.casa}
                    </Link>
                  }
                  sub={`${s.cidade}, ${s.uf} · ${d.semana}`}
                  fim={
                    fui ? (
                      <Link to={`/show/${s.id}`} aria-label={`Você foi. Abrir ${s.artista} em ${s.casa}`}>
                        <CarimboFui animar={recentes.includes(s.id)} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="lv-btn lv-btn--cyan !py-2.5 !px-4"
                        onClick={() => {
                          const m = livvo.registrar(s.id);
                          if (m) {
                            setRecentes((r) => [...r, s.id]);
                            setJanela({ show: s, memoria: m });
                          }
                        }}
                      >
                        <Check className="w-4 h-4" strokeWidth={3} /> Eu fui
                      </button>
                    )
                  }
                />
              );
            })}
            {recentes.length > 0 && <p className="lv-meta mt-3">Toque no carimbo para dar a nota do show e da organização.</p>}
            {janela && <JanelaEuFui show={janela.show} memoria={janela.memoria} usuario={lv.perfil.usuario} fechar={() => setJanela(null)} />}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="lv-sub flex-1 min-w-[220px]">Não achou a data? Você vai poder pedir a inclusão com data, casa e cidade.</p>
              <TagProxima parte={2} />
            </div>
          </div>
        </Bilhete>
      </div>
    );
  }

  return (
    <div className="max-w-[820px]">
      <Bilhete esquerda={tira()} direita="Passo 1 de 2">
        <div className="lv-pad">
          <h1 className="lv-h1">Qual show você viveu?</h1>
          <p className="lv-sub mt-2">Comece pelo artista. Depois é só escolher a data e tocar em Eu fui.</p>

          <label className="lv-campo mt-6">
            <span className="lv-label">Artista</span>
            <span className="lv-busca">
              <Search />
              <input
                className="lv-input"
                type="search"
                autoFocus
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Busque uma banda ou artista"
              />
              {termo && (
                <button type="button" className="lv-iconbtn" aria-label="Limpar busca" onClick={() => setTermo('')}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </span>
          </label>

          {!catalogo ? (
            <div className="mt-6 space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="lv-skel" style={{ height: 56 }} />
              ))}
            </div>
          ) : termo.trim().length >= 2 ? (
            resultados.length ? (
              <>
                <Grupo titulo="Artistas" />
                {resultados.map((a) => (
                  <LinhaArtista key={a.id} a={a} />
                ))}
              </>
            ) : (
              <div className="lv-empty mt-6">
                <p className="font-bold">Nenhum artista encontrado para “{termo.trim()}”.</p>
                <p className="lv-meta">Confira a grafia. Se o artista não está no catálogo, você vai poder pedir a inclusão.</p>
                <TagProxima parte={2} />
              </div>
            )
          ) : (
            daHistoria.length > 0 && (
              <>
                <Grupo titulo="Artistas da sua história" />
                {daHistoria.map(({ a, vezes }) => (
                  <LinhaArtista key={a.id} a={a} vezes={vezes} />
                ))}
                <p className="lv-meta mt-3">Viu algum deles outra vez? Os shows antigos também contam.</p>
              </>
            )
          )}
        </div>
      </Bilhete>
    </div>
  );
};
