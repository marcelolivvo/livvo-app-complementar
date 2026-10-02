import React, { useState } from 'react';
import './b2b-brand.css';
import { B2BDashboard } from './B2BDashboard';

const areas = [
  { slug: 'influencers-plus', title: 'Livvo para Influencers Plus' },
  { slug: 'casas-de-shows', title: 'Livvo para Casas de Shows' },
  { slug: 'artistas', title: 'Livvo para Artistas' },
  { slug: 'produtoras', title: 'Livvo para Produtoras' },
  { slug: 'fa-clubes', title: 'Livvo para Fã Clubes' },
];

export const LivvoB2B: React.FC = () => {
  const [selected, setSelected] = useState(areas[0]);
  const [mode, setMode] = useState<'dashboard' | 'presentation'>('dashboard');
  return (
    <section aria-label="Livvo B2B" className="livvo-b2b space-y-6">
      <div>
        <h1 className="text-3xl text-[#ECE5D1]" style={{ fontFamily: 'Alfa Slab One' }}>Livvo B2B</h1>
        <p className="text-[#B3AE9F] mt-2">Conheça as áreas do Livvo para parceiros.</p>
      </div>
      <nav aria-label="Áreas do Livvo B2B" className="flex flex-wrap gap-2">
        {areas.map(area => (
          <button key={area.slug} aria-pressed={selected.slug === area.slug} onClick={() => setSelected(area)} className={`rounded-full px-4 py-3 text-sm font-semibold border ${selected.slug === area.slug ? 'bg-[#4FDCDE] text-[#100C1F] border-[#4FDCDE]' : 'bg-[#171226] text-[#ECE5D1] border-[#282141] hover:border-[#2FB8BA]'}`}>
            {area.title}
          </button>
        ))}
      </nav>
      <nav aria-label="Modo da área B2B" className="flex gap-4 border-b border-[#282141] pb-4">
        <button aria-pressed={mode === 'dashboard'} onClick={() => setMode('dashboard')} className={mode === 'dashboard' ? 'text-[#4FDCDE] font-semibold' : 'text-[#B3AE9F]'}>Ambiente de trabalho</button>
        <button aria-pressed={mode === 'presentation'} onClick={() => setMode('presentation')} className={mode === 'presentation' ? 'text-[#4FDCDE] font-semibold' : 'text-[#B3AE9F]'}>Apresentação</button>
      </nav>
      <div className={mode === 'dashboard' ? '' : 'hidden'}><B2BDashboard slug={selected.slug} /></div>
      {mode === 'presentation' && <iframe key={selected.slug} src={`/b2b/${selected.slug}.html`} title={selected.title} sandbox="allow-scripts" className="w-full h-[75vh] min-h-[500px] rounded-2xl border border-[#282141] bg-[#100C1F]" />}
    </section>
  );
};
