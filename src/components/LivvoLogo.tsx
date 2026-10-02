import React from 'react';

interface LivvoLogoProps {
  className?: string;
  size?: number;
}

export const LivvoLogo: React.FC<LivvoLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <div
      style={size ? { width: size, height: size } : undefined}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      title="Livvo"
    >
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full object-contain filter drop-shadow-sm transition-transform"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="livvoCyanGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3EE7EE" />
            <stop offset="50%" stop-color="#33DFE5" />
            <stop offset="100%" stop-color="#20D2D9" />
          </linearGradient>
        </defs>

        {/* Squircle Badge Background */}
        <rect
          x="16"
          y="16"
          width="480"
          height="480"
          rx="122"
          fill="url(#livvoCyanGradInner)"
        />

        {/* 3D LIVVO Extruded Wordmark */}
        <g>
          {/* Deep Black 3D Extrusion Layers (offset down-right) */}
          <text
            x="256"
            y="302"
            textAnchor="middle"
            fontFamily="'Montserrat', 'Arial Black', 'Impact', sans-serif"
            fontSize="114"
            fontWeight="900"
            letterSpacing="-1.5"
            fill="#000000"
            stroke="#000000"
            strokeWidth="20"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            LIVVO
          </text>
          <text
            x="253"
            y="299"
            textAnchor="middle"
            fontFamily="'Montserrat', 'Arial Black', 'Impact', sans-serif"
            fontSize="114"
            fontWeight="900"
            letterSpacing="-1.5"
            fill="#000000"
            stroke="#000000"
            strokeWidth="16"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            LIVVO
          </text>
          <text
            x="250"
            y="296"
            textAnchor="middle"
            fontFamily="'Montserrat', 'Arial Black', 'Impact', sans-serif"
            fontSize="114"
            fontWeight="900"
            letterSpacing="-1.5"
            fill="#000000"
            stroke="#000000"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            LIVVO
          </text>

          {/* Front Black Outline */}
          <text
            x="244"
            y="290"
            textAnchor="middle"
            fontFamily="'Montserrat', 'Arial Black', 'Impact', sans-serif"
            fontSize="114"
            fontWeight="900"
            letterSpacing="-1.5"
            fill="#000000"
            stroke="#000000"
            strokeWidth="12"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            LIVVO
          </text>

          {/* Off-White Cream Face */}
          <text
            x="244"
            y="290"
            textAnchor="middle"
            fontFamily="'Montserrat', 'Arial Black', 'Impact', sans-serif"
            fontSize="114"
            fontWeight="900"
            letterSpacing="-1.5"
            fill="#EDE7DE"
          >
            LIVVO
          </text>
        </g>
      </svg>
    </div>
  );
};
