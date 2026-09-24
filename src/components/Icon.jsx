// Small hand-drawn stroke icons (24x24, currentColor). Inline SVG keeps the
// bundle tiny and needs no icon library or network request.
const PATHS = {
  eye: (
    <>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  hair: (
    <>
      <path d="M6 20c0-7 1.5-12 6-15" />
      <path d="M10 20c0-6 1.5-10 5-13" />
      <path d="M14 20c0-4.5 1.5-8 4.5-10.5" />
    </>
  ),
  skin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" opacity=".35" />
    </>
  ),
  face: (
    <>
      <path d="M12 3c-4.2 0-7 3.3-7 7.8 0 5 3.3 10.2 7 10.2s7-5.2 7-10.2C19 6.3 16.2 3 12 3Z" />
      <path d="M9 10h.01M15 10h.01M10 16c1.2.8 2.8.8 4 0" />
    </>
  ),
  brow: (
    <>
      <path d="M3.5 11c2-2.5 5-3.2 8-2" />
      <path d="M12.5 9c3-1.2 6-.5 8 2" />
      <path d="M5 15.5s2-2 4-2 4 2 4 2" opacity=".5" />
    </>
  ),
  nose: (
    <>
      <path d="M12 3.5v8.5c0 1.5-2.5 3-3.5 4.3-.9 1.2.2 2.7 1.6 2.2.8-.3 1.3-.3 1.9.4" />
      <path d="M13.2 18.4c.6-.7 1.1-.7 1.9-.4 1.4.5 2.5-1 1.6-2.2-.5-.7-1.3-1.4-2-2" />
    </>
  ),
  lips: (
    <>
      <path d="M3 12c2.5-3.5 5-4.5 6.5-3.3 1 .8 1.7.8 2.5.8s1.5 0 2.5-.8C16 7.5 18.5 8.5 21 12" />
      <path d="M3 12h18M3 12c2.5 4 6 5.5 9 5.5s6.5-1.5 9-5.5" />
    </>
  ),
  beard: (
    <>
      <path d="M5 9c0 6 3 11 7 11s7-5 7-11" />
      <path d="M9 13.5c1.8-.9 4.2-.9 6 0" />
      <path d="M8 16.5h.01M11 17.5h.01M13 17.5h.01M16 16.5h.01" strokeWidth="2.4" />
    </>
  ),
  freckles: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 10h.01M11.5 8.5h.01M14.5 10.5h.01M9.5 13.5h.01M13 13h.01M15.5 14.5h.01M11 16h.01" strokeWidth="2.6" />
    </>
  ),
  peak: (
    <>
      <path d="M12 3c-4.4 0-7.5 3.5-7.5 8.3 0 5 3.4 9.7 7.5 9.7s7.5-4.7 7.5-9.7C19.5 6.5 16.4 3 12 3Z" />
      {/* the hairline, dipping to a V at the center */}
      <path d="M4.8 9.5c2.6-2.4 5-2.8 7.2 1.8 2.2-4.6 4.6-4.2 7.2-1.8" />
      <path d="M4.8 9.5c2.6-2.4 5-2.8 7.2 1.8 2.2-4.6 4.6-4.2 7.2-1.8C18.3 5.6 15.6 3 12 3S5.7 5.6 4.8 9.5Z" fill="currentColor" stroke="none" opacity=".35" />
    </>
  ),
  dimple: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 13.5c1.2 1.6 2.5 2.3 4 2.3s2.8-.7 4-2.3" />
      <path d="M6.6 12c.5.9.4 1.7-.2 2.3M17.4 12c-.5.9-.4 1.7.2 2.3" strokeWidth="2" />
    </>
  ),
  ear: (
    <>
      <path d="M7.5 9a5 5 0 0 1 10 0c0 3-2.5 4-3 6.5-.4 2-1.5 4-3.8 4C8.8 19.5 8 18 8 17" />
      <path d="M10.5 9.5a2 2 0 0 1 4 0c0 1.3-1.2 1.8-1.6 2.8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  tree: (
    <>
      {/* a branching family tree */}
      <path d="M12 21v-8M12 13 6.5 7.5M12 13l5.5-5.5M12 13V5.5" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="4" r="1.6" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="12" rx="2" />
      <path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6Z" />
      <path d="m8.8 12.2 2.2 2.2 4.4-4.6" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    </>
  ),
  group: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6 18.4 18.4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m4 18 5-5 3.5 3.5L16 13l4 4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
      <path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4" />
    </>
  ),
  filter: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12h8" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19Z" />
      <path d="M12 10v4.5M12 17.2h.01" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
};

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
