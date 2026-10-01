import React from 'react';

interface LivvoLogoProps {
  className?: string;
  size?: number;
}

export const LivvoLogo: React.FC<LivvoLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <div
      style={size ? { width: size, height: size } : undefined}
      className={`relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-tr from-[#2FB8BA] via-[#22E3E6] to-[#4FDCDE] p-0.5 shadow-lg shadow-[#2FB8BA]/25 select-none ${className}`}
    >
      <div className="w-full h-full bg-[#100C1F] rounded-[14px] flex items-center justify-center relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#2FB8BA]/30 rounded-full blur-sm pointer-events-none" />
        <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ECE5D1] via-[#4FDCDE] to-[#2FB8BA] text-lg sm:text-xl tracking-tighter">
          L
        </span>
      </div>
    </div>
  );
};
