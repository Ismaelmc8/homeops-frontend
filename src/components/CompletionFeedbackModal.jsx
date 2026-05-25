import { useEffect, useState } from "react";
import { socialApi } from "../api/homeops.js";
import TaskTimer from "./TaskTimer.jsx";

export default function CompletionFeedbackModal({ task, onSubmit, onClose, submitting }) {
  const [catalog, setCatalog] = useState(null);
  const [chip, setChip] = useState("");
  const [emoji, setEmoji] = useState("");
  const [tags, setTags] = useState([]);
  const [durationActual, setDurationActual] = useState("");
  const [qualityRating, setQualityRating] = useState(0);

  useEffect(() => {
    socialApi.catalog().then(setCatalog).catch(() => {});
  }, []);

  if (!task) return null;

  function toggleTag(id) {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = durationActual.trim() ? Number(durationActual) : null;
    onSubmit({
      durationActualMin: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
      feedbackChip: chip || null,
      feedbackEmoji: emoji || null,
      tags,
      qualityRating: qualityRating >= 1 ? qualityRating : null,
    });
  }

  return (
    <div className="reward-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="reward-modal completion-feedback-modal"
        role="dialog"
        aria-labelledby="completion-feedback-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="completion-feedback-title">¡Hecho! {task.name}</h2>
        <p className="completion-feedback-hint">
          Opcional: deja un chip o emoji para tu familia (se verá en el historial).
        </p>

        <form onSubmit={handleSubmit} className="completion-feedback-form">
          <TaskTimer
            expectedMin={task.durationMin}
            onElapsed={(mins) => {
              if (mins != null) setDurationActual(String(mins));
            }}
          />
          <label className="task-duration-field">
            <span className="field-hint">Minutos reales (opcional, mejora bonus eficiencia)</span>
            <input
              type="number"
              min="1"
              max="999"
              placeholder={`~${task.durationMin} min`}
              value={durationActual}
              onChange={(e) => setDurationActual(e.target.value)}
              className="task-duration-input"
            />
          </label>

          {catalog?.chips && (
            <div className="chip-group">
              <span className="chip-group-label">Feedback</span>
              <div className="chip-row">
                {catalog.chips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip-btn${chip === c.id ? " chip-btn--active" : ""}`}
                    onClick={() => setChip(chip === c.id ? "" : c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {catalog?.emojis && (
            <div className="chip-group">
              <span className="chip-group-label">Reacción</span>
              <div className="chip-row emoji-row">
                {catalog.emojis.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`emoji-btn${emoji === em ? " emoji-btn--active" : ""}`}
                    onClick={() => setEmoji(emoji === em ? "" : em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chip-group">
            <span className="chip-group-label">Calidad (opcional, afecta bonus si ≥4)</span>
            <div className="chip-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip-btn${qualityRating === n ? " chip-btn--active" : ""}`}
                  onClick={() => setQualityRating(qualityRating === n ? 0 : n)}
                >
                  {n}★
                </button>
              ))}
            </div>
          </div>

          {catalog?.tags && (
            <div className="chip-group">
              <span className="chip-group-label">Etiquetas</span>
              <div className="chip-row">
                {catalog.tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`chip-btn${tags.includes(t.id) ? " chip-btn--active" : ""}`}
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="completion-feedback-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onSubmit({})}
              disabled={submitting}
            >
              Omitir
            </button>
            <button type="submit" className="btn-complete" disabled={submitting}>
              {submitting ? "Guardando…" : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
