import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, LogIn } from 'lucide-react';
import { guestService, GUEST_CARD_LIMIT } from '../services/guestService';
import { useModalA11y } from '../utils/useModalA11y';
import { LivvoLogo } from './LivvoLogo';

/**
 * Tela de login ágil (#12). Abre quando a pessoa sem login chega ao 4º card,
 * ou pelo menu do usuário. Nesta prévia o login é simulado no navegador.
 */
export const LoginModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => guestService.onOpenRequest(() => setIsOpen(true)), []);

  const close = () => {
    setIsOpen(false);
    setError(null);
  };
  useModalA11y(isOpen, close, boxRef);

  if (!isOpen) return null;

  const reachedLimit = !guestService.isLoggedIn() && guestService.usedCount() >= GUEST_CARD_LIMIT;

  const enter = (value: string) => {
    const v = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError('Digite um e-mail válido.');
      return;
    }
    guestService.login(v);
    close();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lv-login-title"
        tabIndex={-1}
        className="lv-login bg-[#171226] border border-[#3A3159] rounded-2xl w-full max-w-[400px] p-6 space-y-5 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fechar login"
          className="absolute right-3 top-3 p-2 rounded-lg text-[#8A8577] hover:text-[#ECE5D1] hover:bg-[#1E1833]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <LivvoLogo className="w-11 h-11" />
          <div>
            <h2 id="lv-login-title" className="lv-display text-[22px] text-[#ECE5D1] leading-tight">
              Entre no Livvo
            </h2>
            <p className="text-[12.5px] text-[#B3AE9F]">Leva poucos segundos.</p>
          </div>
        </div>

        <p className="text-[13.5px] text-[#ECE5D1] leading-relaxed">
          {reachedLimit
            ? `Você já criou ${GUEST_CARD_LIMIT} cards sem login. Entre para continuar criando, salvando e compartilhando quantos quiser.`
            : 'Entre para guardar seus cards e criar quantos quiser.'}
        </p>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            enter(email);
          }}
        >
          <label htmlFor="lv-login-email" className="lv-eyebrow block">
            E-mail
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#8A8577] absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="lv-login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="voce@email.com"
              className="lv-input pl-6"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'lv-login-error' : undefined}
            />
          </div>
          {error && (
            <p id="lv-login-error" role="alert" className="text-[12px] text-[#FF8A8A]">
              {error}
            </p>
          )}
          <button type="submit" className="lv-btn lv-btn--cyan w-full">
            <LogIn className="w-4 h-4" />
            <span>Continuar</span>
          </button>
        </form>

        <button type="button" onClick={close} className="lv-link w-full justify-center text-[#B3AE9F]">
          Agora não
        </button>

        <p className="lv-mono text-[10.5px] text-[#8A8577] border-t border-dashed border-[#282141] pt-3">
          Prévia de teste: o login é simulado neste navegador e nenhum dado é enviado. No livvomusic.com.br, esta tela usa o login real.
        </p>
      </div>
    </div>
  );
};
