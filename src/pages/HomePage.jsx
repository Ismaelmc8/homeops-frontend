import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tasksApi, metricsApi, goalsApi, smartApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";
import TaskCard from "../components/TaskCard.jsx";
import RewardBreakdownModal from "../components/RewardBreakdownModal.jsx";
import CompletionFeedbackModal from "../components/CompletionFeedbackModal.jsx";

/* ── Greeting helper ─────────────────────────────────────────── */
function getGreeting(name) {
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
  return name ? `${saludo}, ${name.split(" ")[0]}` : saludo;
}

/* ── Stat chip ───────────────────────────────────────────────── */
function StatChip({ icon, label, value, highlight }) {
  return (
    <div className={`home-stat-chip${highlight ? " home-stat-chip--hl" : ""}`}>
      <span className="home-stat-chip-icon">{icon}</span>
      <div>
        <div className="home-stat-chip-value">{value}</div>
        <div className="home-stat-chip-label">{label}</div>
      </div>
    </div>
  );
}

/* ── Featured next task ──────────────────────────────────────── */
function FeaturedTask({ task, onStart }) {
  return (
    <section className="home-featured-task" aria-label="Siguiente tarea sugerida">
      <div className="home-featured-top">
        <span className="home-featured-pill">✦ Sugerida</span>
        <span className="home-featured-duration">⏱ {task.durationMin} min</span>
      </div>
      <h2 className="home-featured-name">{task.name}</h2>
      <p className="home-featured-zone">{task.zoneName}</p>
      {task.reasons?.length > 0 && (
        <p className="home-featured-reason">{task.reasons[0]}</p>
      )}
      <button
        type="button"
        className="home-featured-btn"
        onClick={() => onStart(task)}
      >
        Empezar ahora
      </button>
    </section>
  );
}

/* ── Context banner (generic compact) ───────────────────────── */
function ContextBanner({ icon, label, detail, variant = "info" }) {
  return (
    <div className={`home-ctx-banner home-ctx-banner--${variant}`}>
      <span className="home-ctx-banner-icon">{icon}</span>
      <div>
        <strong>{label}</strong>
        {detail && <span className="home-ctx-banner-detail">{detail}</span>}
      </div>
    </div>
  );
}

/* ── Kanban column ───────────────────────────────────────────── */
function Column({ title, emoji, tasks, moreCount, onRequestComplete, completingId }) {
  if (!tasks?.length && !moreCount) return null;
  const count = (tasks?.length ?? 0) + (moreCount ?? 0);
  return (
    <section className="kanban-col">
      <div className="kanban-col-header">
        <span className="kanban-col-emoji">{emoji}</span>
        <h2>{title}</h2>
        <span className="kanban-col-count">{count}</span>
      </div>
      {tasks?.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          onRequestComplete={onRequestComplete}
          completing={completingId === t.id}
        />
      ))}
      {moreCount > 0 && (
        <p className="see-more">+ {moreCount} más en esta sección</p>
      )}
    </section>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function HomePage() {
  const { user, refresh } = useAuth();
  const [data, setData]           = useState(null);
  const [metrics, setMetrics]     = useState(null);
  const [microOnly, setMicroOnly] = useState(false);
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [claimingGoal, setClaimingGoal] = useState(false);
  const [toast, setToast]         = useState("");
  const [completingId, setCompletingId] = useState(null);
  const [error, setError]         = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);
  const [lowEnergySaving, setLowEnergySaving] = useState(false);

  const load = useCallback(async () => {
    const [kanban, m] = await Promise.all([
      tasksApi.kanban({ microOnly, assignedToMe }),
      metricsApi.summary(),
    ]);
    setData(kanban);
    setMetrics(m);
  }, [microOnly, assignedToMe]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  }

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

  async function toggleLowEnergy(active) {
    setLowEnergySaving(true);
    try {
      await smartApi.updatePrefs({ lowEnergyMode: active });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLowEnergySaving(false);
    }
  }

  if (error) return <p className="form-error" style={{ padding: "1.25rem" }}>{error}</p>;
  if (!data) return <div className="page-loading">Cargando hogar…</div>;

  const smart    = data.smart;
  const fatigue  = data.fatigue ?? metrics?.fatigue;
  const cols     = data.columns ?? {};
  const pendingCount =
    (cols.critical?.length ?? 0) +
    (cols.today?.length ?? 0) +
    (cols.recommended?.length ?? 0) +
    (cols.next?.length ?? 0) +
    (cols.todayMore ?? 0) +
    (cols.recommendedMore ?? 0) +
    (cols.nextMore ?? 0);

  const isLowEnergy = !!smart?.userPrefs?.lowEnergyMode;
  const isMicroEffective = !!smart?.effectiveMicroOnly;

  return (
    <div className="home-page">
      {/* ── Modals & toast ── */}
      {toast && (
        <div className="toast" role="status">
          {toast}
          {lastResult && (
            <button
              type="button"
              className="toast-info-btn"
              onClick={() => setShowBreakdown(true)}
              aria-label="Ver desglose"
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

      {/* ═══════════════════════════════════════════
          HERO — Saludo + métricas rápidas
          ═══════════════════════════════════════════ */}
      <section className="home-hero">
        <div className="home-hero-top">
          <div className="home-greeting-block">
            <p className="home-greeting">{getGreeting(user?.name)}</p>
            <h1 className="home-title">
              {pendingCount > 0
                ? <>{pendingCount} <span>pendientes</span></>
                : <>Todo al día <span>🎉</span></>
              }
            </h1>
            {smart?.inOptimalWindow && smart?.optimalHours?.label && (
              <p className="home-optimal-hint">⚡ {smart.optimalHours.label}</p>
            )}
          </div>
          <Link to="/mapa" className="home-map-cta" aria-label="Ver mapa del hogar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/>
            </svg>
            Mapa
          </Link>
        </div>

        {/* Quick stats chips */}
        {metrics && (
          <div className="home-stats-row" role="list" aria-label="Estadísticas">
            {metrics.preventivePercent != null && (
              <StatChip icon="🛡️" label="Preventivo" value={`${metrics.preventivePercent}%`} />
            )}
            {metrics.stabilityPercent != null && (
              <StatChip icon="🏠" label="Estabilidad" value={`${metrics.stabilityPercent}%`} />
            )}
            {metrics.activeStreaks > 0 && (
              <StatChip icon="🔥" label="Rachas" value={metrics.activeStreaks} />
            )}
            {metrics.avgDurationMin != null && (
              <StatChip icon="⏱" label="Tiempo medio" value={`${metrics.avgDurationMin} min`} />
            )}
            {fatigue && (
              <StatChip
                icon="⚡"
                label="Fatiga"
                value={`${fatigue.points}/${fatigue.limit}`}
                highlight={fatigue.high}
              />
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          CONTEXTO — Banners compactos
          ═══════════════════════════════════════════ */}
      <div className="home-context-stack">
        {(data.welcomeMessage || data.recoveryMode) && (
          <ContextBanner
            icon="👋"
            label="Bienvenido/a de nuevo"
            detail={data.welcomeMessage || "Empezamos suave hoy. Tus rachas siguen guardadas."}
            variant="info"
          />
        )}

        {data.meta?.livingBase && data.meta.livingBase.state !== "stable" && (
          <ContextBanner
            icon={data.meta.livingBase.state === "radiant" ? "✨" : data.meta.livingBase.state === "recovery" ? "🚨" : "⚠️"}
            label={data.meta.livingBase.label}
            detail={data.meta.livingBase.buffPercent > 0
              ? `+${data.meta.livingBase.buffPercent}% monedas${data.meta.livingBase.alert ? " · " + data.meta.livingBase.alert : ""}`
              : data.meta.livingBase.alert}
            variant={data.meta.livingBase.state === "radiant" ? "success" : data.meta.livingBase.state === "recovery" ? "danger" : "warn"}
          />
        )}

        {data.meta?.bossMissions?.length > 0 && (
          <ContextBanner
            icon="⚔️"
            label={`Boss de suciedad: ${data.meta.bossMissions.map((b) => b.zoneName).join(", ")}`}
            detail="Misión cooperativa de rescate"
            variant="danger"
          />
        )}

        {data.meta?.dailyMission && !data.meta.dailyMission.completed && (
          <ContextBanner
            icon="📋"
            label={`Misión del día: ${data.meta.dailyMission.label}`}
            detail={`${data.meta.dailyMission.progress}/${data.meta.dailyMission.target} completadas`}
            variant="info"
          />
        )}

        {data.activeEvent && ["speedrun", "perfect_day"].includes(data.activeEvent.eventType) && (
          <ContextBanner
            icon={data.activeEvent.eventType === "speedrun" ? "⚡" : "✨"}
            label={data.activeEvent.eventType === "speedrun" ? "Speedrun activo" : "Día perfecto activo"}
            detail={data.activeEvent.eventType === "speedrun"
              ? "+50% monedas en tareas ≤15 min"
              : "Bonus si todas las zonas quedan en verde"}
            variant="event"
          />
        )}

        {data.meta?.randomBonusActive && (
          <ContextBanner
            icon="🎁"
            label="Impulso sorpresa +15% monedas"
            detail={`Hasta las ${new Date(data.meta.randomBonusActive.endsAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
            variant="event"
          />
        )}

        {data.weeklyMvp?.enabled && data.weeklyMvp.mvp && (
          <ContextBanner
            icon="⭐"
            label={`MVP del hogar: ${data.weeklyMvp.mvp.name}`}
            detail={data.weeklyMvp.mvp.label}
            variant="success"
          />
        )}

        {smart?.burnout?.active && (
          <ContextBanner
            icon="😮‍💨"
            label="Modo suave recomendado"
            detail={smart.burnout.suggestion}
            variant="warn"
          />
        )}

        {smart?.assigneeSuggestions?.length > 0 && (
          <div className="home-ctx-banner home-ctx-banner--info">
            <span className="home-ctx-banner-icon">🤝</span>
            <div>
              <strong>Reparto sugerido</strong>
              <div className="home-ctx-banner-detail">
                {smart.assigneeSuggestions.slice(0, 2).map((s) => (
                  <span key={`${s.taskId}-${s.userId}`}>{s.taskName} → {s.name} · </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          SIGUIENTE TAREA DESTACADA
          ═══════════════════════════════════════════ */}
      {smart?.nextBestTask && (
        <FeaturedTask
          task={smart.nextBestTask}
          onStart={setPendingTask}
        />
      )}

      {/* ═══════════════════════════════════════════
          OBJETIVO SEMANAL + SESIÓN SUGERIDA
          ═══════════════════════════════════════════ */}
      {data.weeklyGoal && (
        <section className="home-weekly-goal">
          <div className="home-weekly-goal-head">
            <div>
              <p className="home-weekly-goal-label">Objetivo semanal</p>
              <p className="home-weekly-goal-text">{data.weeklyGoal.progress.label}</p>
            </div>
            <span className="home-weekly-goal-pct">
              {data.weeklyGoal.progress.percent}%
            </span>
          </div>
          <div className="home-weekly-goal-bar">
            <div
              className="home-weekly-goal-fill"
              style={{ width: `${data.weeklyGoal.progress.percent}%` }}
            />
          </div>
          <div className="home-weekly-goal-foot">
            <span>{data.weeklyGoal.progress.current} / {data.weeklyGoal.progress.target}</span>
            {data.weeklyGoal.claimed ? (
              <span className="home-weekly-goal-claimed">✓ Cofre abierto</span>
            ) : data.weeklyGoal.canClaim ? (
              <button
                type="button"
                className="home-weekly-goal-claim"
                onClick={handleClaimGoal}
                disabled={claimingGoal}
              >
                Abrir cofre 🎁 +{data.weeklyGoal.rewardCoins} 🪙
              </button>
            ) : null}
          </div>
        </section>
      )}

      {data.microGoal && (
        <section className="home-microgoal">
          <span className="home-microgoal-label">Micro-objetivo</span>
          <strong className="home-microgoal-text">{data.microGoal.label}</strong>
          <span className="home-microgoal-progress">
            {data.microGoal.progress}/{data.microGoal.target}
            {data.microGoal.met && <span className="home-microgoal-done"> ✓</span>}
          </span>
        </section>
      )}

      {data.sessionSuggestion && (
        <section className="home-session-card">
          <span className="home-session-label">Sesión ideal hoy</span>
          <span className="home-session-text">{data.sessionSuggestion.label}</span>
          <span className="home-session-time">~{data.sessionSuggestion.totalMin} min</span>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          FILTROS — toggle pills
          ═══════════════════════════════════════════ */}
      <div className="home-filter-pills" role="group" aria-label="Filtros">
        <button
          type="button"
          className={`filter-pill${(microOnly || isMicroEffective) ? " filter-pill--active" : ""}`}
          onClick={() => setMicroOnly((v) => !v)}
          disabled={isMicroEffective && !microOnly}
          aria-pressed={microOnly || isMicroEffective}
        >
          ⚡ Microtareas
          {isMicroEffective && !microOnly && <span className="filter-pill-auto"> · auto</span>}
        </button>
        <button
          type="button"
          className={`filter-pill${isLowEnergy ? " filter-pill--active" : ""}`}
          onClick={() => toggleLowEnergy(!isLowEnergy)}
          disabled={lowEnergySaving}
          aria-pressed={isLowEnergy}
        >
          😴 Energía baja
        </button>
        <button
          type="button"
          className={`filter-pill${assignedToMe ? " filter-pill--active" : ""}`}
          onClick={() => setAssignedToMe((v) => !v)}
          aria-pressed={assignedToMe}
        >
          👤 Mis tareas
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          ESTADO VACÍO
          ═══════════════════════════════════════════ */}
      {pendingCount === 0 && (
        <div className="home-all-done">
          <div className="home-all-done-icon">🎉</div>
          <h2>¡Todo al día!</h2>
          <p>No hay tareas pendientes ahora mismo. ¡Buen trabajo en equipo!</p>
          <Link to="/mapa" className="home-map-cta" style={{ marginTop: "0.75rem" }}>
            Ver estado del hogar
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          COLUMNAS KANBAN
          ═══════════════════════════════════════════ */}
      <Column
        title="Crítico"
        emoji="🔴"
        tasks={cols.critical}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />
      <Column
        title="Hoy"
        emoji="📋"
        tasks={cols.today}
        moreCount={cols.todayMore}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />
      <Column
        title="Recomendado"
        emoji="✨"
        tasks={cols.recommended}
        moreCount={cols.recommendedMore}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />
      <Column
        title="Próximo"
        emoji="🕐"
        tasks={cols.next}
        moreCount={cols.nextMore}
        onRequestComplete={setPendingTask}
        completingId={completingId}
      />

      {/* ═══════════════════════════════════════════
          COMPLETADAS
          ═══════════════════════════════════════════ */}
      {data.done?.length > 0 && (
        <section className="home-done-section">
          <div className="kanban-col-header">
            <span className="kanban-col-emoji">✅</span>
            <h2>Hecho</h2>
            <span className="kanban-col-count">7 días</span>
          </div>
          <ul className="home-done-list">
            {data.done.slice(0, 8).map((d) => (
              <li key={d.id} className="home-done-item">
                <span className="home-done-task">{d.task_name}</span>
                <span className="home-done-meta">{d.user_name}</span>
                <span className="home-done-coins">+{d.coins_earned} 🪙</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Smart notifications (colapsadas al fondo) */}
      {smart?.notifications?.filter((n) => !n.read)?.length > 0 && (
        <section className="home-notifs-section">
          <div className="kanban-col-header">
            <span className="kanban-col-emoji">🔔</span>
            <h2>Avisos</h2>
            <span className="kanban-col-count">{smart.notifications.filter((n) => !n.read).length}</span>
          </div>
          <div className="home-notifs-list">
            {smart.notifications.filter((n) => !n.read).slice(0, 3).map((n) => (
              <div key={n.id} className="home-notif-item">
                <div className="home-notif-body">
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                </div>
                <button
                  type="button"
                  className="home-notif-read"
                  onClick={() => smartApi.markRead(n.id).then(() => load())}
                >
                  Leído
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
