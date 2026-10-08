import React, { Suspense, lazy, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from './AppShell';
import { Link, navigate, useRoute } from './router';
import { carregarCatalogo } from './data/catalog';
import { Inicio } from './pages/Inicio';
import { Explorar } from './pages/Explorar';
import { ShowDetalhe } from './pages/ShowDetalhe';
import { Registrar } from './pages/Registrar';
import { MinhaHistoria } from './pages/MinhaHistoria';
import { EmBreve } from './pages/EmBreve';
import { Comunidade } from './pages/Comunidade';
import { Entrar } from './pages/Entrar';
import { useLivvo } from './store';
import './livvo.css';

// O laboratório (Estúdio, Wallet, área interna) só carrega quando alguém abre /estudio
const Laboratorio = lazy(() => import('../App').then((m) => ({ default: m.App })));

const TITULOS: Record<string, string> = {
  '': 'Livvo · Sua história através dos seus shows',
  explorar: 'Shows · Livvo',
  registrar: 'Registrar show · Livvo',
  comunidade: 'Comunidade · Livvo',
  'minha-historia': 'Minha História · Livvo',
  entrar: 'Entrar · Livvo',
  alertas: 'Alertas · Livvo',
  estudio: 'Estúdio (laboratório) · Livvo',
};

export const LivvoApp: React.FC = () => {
  const { segments } = useRoute();
  const raiz = segments[0] || '';
  const lv = useLivvo();

  // Página de entrada (revisão 8): quem chega sem ter entrado vê a homepage do Livvo (cópia ligada ao app em
  // public/bem-vindo/index.html). Quem já entrou segue para o Início.
  useEffect(() => {
    if (raiz === '' && !lv.logado) window.location.replace('/bem-vindo');
  }, [raiz, lv.logado]);

  useEffect(() => {
    if (raiz !== 'show') document.title = TITULOS[raiz] || TITULOS['']!;
  }, [raiz]);

  // Começa a baixar o catálogo logo na abertura (Explorar e Detalhe ficam instantâneos)
  useEffect(() => {
    carregarCatalogo().catch(() => undefined);
  }, []);

  // A área interna do redesign mora no laboratório (menu de admin do Estúdio)
  useEffect(() => {
    if (raiz === 'admin') navigate('/estudio', { replace: true });
  }, [raiz]);

  if (raiz === 'estudio' || raiz === 'admin') {
    return (
      <>
        <div className="bg-[#100C1F] border-b border-dashed border-[#3A3159] px-4 py-2 flex items-center justify-between gap-3 text-[12px]">
          <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-[#4FDCDE] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Livvo final
          </Link>
          <span className="text-[#8A8577] text-right">Laboratório do redesign: Estúdio, Wallet e área interna, como estavam</span>
        </div>
        <Suspense fallback={<div className="min-h-screen bg-[#100C1F]" />}>
          <Laboratorio />
        </Suspense>
      </>
    );
  }

  let pagina: React.ReactNode;
  switch (raiz) {
    case '':
      if (!lv.logado) return <div className="min-h-screen bg-[#100C1F]" aria-busy="true" />;
      pagina = <Inicio />;
      break;
    case 'entrar':
      pagina = <Entrar />;
      break;
    case 'explorar':
      pagina = <Explorar />;
      break;
    case 'show':
      pagina = segments[1] ? <ShowDetalhe id={segments[1]} /> : <Explorar />;
      break;
    case 'registrar':
      pagina = <Registrar />;
      break;
    case 'minha-historia':
      pagina = <MinhaHistoria />;
      break;
    case 'comunidade':
      pagina = <Comunidade />;
      break;
    case 'alertas':
      pagina = (
        <EmBreve
          kicker="Alertas e agenda"
          titulo="Não perca o próximo show de quem você gosta"
          texto="Siga artistas e até 5 cidades. Quando um show for anunciado, o Livvo avisa pelo canal que você escolher."
          itens={[
            'Artistas e cidades que você segue.',
            'Quero ir e Tenho ingresso, com contagem regressiva.',
            'Lembrete na véspera e “Como foi?” na manhã seguinte.',
            'Canal de aviso: e-mail primeiro; WhatsApp e push com o seu consentimento.',
          ]}
          parte={4}
          acao={{ to: '/explorar?aba=proximos', rotulo: 'Ver os próximos shows' }}
        />
      );
      break;
    default:
      pagina = (
        <div className="lv-empty">
          <p className="lv-h2">Esta página não existe.</p>
          <Link to="/" className="lv-btn lv-btn--cyan">
            Ir para o Início
          </Link>
        </div>
      );
  }

  return <AppShell>{pagina}</AppShell>;
};
