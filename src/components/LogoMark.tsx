import type { SVGProps } from 'react';

export default function LogoMark({ size = 32, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {/* 4 organic petals arranged as a cross-flower */}
      <g opacity="0.92">
        {/* Top petal */}
        <ellipse cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c"/>
        {/* Right petal (rotate 90° around center 20,20) */}
        <ellipse cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c" transform="rotate(90 20 20)"/>
        {/* Bottom petal (rotate 180° around center 20,20) */}
        <ellipse cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c" transform="rotate(180 20 20)"/>
        {/* Left petal (rotate 270° around center 20,20) */}
        <ellipse cx="20" cy="11" rx="5.5" ry="9.5" fill="#e91e8c" transform="rotate(270 20 20)"/>
      </g>
      {/* Gold center */}
      <circle cx="20" cy="20" r="6" fill="#c9a84c"/>
      {/* Inner center highlight */}
      <circle cx="20" cy="20" r="2.5" fill="#e8d095" opacity="0.6"/>
    </svg>
  );
}
