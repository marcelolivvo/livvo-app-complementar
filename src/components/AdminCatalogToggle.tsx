import React, { useEffect, useState } from 'react';
import { Database, Lock, RefreshCw } from 'lucide-react';
import { adminCatalog } from '../services/adminCatalogService';

/** Bloco do menu Admin que liga o catálogo completo (CSV) com o código de admin. */
export const AdminCatalogToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(adminCatalog.isEnabled());
  const [hasKey, setHasKey] = useState(adminCatalog.hasKey());
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(
    () =>
      adminCatalog.onChange(() => {
        setEnabled(adminCatalog.isEnabled());
        setHasKey(adminCatalog.hasKey());
      }),
    []
  );

  const toggle = () => {
    setMsg(null);
    if (enabled) return adminCatalog.setEnabled(false);
    if (hasKey) return adminCatalog.setEnabled(true);
    setAsking(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await adminCatalog.unlock(code);
    setBusy(false);
    setMsg(r.message);
    if (r.ok) {
      setAsking(false);
      setCode('');
    }
  };

  return (
    <div className="px-3 py-2.5 rounded-2xl border border-[#282141] space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-[#2FB8BA]/10 text-[#2FB8BA] shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#ECE5D1] leading-tight">Catálogo completo (CSV)</div>
            <div className="text-[11px] text-[#B3AE9F] mt-0.5">
              {enabled ? '114.800 shows · 12.385 artistas' : 'Desligado · lista padrão de 145 artistas'}
            </div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
            enabled ? 'bg-[#4FDCDE]' : 'bg-[#282141]'
          }`}
          title={enabled ? 'Desligar catálogo completo' : 'Ligar catálogo completo'}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-[#100C1F] transition-all ${enabled ? 'left-5' : 'left-1'}`}
          />
        </button>
      </div>

      {asking && (
        <form onSubmit={submit} className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#4FDCDE] shrink-0" />
          <input
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de admin"
            className="flex-1 min-w-0 bg-transparent border-b border-[#3A3159] focus:border-[#4FDCDE] outline-none text-[12px] text-[#ECE5D1] py-1"
            autoFocus
          />
          <button
            type="submit"
            disabled={busy}
            className="text-[11px] font-bold text-[#100C1F] bg-[#4FDCDE] rounded-lg px-2.5 py-1 cursor-pointer"
          >
            {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Liberar'}
          </button>
        </form>
      )}

      {msg && <p className="text-[11px] text-[#4FDCDE]">{msg}</p>}

      {hasKey && !asking && (
        <button
          type="button"
          onClick={() => {
            adminCatalog.lock();
            setMsg('Código removido deste navegador.');
          }}
          className="text-[10.5px] text-[#8A8577] hover:text-[#ECE5D1] cursor-pointer"
        >
          Esquecer código neste navegador
        </button>
      )}
    </div>
  );
};
