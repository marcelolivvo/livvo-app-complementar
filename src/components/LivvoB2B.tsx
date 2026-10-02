import React, { useState } from 'react';

const areas = [
  { slug: 'influencers-plus', title: 'Livvo para Influencers Plus' },
  { slug: 'casas-de-shows', title: 'Livvo para Casas de Shows' },
  { slug: 'artistas', title: 'Livvo para Artistas' },
  { slug: 'produtoras', title: 'Livvo para Produtoras' },
  { slug: 'fa-clubes', title: 'Livvo para Fã Clubes' },
];

export const LivvoB2B: React.FC = () => {
  const [selected, setSelected] = useState(areas[0]);
  return (
    <section aria-label="Livvo B2B" className="space-y-6">
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
      <iframe key={selected.slug} src={`/b2b/${selected.slug}.html`} title={selected.title} sandbox="allow-scripts" className="w-full h-[75vh] min-h-[500px] rounded-2xl border border-[#282141] bg-[#100C1F]" />
    </section>
  );
};
