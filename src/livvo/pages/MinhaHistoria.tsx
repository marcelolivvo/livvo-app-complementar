import React, { Suspense, lazy, useMemo, useRef, useState } from 'react';
import { BarChart3, Camera, Plus, Share2, Sparkles } from 'lucide-react';
import { useCatalogo } from '../data/catalog';
import { dataCartao, nota } from '../format';
import { Link } from '../router';
import { calcularPassaporte } from '../stats';
import { livvo, personalizacaoDe, useLivvo } from '../store';
import { Bilhete, Discos, Grupo, IngressoContorno, Poster, Stub, TagExemplo, TagProxima, avisar } from '../ui';
import { concertBuddies } from '../data/social';
import { ListaBuddies } from '../ConcertBuddies';
import { CamposPassaporte, ProgressoFaixa } from './Inicio';
import { LivvoCredencialCard, exportarCredencialPNG } from '../../components/LivvoCredencialCard';
import { PassportIcon } from '../../components/PassportIcon';
import { BotaoAtualizarFoto } from '../AtualizarFoto';

// Gráficos e Wrapped do Livvo Virtual Poster: carregados só quando a pessoa abre (revisão 5)
const MeuHistorico = lazy(() => import('../HistoricoWrapped').then((m) => ({ default: m.MeuHistorico })));
const MeuWrapped = lazy(() => import('../HistoricoWrapped').then((m) => ({ default: m.MeuWrapped })));

/**
 * Minha História — o Passaporte com a mesma cara da Wallet do Estúdio:
 * página de identificação (tira, título teal, campos, picotes, botões-canhoto) + Credencial Backstage,
 * e a Carteira de ingressos em contorno ciano. Sem a linha estilo passaporte (MRZ), decisão de 07/10/2026.
 * Na parte 3 entram as abas Números, Coleção (medalhas, desafios, stickers), Agenda e Listas.
 */

const CHAVE_FOTO = 'livvo_user_photo_v1'; // mesma chave do Estúdio: a foto vale nos dois

const lerFoto = (): string | null => {
  try {
    return localStorage.getItem(CHAVE_FOTO);
  } catch {
    return null;
  }
};

const numeroCadastro = (): number => {
  try {
    const n = Number(localStorage.getItem('livvo_member_number_v1'));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 16;
  } catch {
    return 16;
  }
};

/** Mesmo tratamento de foto do Estúdio: lado maior até 1024 px, mantém transparência, tenta 640 px sem espaço. */
const prepararFoto = (file: File): Promise<string> =>
  new Promise((ok, erro) => {
    const reader = new FileReader();
    reader.onerror = () => erro(new Error('leitura'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => erro(new Error('formato'));
      img.onload = () => {
        const gerar = (lado: number): string => {
          const k = Math.min(1, lado / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * k));
          const h = Math.max(1, Math.round(img.height * k));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas');
          ctx.drawImage(img, 0, 0, w, h);
          let transparente = false;
          try {
            const d = ctx.getImageData(0, 0, w, h).data;
            for (let i = 3; i < d.length; i += 4 * 7)
              if (d[i]! < 250) {
                transparente = true;
                break;
              }
          } catch {
            /* sem leitura de pixels: foto comum */
          }
          if (!transparente) return canvas.toDataURL('image/jpeg', 0.88);
          const webp = canvas.toDataURL('image/webp', 0.9);
          return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
        };
        try {
          let url = gerar(1024);
          try {
            localStorage.setItem(CHAVE_FOTO, url);
          } catch {
            url = gerar(640);
            try {
              localStorage.setItem(CHAVE_FOTO, url);
            } catch {
              avisar('A foto aparece agora, mas o aparelho está sem espaço para guardá-la.');
            }
          }
          ok(url);
        } catch (e) {
          erro(e);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const MinhaHistoria: React.FC = () => {
  const { catalogo } = useCatalogo();
  const lv = useLivvo();
  const pass = useMemo(() => calcularPassaporte(lv.memorias, catalogo), [lv.memorias, catalogo]);
  const buddies = useMemo(() => concertBuddies(pass.memoriasComShow, lv.exemplos), [pass, lv.exemplos]);
  const [foto, setFoto] = useState<string | null>(lerFoto);
  const [gerando, setGerando] = useState(false);
  const [historico, setHistorico] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);
  const abrirHistorico = () => {
    setHistorico((v) => !v);
    window.setTimeout(() => document.getElementById('meu-historico')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

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
      <div className="lv-empty max-w-xl mx-auto">
        <h1 className="lv-h2">Sua história começa aqui.</h1>
        <p className="lv-sub">Entre para guardar os shows que você viveu e ver o seu Passaporte crescer.</p>
        <Stub icone={Plus} onClick={() => livvo.entrar()}>
          Entrar no Livvo
        </Stub>
      </div>
    );
  }

  const dadosCredencial = () => ({
    nome: lv.perfil.nome,
    usuario: `@${lv.perfil.usuario}`,
    shows: pass.shows,
    numero: numeroCadastro(),
    desde: pass.primeiroShow ? new Date(pass.primeiroShow.ts).getFullYear() : undefined,
    foto,
  });

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      setFoto(await prepararFoto(file));
      avisar('Foto na credencial');
    } catch {
      avisar('Não deu para abrir esta foto. Envie em JPG ou PNG (HEIC do iPhone não abre em todos os navegadores).');
    }
  };

  const compartilharCredencial = async () => {
    if (gerando) return;
    setGerando(true);
    try {
      const blob = await exportarCredencialPNG(dadosCredencial());
      const nomeArq = `Livvo_Credencial_${lv.perfil.usuario.replace(/[^\w.-]+/g, '') || 'fa'}.png`;
      const arquivo = new File([blob], nomeArq, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [arquivo] })) {
        await nav.share({ files: [arquivo], title: 'Minha credencial Livvo' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nomeArq;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) avisar('Não deu para gerar a credencial agora.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div>
      <input ref={inputFoto} type="file" accept="image/*" className="hidden" onChange={escolherFoto} />

      <Bilhete
        rotulo="Passaporte"
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
        <div className="lv-pad grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <PassportIcon size={34} className="text-[#2FB8BA] shrink-0 mt-1 hidden sm:block" />
              <div className="min-w-0">
                <h1 className="lv-display lv-titulo-teal text-[clamp(28px,5.4vw,44px)]">Passaporte Oficial de Shows</h1>
                <p className="lv-sub mt-2">Cada show que você registra vira um carimbo aqui. Os antigos contam também.</p>
              </div>
            </div>

            <div className="mt-7">
              <div className="lv-label">Titular · Nome</div>
              <div className="lv-display text-[24px] mt-1.5">{lv.perfil.nome}</div>
              <div className="text-[13px] font-bold text-[#4FDCDE] mt-1">@{lv.perfil.usuario}</div>
            </div>

            {!catalogo ? (
              <div className="lv-skel mt-7" style={{ height: 120, maxWidth: 620 }} aria-busy="true" />
            ) : (
              <>
                <div className="mt-7">
                  <CamposPassaporte pass={pass} />
                </div>
                <div className="mt-7">
                  <ProgressoFaixa pass={pass} />
                </div>
              </>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Stub icone={Plus} to="/registrar">
                Registrar show
              </Stub>
              <Stub icone={Share2} cor="cream" onClick={compartilharCredencial} disabled={gerando}>
                {gerando ? 'Gerando…' : 'Compartilhar credencial'}
              </Stub>
            </div>
            {/* Do Livvo Virtual Poster: gráficos da Minha história e o Wrapped (07/10/2026) */}
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="lv-btn lv-btn--stub lv-btn--teal"
                aria-expanded={historico}
                aria-controls="meu-historico"
                onClick={abrirHistorico}
                disabled={!catalogo}
              >
                <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                <span>Meu histórico</span>
              </button>
              <button type="button" className="lv-btn lv-btn--stub lv-btn--cream" onClick={() => setWrapped(true)} disabled={!catalogo || pass.shows === 0}>
                <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                <span>Gerar meu Wrapped</span>
              </button>
            </div>
          </div>

          <div className="lv-badge-slot">
            <div className="lv-cred-wrap">
              <LivvoCredencialCard className="lv-badge-img lv-credencial" {...dadosCredencial()} />
              {!foto && (
                <button type="button" className="lv-cred-photo" data-empty="true" onClick={() => inputFoto.current?.click()}>
                  <span>
                    <Camera className="w-6 h-6" />
                    Adicionar foto
                  </span>
                </button>
              )}
            </div>
            <span className="lv-eyebrow">Credencial teste · com os seus dados</span>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              <button type="button" className="lv-link" onClick={() => inputFoto.current?.click()}>
                <Camera className="w-4 h-4" /> {foto ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              <button type="button" className="lv-link" onClick={compartilharCredencial} disabled={gerando}>
                <Share2 className="w-4 h-4" /> Compartilhar
              </button>
            </div>
          </div>
        </div>
        {historico && (
          <Suspense fallback={<div className="lv-skel m-5" style={{ height: 240 }} aria-busy="true" />}>
            <MeuHistorico pass={pass} fechar={() => setHistorico(false)} />
          </Suspense>
        )}
      </Bilhete>
      {wrapped && (
        <Suspense fallback={null}>
          <MeuWrapped pass={pass} usuario={lv.perfil.usuario} fechar={() => setWrapped(false)} />
        </Suspense>
      )}

      {buddies.length > 0 && (
        <section aria-label="Concert Buddies" className="max-w-[880px]">
          <Grupo titulo="Concert Buddies · mais shows juntos" extra={buddies.some((b) => b.exemplo) ? <TagExemplo /> : undefined} />
          <ListaBuddies buddies={buddies} limite={4} />
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="lv-display text-[24px] sm:text-[28px]">
          Carteira de ingressos <span className="lv-num text-[#4FDCDE] ml-1">{pass.shows}</span>
        </h2>
        <span className="flex items-center gap-2">
          <span className="lv-meta">Números, coleção e listas na</span>
          <TagProxima parte={3} />
        </span>
      </div>

      {!catalogo ? (
        <div className="lv-skel mt-6" style={{ height: 180 }} aria-busy="true" />
      ) : pass.shows === 0 ? (
        <div className="lv-empty mt-6">
          <h2 className="lv-h2">Nenhum show por aqui ainda.</h2>
          <p className="lv-sub">Comece pelo último show que você viu. Os antigos contam também.</p>
          <Stub icone={Plus} to="/registrar">
            Registrar show
          </Stub>
        </div>
      ) : (
        porAno.map((g) => (
          <section key={g.ano} aria-label={g.ano}>
            <Grupo titulo={`${g.ano} · ${g.itens.length === 1 ? '1 show' : `${g.itens.length} shows`}`} />
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {g.itens.map(({ memoria, show }) => {
                const d = dataCartao(show.ts);
                return (
                  <IngressoContorno
                    key={memoria.id}
                    rotulo={`${show.artista}, ${show.casa}`}
                    canhoto={
                      <Link to={`/show/${show.id}`} tabIndex={-1} aria-hidden="true">
                        <Poster
                          show={show}
                          usuario={lv.perfil.usuario}
                          perso={personalizacaoDe(memoria)}
                          detalhes={{ setor: memoria.setor, comQuem: (memoria.buddies || []).filter((b) => b.status === 'aceita').map((b) => b.usuario) }}
                        />
                      </Link>
                    }
                  >
                    <Link to={`/show/${show.id}`} className="block group">
                      <h3 className="lv-display text-[22px] leading-tight lv-clamp-2 group-hover:text-white">{show.artista}</h3>
                      <p className="mt-1.5 text-[13px] font-bold text-[#ECE5D1]">
                        {d.dia} {d.mes.toLowerCase()} {d.ano}
                      </p>
                      <p className="lv-meta truncate">
                        {show.casa} · {show.cidade}
                      </p>
                    </Link>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {memoria.notaShow !== undefined ? (
                        <>
                          <Discos valor={memoria.notaShow} tamanho={15} rotulo="Nota do show" />
                          <span className="lv-nota-num text-[15px]">{nota(memoria.notaShow)}</span>
                        </>
                      ) : (
                        <span className="lv-tag lv-tag--next">Sem nota</span>
                      )}
                      {memoria.notaOrganizacao === undefined && (
                        <Link to={`/show/${show.id}?avaliar=org`} className="lv-link !text-[12px]">
                          Falta a organização
                        </Link>
                      )}
                    </div>
                    <BotaoAtualizarFoto show={show} memoria={memoria} fotoCatalogo={show.foto} compacto className="mt-2.5" />
                  </IngressoContorno>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
};
