import React, { useEffect } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { navigate } from '../router';
import { livvo, useLivvo } from '../store';
import { Bilhete, Stub } from '../ui';

/**
 * /entrar (revisão 8): destino de "Entrar", "Pedir acesso" e "Quero entrar no Livvo" da página de entrada.
 * Abre a janela de entrar da prévia; depois de entrar, vai ao Início. Quem já entrou vai direto ao Início.
 */
export const Entrar: React.FC = () => {
  const lv = useLivvo();
  useEffect(() => {
    if (lv.logado) {
      navigate('/', { replace: true });
      return;
    }
    // espera a janela de entrar (montada pelo AppShell) começar a ouvir o pedido
    const t = window.setTimeout(() => livvo.entrar(), 60);
    return () => window.clearTimeout(t);
  }, [lv.logado]);
  return (
    <div className="max-w-xl mx-auto">
      <Bilhete
        esquerda={
          <>
            Livvo · <b>Entrar</b>
          </>
        }
        direita="Prévia"
      >
        <div className="lv-pad">
          <h1 className="lv-h2">Entre na prévia do Livvo.</h1>
          <p className="lv-sub mt-2">Use a conta de demonstração para ver a sua história, registrar shows e testar tudo.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Stub icone={LogIn} onClick={() => livvo.entrar()}>
              Entrar
            </Stub>
            <a href="/bem-vindo" className="lv-link">
              <ArrowLeft className="w-4 h-4" /> Voltar à página do Livvo
            </a>
          </div>
        </div>
      </Bilhete>
    </div>
  );
};
