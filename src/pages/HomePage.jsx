import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tasksApi, metricsApi, goalsApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";
import TaskCard from "../components/TaskCard.jsx";
import RewardBreakdownModal from "../components/RewardBreakdownModal.jsx";
import CompletionFeedbackModal from "../components/CompletionFeedbackModal.jsx";

function ZoneHints({ aggregates }) {
  if (!aggregates?.length) return null;
  return (
    <ul className="zone-hints">
      {aggregates.slice(0, 3).map((z) => (
        <li key={z.zoneId}>
          {z.count} tarea{z.count > 1 ? "s" : ""} en {z.zoneName}
        </li>
      ))}
    </ul>
  );
}

function Column({ title, tasks, zoneAggregates, moreCount, onRequestComplete, completingId }) {
  if (!tasks?.length && !moreCount) return null;
  return (
    <section className="kanban-col">
      <h2>{title}</h2>
      <ZoneHints aggregates={zoneAggregates} />
      {tasks?.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          onRequestComplete={onRequestComplete}
          completing={completingId === t.id}
        />
      ))}
      {moreCount > 0 && <p className="see-more">+ {moreCount} más</p>}
    </section>
  );
}

export default function HomePage() {
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [microOnly, setMicroOnly] = useState(false);
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [claimingGoal, setClaimingGoal] = useState(false);
  const [toast, setToast] = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);

  const load = useCallback(async () => {
    const [kanban, m] = await Promise.all([
      tasksApi.kanban({ microOnly, assignedToMe }),
      metricsApi.summary(),
    ]);
    setData(kanban);
    setMetrics(m);
  }, [microOnly, assignedToMe]);

  async function handleClaimGoal() {
    setClaimingGoal(true);
    try {
      const res = await goalsApi.claim();
      showToast(res.message);
      await refresh();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setClaimingGoal(false);
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  }

  async function submitComplete(body) {
    if (!pendingTask) return;
    setCompletingId(pendingTask.id);
    try {
      const res = await tasksApi.complete(pendingTask.id, body);
      const parts = [`+${res.coinsEarned} 🪙`, `+${res.xpEarned} XP`];
      setLastResult(res);
      showToast(parts.join(" · "));
      setPendingTask(null);
      await refresh();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCompletingId(null);
    }
  }

  if (error) return <p className="form-error" style={{ padding: "1.25rem" }}>{error}</p>;
  if (!data) return <div className="page-loading">Cargando hogar…</div>;

  const fatigue = data.fatigue ?? metrics?.fatigue;
  const cols = data.columns ?? {};
  const zones = data.zoneAggregates ?? {};
  const pendingCount =
    (cols.critical?.length ?? 0) +
    (cols.today?.length ?? 0) +
    (cols.recommended?.length ?? 0) +
    (cols.next?.length ?? 0) +
    (cols.todayMore ?? 0) +
    (cols.recommendedMore ?? 0) +
    (cols.nextMore ?? 0);

  return (
    <div className="home-page">
      {toast && (
        <div className="toast" role="status">
          {toast}
          {lastResult && (
            <button
              type="button"
              className="toast-info-btn"
              onClick={() => setShowBreakdown(true)}
              aria-label="Ver desglose de recompensa"
            >
              ℹ
            </button>
          )}
        </div>
      )}

      <RewardBreakdownModal
        result={showBreakdown ? lastResult : null}
        onClose={() => setShowBreakdown(false)}
      />

      <CompletionFeedbackModal
        task={pendingTask}
        onSubmit={submitComplete}
        onClose={() => {
          if (!completingId && pendingTask) submitComplete({});
        }}
        submitting={!!completingId}
      />

      {(data.welcomeMessage || data.recoveryMode) && (
        <div className="recovery-banner" role="status">
          <strong>Bienvenido/a de nuevo</strong>
          <p>{data.welcomeMessage || "Empezamos suave hoy. Tus rachas siguen guardadas."}</p>
        </div>
      )}

      {data.microGoal && (
        <section className="micro-goal-banner">
          <span>Microobjetivo hoy: {data.microGoal.label}</span>
          <strong>
            {data.microGoal.progress}/{data.microGoal.target}
            {data.microGoal.met ? " ✓" : ""}
          </strong>
        </section>
      )}

      {data.weeklyMvp?.enabled && data.weeklyMvp.mvp && (
        <p className="mvp-banner">
          ⭐ MVP del hogar: <strong>{data.weeklyMvp.mvp.name}</strong> — {data.weeklyMvp.mvp.label}
        </p>
      )}

      {data.friendlyRanking?.enabled && data.friendlyRanking.entries?.length > 0 && (
        <section className="weekly-goal" style={{ marginBottom: "1rem" }}>
          <p className="weekly-goal-label">Ranking amistoso (objetivo común)</p>
          <p className="weekly-goal-text">{data.friendlyRanking.weeklyGoalLabel}</p>
          <p className="weekly-goal-meta">
            Progreso del hogar: <strong>{data.friendlyRanking.entries[0]?.teamProgressPercent}%</strong>
          </p>
        </section>
      )}

      {data.meta?.livingBase && (
        <div className={`meta-base-banner meta-base--${data.meta.livingBase.state}`} role="status">
          <strong>{data.meta.livingBase.label}</strong>
          {data.meta.livingBase.buffPercent > 0 && (
            <span> · +{data.meta.livingBase.buffPercent}% monedas</span>
          )}
          {data.meta.livingBase.alert && <p>{data.meta.livingBase.alert}</p>}
        </div>
      )}

      {data.meta?.dailyMission && !data.meta.dailyMission.completed && (
        <section className="meta-daily-banner">
          <span>Misión del día</span>
          <strong>{data.meta.dailyMission.label}</strong>
          <span className="meta-daily-progress">
            {data.meta.dailyMission.progress}/{data.meta.dailyMission.target}
          </span>
        </section>
      )}

      {data.meta?.bossMissions?.length > 0 && (
        <div className="meta-boss-banner" role="alert">
          <strong>⚔️ Boss de suciedad</strong>
          <p>
            {data.meta.bossMissions.map((b) => b.zoneName).join(", ")} — misión cooperativa de rescate (restaura la zona, no premia el caos).
          </p>
        </div>
      )}

      {data.meta?.randomBonusActive && (
        <div className="event-banner event-banner--random" role="status">
          <strong>✨ Impulso sorpresa</strong>
          <p>+15% monedas en todas las tareas hasta {new Date(data.meta.randomBonusActive.endsAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}.</p>
        </div>
      )}

      {data.meta?.randomEventSpawned && (
        <p className="toast" role="status">{data.meta.randomEventSpawned.label}</p>
      )}

      {data.activeEvent &&
        ["speedrun", "perfect_day"].includes(data.activeEvent.eventType) && (
        <div className="event-banner" role="status">
          <strong>
            {data.activeEvent.eventType === "speedrun" ? "⚡ Speedrun" : "✨ Día perfecto"}
          </strong>
          <p>
            {data.activeEvent.eventType === "speedrun"
              ? "+50% monedas en tareas de ≤15 min hasta el fin del evento."
              : "Bonus si todas las zonas quedan en verde durante el evento."}
          </p>
        </div>
      )}

      {data.weeklyGoal && (
        <section className="weekly-goal">
          <p className="weekly-goal-label">Objetivo del hogar esta semana</p>
          <p className="weekly-goal-text">{data.weeklyGoal.progress.label}</p>
          <div className="weekly-goal-bar">
            <div
              className="weekly-goal-fill"
              style={{ width: `${data.weeklyGoal.progress.percent}%` }}
            />
          </div>
          <p className="weekly-goal-meta">
            {data.weeklyGoal.progress.current} / {data.weeklyGoal.progress.target}
            {data.weeklyGoal.claimed
              ? " · Cofre abierto"
              : data.weeklyGoal.canClaim
                ? (
                    <button
                      type="button"
                      className="btn-link weekly-goal-claim"
                      onClick={handleClaimGoal}
                      disabled={claimingGoal}
                    >
                      Abrir cofre (+{data.weeklyGoal.rewardCoins} 🪙 repartidos)
                    </button>
                  )
                : ""}
          </p>
        </section>
      )}

      {data.sessionSuggestion && (
        <section className="session-suggestion">
          <p className="session-suggestion-label">Sesión sugerida (~{data.sessionSuggestion.totalMin} min)</p>
          <p className="session-suggestion-text">{data.sessionSuggestion.label}</p>
        </section>
      )}

      <div className="home-header">
        <p className="home-summary">{data.homeSummary}</p>
        <Link to="/mapa" className="home-map-cta">
          Ver mapa del hogar →
        </Link>
        <div className="home-meta">
          {metrics && (
            <>
              <p className="home-metric">
                Preventivo (7 d): <strong>{metrics.preventivePercent ?? metrics.onTimePercent}%</strong>
              </p>
              {metrics.avgDurationMin != null && (
                <p className="home-metric">
                  Tiempo medio: <strong>{metrics.avgDurationMin} min</strong>
                </p>
              )}
              {metrics.stabilityPercent != null && (
                <p className="home-metric">
                  Estabilidad: <strong>{metrics.stabilityPercent}%</strong>
                </p>
              )}
              {metrics.activeStreaks > 0 && (
                <p className="home-metric">
                  Rachas activas: <strong>{metrics.activeStreaks}</strong>
                </p>
              )}
            </>
          )}
          {fatigue && (
            <p className={`home-fatigue${fatigue.high ? " home-fatigue--high" : ""}`}>
              Fatiga hoy: <strong>{fatigue.points}/{fatigue.limit}</strong>
              {fatigue.high && (
                <span className="badge badge-fatigue" style={{ marginLeft: "0.5rem" }}>
                  Fatiga alta
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="home-filters">
        <label className="micro-filter">
          <input
            type="checkbox"
            checked={microOnly}
            onChange={(e) => setMicroOnly(e.target.checked)}
          />
          Solo microtareas (≤5 min)
        </label>
        <label className="micro-filter">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => setAssignedToMe(e.target.checked)}
          />
          Mis tareas asignadas
        </label>
      </div>

      {pendingCount === 0 && (
        <div className="empty-state" style={{ margin: "0 0 1.5rem" }}>
          <p className="empty-state-title">Todo al día 🎉</p>
          <p className="empty-state-desc">No hay tareas pendientes ahora mismo. ¡Buen trabajo!</p>
        </div>
      )}

      <Column
        title="🔴 Crítico"
        tasks={cols.critical}
        zoneAggregates={zones.critical}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />
      <Column
        title="📋 Hoy"
        tasks={cols.today}
        zoneAggregates={zones.today}
        moreCount={cols.todayMore}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />
      <Column
        title="✨ Recomendado"
        tasks={cols.recommended}
        zoneAggregates={zones.recommended}
        moreCount={cols.recommendedMore}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />
      <Column
        title="🕐 Próximo"
        tasks={cols.next}
        zoneAggregates={zones.next}
        moreCount={cols.nextMore}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />

      {data.done?.length > 0 && (
        <section className="kanban-col">
          <h2>✅ Hecho (7 días)</h2>
          <ul className="done-list">
            {data.done.slice(0, 10).map((d) => (
              <li key={d.id}>
                {d.task_name} — {d.user_name}{" "}
                <span style={{ color: "var(--brand)", fontWeight: 700 }}>
                  +{d.coins_earned} 🪙
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
