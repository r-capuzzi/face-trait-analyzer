import { useEffect, useRef } from "react";
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
export default function PhotoOverlay({ image, result, layers }) {
  const canvasRef = useRef(null);

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
      const { frame, eyes, eyeGap, nose, mouth, lips } = traits.shape.lines;
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
  }, [image, result, layers]);

  return <canvas ref={canvasRef} className="photo" aria-label="Your photo with measurement overlay" />;
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
