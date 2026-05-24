import { useCallback, useEffect, useState } from "react";
import { socialApi, membersApi, zonesApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";

const CHIP_LABELS = {
  well_done: "Bien hecho",
  thanks: "Gracias",
  together_again: "¿Otra vez juntos?",
};

export default function TimelinePage() {
  const { user, refresh } = useAuth();
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [zones, setZones] = useState([]);
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [timeline, m, z] = await Promise.all([
      socialApi.timeline({
        userId: userId || undefined,
        zoneId: zoneId || undefined,
      }),
      membersApi.list(),
      zonesApi.list(),
    ]);
    setItems(timeline.items);
    setMembers(m.filter((x) => x.status === "active"));
    setZones(z);
  }, [userId, zoneId]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function sendKudos(item) {
    const others = members.filter((m) => m.id !== user.id);
    if (!others.length) {
      setMsg("No hay otros miembros para enviar kudos.");
      return;
    }
    const to = others[0];
    try {
      const res = await socialApi.kudos({ toUserId: to.id, completionId: item.id });
      setMsg(res.message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="page-content timeline-page">
      <h1 className="page-title">Historial del hogar</h1>
      <p className="page-desc">Actividad reciente de toda la familia (últimos 14 días).</p>

      {msg && <p className="toast" role="status">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="timeline-filters">
        <label>
          Miembro
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Todos</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.email}
              </option>
            ))}
          </select>
        </label>
        <label>
          Zona
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            <option value="">Todas</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="timeline-list">
        {items.map((item) => (
          <li key={item.id} className="timeline-item">
            <div className="timeline-item-head">
              <strong>{item.taskName}</strong>
              <span className="timeline-meta">
                {item.userName} · {item.zoneName} ·{" "}
                {new Date(item.completedAt).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="timeline-item-badges">
              <span>+{item.coinsEarned} 🪙</span>
              {item.isPreventive && <span className="badge badge-micro">Preventivo</span>}
              {item.feedbackChip && (
                <span className="badge badge-streak">{CHIP_LABELS[item.feedbackChip] ?? item.feedbackChip}</span>
              )}
              {item.feedbackEmoji && <span>{item.feedbackEmoji}</span>}
              {item.tags?.map((t) => (
                <span key={t} className="badge badge-assignee">
                  #{t}
                </span>
              ))}
              {item.kudosCount > 0 && (
                <span className="badge badge-coop">{item.kudosCount} kudos</span>
              )}
            </div>
            {item.userId !== user.id && (
              <button type="button" className="btn-link" onClick={() => sendKudos(item)}>
                Enviar kudos 👏
              </button>
            )}
          </li>
        ))}
      </ul>

      {!items.length && !error && (
        <p className="empty-state-desc">Aún no hay actividad en este periodo.</p>
      )}
    </div>
  );
}
