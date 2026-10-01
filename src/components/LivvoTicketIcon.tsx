import React, { useId } from 'react';

interface LivvoTicketIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const LivvoTicketIcon: React.FC<LivvoTicketIconProps> = ({
  size = 24,
  className = '',
  ...props
}) => {
  const rawId = useId();
  const maskId = `livvo-ticket-mask-${rawId.replace(/:/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <mask id={maskId}>
          {/* White renders pick as visible */}
          <rect x="0" y="0" width="100" height="150" fill="white" />
          {/* Black cuts out the musical note inside the pick so background shines through */}
          <ellipse
            cx="44.5"
            cy="109"
            rx="3.2"
            ry="2.4"
            transform="rotate(-20 44.5 109)"
            fill="black"
          />
          <ellipse
            cx="54.5"
            cy="106"
            rx="3.2"
            ry="2.4"
            transform="rotate(-20 54.5 106)"
            fill="black"
          />
          <rect
            x="46"
            y="95"
            width="2"
            height="13"
            rx="0.8"
            fill="black"
          />
          <rect
            x="56"
            y="92"
            width="2"
            height="13"
            rx="0.8"
            fill="black"
          />
          <polygon
            points="46,95 58,92 58,95.5 46,98.5"
            fill="black"
          />
        </mask>
      </defs>

      {/* Outer Ticket Path with Notches at Center (y ~ 75) */}
      <path
        d="
          M 26 12
          H 74
          A 14 14 0 0 1 88 26
          V 64
          A 11 11 0 0 0 88 86
          V 124
          A 14 14 0 0 1 74 138
          H 26
          A 14 14 0 0 1 12 124
          V 86
          A 11 11 0 0 0 12 64
          V 26
          A 14 14 0 0 1 26 12
          Z
        "
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Dashed Perforation Line Across the Middle */}
      <line
        x1="22"
        y1="75"
        x2="78"
        y2="75"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />

      {/* Top Half: Barcode Lines */}
      <g stroke="currentColor" strokeLinecap="round">
        {/* Bar 1 */}
        <line x1="26" y1="28" x2="26" y2="58" strokeWidth="5.5" />
        {/* Bar 2 */}
        <line x1="33" y1="28" x2="33" y2="58" strokeWidth="2.5" />
        {/* Bar 3 */}
        <line x1="38" y1="28" x2="38" y2="58" strokeWidth="4.5" />
        {/* Bar 4 */}
        <line x1="45" y1="28" x2="45" y2="58" strokeWidth="2" />
        {/* Bar 5 */}
        <line x1="49.5" y1="28" x2="49.5" y2="58" strokeWidth="5" />
        {/* Bar 6 */}
        <line x1="56" y1="28" x2="56" y2="58" strokeWidth="2.5" />
        {/* Bar 7 */}
        <line x1="61" y1="28" x2="61" y2="58" strokeWidth="5" />
        {/* Bar 8 */}
        <line x1="68" y1="28" x2="68" y2="58" strokeWidth="3" />
        {/* Bar 9 */}
        <line x1="74" y1="28" x2="74" y2="58" strokeWidth="4.5" />
      </g>

      {/* Bottom Half: Guitar Pick with Masked Hollow Musical Note */}
      <path
        d="
          M 36 92
          C 33 87, 43 85, 50 85
          C 57 85, 67 87, 64 92
          C 61 98, 56 114, 52 121
          C 51 123, 49 123, 48 121
          C 44 114, 39 98, 36 92
          Z
        "
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
};
