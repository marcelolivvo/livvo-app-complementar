import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, X, Check, CalendarDays, MapPin, Building2, PlusCircle } from 'lucide-react';
import { combina, ehFuturo, useCatalogo, type Show } from '../data/catalog';
import { socialDoShow } from '../data/social';
import { mesAno, plural } from '../format';
import { Link, setQuery, useRoute } from '../router';
import { useLivvo } from '../store';
import { Avatar, CardShow, GradeCarregando, TagExemplo } from '../ui';

const PAGINA = 40;

const milhar = (n: number) => `${(Math.round(n / 100) / 10).toLocaleString('pt-BR')} mil`;

/** Seletor em formato de chip (usa o <select> nativo por baixo: acessível e bom no celular). */
const ChipSelect: React.FC<{
  rotulo: string;
  icone: React.ReactNode;
  valor: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
  onChange: (v: string) => void;
}> = ({ rotulo, icone, valor, opcoes, onChange }) => {
  const atual = opcoes.find((o) => o.valor === valor);
  return (
    <label className="lv-chip" data-on={Boolean(valor)}>
      {icone}
      <span>{atual ? atual.rotulo : rotulo}</span>
      <ChevronDown />
      <select aria-label={rotulo} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">{`Qualquer ${rotulo.toLowerCase()}`}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </label>
  );
};

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="lv-kicker lv-kicker--cyan">Explorar</div>
          <h1 className="lv-h1 mt-1">Shows</h1>
          <p className="lv-sub mt-2 max-w-xl">Encontre um show que você viveu para guardar na sua história, ou um que vem aí.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="lv-search">
          <Search />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Artista, casa de show ou cidade"
            aria-label="Buscar shows por artista, casa de show ou cidade"
          />
          {termo && (
            <button type="button" className="lv-iconbtn lv-search-clear" aria-label="Limpar busca" onClick={() => setTermo('')}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="lv-tabs2" role="tablist" aria-label="Período">
            <button type="button" role="tab" aria-selected={aba === 'passados'} onClick={() => setQuery({ aba: null, ano: null })}>
              Passados
            </button>
            <button type="button" role="tab" aria-selected={aba === 'proximos'} onClick={() => setQuery({ aba: 'proximos', ano: null, fui: null })}>
              Próximos
            </button>
          </div>
          {aba === 'proximos' && <TagExemplo texto="Datas de exemplo" title="O catálogo real ainda não tem shows futuros. Estas datas são fictícias, para mostrar a agenda." />}
        </div>

        <div className="lv-chips" aria-label="Filtros">
          <ChipSelect rotulo="Cidade" icone={<MapPin />} valor={cidade} opcoes={opcoes.cidades} onChange={(v) => setQuery({ cidade: v || null, casa: null })} />
          {aba === 'passados' && (
            <ChipSelect rotulo="Ano" icone={<CalendarDays />} valor={ano} opcoes={opcoes.anos} onChange={(v) => setQuery({ ano: v || null })} />
          )}
          <ChipSelect rotulo="Casa" icone={<Building2 />} valor={casa} opcoes={opcoes.casas} onChange={(v) => setQuery({ casa: v || null })} />
          {logado && aba === 'passados' && (
            <button type="button" className="lv-chip" data-on={soFui} aria-pressed={soFui} onClick={() => setQuery({ fui: soFui ? null : '1' })}>
              <Check /> Shows que eu fui
            </button>
          )}
          {temFiltro && (
            <button
              type="button"
              className="lv-link ml-1 shrink-0"
              onClick={() => {
                setTermo('');
                setQuery({ q: null, cidade: null, ano: null, casa: null, fui: null });
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="mt-5" aria-live="polite">
        {erro ? (
          <div className="lv-card p-6 text-center">
            <p className="font-bold">Não conseguimos carregar os shows agora.</p>
            <p className="lv-meta mt-1">Confira a conexão e tente de novo.</p>
            <button type="button" className="lv-ghost mt-4" onClick={tentarDeNovo}>
              Tentar de novo
            </button>
          </div>
        ) : !catalogo ? (
          <GradeCarregando />
        ) : filtrados.length === 0 ? (
          <div className="lv-card p-6 sm:p-8 text-center">
            <p className="lv-h2">Nenhum show encontrado{termoUrl ? ` para “${termoUrl}”` : ''}.</p>
            <p className="lv-sub mt-2">Confira o nome ou tire um filtro. Se o show não está no catálogo, você pode pedir a inclusão.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
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
                <div className="lv-divider-month">
                  <h2 className="lv-kicker">{g.titulo}</h2>
                </div>
                <div className="lv-grid lv-grid--5">
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
