import React, { useState, useEffect } from 'react';
import data from './b2bDashboardData.json';

type RoleData = { name: string; title: string; intro: string; metrics: string[][]; panel: string; ratings?: number[]; rows?: string[][]; action: string[]; features: string[][]; steps: string[][] };
type Draft = { title: string; owner: string };
const roles: Record<string, RoleData> = data;
const roleKeys: Record<string, string> = { 'influencers-plus': 'plus', 'casas-de-shows': 'casas', artistas: 'artistas', produtoras: 'produtoras', 'fa-clubes': 'clubes' };
const views = ['Visão geral', 'Funcionalidades', 'Jornada', 'Rascunhos'];

export const B2BDashboard: React.FC<{ slug: string }> = ({ slug }) => {
  const role = roles[roleKeys[slug]];
  const [view, setView] = useState(views[0]);
  const [drafts, setDrafts] = useState<Record<string, Draft[]>>({});
  const [form, setForm] = useState<Draft | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { setView('Visão geral'); setForm(null); setNotice(''); }, [slug]);
  const card = 'rounded-2xl border border-[#282141] bg-[#171226] p-6';
  const button = 'b2b-primary rounded-full bg-[#4FDCDE] text-[#100C1F] px-5 py-3 font-semibold';
  const openDraft = () => setForm({ title: role.action[1], owner: '' });
  const currentDrafts = drafts[slug] || [];
  return (
    <section className="space-y-6" aria-label={`Dashboard ${role.name}`}>
      <p className="rounded-xl border border-[#2FB8BA]/40 p-3 text-sm text-[#B3AE9F]">Ambiente demonstrativo · Indicadores fictícios · Rascunhos mantidos nesta sessão, sem envio ou publicação.</p>
      <header className="b2b-header space-y-3">
        <div className="flex items-center gap-3"><img src="/brand/livvo-icon.png" alt="Livvo" width="52" height="52" className="w-[52px] h-[52px] object-contain" /><span className="b2b-eyebrow text-[#4FDCDE] text-xs">Ambiente de trabalho</span></div>
        <p className="b2b-eyebrow text-[#4FDCDE] text-sm">{role.name}</p>
        <h2 className="text-3xl sm:text-4xl max-w-3xl" style={{ fontFamily: 'Alfa Slab One' }}>{role.title.replace(/<br>/g, ' ')}</h2>
        <p className="max-w-3xl text-[#B3AE9F]">{role.intro}</p>
      </header>
      <nav aria-label="Seções do dashboard" className="flex gap-2 flex-wrap">
        {views.map(v => <button key={v} aria-pressed={view === v} onClick={() => { setView(v); setNotice(''); }} className={`rounded-full px-4 py-2 border ${view === v ? 'border-[#4FDCDE] text-[#4FDCDE]' : 'border-[#282141] text-[#B3AE9F]'}`}>{v}</button>)}
      </nav>
      <p role="status" className="text-[#4FDCDE]">{notice}</p>
      {view === 'Visão geral' && <>
        <div className="grid sm:grid-cols-3 gap-4">{role.metrics.map(m => <article key={m[0]} className={card}><h3 className="text-[#B3AE9F] text-sm">{m[0]}</h3><p className="b2b-number text-4xl text-[#4FDCDE] my-3">{m[1]}</p><p className="text-xs text-[#B3AE9F]">{m[2]}</p></article>)}</div>
        <div className="grid lg:grid-cols-2 gap-4">
          <article className={card}><h3 className="text-xl font-semibold mb-5">{role.panel}</h3>
            {role.ratings ? role.ratings.map((rating, i) => <div key={i} className="mb-5"><div className="flex justify-between mb-2"><span>{['Nota do Show', 'Nota da Organização'][i]}</span><b>{rating.toFixed(1).replace('.', ',')}</b></div><div className="h-2 rounded-full bg-[#282141]"><div className="h-2 rounded-full bg-[#4FDCDE]" style={{ width: `${rating / 5 * 100}%` }} /></div></div>) : role.rows?.map(row => <div key={row[0]} className="py-3 border-b border-[#282141]"><h4 className="font-semibold">{row[0]}</h4><p className="text-[#B3AE9F] mt-1">{row[1]}</p></div>)}
            <p className="text-xs text-[#B3AE9F] mt-4">Exemplo demonstrativo. Período: evento piloto. Nenhuma coleta real conectada.</p>
          </article>
          <article className={card}><p className="text-[#4FDCDE] text-sm">{role.action[0]}</p><h3 className="text-2xl my-4">{role.action[1]}</h3><p className="text-[#B3AE9F] mb-6">{role.action[2]}</p><button onClick={openDraft} className={button}>{role.action[3]}</button></article>
        </div>
      </>}
      {view === 'Funcionalidades' && <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{role.features.map(f => <article key={f[0]} className={card}><p className="text-xs text-[#4FDCDE]">{f[3]}</p><h3 className="text-xl font-semibold my-3">{f[0]}</h3><p className="text-[#B3AE9F]">{f[1]}</p><p className="mt-4 text-xs text-[#B3AE9F]">Conecta com: {f[2]}</p></article>)}</div>}
      {view === 'Jornada' && <ol className="grid md:grid-cols-2 gap-4">{role.steps.map((s, i) => <li key={s[0]} className={card}><span className="b2b-number text-[#4FDCDE] text-2xl">{String(i + 1).padStart(2, '0')}</span><h3 className="text-xl font-semibold my-3">{s[0]}</h3><p className="text-[#B3AE9F]">{s[1]}</p></li>)}</ol>}
      {view === 'Rascunhos' && <div className={card}><div className="flex flex-wrap justify-between gap-4"><h3 className="text-xl">Rascunhos de {role.name}</h3><button onClick={openDraft} className={button}>Novo rascunho</button></div>{currentDrafts.length ? <ul className="mt-6 space-y-4">{currentDrafts.map((d, i) => <li key={i} className="border-t border-[#282141] pt-4"><h4 className="font-semibold">{d.title}</h4><p className="text-[#B3AE9F]">Responsável: {d.owner} · Rascunho demonstrativo</p></li>)}</ul> : <p className="mt-6 text-[#B3AE9F]">Nenhum rascunho neste ambiente. Crie o primeiro para experimentar o fluxo.</p>}</div>}
      {form && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onKeyDown={e => { if (e.key === 'Escape') setForm(null); }}>
        <form role="dialog" aria-modal="true" aria-labelledby="draft-title" className={`${card} w-full max-w-lg space-y-4`} onSubmit={e => { e.preventDefault(); if (!form.title.trim() || !form.owner.trim()) return; setDrafts(prev => ({ ...prev, [slug]: [...(prev[slug] || []), { title: form.title.trim(), owner: form.owner.trim() }] })); setForm(null); setView('Rascunhos'); setNotice('Rascunho salvo nesta sessão.'); }}>
          <h3 id="draft-title" className="text-2xl">{role.action[3]}</h3><p className="text-sm text-[#B3AE9F]">Prepare um exemplo para {role.name}.</p>
          <label className="block">Título<input autoFocus required maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="block w-full bg-[#100C1F] border border-[#282141] rounded-lg p-3 mt-2" /></label>
          <label className="block">Responsável<input required maxLength={60} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className="block w-full bg-[#100C1F] border border-[#282141] rounded-lg p-3 mt-2" /></label>
          <div className="flex gap-3"><button type="submit" className={button}>Salvar rascunho</button><button type="button" onClick={() => setForm(null)} className="px-4">Cancelar</button></div>
        </form>
      </div>}
    </section>
  );
};
