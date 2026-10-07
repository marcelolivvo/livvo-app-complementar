import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../router';
import { TagProxima } from '../ui';

/** Página de espera para áreas das próximas partes da prévia, sempre com um caminho útil. */
export const EmBreve: React.FC<{
  kicker: string;
  titulo: string;
  texto: string;
  itens: string[];
  parte: number;
  acao: { to: string; rotulo: string };
}> = ({ kicker, titulo, texto, itens, parte, acao }) => (
  <div className="max-w-[720px]">
    <div className="flex items-center gap-2">
      <span className="lv-kicker lv-kicker--cyan">{kicker}</span>
      <TagProxima parte={parte} />
    </div>
    <h1 className="lv-h1 mt-1.5">{titulo}</h1>
    <p className="lv-sub mt-3">{texto}</p>
    <div className="lv-card mt-6 p-5">
      <div className="lv-kicker">O que entra aqui</div>
      <ul className="mt-3 space-y-2.5">
        {itens.map((i) => (
          <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#2FB8BA] shrink-0" />
            {i}
          </li>
        ))}
      </ul>
    </div>
    <Link to={acao.to} className="lv-link mt-6">
      {acao.rotulo} <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);
