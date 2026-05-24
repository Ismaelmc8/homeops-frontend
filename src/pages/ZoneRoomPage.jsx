import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { visualizationApi, tasksApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";
import CompletionFeedbackModal from "../components/CompletionFeedbackModal.jsx";
import RewardBreakdownModal from "../components/RewardBreakdownModal.jsx";

const COLUMN_LABEL = {
  critical: "Crítico",
  today: "Hoy",
  recommended: "Recomendado",
  next: "Próximo",
  snoozed: "Pospuesta",
  recent: "Al día",
};

export default function ZoneRoomPage() {
  const { zoneId } = useParams();
  const { user, refresh } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [microName, setMicroName] = useState("");
  const [pendingTask, setPendingTask] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const load = useCallback(async () => {
    const detail = await visualizationApi.zone(zoneId);
    setData(detail);
  }, [zoneId]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function handlePostpone(taskId) {
    try {
      const res = await tasksApi.postpone(taskId, 1);
      showToast(res.message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSplit(taskId) {
    if (!window.confirm("¿Dividir esta tarea en dos partes más pequeñas?")) return;
    try {
      const res = await tasksApi.split(taskId);
      showToast(res.message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleQuickMicro(e) {
    e.preventDefault();
    try {
      await tasksApi.quickMicro({
        zoneId: Number(zoneId),
        name: microName.trim() || undefined,
      });
      setMicroName("");
      showToast("Microtarea creada.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitComplete(body) {
    if (!pendingTask) return;
    setCompletingId(pendingTask.id);
    try {
      const res = await tasksApi.complete(pendingTask.id, body);
      setLastResult(res);
      showToast(`+${res.coinsEarned} 🪙 · +${res.xpEarned} XP`);
      setPendingTask(null);
      await refresh();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCompletingId(null);
    }
  }

  if (error && !data) {
    return (
      <div className="page-content zone-room-page">
        <p className="form-error">{error}</p>
        <Link to="/mapa">← Volver al mapa</Link>
      </div>
    );
  }

  if (!data) return <div className="page-loading">Cargando habitación…</div>;

  const { zone, tasks, recentCompletions } = data;
  const activeTasks = tasks.filter((t) => t.column !== "recent");

  return (
    <div className="page-content zone-room-page">
      <Link to="/mapa" className="zone-back">← Mapa del hogar</Link>

      <header className={`zone-room-header dirt-${zone.dirtLevel}`}>
        <span className="zone-room-icon" aria-hidden="true">{zone.icon}</span>
        <div>
          <h1 className="page-title">{zone.name}</h1>
          <p className="zone-room-status">
            <strong>{zone.dirtLabel}</strong> · Estabilidad {zone.stabilityPercent}%
          </p>
        </div>
      </header>

      {toast && <p className="toast" role="status">{toast}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="zone-quick-actions">
        <h2 className="zone-section-title">Acciones rápidas</h2>
        <form onSubmit={handleQuickMicro} className="zone-micro-form">
          <input
            type="text"
            placeholder="Nueva microtarea (opcional)"
            value={microName}
            onChange={(e) => setMicroName(e.target.value)}
            maxLength={120}
          />
          <button type="submit" className="btn-complete btn-sm">
            + Micro
          </button>
        </form>
      </section>

      <section className="zone-tasks-section">
        <h2 className="zone-section-title">Tareas en esta zona</h2>
        {!activeTasks.length && (
          <p className="muted">No hay tareas pendientes aquí. ¡Buen trabajo!</p>
        )}
        <ul className="zone-task-list">
          {activeTasks.map((t) => (
            <li key={t.id} className="zone-task-item">
              <div className="zone-task-info">
                <strong>{t.name}</strong>
                <span className="zone-task-meta">
                  {COLUMN_LABEL[t.column] ?? t.column}
                  {t.isMicro && " · Micro"}
                  {t.durationMin && ` · ~${t.durationMin} min`}
                </span>
              </div>
              <div className="zone-task-actions">
                {t.column !== "snoozed" && (
                  <>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => handlePostpone(t.id)}
                    >
                      Posponer
                    </button>
                    {user?.role === "admin" && !t.isMicro && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => handleSplit(t.id)}
                      >
                        Dividir
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-complete btn-sm"
                      onClick={() =>
                        setPendingTask({
                          id: t.id,
                          name: t.name,
                          durationMin: t.durationMin,
                          zoneName: zone.name,
                        })
                      }
                      disabled={completingId === t.id}
                    >
                      Hecho
                    </button>
                  </>
                )}
                {t.column === "snoozed" && (
                  <span className="badge badge-warn">Pospuesta</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="zone-history-section">
        <h2 className="zone-section-title">Historial reciente</h2>
        {!recentCompletions.length ? (
          <p className="muted">Aún no hay completados en esta zona.</p>
        ) : (
          <ul className="zone-history-list">
            {recentCompletions.map((c) => (
              <li key={c.id}>
                <span className="zone-history-task">{c.taskName}</span>
                <span className="zone-history-meta">
                  {c.userName} · {new Date(c.completedAt).toLocaleDateString("es-ES")}
                  {" · "}+{c.coinsEarned}🪙
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingTask && (
        <CompletionFeedbackModal
          task={pendingTask}
          onSubmit={submitComplete}
          onClose={() => setPendingTask(null)}
          submitting={!!completingId}
        />
      )}

      {showBreakdown && lastResult && (
        <RewardBreakdownModal result={lastResult} onClose={() => setShowBreakdown(false)} />
      )}

      {lastResult && !showBreakdown && (
        <button
          type="button"
          className="btn-secondary map-floating-detail"
          onClick={() => setShowBreakdown(true)}
        >
          Ver desglose de recompensa
        </button>
      )}
    </div>
  );
}
