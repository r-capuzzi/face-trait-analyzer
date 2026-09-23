// Color science helpers. Every trait in this app is measured in CIELAB
// (L* lightness, a* green-red, b* blue-yellow) rather than RGB, because
// that's the space the reference studies publish in (Edwards 2012/2016 for
// iris, Chardon 1991 for skin ITA) and because distances in it roughly track
// perceived color difference. Reference white is D65, which is what sRGB
// camera/JPEG pixels are encoded against.

// D65 reference white (CIE 1931 2° observer), Y normalized to 1.
const WHITE = { x: 0.95047, y: 1.0, z: 1.08883 };

const EPS = (6 / 29) ** 3; // CIE 116/16 linear-segment cutoff
const KAPPA = 3 * (6 / 29) ** 2;

// 0..255 gamma-encoded sRGB channel -> 0..1 linear light (IEC 61966-2-1)
export function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(v) {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

function f(t) {
  return t > EPS ? Math.cbrt(t) : t / KAPPA + 4 / 29;
}

function fInv(t) {
  return t > 6 / 29 ? t ** 3 : KAPPA * (t - 4 / 29);
}

export function rgbToLab(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const x = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = 0.0193339 * R + 0.119192 * G + 0.9503041 * B;
  const fx = f(x / WHITE.x);
  const fy = f(y / WHITE.y);
  const fz = f(z / WHITE.z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

// Inverse, for drawing a measured Lab color back on screen as a swatch.
// Out-of-gamut values are clamped per channel.
export function labToRgb({ L, a, b }) {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const x = fInv(fx) * WHITE.x;
  const y = fInv(fy) * WHITE.y;
  const z = fInv(fz) * WHITE.z;
  const R = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const G = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const B = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return { r: linearToSrgb(R), g: linearToSrgb(G), b: linearToSrgb(B) };
}

export function labToHex(lab) {
  const { r, g, b } = labToRgb(lab);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function hexToLab(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgbToLab((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

// Colorfulness: distance from the neutral gray axis.
export function chroma({ a, b }) {
  return Math.hypot(a, b);
}

// Hue angle in degrees, 0..360 (0 = +a* red, 90 = +b* yellow).
export function hueAngle({ a, b }) {
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return h < 0 ? h + 360 : h;
}

// Individual Typology Angle (Chardon, Cretois & Hourseau 1991): the angle of
// a skin color in the L*-b* plane, measured around L* = 50. Higher = lighter.
// atan2 equals the published arctan((L*-50)/b*) whenever b* > 0 (all real
// skin) and stays finite if b* hits 0.
export function ita({ L, b }) {
  return (Math.atan2(L - 50, b) * 180) / Math.PI;
}

const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;

// CIEDE2000 color difference, following Sharma, Wu & Dalal (2005),
// "The CIEDE2000 color-difference formula: implementation notes...".
// ~1 is a just-noticeable difference; the test file checks their worked pairs.
export function deltaE2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hp = (b, ap) => {
    if (b === 0 && ap === 0) return 0;
    const h = deg(Math.atan2(b, ap));
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(b1, a1p);
  const h2p = hp(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
    else hbarp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63));
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const Cbarp7 = Cbarp ** 7;
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;

  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)
  );
}
