/** Lacre azul com monograma — usado no canudo, no diploma e nas páginas neutras. */
export function Seal({ className, label = "JVD" }: { className?: string; label?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="sealG" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#8dbcf2" />
          <stop offset="1" stopColor="#1f5fbf" />
        </radialGradient>
      </defs>
      <path
        d="M0-46c7 0 9 5 15 6s11-3 16 2 1 10 4 15 9 7 9 14-6 9-7 15 3 11-2 16-10 1-15 4-7 9-14 9-9-6-15-7-11 3-16-2-1-10-4-15-9-7-9-14 6-9 7-15-3-11 2-16 10-1 15-4 7-9 13-9z"
        fill="url(#sealG)"
      />
      <circle r="31" fill="none" stroke="#12336b" strokeOpacity=".55" strokeWidth="1.2" />
      <circle r="27" fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth=".8" strokeDasharray="1.5 2.5" />
      <text
        y="7"
        textAnchor="middle"
        fontFamily="var(--font-display), serif"
        fontSize="21"
        fontWeight="700"
        fill="#0a1f44"
        style={{ letterSpacing: "1px" }}
      >
        {label}
      </text>
    </svg>
  );
}
