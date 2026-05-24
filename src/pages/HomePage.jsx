import { useCallback, useEffect, useState } from "react";
import { tasksApi, metricsApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";
import TaskCard from "../components/TaskCard.jsx";

function Column({ title, tasks, onComplete, completingId }) {
  if (!tasks?.length) return null;
  return (
    <section className="kanban-col">
      <h2>{title}</h2>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} onComplete={onComplete} completing={completingId === t.id} />
      ))}
    </section>
  );
}

export default function HomePage() {
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [toast, setToast] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [kanban, m] = await Promise.all([tasksApi.kanban(), metricsApi.summary()]);
    setData(kanban);
    setMetrics(m);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function handleComplete(id) {
    setCompletingId(id);
    try {
      const res = await tasksApi.complete(id);
      setToast(`+${res.coinsEarned} monedas`);
      await refresh();
      await load();
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setCompletingId(null);
    }
  }

  if (error) return <p className="form-error" style={{ padding: "1.25rem" }}>{error}</p>;
  if (!data) return <div className="page-loading">Cargando hogar…</div>;

  return (
    <div className="home-page">
      {toast && (
        <div className="toast" role="status">
          +{toast.replace("+", "").replace(" monedas", "")} 🪙
        </div>
      )}

      <div className="home-header">
        <p className="home-summary">{data.homeSummary}</p>
        {metrics && (
          <p className="home-metric">
            A tiempo esta semana: <strong>{metrics.onTimePercent}%</strong>
          </p>
        )}
      </div>

      {!data.columns.critical?.length && !data.columns.today?.length && !data.columns.next?.length && (
        <div className="empty-state" style={{ margin: "0 0 1.5rem" }}>
          <p className="empty-state-title">Todo al día 🎉</p>
          <p className="empty-state-desc">No hay tareas pendientes ahora mismo. ¡Buen trabajo!</p>
        </div>
      )}

      <Column title="🔴 Crítico" tasks={data.columns.critical} onComplete={handleComplete} completingId={completingId} />
      <Column title="📋 Hoy"     tasks={data.columns.today}    onComplete={handleComplete} completingId={completingId} />
      {data.columns.todayMore > 0 && <p className="see-more">+ {data.columns.todayMore} más en Hoy</p>}
      <Column title="🕐 Próximo" tasks={data.columns.next}     onComplete={handleComplete} completingId={completingId} />

      {data.done?.length > 0 && (
        <section className="kanban-col">
          <h2>✅ Hecho (7 días)</h2>
          <ul className="done-list">
            {data.done.slice(0, 10).map((d) => (
              <li key={d.id}>
                {d.task_name} — {d.user_name} <span style={{ color: "var(--brand)", fontWeight: 700 }}>+{d.coins_earned} 🪙</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
