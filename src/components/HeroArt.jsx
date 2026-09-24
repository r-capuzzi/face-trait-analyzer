// Decorative "iris" for the header: concentric rings and radial fibers in
// the trait accent colors. Purely ornamental (aria-hidden), pure SVG.
const FIBERS = Array.from({ length: 48 }, (_, i) => (i / 48) * Math.PI * 2);

export default function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hero-iris" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--eye)" stopOpacity="0.05" />
          <stop offset="55%" stopColor="var(--eye)" stopOpacity="0.28" />
          <stop offset="80%" stopColor="var(--hair)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--skin)" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="112" fill="url(#hero-iris)" />
      <g stroke="var(--eye)" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round">
        {FIBERS.map((a, i) => (
          <line
            key={a}
            x1={120 + Math.cos(a) * 42}
            y1={120 + Math.sin(a) * 42}
            x2={120 + Math.cos(a) * (i % 2 ? 92 : 104)}
            y2={120 + Math.sin(a) * (i % 2 ? 92 : 104)}
          />
        ))}
      </g>
      <circle cx="120" cy="120" r="104" fill="none" stroke="var(--shape)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 6" />
      {/* pupil and catchlight keep fixed colors: a pupil is dark in any theme */}
      <circle cx="120" cy="120" r="40" fill="#1a1613" />
      <circle cx="104" cy="104" r="9" fill="#ffffff" fillOpacity="0.92" />
    </svg>
  );
}
