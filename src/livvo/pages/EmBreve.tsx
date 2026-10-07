import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../router';
import { Bilhete, TagProxima } from '../ui';

/** Página de espera para áreas das próximas partes da prévia, sempre com um caminho útil. */
export const EmBreve: React.FC<{
  kicker: string;
  titulo: string;
  texto: string;
  itens: string[];
  parte: number;
  acao: { to: string; rotulo: string };
}> = ({ kicker, titulo, texto, itens, parte, acao }) => (
  <div className="max-w-[760px]">
    <Bilhete
      esquerda={
        <>
          Livvo · <b>{kicker}</b>
        </>
      }
      direita={<TagProxima parte={parte} />}
    >
      <div className="lv-stage lv-pad">
        <h1 className="lv-h1">{titulo}</h1>
        <p className="lv-sub mt-3">{texto}</p>
        <div className="lv-group">O que entra aqui</div>
        <ul>
          {itens.map((i) => (
            <li key={i} className="py-3 border-b border-dashed border-[#282141] text-[14px] leading-relaxed">
              {i}
            </li>
          ))}
        </ul>
        <Link to={acao.to} className="lv-link mt-6">
          {acao.rotulo} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Bilhete>
  </div>
);
