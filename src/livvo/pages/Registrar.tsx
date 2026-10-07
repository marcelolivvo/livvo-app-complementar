import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Search, X } from 'lucide-react';
import { buscarArtistas, ehFuturo, useCatalogo, type Artista } from '../data/catalog';
import { dataCartao, plural } from '../format';
import { Link, setQuery, useRoute } from '../router';
import { livvo, useLivvo } from '../store';
import { Avatar, Bilhete, CaixaData, CarimboFui, Grupo, Linha, TagProxima, avisar } from '../ui';

/**
 * Registrar (versão da parte 1): artista → data → Eu fui, em 3 toques.
 * A parte 2 acrescenta a tela de sucesso com o Ingresso de Memória, o Avaliar em camadas
 * e o formulário "Meu show não está aqui".
 */

/** Sem foto de artista até haver imagens licenciadas: iniciais no lugar. */
const FotoArtista: React.FC<{ a: Artista; tamanho?: number }> = ({ a, tamanho = 44 }) => <Avatar nome={a.nome} tamanho={tamanho} />;

const LinhaArtista: React.FC<{ a: Artista; vezes?: number }> = ({ a, vezes }) => {
  const passados = a.shows.filter((s) => !ehFuturo(s)).length;
  return (
    <Linha
      avatar
      onClick={() => setQuery({ artista: a.id })}
      inicio={<FotoArtista a={a} tamanho={40} />}
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
              <FotoArtista a={artista} tamanho={60} />
              <div className="min-w-0">
                <div className="lv-kicker lv-kicker--cyan">Qual destes você viveu?</div>
                <h1 className="lv-h1 mt-1 !text-[clamp(26px,5.6vw,38px)] break-words">{artista.nome}</h1>
                <p className="lv-meta mt-1">
                  {plural(passados.length, 'show no catálogo', 'shows no catálogo')}
                  {fuiAqui ? ` · você foi a ${fuiAqui}` : ''}
                </p>
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
                          if (livvo.registrar(s.id)) {
                            setRecentes((r) => [...r, s.id]);
                            avisar('Show guardado na sua história');
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
