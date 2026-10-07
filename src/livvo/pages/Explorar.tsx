import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, PlusCircle } from 'lucide-react';
import { combina, ehFuturo, useCatalogo, type Show } from '../data/catalog';
import { socialDoShow } from '../data/social';
import { mesAno, plural } from '../format';
import { Link, setQuery, useRoute } from '../router';
import { useLivvo } from '../store';
import { Avatar, Bilhete, CardShow, GradeCarregando, Grupo, TagExemplo } from '../ui';

const PAGINA = 40;

const milhar = (n: number) => `${(Math.round(n / 100) / 10).toLocaleString('pt-BR')} mil`;

/** Filtro como os campos do Estúdio: rótulo em caixa alta e <select> nativo sublinhado. */
const Filtro: React.FC<{
  rotulo: string;
  valor: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
  onChange: (v: string) => void;
}> = ({ rotulo, valor, opcoes, onChange }) => (
  <label className="lv-campo">
    <span className="lv-label">{rotulo}</span>
    <select className="lv-input" value={valor} onChange={(e) => onChange(e.target.value)} data-on={Boolean(valor)}>
      <option value="">Todas</option>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  </label>
);

export const Explorar: React.FC = () => {
  const { query } = useRoute();
  const { catalogo, erro, tentarDeNovo } = useCatalogo();
  const { memoriaDoShow, memorias, exemplos, interesses, logado } = useLivvo();

  const aba = query.get('aba') === 'proximos' ? 'proximos' : 'passados';
  const cidade = query.get('cidade') || '';
  const ano = query.get('ano') || '';
  const casa = query.get('casa') || '';
  const soFui = query.get('fui') === '1';
  const termoUrl = query.get('q') || '';

  const [termo, setTermo] = useState(termoUrl);
  const [limite, setLimite] = useState(PAGINA);
  // A URL manda (voltar/avançar do navegador); o que está sendo digitado não é sobrescrito
  useEffect(() => setTermo((t) => (t.trim() === termoUrl ? t : termoUrl)), [termoUrl]);
  useEffect(() => setLimite(PAGINA), [aba, cidade, ano, casa, soFui, termoUrl]);

  // Busca com pequeno atraso para não recalcular a cada tecla
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (termo.trim() !== termoUrl) setQuery({ q: termo.trim() || null });
    }, 220);
    return () => window.clearTimeout(t);
  }, [termo, termoUrl]);

  const fuiIds = useMemo(() => new Set(memorias.map((m) => m.showId)), [memorias]);

  const base = useMemo(() => {
    if (!catalogo) return [];
    return catalogo.shows.filter((s) => (aba === 'proximos' ? ehFuturo(s) : !ehFuturo(s)));
  }, [catalogo, aba]);

  const contagem = useMemo(() => {
    if (!catalogo) return { passados: 0, proximos: 0 };
    const proximos = catalogo.shows.filter(ehFuturo).length;
    return { passados: catalogo.shows.length - proximos, proximos };
  }, [catalogo]);

  const opcoes = useMemo(() => {
    const cidades = new Map<string, number>();
    const anos = new Set<string>();
    const casas = new Map<string, number>();
    base.forEach((s) => {
      cidades.set(s.cidade, (cidades.get(s.cidade) || 0) + 1);
      anos.add(s.data.slice(-4));
      if (!cidade || s.cidade === cidade) casas.set(s.casa, (casas.get(s.casa) || 0) + 1);
    });
    return {
      cidades: Array.from(cidades.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => ({ valor: c, rotulo: c })),
      anos: Array.from(anos)
        .sort((a, b) => Number(b) - Number(a))
        .map((a) => ({ valor: a, rotulo: a })),
      casas: Array.from(casas.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 80)
        .map(([c]) => ({ valor: c, rotulo: c })),
    };
  }, [base, cidade]);

  const filtrados = useMemo(() => {
    const lista = base.filter(
      (s) =>
        (!cidade || s.cidade === cidade) &&
        (!ano || s.data.endsWith(ano)) &&
        (!casa || s.casa === casa) &&
        (!soFui || fuiIds.has(s.id)) &&
        combina(s, termoUrl),
    );
    // Próximos: do mais perto para o mais longe
    return aba === 'proximos' ? [...lista].sort((a, b) => a.ts - b.ts) : lista;
  }, [base, cidade, ano, casa, soFui, fuiIds, termoUrl, aba]);

  const grupos = useMemo(() => {
    const out: Array<{ chave: string; titulo: string; shows: Show[] }> = [];
    filtrados.slice(0, limite).forEach((s) => {
      const chave = s.data.slice(3);
      const ultimo = out[out.length - 1];
      if (ultimo && ultimo.chave === chave) ultimo.shows.push(s);
      else out.push({ chave, titulo: mesAno(s.ts), shows: [s] });
    });
    return out;
  }, [filtrados, limite]);

  const temFiltro = Boolean(cidade || ano || casa || soFui || termoUrl);

  const linhaSocial = (s: Show) => {
    const fui = Boolean(memoriaDoShow(s.id));
    const soc = socialDoShow(s, exemplos, memoriaDoShow(s.id));
    const interesse = interesses[s.id];
    if (ehFuturo(s)) {
      if (interesse) return <span className="lv-tag lv-tag--cyan">{interesse === 'tenho_ingresso' ? 'Tenho ingresso' : 'Quero ir'}</span>;
      if (soc.registros > 0) return <span className="lv-meta">{plural(soc.registros, 'pessoa quer ir', 'pessoas querem ir')}</span>;
      return null;
    }
    const outros = soc.registros - (fui ? 1 : 0);
    if (outros <= 0) return null;
    return (
      <span className="flex items-center gap-2">
        <span className="lv-av-stack">
          {soc.pessoas.slice(0, 3).map((p) => (
            <Avatar key={p.usuario} nome={p.nome} tamanho={20} />
          ))}
        </span>
        <span className="lv-meta">{plural(soc.registros, 'registrou', 'registraram')}</span>
      </span>
    );
  };

  return (
    <div>
      <Bilhete
        rotulo="Buscar shows"
        esquerda={
          <>
            Livvo · <b>Shows</b>
          </>
        }
        direita={catalogo ? `${milhar(catalogo.totalCatalogo)} no catálogo` : ' '}
      >
        <div className="lv-pad">
          <h1 className="lv-h1">Encontre o seu show</h1>
          <p className="lv-sub mt-2 max-w-xl">Um show que você viveu, para guardar na sua história, ou um que vem aí.</p>

          <div className="mt-6 grid gap-x-6 gap-y-5 grid-cols-3 lg:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))]">
            <label className="lv-campo col-span-3 lg:col-span-1">
              <span className="lv-label">Artista, casa ou cidade</span>
              <span className="lv-busca">
                <Search />
                <input
                  className="lv-input"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder="Busque uma banda, casa ou cidade"
                />
                {termo && (
                  <button type="button" className="lv-iconbtn" aria-label="Limpar busca" onClick={() => setTermo('')}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </span>
            </label>
            <Filtro rotulo="Cidade" valor={cidade} opcoes={opcoes.cidades} onChange={(v) => setQuery({ cidade: v || null, casa: null })} />
            {aba === 'passados' ? (
              <Filtro rotulo="Ano" valor={ano} opcoes={opcoes.anos} onChange={(v) => setQuery({ ano: v || null })} />
            ) : (
              <span />
            )}
            <Filtro rotulo="Casa" valor={casa} opcoes={opcoes.casas} onChange={(v) => setQuery({ casa: v || null })} />
          </div>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="lv-tabs" role="tablist" aria-label="Período">
              <button type="button" role="tab" aria-selected={aba === 'passados'} data-on={aba === 'passados'} onClick={() => setQuery({ aba: null, ano: null })}>
                Passados <span className="lv-mono">{contagem.passados.toLocaleString('pt-BR')}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aba === 'proximos'}
                data-on={aba === 'proximos'}
                onClick={() => setQuery({ aba: 'proximos', ano: null, fui: null })}
              >
                Próximos <span className="lv-mono">{contagem.proximos}</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-2">
              {logado && aba === 'passados' && (
                <label className="lv-check !py-0 text-[13.5px] font-bold">
                  <input type="checkbox" className="accent-[#4FDCDE] w-4 h-4" checked={soFui} onChange={() => setQuery({ fui: soFui ? null : '1' })} />
                  Só shows que eu fui
                </label>
              )}
              {aba === 'proximos' && (
                <TagExemplo texto="Datas de exemplo" title="O catálogo real ainda não tem shows futuros. Estas datas são fictícias, para mostrar a agenda." />
              )}
              {temFiltro && (
                <button
                  type="button"
                  className="lv-link"
                  onClick={() => {
                    setTermo('');
                    setQuery({ q: null, cidade: null, ano: null, casa: null, fui: null });
                  }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </Bilhete>

      <div className="mt-5" aria-live="polite">
        {erro ? (
          <div className="lv-empty">
            <p className="font-bold">Não conseguimos carregar os shows agora.</p>
            <p className="lv-meta">Confira a conexão e tente de novo.</p>
            <button type="button" className="lv-ghost" onClick={tentarDeNovo}>
              Tentar de novo
            </button>
          </div>
        ) : !catalogo ? (
          <GradeCarregando />
        ) : filtrados.length === 0 ? (
          <div className="lv-empty">
            <p className="lv-h2">Nenhum show encontrado{termoUrl ? ` para “${termoUrl}”` : ''}.</p>
            <p className="lv-sub">Confira o nome ou tire um filtro. Se o show não está no catálogo, você pode pedir a inclusão.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={`/registrar${termoUrl ? `?q=${encodeURIComponent(termoUrl)}` : ''}`} className="lv-ghost">
                <PlusCircle className="w-4 h-4" /> Meu show não está aqui
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="lv-meta">
              {plural(filtrados.length, 'show', 'shows')}
              {aba === 'passados' && !temFiltro && (
                <>
                  {' '}
                  · prévia com um recorte de {milhar(catalogo.shows.length)} dos {milhar(catalogo.totalCatalogo)} shows do catálogo
                </>
              )}
            </p>
            {grupos.map((g) => (
              <section key={g.chave} aria-label={g.titulo}>
                <Grupo titulo={g.titulo} />
                <div className="lv-grid lv-grid--5 mt-4">
                  {g.shows.map((s) => (
                    <CardShow key={s.id} show={s} fui={fuiIds.has(s.id)} linhaSocial={linhaSocial(s)} />
                  ))}
                </div>
              </section>
            ))}
            {filtrados.length > limite && (
              <div className="mt-10 flex justify-center">
                <button type="button" className="lv-ghost" onClick={() => setLimite((n) => n + PAGINA)}>
                  Mostrar mais shows
                </button>
              </div>
            )}
            <div className="mt-12 text-center">
              <p className="lv-meta">Não achou o seu show?</p>
              <Link to={`/registrar${termoUrl ? `?q=${encodeURIComponent(termoUrl)}` : ''}`} className="lv-link mt-1">
                Peça a inclusão
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
