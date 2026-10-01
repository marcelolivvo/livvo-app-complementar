import React from 'react';

interface MedalIllustrationProps {
  className?: string;
  unlocked?: boolean;
}

/**
 * 1. Medalha Bronze (Nível 1 - 3º Lugar)
 * Medalha de bronze redonda com número 3, fita azul no topo e folhas de louro
 */
export const BronzeMedalIllustration: React.FC<MedalIllustrationProps> = ({
  className = 'w-14 h-14',
  unlocked = true,
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${!unlocked ? 'grayscale opacity-40 brightness-75' : 'drop-shadow-[0_4px_12px_rgba(205,127,50,0.35)]'}`}
  >
    <defs>
      {/* Ribbon Gradient */}
      <linearGradient id="bronzeRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      {/* Outer Bronze Rim */}
      <linearGradient id="bronzeRimGrad" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#E29B63" />
        <stop offset="40%" stopColor="#B45309" />
        <stop offset="80%" stopColor="#78350F" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
      {/* Inner Bronze Face */}
      <radialGradient id="bronzeFaceGrad" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="65%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </radialGradient>
      {/* 3D Number 3 Gradient */}
      <linearGradient id="bronzeNumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="60%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Ribbon Left Fold */}
    <path
      d="M58 20L44 26C40 28 38 34 40 38L54 62C55 64 58 65 60 64L76 56L64 22C63 20 60 19 58 20Z"
      fill="url(#bronzeRibbonGrad)"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Ribbon Right Fold */}
    <path
      d="M102 20L116 26C120 28 122 34 120 38L106 62C105 64 102 65 100 64L84 56L96 22C97 20 100 19 102 20Z"
      fill="url(#bronzeRibbonGrad)"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Ribbon Inner Shadow / Fold Crease */}
    <path
      d="M72 40L60 64L76 56L80 44Z"
      fill="#172554"
      opacity="0.6"
    />
    <path
      d="M88 40L100 64L84 56L80 44Z"
      fill="#172554"
      opacity="0.6"
    />

    {/* Hanging Metal Rings */}
    <path
      d="M62 48C62 44 66 42 70 42C74 42 78 44 78 48V60H62V48Z"
      fill="#D97706"
      stroke="#451A03"
      strokeWidth="3"
    />
    <path
      d="M82 48C82 44 86 42 90 42C94 42 98 44 98 48V60H82V48Z"
      fill="#D97706"
      stroke="#451A03"
      strokeWidth="3"
    />

    {/* Outer Circular Medal Body */}
    <circle
      cx="80"
      cy="100"
      r="48"
      fill="url(#bronzeRimGrad)"
      stroke="#271810"
      strokeWidth="4"
    />

    {/* Inner Beveled Rim */}
    <circle
      cx="80"
      cy="100"
      r="40"
      fill="url(#bronzeFaceGrad)"
      stroke="#451A03"
      strokeWidth="2.5"
    />

    {/* Laurel Wreath Leaves (Left) */}
    <g fill="#78350F" opacity="0.8">
      <path d="M52 108C50 102 54 96 58 97C60 102 56 108 52 108Z" />
      <path d="M55 118C52 113 54 107 59 107C62 112 59 118 55 118Z" />
      <path d="M62 125C58 121 59 115 64 114C68 118 66 125 62 125Z" />
      <path d="M72 130C67 127 67 121 72 119C77 122 76 129 72 130Z" />
    </g>

    {/* Laurel Wreath Leaves (Right) */}
    <g fill="#78350F" opacity="0.8">
      <path d="M108 108C110 102 106 96 102 97C100 102 104 108 108 108Z" />
      <path d="M105 118C108 113 106 107 101 107C98 112 101 118 105 118Z" />
      <path d="M98 125C102 121 101 115 96 114C92 118 94 125 98 125Z" />
      <path d="M88 130C93 127 93 121 88 119C83 122 84 129 88 130Z" />
    </g>

    {/* Bold 3D Number "3" */}
    {/* Shadow behind 3 */}
    <path
      d="M68 83C68 76 74 72 82 72C89 72 95 76 95 82C95 86 92 89 87 91C93 93 96 98 96 104C96 112 88 117 80 117C71 117 65 112 65 104H74C74 108 77 111 81 111C85 111 88 108 88 103C88 98 84 95 79 95H75V89H79C83 89 86 86 86 82C86 78 84 76 81 76C78 76 76 78 76 83H68Z"
      fill="#451A03"
      transform="translate(1.5, 2.5)"
    />
    {/* Main Face of 3 */}
    <path
      d="M68 83C68 76 74 72 82 72C89 72 95 76 95 82C95 86 92 89 87 91C93 93 96 98 96 104C96 112 88 117 80 117C71 117 65 112 65 104H74C74 108 77 111 81 111C85 111 88 108 88 103C88 98 84 95 79 95H75V89H79C83 89 86 86 86 82C86 78 84 76 81 76C78 76 76 78 76 83H68Z"
      fill="url(#bronzeNumGrad)"
      stroke="#451A03"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Glossy highlight line on 3 */}
    <path
      d="M72 75C75 74 78 73.5 82 73.5C87 73.5 91 75 92 78"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

/**
 * 2. Medalha Prata (Nível 2 - 2º Lugar)
 * Medalha de prata com número 2, fita azul no topo e folhas de louro
 */
export const SilverMedalIllustration: React.FC<MedalIllustrationProps> = ({
  className = 'w-14 h-14',
  unlocked = true,
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${!unlocked ? 'grayscale opacity-40 brightness-75' : 'drop-shadow-[0_4px_12px_rgba(192,200,210,0.45)]'}`}
  >
    <defs>
      <linearGradient id="silverRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      {/* Outer Silver Rim */}
      <linearGradient id="silverRimGrad" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="35%" stopColor="#CBD5E1" />
        <stop offset="70%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      {/* Inner Silver Face */}
      <radialGradient id="silverFaceGrad" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="55%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#94A3B8" />
      </radialGradient>
      {/* 3D Number 2 Gradient */}
      <linearGradient id="silverNumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>

    {/* Ribbon Left Fold */}
    <path
      d="M58 20L44 26C40 28 38 34 40 38L54 62C55 64 58 65 60 64L76 56L64 22C63 20 60 19 58 20Z"
      fill="url(#silverRibbonGrad)"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Ribbon Right Fold */}
    <path
      d="M102 20L116 26C120 28 122 34 120 38L106 62C105 64 102 65 100 64L84 56L96 22C97 20 100 19 102 20Z"
      fill="url(#silverRibbonGrad)"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path
      d="M72 40L60 64L76 56L80 44Z"
      fill="#172554"
      opacity="0.6"
    />
    <path
      d="M88 40L100 64L84 56L80 44Z"
      fill="#172554"
      opacity="0.6"
    />

    {/* Hanging Metal Rings */}
    <path
      d="M62 48C62 44 66 42 70 42C74 42 78 44 78 48V60H62V48Z"
      fill="#CBD5E1"
      stroke="#334155"
      strokeWidth="3"
    />
    <path
      d="M82 48C82 44 86 42 90 42C94 42 98 44 98 48V60H82V48Z"
      fill="#CBD5E1"
      stroke="#334155"
      strokeWidth="3"
    />

    {/* Outer Circular Medal Body */}
    <circle
      cx="80"
      cy="100"
      r="48"
      fill="url(#silverRimGrad)"
      stroke="#1E293B"
      strokeWidth="4"
    />

    {/* Inner Beveled Rim */}
    <circle
      cx="80"
      cy="100"
      r="40"
      fill="url(#silverFaceGrad)"
      stroke="#475569"
      strokeWidth="2.5"
    />

    {/* Laurel Wreath Leaves (Left) */}
    <g fill="#64748B" opacity="0.75">
      <path d="M52 108C50 102 54 96 58 97C60 102 56 108 52 108Z" />
      <path d="M55 118C52 113 54 107 59 107C62 112 59 118 55 118Z" />
      <path d="M62 125C58 121 59 115 64 114C68 118 66 125 62 125Z" />
      <path d="M72 130C67 127 67 121 72 119C77 122 76 129 72 130Z" />
    </g>

    {/* Laurel Wreath Leaves (Right) */}
    <g fill="#64748B" opacity="0.75">
      <path d="M108 108C110 102 106 96 102 97C100 102 104 108 108 108Z" />
      <path d="M105 118C108 113 106 107 101 107C98 112 101 118 105 118Z" />
      <path d="M98 125C102 121 101 115 96 114C92 118 94 125 98 125Z" />
      <path d="M88 130C93 127 93 121 88 119C83 122 84 129 88 130Z" />
    </g>

    {/* Bold 3D Number "2" */}
    {/* Shadow behind 2 */}
    <path
      d="M67 82C67 74 73 70 82 70C91 70 96 75 96 82C96 88 92 93 84 98L74 106H97V114H65V107L80 94C85 90 87 87 87 83C87 79 84 76 80 76C76 76 73 79 73 83H67Z"
      fill="#334155"
      transform="translate(1.5, 2.5)"
    />
    {/* Main Face of 2 */}
    <path
      d="M67 82C67 74 73 70 82 70C91 70 96 75 96 82C96 88 92 93 84 98L74 106H97V114H65V107L80 94C85 90 87 87 87 83C87 79 84 76 80 76C76 76 73 79 73 83H67Z"
      fill="url(#silverNumGrad)"
      stroke="#334155"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Glossy highlight line on 2 */}
    <path
      d="M72 74C76 72 80 71.5 83 71.5C88 71.5 92 73 94 77"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

/**
 * 3. Medalha Ouro (Nível 3 - 1º Lugar)
 * Medalha de ouro brilhante com número 1, fita azul no topo e folhas de louro
 */
export const GoldMedalIllustration: React.FC<MedalIllustrationProps> = ({
  className = 'w-14 h-14',
  unlocked = true,
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${!unlocked ? 'grayscale opacity-40 brightness-75' : 'drop-shadow-[0_4px_16px_rgba(255,215,0,0.5)]'}`}
  >
    <defs>
      <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      {/* Outer Gold Rim */}
      <linearGradient id="goldRimGrad" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="35%" stopColor="#FACC15" />
        <stop offset="70%" stopColor="#CA8A04" />
        <stop offset="100%" stopColor="#854D0E" />
      </linearGradient>
      {/* Inner Gold Face */}
      <radialGradient id="goldFaceGrad" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="45%" stopColor="#FACC15" />
        <stop offset="90%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#A16207" />
      </radialGradient>
      {/* 3D Number 1 Gradient */}
      <linearGradient id="goldNumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#FEF9C3" />
        <stop offset="100%" stopColor="#FDE047" />
      </linearGradient>
    </defs>

    {/* Ribbon Left Fold */}
    <path
      d="M58 20L44 26C40 28 38 34 40 38L54 62C55 64 58 65 60 64L76 56L64 22C63 20 60 19 58 20Z"
      fill="url(#goldRibbonGrad)"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Ribbon Right Fold */}
    <path
      d="M102 20L116 26C120 28 122 34 120 38L106 62C105 64 102 65 100 64L84 56L96 22C97 20 100 19 102 20Z"
      fill="url(#goldRibbonGrad)"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path
      d="M72 40L60 64L76 56L80 44Z"
      fill="#172554"
      opacity="0.6"
    />
    <path
      d="M88 40L100 64L84 56L80 44Z"
      fill="#172554"
      opacity="0.6"
    />

    {/* Hanging Metal Rings */}
    <path
      d="M62 48C62 44 66 42 70 42C74 42 78 44 78 48V60H62V48Z"
      fill="#FACC15"
      stroke="#713F12"
      strokeWidth="3"
    />
    <path
      d="M82 48C82 44 86 42 90 42C94 42 98 44 98 48V60H82V48Z"
      fill="#FACC15"
      stroke="#713F12"
      strokeWidth="3"
    />

    {/* Outer Circular Medal Body */}
    <circle
      cx="80"
      cy="100"
      r="48"
      fill="url(#goldRimGrad)"
      stroke="#382006"
      strokeWidth="4"
    />

    {/* Inner Beveled Rim */}
    <circle
      cx="80"
      cy="100"
      r="40"
      fill="url(#goldFaceGrad)"
      stroke="#713F12"
      strokeWidth="2.5"
    />

    {/* Laurel Wreath Leaves (Left) */}
    <g fill="#A16207" opacity="0.8">
      <path d="M52 108C50 102 54 96 58 97C60 102 56 108 52 108Z" />
      <path d="M55 118C52 113 54 107 59 107C62 112 59 118 55 118Z" />
      <path d="M62 125C58 121 59 115 64 114C68 118 66 125 62 125Z" />
      <path d="M72 130C67 127 67 121 72 119C77 122 76 129 72 130Z" />
    </g>

    {/* Laurel Wreath Leaves (Right) */}
    <g fill="#A16207" opacity="0.8">
      <path d="M108 108C110 102 106 96 102 97C100 102 104 108 108 108Z" />
      <path d="M105 118C108 113 106 107 101 107C98 112 101 118 105 118Z" />
      <path d="M98 125C102 121 101 115 96 114C92 118 94 125 98 125Z" />
      <path d="M88 130C93 127 93 121 88 119C83 122 84 129 88 130Z" />
    </g>

    {/* Bold 3D Number "1" */}
    {/* Shadow behind 1 */}
    <path
      d="M72 84L82 72H88V114H76V88L72 90V84Z"
      fill="#713F12"
      transform="translate(1.5, 2.5)"
    />
    <path
      d="M66 114H98V120H66V114Z"
      fill="#713F12"
      transform="translate(1.5, 2.5)"
    />
    {/* Main Face of 1 */}
    <path
      d="M72 84L82 72H88V114H76V88L72 90V84Z"
      fill="url(#goldNumGrad)"
      stroke="#713F12"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M66 114H98V120H66V114Z"
      fill="url(#goldNumGrad)"
      stroke="#713F12"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Glossy specular highlight on 1 */}
    <path
      d="M84 74L77 82"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

/**
 * 4. Insígnia Diamante (Nível 4 - Joia Lapidada com Estrela)
 * Emblema octogonal com facetas de cristal/diamante, estrela central e fita azul
 */
export const DiamondMedalIllustration: React.FC<MedalIllustrationProps> = ({
  className = 'w-14 h-14',
  unlocked = true,
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${!unlocked ? 'grayscale opacity-40 brightness-75' : 'drop-shadow-[0_4px_16px_rgba(56,189,248,0.5)]'}`}
  >
    <defs>
      <linearGradient id="gemRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      {/* Outer Facets Gradients */}
      <linearGradient id="facetTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E0F2FE" />
      </linearGradient>
      <linearGradient id="facetRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#BAE6FD" />
      </linearGradient>
      <linearGradient id="facetBottom" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="facetLeft" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F0F9FF" />
        <stop offset="100%" stopColor="#C4B5FD" />
      </linearGradient>
      {/* Center Table Face */}
      <radialGradient id="centerTableGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F0F9FF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </radialGradient>
    </defs>

    {/* Ribbon Tails Beneath the Gem */}
    <path
      d="M66 100L66 138L80 126L94 138L94 100Z"
      fill="url(#gemRibbonGrad)"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Ribbon Gold Edge Stripes */}
    <path
      d="M69 104L69 130"
      stroke="#FACC15"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M91 104L91 130"
      stroke="#FACC15"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Octagonal Outer Gem Contour (Stroke & Dark Border) */}
    {/* Coordinates: Top: (60,18) -> (100,18) -> (132,50) -> (132,90) -> (100,122) -> (60,122) -> (28,90) -> (28,50) -> Z */}
    <path
      d="M60 18L100 18L132 50L132 90L100 122L60 122L28 90L28 50Z"
      fill="#1E293B"
      stroke="#0F172A"
      strokeWidth="4"
      strokeLinejoin="round"
    />

    {/* Facet Polygons connecting Outer Octagon to Inner Octagon */}
    {/* Inner Octagon: (66,36) -> (94,36) -> (114,56) -> (114,84) -> (94,104) -> (66,104) -> (46,84) -> (46,56) -> Z */}
    
    {/* Top Facet */}
    <polygon points="60,18 100,18 94,36 66,36" fill="url(#facetTop)" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Top-Right Facet */}
    <polygon points="100,18 132,50 114,56 94,36" fill="url(#facetRight)" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Right Facet */}
    <polygon points="132,50 132,90 114,84 114,56" fill="#BAE6FD" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Bottom-Right Facet */}
    <polygon points="132,90 100,122 94,104 114,84" fill="url(#facetBottom)" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Bottom Facet */}
    <polygon points="100,122 60,122 66,104 94,104" fill="#38BDF8" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Bottom-Left Facet */}
    <polygon points="60,122 28,90 46,84 66,104" fill="url(#facetLeft)" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Left Facet */}
    <polygon points="28,90 28,50 46,56 46,84" fill="#E0F2FE" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Top-Left Facet */}
    <polygon points="28,50 60,18 66,36 46,56" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />

    {/* Center Flat Table Face */}
    <polygon
      points="66,36 94,36 114,56 114,84 94,104 66,104 46,84 46,56"
      fill="url(#centerTableGrad)"
      stroke="#64748B"
      strokeWidth="2"
    />

    {/* Center 5-Pointed White Star */}
    {/* Center around (80, 70), outer radius ~20, inner radius ~8.5 */}
    <polygon
      points="
        80,50
        85,63
        99,63
        88,72
        92,86
        80,78
        68,86
        72,72
        61,63
        75,63
      "
      fill="#FFFFFF"
      stroke="#1E293B"
      strokeWidth="3"
      strokeLinejoin="round"
    />

    {/* Star Inner Specular Highlight */}
    <polygon
      points="
        80,53
        84,63
        95,63
        87,70
        90,81
        80,75
        70,81
        73,70
        65,63
        76,63
      "
      fill="#F8FAFC"
      opacity="0.9"
    />
  </svg>
);

/**
 * 5. Coroa Real com Louros (Nível 5 - Lenda Viva)
 * Coroa dourada majestosa com rubi central, faixa azul na base e ramos de louro laterais
 */
export const CrownMedalIllustration: React.FC<MedalIllustrationProps> = ({
  className = 'w-14 h-14',
  unlocked = true,
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${!unlocked ? 'grayscale opacity-40 brightness-75' : 'drop-shadow-[0_4px_18px_rgba(255,215,0,0.6)]'}`}
  >
    <defs>
      {/* Crown Gold Gradient */}
      <linearGradient id="crownGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="25%" stopColor="#FACC15" />
        <stop offset="70%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#A16207" />
      </linearGradient>
      {/* Crown Back Inner Shade */}
      <linearGradient id="crownInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#CA8A04" />
        <stop offset="100%" stopColor="#713F12" />
      </linearGradient>
      {/* Laurel Leaves Gradient */}
      <linearGradient id="laurelLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A3E635" />
        <stop offset="50%" stopColor="#65A30D" />
        <stop offset="100%" stopColor="#3F6212" />
      </linearGradient>
      {/* Ruby Jewel Gradient */}
      <radialGradient id="rubyGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="40%" stopColor="#EF4444" />
        <stop offset="80%" stopColor="#B91C1C" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </radialGradient>
    </defs>

    {/* Laurel Branches (Left) */}
    <g stroke="#1F2937" strokeWidth="2.5" strokeLinejoin="round">
      {/* Branch curve */}
      <path d="M42 122C32 104 30 82 40 58" fill="none" stroke="#3F6212" strokeWidth="3" />
      {/* Leaves */}
      <path d="M42 60C32 60 26 70 34 76C42 74 44 64 42 60Z" fill="url(#laurelLeafGrad)" />
      <path d="M30 78C20 80 18 90 26 94C34 92 34 82 30 78Z" fill="url(#laurelLeafGrad)" />
      <path d="M32 98C22 102 22 112 30 114C38 110 38 102 32 98Z" fill="url(#laurelLeafGrad)" />
      <path d="M40 116C32 120 34 130 42 130C48 124 46 118 40 116Z" fill="url(#laurelLeafGrad)" />
    </g>

    {/* Laurel Branches (Right) */}
    <g stroke="#1F2937" strokeWidth="2.5" strokeLinejoin="round">
      {/* Branch curve */}
      <path d="M118 122C128 104 130 82 120 58" fill="none" stroke="#3F6212" strokeWidth="3" />
      {/* Leaves */}
      <path d="M118 60C128 60 134 70 126 76C118 74 116 64 118 60Z" fill="url(#laurelLeafGrad)" />
      <path d="M130 78C140 80 142 90 134 94C126 92 126 82 130 78Z" fill="url(#laurelLeafGrad)" />
      <path d="M128 98C138 102 138 112 130 114C122 110 122 102 128 98Z" fill="url(#laurelLeafGrad)" />
      <path d="M120 116C128 120 126 130 118 130C112 124 114 118 120 116Z" fill="url(#laurelLeafGrad)" />
    </g>

    {/* Crown Inner Velvet / Back Wall Shade */}
    <path
      d="M48 68L60 88L80 50L100 88L112 68L118 116H42L48 68Z"
      fill="url(#crownInnerGrad)"
    />

    {/* Crown Main Body */}
    {/* Base width 42 to 118, top points: (48, 68), (62, 54), (80, 36), (98, 54), (112, 68) */}
    <path
      d="
        M42 118
        L46 64
        C44 60 48 56 52 58
        C56 60 54 66 50 68
        L60 86
        L62 52
        C60 48 64 44 68 46
        C72 48 70 54 66 56
        L76 80
        L78 34
        C76 28 84 28 84 34
        L84 80
        L94 56
        C90 54 88 48 92 46
        C96 44 100 48 98 52
        L100 86
        L110 68
        C106 66 104 60 108 58
        C112 56 116 60 114 64
        L118 118
        Z
      "
      fill="url(#crownGoldGrad)"
      stroke="#382006"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Crown Golden Round Pearls on 5 Peaks */}
    <circle cx="50" cy="62" r="5" fill="#FEF08A" stroke="#382006" strokeWidth="2.5" />
    <circle cx="65" cy="50" r="5.5" fill="#FEF08A" stroke="#382006" strokeWidth="2.5" />
    <circle cx="80" cy="32" r="7" fill="#FEF9C3" stroke="#382006" strokeWidth="2.5" />
    <circle cx="95" cy="50" r="5.5" fill="#FEF08A" stroke="#382006" strokeWidth="2.5" />
    <circle cx="110" cy="62" r="5" fill="#FEF08A" stroke="#382006" strokeWidth="2.5" />

    {/* Crown Base Rim */}
    <rect
      x="40"
      y="114"
      width="80"
      height="14"
      rx="7"
      fill="#EAB308"
      stroke="#382006"
      strokeWidth="3.5"
    />

    {/* Royal Blue Banner on Base */}
    <rect
      x="56"
      y="117"
      width="48"
      height="8"
      rx="3"
      fill="#1D4ED8"
      stroke="#1E1B4B"
      strokeWidth="2"
    />

    {/* Center Red Ruby Gem */}
    <ellipse
      cx="80"
      cy="94"
      rx="6.5"
      ry="8"
      fill="url(#rubyGrad)"
      stroke="#382006"
      strokeWidth="2.5"
    />
    {/* Ruby Highlight Dot */}
    <circle cx="78" cy="91" r="1.8" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

/**
 * Componente unificador de exibição de Medalhas/Conquistas
 * Permite renderizar a ilustração exata para cada nível com fundo 100% transparente
 */
export const FanMedalIllustration: React.FC<{
  medalId?: string;
  level?: number;
  unlocked?: boolean;
  className?: string;
}> = ({ medalId, level, unlocked = true, className = 'w-14 h-14' }) => {
  if (medalId === 'lenda-viva' || level === 5) {
    return <CrownMedalIllustration className={className} unlocked={unlocked} />;
  }
  if (medalId === 'fa-diamante' || level === 4) {
    return <DiamondMedalIllustration className={className} unlocked={unlocked} />;
  }
  if (medalId === 'fa-ouro' || level === 3) {
    return <GoldMedalIllustration className={className} unlocked={unlocked} />;
  }
  if (medalId === 'fa-prata' || level === 2) {
    return <SilverMedalIllustration className={className} unlocked={unlocked} />;
  }
  // Default: Bronze (Nível 1)
  return <BronzeMedalIllustration className={className} unlocked={unlocked} />;
};
