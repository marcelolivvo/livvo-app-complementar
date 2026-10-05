import React from 'react';

/**
 * Livvo Badge Teste com os dados do usuário.
 * Base: imagem do Firefly (528 x 1166). As áreas de dados de exemplo (foto, nome,
 * números, nível e faixa de acesso) são cobertas e redesenhadas com os dados reais.
 * Coordenadas medidas na imagem original.
 */

export interface LivvoBadgeCardProps {
  photoUrl?: string | null;
  handle: string; // @usuario
  name?: string; // nome de exibição (ainda não existe no app; usa o @ sem arroba)
  totalShows: number;
  sinceYear?: number;
  level: number; // 1..5 (0 = sem nível)
  levelTitle: string; // 'Fã Bronze' ... 'Lenda Viva'
  medalColor?: string;
  className?: string;
}

// Nível de fã -> nível de acesso do crachá (proposta do canvas "Livvo Crachá de Show")
const ACCESS: Record<number, string> = {
  0: 'PISTA',
  1: 'PISTA',
  2: 'PISTA PREMIUM',
  3: 'CAMAROTE',
  4: 'BACKSTAGE',
  5: 'ALL ACCESS',
};

const CREAM = '#EEE6D0'; // creme do crachá (amostrado na imagem)
const INK = '#0C0817'; // tarja de baixo (amostrada)
const CYAN = '#4FDCDE';
const TEAL = '#2FB8BA';
const PRETO = '#100C1F';

export const LivvoBadgeCard: React.FC<LivvoBadgeCardProps> = ({
  photoUrl,
  handle,
  name,
  totalShows,
  sinceYear,
  level,
  levelTitle,
  medalColor = '#C9CED6',
  className,
}) => {
  const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
  const display = (name || cleanHandle.replace(/^@/, '')).trim();
  // Nome em até 2 linhas, quebrando no espaço do meio
  const words = display.split(/\s+/);
  let line1 = display;
  let line2 = '';
  if (words.length > 1) {
    const half = Math.ceil(words.length / 2);
    line1 = words.slice(0, half).join(' ');
    line2 = words.slice(half).join(' ');
  }
  const longest = Math.max(line1.length, line2.length);
  const nameSize = longest <= 8 ? 44 : longest <= 11 ? 36 : longest <= 14 ? 30 : 24;
  const access = ACCESS[level] ?? 'PISTA';
  const accessSize = access.length <= 9 ? 56 : access.length <= 10 ? 52 : 40;
  const pillText = levelTitle;
  const showsStr = String(totalShows);
  const showsSize = showsStr.length >= 4 ? 22 : showsStr.length === 3 ? 27 : 32;
  const clipId = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 528 1166"
      className={className}
      role="img"
      aria-label={`Credencial de fã Livvo de ${cleanHandle}: ${totalShows} shows, ${levelTitle}, acesso ${access}`}
    >
      <defs>
        <clipPath id={`ph-${clipId}`}>
          <rect x={46} y={426} width={436} height={393} />
        </clipPath>
      </defs>

      {/* Base */}
      <image href="/badges/livvo-badge-teste.webp" x={0} y={0} width={528} height={1166} />

      {/* Foto do titular (quadrado recortado no app, preenche a moldura) */}
      <g clipPath={`url(#ph-${clipId})`}>
        <rect x={46} y={426} width={436} height={393} fill={TEAL} />
        {photoUrl ? (
          <image href={photoUrl} x={46} y={426} width={436} height={393} preserveAspectRatio="xMidYMid slice" />
        ) : (
          <>
            <path d="M46,700 L200,426 L250,426 L96,700 Z" fill={CREAM} opacity={0.9} />
            <path d="M330,819 L482,560 L482,640 L380,819 Z" fill={CREAM} opacity={0.9} />
            <text x={264} y={628} textAnchor="middle" className="lv-mono" fontSize={20} letterSpacing="3" fill={PRETO}>
              SUA FOTO AQUI
            </text>
          </>
        )}
      </g>
      {/* Selo holográfico original por cima da foto */}
      <image href="/badges/livvo-badge-selo.png" x={362} y={699} width={121} height={120} />

      {/* Nome, @, números e nível */}
      <rect x={40} y={824} width={450} height={136} fill={CREAM} />
      <text x={46} y={line2 ? 872 : 892} className="lv-display" fontSize={nameSize} fill={PRETO}>
        {line1}
      </text>
      {line2 && (
        <text x={46} y={872 + nameSize * 0.92} className="lv-display" fontSize={nameSize} fill={PRETO}>
          {line2}
        </text>
      )}
      <text x={46} y={946} fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight={600} fontSize={20} fill={PRETO}>
        {cleanHandle}
      </text>

      {/* Shows | Desde */}
      <text x={352} y={884} textAnchor="middle" className="lv-num" fontSize={showsSize} fill={PRETO}>
        {totalShows}
      </text>
      <text x={352} y={906} textAnchor="middle" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight={600} fontSize={14} fill={PRETO}>
        {totalShows === 1 ? 'SHOW' : 'SHOWS'}
      </text>
      <line x1={392} x2={392} y1={848} y2={910} stroke={PRETO} strokeWidth={2} />
      <text x={438} y={884} textAnchor="middle" className="lv-num" fontSize={24} fill={PRETO}>
        {sinceYear ?? '----'}
      </text>
      <text x={438} y={906} textAnchor="middle" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif" fontWeight={600} fontSize={14} fill={PRETO}>
        DESDE
      </text>

      {/* Pílula do nível */}
      <rect x={316} y={918} width={166} height={36} rx={18} fill={PRETO} />
      <text
        x={336}
        y={942}
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontWeight={700}
        fontSize={pillText.length > 11 ? 15 : 17}
        fill={CREAM}
      >
        {pillText}
      </text>
      <circle cx={462} cy={936} r={11} fill={medalColor} stroke={CREAM} strokeWidth={2} />

      {/* Faixa de acesso pelo nível */}
      <rect x={36} y={970} width={458} height={80} fill={INK} />
      <text
        x={264}
        y={1030}
        textAnchor="middle"
        className="lv-display"
        fontSize={accessSize}
        fill={CYAN}
        textLength={access.length > 6 ? 436 : undefined}
        lengthAdjust="spacingAndGlyphs"
      >
        {access}
      </text>
    </svg>
  );
};
