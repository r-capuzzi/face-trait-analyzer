import Icon from "./Icon";

// The photo panel's color-correction control. The actual picking happens on
// the photo (PhotoOverlay); this explains it and offers start / cancel /
// undo. Three states: idle, picking (maybe with a rejected spot), corrected.
export default function ColorCorrection({ picking, corrected, error, onStart, onCancel, onUndo }) {
  if (picking) {
    return (
      <div className="recolor is-active">
        <p className="recolor__text" role="status">
          <Icon name="target" size={18} />
          <span>
            Click something that should be <strong>white or gray</strong>: a shirt, a wall, a sheet of paper.
            Or use the arrow keys and press Enter.
          </span>
        </p>
        {error && (
          <p className="callout callout--warn" role="alert">
            <Icon name="alert" size={18} /> {error}
          </p>
        )}
        <button type="button" className="button button--ghost button--small" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }

  if (corrected) {
    return (
      <div className="recolor">
        <p className="recolor__text" role="status">
          <Icon name="check" size={18} />
          <span>Colors corrected for the lighting, using the spot circled on your photo.</span>
        </p>
        <div className="recolor__actions">
          <button type="button" className="button button--ghost button--small" onClick={onStart}>
            Pick another spot
          </button>
          <button type="button" className="button button--ghost button--small" onClick={onUndo}>
            Undo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recolor">
      <p className="recolor__text">
        <Icon name="target" size={18} />
        <span>
          Colored light tints every color measured. Pick something white or gray in your photo to remove
          the tint.
        </span>
      </p>
      <button type="button" className="button button--ghost button--small" onClick={onStart}>
        Correct the colors
      </button>
    </div>
  );
}
