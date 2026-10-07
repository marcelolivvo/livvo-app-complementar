import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
import type { Catalogo } from './data/catalog';
import type { Passaporte } from './stats';
import { livvo, useLivvo } from './store';
import { CaixaFoto, FotoArtista, Grupo, avisar } from './ui';

/**
 * Artistas favoritos (revisão 7, 07/10/2026). A pessoa escolhe os favoritos com um botão discreto (coração)
 * na página do show e na página do artista em Registrar. Na Minha História, antes de Concert Buddies, aparecem
 * até 5 favoritos (os com mais shows seus); sem nenhum favorito, aparecem os 5 artistas mais vistos.
 */

export const BotaoFavoritar: React.FC<{ artistaId: string; nome: string; className?: string; compacto?: boolean }> = ({
  artistaId,
  nome,
  className = '',
  compacto,
}) => {
  const lv = useLivvo();
  const fav = lv.favoritos.includes(artistaId);
  return (
    <button
      type="button"
      className={`lv-fav ${compacto ? 'lv-fav--compacto' : ''} ${className}`}
      aria-pressed={fav}
      aria-label={fav ? `Tirar ${nome} dos favoritos` : `Favoritar ${nome}`}
      title={fav ? 'Tirar dos favoritos' : 'Favoritar artista'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const agora = livvo.alternarFavorito(artistaId);
        if (agora !== undefined && lv.logado) avisar(agora ? `${nome} nos seus favoritos` : `${nome} saiu dos favoritos`);
      }}
    >
      <Heart className="w-3.5 h-3.5" fill={fav ? 'currentColor' : 'none'} strokeWidth={2.2} />
      {!compacto && <span>{fav ? 'Favorito' : 'Favoritar'}</span>}
    </button>
  );
};

export const ArtistasFavoritos: React.FC<{ pass: Passaporte; catalogo: Catalogo | null }> = ({ pass, catalogo }) => {
  const lv = useLivvo();
  const { itens, sugestao } = useMemo(() => {
    const vezes = new Map<string, number>();
    pass.memoriasComShow.forEach(({ show }) => vezes.set(show.artistaId, (vezes.get(show.artistaId) || 0) + 1));
    const nome = (id: string) => catalogo?.artistas.get(id)?.nome || pass.memoriasComShow.find((x) => x.show.artistaId === id)?.show.artista || '';
    const porShows = (ids: string[]) =>
      ids
        .map((id) => ({ id, nome: nome(id), vezes: vezes.get(id) || 0 }))
        .filter((a) => a.nome)
        .sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome, 'pt-BR'))
        .slice(0, 5);
    if (lv.favoritos.length) return { itens: porShows(lv.favoritos), sugestao: false };
    return { itens: porShows(Array.from(vezes.keys())), sugestao: true };
  }, [pass, catalogo, lv.favoritos]);

  if (!itens.length) return null;
  return (
    <section aria-label="Artistas favoritos" className="max-w-[880px]">
      <Grupo titulo={sugestao ? 'Artistas favoritos · seus mais vistos' : 'Artistas favoritos'} />
      {sugestao && <p className="lv-meta mt-3">Toque no coração para escolher os seus favoritos. Até lá, aparecem os artistas que você mais viu.</p>}
      <div className="lv-buddies-caixas">
        {itens.map((a) => (
          <CaixaFoto
            key={a.id}
            foto={<FotoArtista nome={a.nome} artistaId={a.id} tamanho="caixa" />}
            titulo={a.nome}
            linha={
              a.vezes ? (
                <>
                  <b>{a.vezes}</b> {a.vezes === 1 ? 'show' : 'shows'}
                </>
              ) : (
                'Nenhum show ainda'
              )
            }
            to={`/explorar?q=${encodeURIComponent(a.nome)}`}
            rotulo={`${a.nome}: ${a.vezes} shows. Ver os shows`}
            extra={<BotaoFavoritar artistaId={a.id} nome={a.nome} compacto />}
          />
        ))}
      </div>
    </section>
  );
};
