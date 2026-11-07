// O canudo do diploma (centro em 0,0, deitado, 200 × 30 unidades).
export function Canudo({ id }: { id: string }) {
  const g = `cg-${id}`;
  const clip = `cc-${id}`;
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf4ea" />
          <stop offset=".35" stopColor="#f1e3cf" />
          <stop offset=".8" stopColor="#d7bda6" />
          <stop offset="1" stopColor="#b7957f" />
        </linearGradient>
        <clipPath id={clip}>
          <rect x={-100} y={-15} width={200} height={30} rx={6} />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={19} rx={98} ry={5} fill="#2a1705" opacity={0.22} data-c="shadow" />
      <g data-c="tube">
        <rect x={-100} y={-15} width={200} height={30} rx={6} fill={`url(#${g})`} data-c="body" />
        <path d="M-96,-6 H96" stroke="#fff" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
        <g clipPath={`url(#${clip})`}>
          <rect data-c="glint" x={-160} y={-20} width={16} height={40} fill="#fff" opacity={0.55} transform="skewX(-20)" />
        </g>
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={100 * s} cy={0} rx={6} ry={15} fill="#eadac4" stroke="#c4a68c" strokeWidth={1} />
            <ellipse cx={100 * s} cy={0} rx={3.6} ry={9} fill="none" stroke="#b7957f" strokeWidth={1} />
            <ellipse cx={100 * s} cy={0} rx={1.4} ry={3.5} fill="#b7957f" />
          </g>
        ))}
      </g>
      {/* fita */}
      <g data-c="band">
        <rect x={-10} y={-16} width={20} height={32} fill="#ab7743" />
        <rect x={-10} y={-16} width={2} height={32} fill="#c9a35a" />
        <rect x={8} y={-16} width={2} height={32} fill="#c9a35a" />
      </g>
      <g data-c="tailL">
        <path d="M-3,-6 L-22,30 L-13,27 L-9,36 L3,-4 Z" fill="#97652f" />
      </g>
      <g data-c="tailR">
        <path d="M3,-6 L20,32 L12,28 L6,36 L-3,-4 Z" fill="#ab7743" />
      </g>
      <g data-c="bowL">
        <path d="M0,-12 C-24,-42 -48,-22 -32,-8 C-23,0 -9,-6 0,-12 Z" fill="#ab7743" />
        <path d="M-4,-13 C-20,-30 -36,-22 -30,-12" stroke="#c9a35a" strokeWidth={1.4} fill="none" />
      </g>
      <g data-c="bowR">
        <path d="M0,-12 C24,-42 48,-22 32,-8 C23,0 9,-6 0,-12 Z" fill="#97652f" />
        <path d="M4,-13 C20,-30 36,-22 30,-12" stroke="#c9a35a" strokeWidth={1.4} fill="none" />
      </g>
      {/* lacre partido em duas metades */}
      <g data-c="sealL">
        <path d="M0,-25 A13,13 0 0 0 0,1 L-2,-6 L2,-12 L-1,-18 Z" fill="#c9a35a" />
        <path d="M0,-25 A13,13 0 0 0 0,1" fill="none" stroke="#8a6428" strokeWidth={1} />
      </g>
      <g data-c="sealR">
        <path d="M0,-25 A13,13 0 0 1 0,1 L-2,-6 L2,-12 L-1,-18 Z" fill="#b8924c" />
        <path d="M0,-25 A13,13 0 0 1 0,1" fill="none" stroke="#8a6428" strokeWidth={1} />
      </g>
      <text data-c="sealText" x={0} y={-9} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#6b4716" fontFamily="var(--font-display), serif">
        JVD
      </text>
    </g>
  );
}
