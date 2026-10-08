import React from 'react';

/**
 * Livvo Credencial Backstage com os dados do usuário (teste DRAFT).
 * Usa o mesmo componente da pasta Livvo (`livvo-badge-teste/credencial-backstage/livvo-credencial.js`),
 * copiado em `public/credencial/`. A peça é desenhada num <canvas> nas coordenadas da arte original
 * (2143 x 3509 px), então a tela e o PNG exportado saem idênticos.
 * Campos dinâmicos: Nº de cadastro, nome, @, shows, desde (ano do primeiro show), nível, acesso e foto.
 */

export interface DadosCredencial {
  nome: string;
  usuario: string;
  shows: number;
  numero: number;
  desde?: number;
  foto?: string | null;
  nivel?: string; // nível vindo do Estúdio ("Fã Platina" vira "Nível 4"); sem nível, calcula pelos shows (só faixas, revisão 11)
}

interface LivvoCredencialAPI {
  render: (el: HTMLElement, dados: Record<string, unknown>) => Promise<{ nivel: string; acesso: string; foto: string | null }>;
  exportarPNG: (dados: Record<string, unknown>) => Promise<Blob>;
}

declare global {
  interface Window {
    LivvoCredencial?: LivvoCredencialAPI;
  }
}

const SCRIPT = '/credencial/livvo-credencial.js';
let carregando: Promise<LivvoCredencialAPI> | null = null;

export function carregarCredencial(): Promise<LivvoCredencialAPI> {
  if (window.LivvoCredencial) return Promise.resolve(window.LivvoCredencial);
  if (!carregando) {
    carregando = new Promise((ok, erro) => {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => (window.LivvoCredencial ? ok(window.LivvoCredencial) : erro(new Error('Credencial não carregou')));
      s.onerror = () => {
        carregando = null;
        erro(new Error('Credencial não carregou'));
      };
      document.head.appendChild(s);
    });
  }
  return carregando;
}

function paraComponente(d: DadosCredencial): Record<string, unknown> {
  return {
    nome: d.nome,
    usuario: d.usuario,
    shows: d.shows,
    numero: d.numero,
    desde: d.desde ?? '',
    foto: d.foto || undefined,
    nivel: d.nivel && !/novo/i.test(d.nivel) ? d.nivel : undefined,
  };
}

export async function exportarCredencialPNG(d: DadosCredencial): Promise<Blob> {
  const api = await carregarCredencial();
  return api.exportarPNG(paraComponente(d));
}

export const LivvoCredencialCard: React.FC<DadosCredencial & { className?: string }> = ({ className, ...dados }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const chave = JSON.stringify(dados);

  React.useEffect(() => {
    let vivo = true;
    carregarCredencial()
      .then((api) => {
        if (vivo && ref.current) return api.render(ref.current, paraComponente(JSON.parse(chave)));
      })
      .catch(() => {
        /* sem a credencial: o espaço fica vazio, o resto da Wallet segue normal */
      });
    return () => {
      vivo = false;
    };
  }, [chave]);

  return <div ref={ref} className={`livvo-credencial ${className || ''}`} />;
};
