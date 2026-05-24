const DIRT_CLASSES = ["dirt-0", "dirt-1", "dirt-2", "dirt-3", "dirt-4", "dirt-5"];

export default function TaskCard({ task, onRequestComplete, completing }) {
  const cls = DIRT_CLASSES[task.dirtLevel] ?? "dirt-1";

  return (
    <article className={`task-card ${cls}`}>
      <div className="task-card-main">
        <strong>{task.name}</strong>
        <span className="task-zone">{task.zoneName}</span>
        <span className="task-dirt">{task.dirtLabel}</span>
        <div className="task-badges">
          {(task.dirtLevel >= 4 || task.scheduleStatus === "critical") && (
            <span className="badge badge-critical">Crítico</span>
          )}
          {task.scheduleStatus === "late" && (
            <span className="badge badge-warn">Atrasada</span>
          )}
          {task.isMicro && <span className="badge badge-micro">Micro</span>}
          {task.isCooperative && <span className="badge badge-coop">Cooperativa</span>}
          {task.assignees?.length > 0 && (
            <span className="badge badge-assignee">
              {task.assignees.map((a) => a.name).join(", ")}
            </span>
          )}
          {task.streakCount >= 2 && (
            <span className="badge badge-streak">Racha ×{task.streakCount}</span>
          )}
        </div>
      </div>

      <div className="task-card-actions">
        <button
          type="button"
          className="btn-complete"
          onClick={() => onRequestComplete(task)}
          disabled={completing}
        >
          Hecho
        </button>
      </div>
    </article>
  );
}
