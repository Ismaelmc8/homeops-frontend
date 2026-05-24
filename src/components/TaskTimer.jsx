import { useEffect, useRef, useState } from "react";

function formatElapsed(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TaskTimer({ expectedMin, onElapsed }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(sec);
        onElapsed?.(Math.max(1, Math.round(sec / 60)));
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [running, onElapsed]);

  function toggle() {
    if (running) {
      setRunning(false);
      clearInterval(tickRef.current);
    } else {
      startRef.current = Date.now() - elapsed * 1000;
      setRunning(true);
    }
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    clearInterval(tickRef.current);
    onElapsed?.(null);
  }

  const pct = expectedMin
    ? Math.min(100, Math.round((elapsed / 60 / expectedMin) * 100))
    : 0;
  const onTrack = expectedMin && elapsed / 60 <= expectedMin;

  return (
    <div className="task-timer" aria-label="Cronómetro opcional">
      <div className="task-timer-display">
        <span className="task-timer-time">{formatElapsed(elapsed)}</span>
        {expectedMin > 0 && (
          <span className={`task-timer-hint${onTrack ? " task-timer-hint--ok" : ""}`}>
            objetivo ~{expectedMin} min
          </span>
        )}
      </div>
      <div className="task-timer-bar" aria-hidden="true">
        <div
          className="task-timer-bar-fill"
          style={{ width: `${pct}%`, background: onTrack ? "var(--brand-light)" : "var(--warn)" }}
        />
      </div>
      <div className="task-timer-actions">
        <button type="button" className="btn-secondary btn-sm" onClick={toggle}>
          {running ? "Pausar" : "Iniciar"}
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={reset}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}
