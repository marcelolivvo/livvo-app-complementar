import React, { useState } from 'react';
import { LogIn, X } from 'lucide-react';
import type { Show } from './data/catalog';
import { dataCartao } from './format';
import { livvo, posterVisitante, VISIBILIDADE_PADRAO, type Memoria } from './store';
import { Modal } from './AtualizarFoto';
import { BotaoCompartilhar } from './Compartilhar';
import { Bilhete, CarimboFui, Poster } from './ui';

/**
 * Pôster grátis do visitante (revisão 11, decisão de 07/10/2026): sem login, a pessoa cria e compartilha
 * 1 pôster. Guardar na história ou criar o 2º pôster pede login.
 */
const JanelaPosterVisitante: React.FC<{ show: Show; fechar: () => void }> = ({ show, fechar }) => {
  const d = dataCartao(show.ts);
  // Memória só para desenhar a imagem; não é gravada em lugar nenhum
  const memoria: Memoria = { id: `visitante-${show.id}`, showId: show.id, criadaEm: 0, atualizadaEm: 0, visibilidade: VISIBILIDADE_PADRAO, origem: 'usuario' };
  return (
    <Modal rotulo={`Seu pôster: ${show.artista}`} fechar={fechar}>
      <Bilhete
        esquerda={
          <>
            Livvo · <b>Seu pôster</b>
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
            <Poster show={show} />
          </div>
          <div className="min-w-0">
            <CarimboFui animar texto="Pronto" />
            <h2 className="lv-display text-[26px] leading-tight mt-3">{show.artista}</h2>
            <p className="lv-meta mt-1">
              {show.casa} · {show.cidade} · {d.dia} {d.mes.toLowerCase()} {d.ano}
            </p>
            <p className="lv-sub mt-4">Seu pôster está pronto para compartilhar, sem precisar de conta.</p>
            <div className="mt-5 grid gap-2.5 max-w-[320px]">
              <BotaoCompartilhar show={show} memoria={memoria} usuario="" botao />
              <button
                type="button"
                className="lv-btn lv-btn--stub lv-btn--cream w-full whitespace-nowrap"
                onClick={() => {
                  fechar();
                  posterVisitante.guardarAoEntrar(show.id);
                }}
              >
                <LogIn className="w-4 h-4 shrink-0" strokeWidth={2.2} /> <span>Entrar e guardar</span>
              </button>
            </div>
            <p className="lv-meta mt-3 max-w-[340px]">Para guardar este show na sua história e criar outros pôsteres, entre no Livvo. Leva menos de um minuto.</p>
          </div>
        </div>
      </Bilhete>
    </Modal>
  );
};

/**
 * "Eu fui" de quem pode estar sem login. Com login, registra (devolve a memória);
 * sem login, abre o pôster grátis (1 por visitante) ou, depois dele, a tela de entrar.
 */
export const useEuFui = () => {
  const [visitante, setVisitante] = useState<Show | null>(null);
  const euFui = (show: Show, logado: boolean): Memoria | null => {
    if (logado) return livvo.registrar(show.id);
    if (posterVisitante.podeCriar(show.id)) {
      posterVisitante.criar(show.id);
      setVisitante(show);
    } else {
      livvo.entrar();
    }
    return null;
  };
  const janela = visitante ? <JanelaPosterVisitante show={visitante} fechar={() => setVisitante(null)} /> : null;
  return { euFui, janela };
};
