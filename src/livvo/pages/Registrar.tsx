import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { buscarArtistas, ehFuturo, useCatalogo, type Artista } from '../data/catalog';
import { dataCartao, plural } from '../format';
import { Link, setQuery, useRoute } from '../router';
import { livvo, useLivvo } from '../store';
import { Avatar, CaixaData, CarimboFui, TagProxima, avisar } from '../ui';

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
    <button type="button" className="lv-row2 w-full text-left hover:bg-[#1E1833]" onClick={() => setQuery({ artista: a.id })}>
      <FotoArtista a={a} />
      <div className="min-w-0 flex-1">
        <div className="font-extrabold text-[15px] truncate">{a.nome}</div>
        <div className="lv-meta">
          {plural(passados, 'show no catálogo', 'shows no catálogo')}
          {vezes ? ` · você foi a ${vezes}` : ''}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-[#8A8577] shrink-0" />
    </button>
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

  if (artista) {
    const passados = artista.shows.filter((s) => !ehFuturo(s));
    const fuiAqui = passados.filter((s) => lv.memoriaDoShow(s.id)).length;
    return (
      <div className="max-w-[760px]">
        <button type="button" className="lv-link text-[#B3AE9F]" onClick={() => setQuery({ artista: null })}>
          <ArrowLeft className="w-4 h-4" /> Outro artista
        </button>
        <div className="mt-4 flex items-center gap-4">
          <FotoArtista a={artista} tamanho={64} />
          <div className="min-w-0">
            <div className="lv-kicker lv-kicker--cyan">Qual destes você viveu?</div>
            <h1 className="lv-h1 mt-1 !text-[clamp(26px,5.6vw,38px)]">{artista.nome}</h1>
            <p className="lv-meta mt-1">
              {plural(passados.length, 'show no catálogo', 'shows no catálogo')}
              {fuiAqui ? ` · você foi a ${fuiAqui}` : ''}
            </p>
          </div>
        </div>

        <ul className="lv-card mt-6 p-1.5 divide-y divide-[#282141]">
          {passados.map((s) => {
            const fui = Boolean(lv.memoriaDoShow(s.id));
            const d = dataCartao(s.ts);
            return (
              <li key={s.id} className="flex items-center gap-3 sm:gap-4 px-2.5 py-3">
                <CaixaData ts={s.ts} comAno />
                <Link to={`/show/${s.id}`} className="min-w-0 flex-1 hover:underline decoration-[#3A3159]">
                  <div className="font-extrabold text-[14.5px] truncate">{s.casa}</div>
                  <div className="lv-meta truncate">
                    {s.cidade}, {s.uf} · {d.semana} {d.dia} {d.mes} {d.ano}
                  </div>
                </Link>
                {fui ? (
                  <Link to={`/show/${s.id}`} className="shrink-0" aria-label={`Você foi. Abrir ${s.artista} em ${s.casa}`}>
                    <CarimboFui animar={recentes.includes(s.id)} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="lv-btn lv-btn--cyan !py-2.5 !px-4 shrink-0"
                    onClick={() => {
                      if (livvo.registrar(s.id)) {
                        setRecentes((r) => [...r, s.id]);
                        avisar('Show guardado na sua história');
                      }
                    }}
                  >
                    Eu fui
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {recentes.length > 0 && (
          <p className="lv-meta mt-3">Toque no carimbo para dar a nota do show e da organização.</p>
        )}
        <div className="lv-card mt-6 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="lv-sub flex-1">Não achou a data? Você vai poder pedir a inclusão com data, casa e cidade.</p>
          <TagProxima parte={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px]">
      <div className="lv-kicker lv-kicker--cyan">Registrar</div>
      <h1 className="lv-h1 mt-1">Qual show você viveu?</h1>
      <p className="lv-sub mt-2">Comece pelo artista. Depois é só escolher a data e tocar em Eu fui.</p>

      <div className="lv-search mt-6">
        <Search />
        <input
          type="search"
          autoFocus
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Nome do artista ou banda"
          aria-label="Buscar artista"
        />
        {termo && (
          <button type="button" className="lv-iconbtn lv-search-clear" aria-label="Limpar busca" onClick={() => setTermo('')}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!catalogo ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="lv-skel" style={{ height: 64 }} />
          ))}
        </div>
      ) : termo.trim().length >= 2 ? (
        resultados.length ? (
          <div className="lv-card mt-5 p-1.5">
            {resultados.map((a) => (
              <LinhaArtista key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <div className="lv-card mt-5 p-6">
            <p className="font-bold">Nenhum artista encontrado para “{termo.trim()}”.</p>
            <p className="lv-meta mt-1">Confira a grafia. Se o artista não está no catálogo, você vai poder pedir a inclusão.</p>
            <div className="mt-3">
              <TagProxima parte={2} />
            </div>
          </div>
        )
      ) : (
        <>
          {daHistoria.length > 0 && (
            <section className="lv-section !mt-8">
              <h2 className="lv-kicker mb-3">Artistas da sua história</h2>
              <div className="lv-card p-1.5">
                {daHistoria.map(({ a, vezes }) => (
                  <LinhaArtista key={a.id} a={a} vezes={vezes} />
                ))}
              </div>
              <p className="lv-meta mt-2">Viu algum deles outra vez? Os shows antigos também contam.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
};
