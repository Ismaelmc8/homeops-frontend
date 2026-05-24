const DIRT_CLASS = ["dirt-0", "dirt-1", "dirt-2", "dirt-3", "dirt-4", "dirt-5"];

export default function TaskCard({ task, onComplete, completing }) {
  const cls = DIRT_CLASS[task.dirtLevel] ?? "dirt-1";
  return (
    <article className={`task-card ${cls}`}>
      <div className="task-card-main">
        <strong>{task.name}</strong>
        <span className="task-zone">{task.zoneName}</span>
        <span className="task-dirt">{task.dirtLabel}</span>
        {(task.scheduleStatus === "late" || task.scheduleStatus === "critical") && (
          <span className="badge badge-warn">Atrasada</span>
        )}
      </div>
      <button type="button" className="btn-complete" onClick={() => onComplete(task.id)} disabled={completing}>
        Hecho
      </button>
    </article>
  );
}
