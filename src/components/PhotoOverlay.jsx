import { useEffect, useRef, useState } from "react";
import { eyeOpening, irisCircle } from "../lib/regions";
import { MASK } from "../lib/maskCategories";
import { fromFrame } from "../lib/traits/faceShape";

// Tint colors for the segmentation mask layer, RGBA.
const MASK_TINT = {
  [MASK.HAIR]: [255, 170, 0, 110],
  [MASK.FACE_SKIN]: [0, 200, 255, 70],
  [MASK.OTHERS]: [255, 0, 200, 90],
};

// Draws the photo plus toggleable layers showing exactly which pixels each
// measurement used (cyan = iris, magenta = skin patches, orange = hair) and
// the lines each face-shape proportion was measured along.
//
// While `picking`, the photo doubles as a picker for the color-correction
// reference: click a spot, or move a crosshair with the arrow keys and press
// Enter. `marker` is the spot a correction used.
export default function PhotoOverlay({ image, result, layers, picking = false, onPick, onCancel, marker }) {
  const canvasRef = useRef(null);
  const [cursor, setCursor] = useState(null);

  // start the keyboard crosshair mid-photo and hand it focus
  useEffect(() => {
    if (!picking) {
      setCursor(null);
      return;
    }
    setCursor({ x: Math.round(image.width / 2), y: Math.round(image.height / 2) });
    canvasRef.current?.focus();
  }, [picking, image.width, image.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // no 2D canvas (e.g. jsdom in tests)
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.putImageData(image.imageData, 0, 0);

    const { face, mask, traits } = result;
    const lw = Math.max(1.5, image.width / 500);
    const dot = (pixels, color, size = 1) => {
      ctx.fillStyle = color;
      for (const p of pixels) ctx.fillRect(p.x, p.y, size, size);
    };

    if (layers.mask) {
      ctx.drawImage(maskToCanvas(mask), 0, 0, image.width, image.height);
    }
    if (layers.landmarks) {
      dot(
        face.points.map((p) => ({ x: p.x - lw / 2, y: p.y - lw / 2 })),
        "rgba(0, 255, 120, 0.8)",
        lw
      );
    }
    if (layers.regions) {
      // hair is sampled on a grid, so draw slightly bigger dots
      if (traits.hair?.pixels) dot(traits.hair.pixels, "rgba(255, 160, 0, 0.6)", Math.max(2, lw));
      for (const patch of traits.skin?.patches ?? []) dot(patch.pixels, "rgba(255, 60, 210, 0.45)");
      for (const eye of Object.values(traits.eye?.eyes ?? {})) dot(eye.pixels, "rgba(0, 229, 255, 0.55)");
      // facial hair: the zones checked and the pixels read as hair
      if (traits.beard?.regions) {
        dot(traits.beard.regions.hair, "rgba(255, 90, 54, 0.75)");
        ctx.lineWidth = lw;
        ctx.strokeStyle = "rgba(255, 90, 54, 0.9)";
        for (const z of traits.beard.regions.zones) strokePolygon(ctx, z);
      }

      ctx.lineWidth = lw;
      for (const side of ["right", "left"]) {
        ctx.strokeStyle = "#ffd400";
        strokePolygon(ctx, eyeOpening(face.points, side));
        ctx.strokeStyle = "#00e5ff";
        strokeCircle(ctx, irisCircle(face.points, side));
      }
      ctx.strokeStyle = "#ff4fd8";
      for (const patch of traits.skin?.patches ?? []) strokeCircle(ctx, patch);
    }
    if (layers.shape && traits.shape?.lines) {
      const { frame, eyes, eyeGap, nose, mouth, lips, faceHeight, jaw } = traits.shape.lines;
      ctx.lineWidth = lw * 1.3;
      const line = ({ from, to }, color) => {
        const a = fromFrame(frame, from);
        const b = fromFrame(frame, to);
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };
      for (const e of eyes) line(e, "#ffd400");
      line(eyeGap, "#00e5ff");
      line(nose, "#ff4fd8");
      line(mouth, "#ff9f1a");
      line(lips, "#5dff7a");
      // face proportions: the midline (nasal root -> chin) with ticks at the
      // base of the nose and the bottom of the lower lip, and the jaw width
      ctx.setLineDash([lw * 3, lw * 2]);
      line(faceHeight, "rgba(255, 255, 255, 0.9)");
      line(jaw, "rgba(255, 255, 255, 0.9)");
      if (traits.hairline?.line) {
        // the forehead: nasal root up to the hairline
        const hl = traits.hairline.line;
        line({ from: hl.from, to: hl.to }, "rgba(255, 170, 0, 0.95)");
      }
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffffff";
      for (const mark of faceHeight.marks) {
        const m = fromFrame(frame, mark);
        ctx.beginPath();
        ctx.arc(m.x, m.y, lw * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (layers.shape && traits.brows?.regions) {
      // eyebrows: outline, the pixels read as hair, and the between-brows gap
      const { brows, gap, gapHair } = traits.brows.regions;
      ctx.lineWidth = lw;
      for (const b of brows) {
        dot(b.hair, "rgba(160, 90, 255, 0.55)");
        ctx.strokeStyle = "#b07cff";
        strokePolygon(ctx, b.outline);
      }
      dot(gapHair, "rgba(255, 60, 60, 0.7)");
      ctx.strokeStyle = "#ff6b6b";
      strokePolygon(ctx, gap);
    }

    // the color-correction reference: where it was taken, or the crosshair
    const target = picking ? cursor : marker;
    if (target) {
      // sized to the photo, since it's shown scaled down to fit the panel
      const u = Math.max(image.width, image.height) / 400;
      const r = 7 * u;
      for (const [color, width] of [["rgba(0, 0, 0, 0.75)", 2.4 * u], ["#ffffff", 1.1 * u]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        strokeCircle(ctx, { cx: target.x, cy: target.y, r });
        if (picking) {
          ctx.beginPath();
          ctx.moveTo(target.x - 2 * r, target.y);
          ctx.lineTo(target.x - r, target.y);
          ctx.moveTo(target.x + r, target.y);
          ctx.lineTo(target.x + 2 * r, target.y);
          ctx.moveTo(target.x, target.y - 2 * r);
          ctx.lineTo(target.x, target.y - r);
          ctx.moveTo(target.x, target.y + r);
          ctx.lineTo(target.x, target.y + 2 * r);
          ctx.stroke();
        }
      }
    }
  }, [image, result, layers, picking, cursor, marker]);

  // Screen position -> image pixel. The canvas is CSS-scaled and, when its
  // max-height kicks in, letterboxed by object-fit: contain - so scale by the
  // drawn image's box, not the element's.
  function toImage(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = Math.min(rect.width / image.width, rect.height / image.height);
    if (!(scale > 0)) return null;
    const x = (e.clientX - rect.left - (rect.width - image.width * scale) / 2) / scale;
    const y = (e.clientY - rect.top - (rect.height - image.height * scale) / 2) / scale;
    return { x: Math.round(x), y: Math.round(y) };
  }

  function onKeyDown(e) {
    if (!picking || !cursor) return;
    const step = Math.max(1, Math.round(image.width / 100)) * (e.shiftKey ? 5 : 1);
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (move) {
      e.preventDefault();
      setCursor({
        x: Math.min(image.width - 1, Math.max(0, cursor.x + move[0])),
        y: Math.min(image.height - 1, Math.max(0, cursor.y + move[1])),
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick(cursor.x, cursor.y);
    } else if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={picking ? "photo is-picking" : "photo"}
      aria-label={
        picking
          ? "Your photo. Move the crosshair with the arrow keys (Shift for bigger steps) and press Enter on something white or gray."
          : "Your photo with measurement overlay"
      }
      tabIndex={picking ? 0 : undefined}
      onKeyDown={onKeyDown}
      onPointerMove={picking ? (e) => setCursor(toImage(e) ?? cursor) : undefined}
      onClick={
        picking
          ? (e) => {
              const p = toImage(e);
              if (p) onPick(p.x, p.y);
            }
          : undefined
      }
    />
  );
}

function maskToCanvas(mask) {
  const c = document.createElement("canvas");
  c.width = mask.width;
  c.height = mask.height;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(mask.width, mask.height);
  for (let i = 0; i < mask.data.length; i++) {
    const tint = MASK_TINT[mask.data[i]];
    if (tint) img.data.set(tint, i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function strokeCircle(ctx, { cx, cy, r }) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function strokePolygon(ctx, poly) {
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
}
