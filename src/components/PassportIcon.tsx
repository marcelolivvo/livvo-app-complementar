import React from 'react';

interface PassportIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const PassportIcon: React.FC<PassportIconProps> = ({
  size = 32,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer Passport Booklet */}
      <rect
        x="12"
        y="10"
        width="76"
        height="100"
        rx="12"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Left Spine Fold Line */}
      <line
        x1="24"
        y1="13"
        x2="24"
        y2="107"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Globe Circle */}
      <circle
        cx="53"
        cy="50"
        r="22"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
      />

      {/* Globe Equator and Latitude Grid */}
      <line
        x1="31"
        y1="50"
        x2="75"
        y2="50"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <ellipse
        cx="53"
        cy="50"
        rx="12"
        ry="22"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="none"
      />
      <ellipse
        cx="53"
        cy="50"
        rx="22"
        ry="12"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Continent Blobs / Filled Landmasses */}
      <path
        d="M44 42 C41 40, 39 45, 41 48 C43 51, 46 53, 44 56 C42 59, 39 63, 43 65 C45 62, 47 58, 48 54 C48 48, 47 44, 44 42 Z"
        fill="currentColor"
      />
      <path
        d="M58 43 C56 41, 62 39, 65 44 C67 48, 64 54, 61 57 C58 60, 56 65, 59 67 C63 65, 66 60, 68 54 C70 48, 65 42, 58 43 Z"
        fill="currentColor"
      />

      {/* Airplane Silhouette Flying Diagonally Towards Top-Right */}
      <g transform="translate(56, 32) rotate(18) scale(0.9)">
        {/* Fuselage */}
        <path
          d="M10 0 C12 -2, 16 -3, 18 -1 C20 1, 19 5, 17 7 L0 19 L-4 17 L8 6 L-2 4 L-5 6 L-8 5 L-5 2 L-2 0 L8 2 Z"
          fill="currentColor"
        />
        {/* Main Wings */}
        <polygon
          points="8,4 20,-8 18,-10 -2,2"
          fill="currentColor"
        />
        {/* Tail Fins */}
        <polygon
          points="-4,18 -8,24 -10,23 -6,17"
          fill="currentColor"
        />
      </g>

      {/* Machine Readable Zone (MRZ) Passport Code at Bottom */}
      {/* Row 1: Code blocks */}
      <rect x="29" y="81" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
      <rect x="37" y="81" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
      <rect x="45" y="81" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
      <rect x="53" y="81" width="13" height="4.5" rx="1.5" fill="currentColor" />
      <rect x="68" y="81" width="5.5" height="5.5" rx="1.5" fill="currentColor" />

      {/* Row 2: Line with square notch */}
      <line x1="29" y1="92" x2="52" y2="92" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <rect x="54" y="88.5" width="7" height="7" rx="1.5" fill="currentColor" />
      <line x1="63" y1="92" x2="74" y2="92" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};
