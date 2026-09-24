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
  freckles: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 10h.01M11.5 8.5h.01M14.5 10.5h.01M9.5 13.5h.01M13 13h.01M15.5 14.5h.01M11 16h.01" strokeWidth="2.6" />
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
