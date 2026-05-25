const DIRT_CLASSES = ["dirt-0", "dirt-1", "dirt-2", "dirt-3", "dirt-4", "dirt-5"];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function TaskCard({ task, onRequestComplete, completing }) {
  const cls = DIRT_CLASSES[task.dirtLevel] ?? "dirt-1";

  return (
    <article className={`task-card ${cls}`}>
      {/* Franja de color lateral según nivel de suciedad */}
      <div className="task-card-stripe" aria-hidden="true" />

      <div className="task-card-inner">
        <div className="task-card-main">
          <strong>{task.name}</strong>
          <span className="task-zone">{task.zoneName}</span>
          {task.dirtLevel >= 1 && (
            <span className="task-dirt">{task.dirtLabel}</span>
          )}
          <div className="task-badges">
            {(task.dirtLevel >= 4 || task.scheduleStatus === "critical") && (
              <span className="badge badge-critical">🔴 Crítico</span>
            )}
            {task.scheduleStatus === "late" && (
              <span className="badge badge-warn">⚠ Atrasada</span>
            )}
            {task.isMicro && <span className="badge badge-micro">⚡ Micro</span>}
            {task.isCooperative && <span className="badge badge-coop">🤝 Coop</span>}
            {task.isBoss && <span className="badge badge-boss">💀 Boss</span>}
            {task.assignees?.length > 0 && (
              <span className="badge badge-assignee">
                {task.assignees.map((a) => a.name).join(", ")}
              </span>
            )}
            {task.streakCount >= 2 && (
              <span className="badge badge-streak">🔥 ×{task.streakCount}</span>
            )}
          </div>
        </div>

        <div className="task-card-actions">
          <button
            type="button"
            className="btn-complete"
            onClick={() => onRequestComplete(task)}
            disabled={completing}
            aria-label={`Marcar ${task.name} como completada`}
          >
            <CheckIcon />
            Hecho
          </button>
        </div>
      </div>
    </article>
  );
}
