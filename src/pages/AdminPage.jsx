import { useCallback, useEffect, useState } from "react";
import { zonesApi, tasksApi, rewardsApi, membersApi, metricsApi, eventsApi, socialApi } from "../api/homeops.js";

const TABS = [
  { id: "family", label: "Familia", step: 1 },
  { id: "zones", label: "Zonas", step: 2 },
  { id: "tasks", label: "Tareas", step: 3 },
  { id: "events", label: "Eventos", step: 4 },
  { id: "rewards", label: "Recompensas", step: 5 },
];

const MEMBER_STATUS = {
  active: { label: "Activo", className: "badge-member" },
  pending: { label: "Pendiente", className: "badge-pending" },
};

const TASK_TYPES = [
  { value: "micro", label: "Micro (≤5 min)", hint: "Acción muy rápida; baja la suciedad poco." },
  { value: "recurrent_light", label: "Recurrente ligera", hint: "Mantenimiento habitual (ej. fregar encimera)." },
  { value: "recurrent_heavy", label: "Recurrente pesada", hint: "Limpieza más intensa (ej. fregar suelo)." },
  { value: "deep", label: "Profunda", hint: "Limpieza a fondo; reduce mucha suciedad." },
  { value: "eventual", label: "Eventual", hint: "No sigue un ritmo fijo (ej. ordenar trastero)." },
];

/** Velocidad con la que empeora la zona si no se limpia (valor interno = puntos/día). */
const DIRT_SPEED_OPTIONS = [
  {
    value: 0.5,
    label: "Muy despacio",
    summary: "unas 2 semanas sin limpiar hasta empeorar mucho",
    hint: "Zonas poco usadas: trastero, habitación de invitados.",
  },
  {
    value: 1,
    label: "Normal",
    summary: "unas 5–7 días sin limpiar hasta colapso",
    hint: "Lo habitual en cocina, salón o baño de uso diario.",
  },
  {
    value: 1.5,
    label: "Se ensucia rápido",
    summary: "unos 4 días sin limpiar hasta colapso",
    hint: "Mucho tránsito o humedad: entrada, pasillo, baño pequeño.",
  },
  {
    value: 2,
    label: "Muy rápido",
    summary: "unos 3 días sin limpiar hasta colapso",
    hint: "Solo si de verdad se estropea en muy poco tiempo.",
  },
];

const DIRT_LEVELS = [
  { value: 0, label: "Impecable" },
  { value: 1, label: "Bien — solo mantenimiento" },
  { value: 2, label: "Algo desordenado" },
  { value: 3, label: "Necesita limpieza" },
  { value: 4, label: "Urgente" },
  { value: 5, label: "Colapso — hay que actuar ya" },
];

function dirtSpeedFromIncrement(increment) {
  const n = Number(increment);
  return DIRT_SPEED_OPTIONS.reduce((best, opt) =>
    Math.abs(opt.value - n) < Math.abs(best.value - n) ? opt : best
  );
}

function dirtLevelLabel(level) {
  return DIRT_LEVELS.find((d) => d.value === Number(level))?.label ?? `Nivel ${level}`;
}

function Field({ id, label, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="field-hint" id={`${id}-hint`}>{hint}</p> : null}
    </div>
  );
}

function ItemList({ empty, children }) {
  if (empty) return <p className="admin-empty">Aún no hay ninguno. Crea el primero con el formulario de arriba.</p>;
  return <ul className="admin-list">{children}</ul>;
}

const EMPTY_ZONE_FORM   = { name: "", dailyIncrement: 1, dirtLevel: 1 };
const EMPTY_TASK_FORM   = {
  name: "", zoneId: "", taskType: "recurrent_light",
  difficulty: 2, durationMin: 15,
  frequencyIdealDays: 2, frequencyToleranceDays: 1, frequencyCriticalDays: 3,
  isCooperative: false,
  assigneeIds: [],
};
const EMPTY_EVENT_FORM = {
  eventType: "speedrun",
  startsAt: "",
  endsAt: "",
};
const EMPTY_REWARD_FORM = { name: "", costCoins: 50 };
const EMPTY_INVITE_FORM = { email: "" };

export default function AdminPage() {
  const [tab, setTab] = useState("family");
  const [members, setMembers] = useState([]);
  const [zones, setZones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [msg, setMsg] = useState("");
  const [inviteDevLink, setInviteDevLink] = useState("");

  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE_FORM);
  const [editingZoneId, setEditingZoneId] = useState(null);

  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [rewardForm, setRewardForm] = useState(EMPTY_REWARD_FORM);
  const [editingRewardId, setEditingRewardId] = useState(null);

  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [balanceMetrics, setBalanceMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [socialSettings, setSocialSettings] = useState({
    mvpEnabled: false,
    rankingEnabled: false,
  });

  const load = useCallback(async () => {
    const [m, z, t, r, metrics, balance, ev, social] = await Promise.all([
      membersApi.list(),
      zonesApi.list(),
      tasksApi.list(),
      rewardsApi.list(),
      metricsApi.admin().catch(() => null),
      metricsApi.balance().catch(() => null),
      eventsApi.list().catch(() => []),
      socialApi.settings().catch(() => ({ mvpEnabled: false, rankingEnabled: false })),
    ]);
    setMembers(m);
    setZones(z);
    setTasks(t);
    setRewards(r);
    setAdminMetrics(metrics);
    setBalanceMetrics(balance);
    setEvents(ev);
    setSocialSettings(social);
    if (z.length) {
      setTaskForm((f) => (f.zoneId ? f : { ...f, zoneId: String(z[0].id) }));
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 4000);
  }

  function cancelZoneEdit() {
    setEditingZoneId(null);
    setZoneForm(EMPTY_ZONE_FORM);
  }

  function startZoneEdit(zone) {
    setEditingZoneId(zone.id);
    setZoneForm({
      name: zone.name,
      dailyIncrement: dirtSpeedFromIncrement(zone.daily_increment).value,
      dirtLevel: Number(zone.dirt_level),
    });
    setTab("zones");
  }

  async function saveZone(e) {
    e.preventDefault();
    try {
      if (editingZoneId) {
        await zonesApi.update(editingZoneId, zoneForm);
        cancelZoneEdit();
        flash("Zona actualizada");
      } else {
        await zonesApi.create(zoneForm);
        setZoneForm(EMPTY_ZONE_FORM);
        flash("Zona creada");
      }
      load();
    } catch (err) {
      flash(err.message || "No se pudo guardar la zona");
    }
  }

  async function deleteZone(zone) {
    const taskCount = tasks.filter((t) => t.zone_id === zone.id).length;
    const question =
      taskCount > 0
        ? `¿Borrar la zona «${zone.name}»?\n\nTambién se eliminarán ${taskCount} tarea(s) de esa zona.`
        : `¿Borrar la zona «${zone.name}»?`;
    if (!window.confirm(question)) return;

    try {
      await zonesApi.remove(zone.id);
      if (editingZoneId === zone.id) cancelZoneEdit();
      flash("Zona eliminada");
      load();
    } catch (err) {
      flash(err.message || "No se pudo borrar la zona");
    }
  }

  /* ── Tareas ── */
  function cancelTaskEdit() {
    setEditingTaskId(null);
    setTaskForm((f) => ({
      ...EMPTY_TASK_FORM,
      zoneId: f.zoneId || String(zones[0]?.id ?? ""),
    }));
  }

  function startTaskEdit(t) {
    setEditingTaskId(t.id);
    setTaskForm({
      name: t.name,
      zoneId: String(t.zone_id),
      taskType: t.task_type,
      difficulty: t.difficulty,
      durationMin: t.duration_min,
      frequencyIdealDays: t.frequency_ideal_days,
      frequencyToleranceDays: t.frequency_tolerance_days,
      frequencyCriticalDays: t.frequency_critical_days,
      isCooperative: !!t.is_cooperative,
      assigneeIds: (t.assignees ?? []).map((a) => a.userId),
    });
    setTab("tasks");
  }

  function toggleAssignee(userId) {
    setTaskForm((f) => {
      const ids = f.assigneeIds.includes(userId)
        ? f.assigneeIds.filter((id) => id !== userId)
        : [...f.assigneeIds, userId];
      return { ...f, assigneeIds: ids };
    });
  }

  async function saveTask(e) {
    e.preventDefault();
    if (!zones.length) { flash("Crea al menos una zona primero."); setTab("zones"); return; }
    const payload = {
      ...taskForm,
      zoneId: Number(taskForm.zoneId),
      assigneeIds: taskForm.assigneeIds,
    };
    try {
      if (editingTaskId) {
        await tasksApi.update(editingTaskId, payload);
        cancelTaskEdit();
        flash("Tarea actualizada");
      } else {
        await tasksApi.create(payload);
        setTaskForm((f) => ({ ...f, name: "", assigneeIds: [] }));
        flash("Tarea creada");
      }
      load();
    } catch (err) {
      flash(err.message || "No se pudo guardar la tarea");
    }
  }

  async function createEvent(e) {
    e.preventDefault();
    try {
      await eventsApi.create({
        eventType: eventForm.eventType,
        startsAt: new Date(eventForm.startsAt).toISOString(),
        endsAt: new Date(eventForm.endsAt).toISOString(),
      });
      setEventForm(EMPTY_EVENT_FORM);
      flash("Evento programado");
      load();
    } catch (err) {
      flash(err.message || "No se pudo crear el evento");
    }
  }

  async function deleteEvent(ev) {
    if (!window.confirm("¿Eliminar este evento?")) return;
    try {
      await eventsApi.remove(ev.id);
      flash("Evento eliminado");
      load();
    } catch (err) {
      flash(err.message || "No se pudo eliminar");
    }
  }

  async function deleteTask(t) {
    if (!window.confirm(`¿Borrar la tarea «${t.name}»?`)) return;
    try {
      await tasksApi.remove(t.id);
      if (editingTaskId === t.id) cancelTaskEdit();
      flash("Tarea eliminada");
      load();
    } catch (err) {
      flash(err.message || "No se pudo borrar la tarea");
    }
  }

  /* ── Recompensas ── */
  function cancelRewardEdit() {
    setEditingRewardId(null);
    setRewardForm(EMPTY_REWARD_FORM);
  }

  function startRewardEdit(r) {
    setEditingRewardId(r.id);
    setRewardForm({ name: r.name, costCoins: r.cost_coins });
    setTab("rewards");
  }

  async function saveReward(e) {
    e.preventDefault();
    try {
      if (editingRewardId) {
        await rewardsApi.update(editingRewardId, rewardForm);
        cancelRewardEdit();
        flash("Recompensa actualizada");
      } else {
        await rewardsApi.create(rewardForm);
        setRewardForm(EMPTY_REWARD_FORM);
        flash("Recompensa creada");
      }
      load();
    } catch (err) {
      flash(err.message || "No se pudo guardar la recompensa");
    }
  }

  async function deleteReward(r) {
    if (!window.confirm(`¿Borrar la recompensa «${r.name}»?`)) return;
    try {
      await rewardsApi.remove(r.id);
      if (editingRewardId === r.id) cancelRewardEdit();
      flash("Recompensa eliminada");
      load();
    } catch (err) {
      flash(err.message || "No se pudo borrar la recompensa");
    }
  }

  async function inviteMember(e) {
    e.preventDefault();
    setInviteDevLink("");
    try {
      const res = await membersApi.invite(inviteForm);
      setInviteForm(EMPTY_INVITE_FORM);
      if (res.devLink) setInviteDevLink(res.devLink);
      flash(res.message || "Invitación enviada");
      load();
    } catch (err) {
      flash(err.message || "No se pudo enviar la invitación");
    }
  }

  async function saveSocialSettings() {
    try {
      const data = await socialApi.updateSettings(socialSettings);
      setSocialSettings(data);
      flash("Configuración social guardada");
    } catch (err) {
      flash(err.message || "No se pudo guardar");
    }
  }

  async function resendInvite(member) {
    setInviteDevLink("");
    try {
      const res = await membersApi.resendInvite(member.id);
      if (res.devLink) setInviteDevLink(res.devLink);
      flash(res.message || "Invitación reenviada");
    } catch (err) {
      flash(err.message || "No se pudo reenviar la invitación");
    }
  }

  const selectedType = TASK_TYPES.find((t) => t.value === taskForm.taskType);
  const selectedDirtSpeed = dirtSpeedFromIncrement(zoneForm.dailyIncrement);

  return (
    <div className="admin-page">
      <h1>Administrar casa</h1>
      <p className="admin-intro">
        Configura el hogar: <strong>familia</strong> (invitar miembros), <strong>zonas</strong>,{" "}
        <strong>tareas</strong> y <strong>recompensas</strong> (premios que se canjean con monedas).
      </p>

      {msg && (
        <p className="toast" role="status">
          {msg}
        </p>
      )}

      {balanceMetrics && (
        <section className="admin-balance" aria-label="Reparto semanal">
          <h3 className="admin-balance-title">Reparto (7 días)</h3>
          {balanceMetrics.imbalanceMessage && (
            <p className="admin-balance-warn">{balanceMetrics.imbalanceMessage}</p>
          )}
          <ul className="admin-balance-list">
            {balanceMetrics.members.map((m) => (
              <li key={m.userId}>
                <span>{m.name}</span>
                <span>{m.sharePercent}% · fiabilidad {m.reliabilityPercent}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {adminMetrics && (
        <section className="admin-metrics" aria-label="Métricas del hogar (7 días)">
          <div className="admin-metric-card">
            <strong>{adminMetrics.preventivePercent}%</strong>
            <span>Preventivo</span>
          </div>
          <div className="admin-metric-card">
            <strong>{adminMetrics.stabilityPercent}%</strong>
            <span>Estabilidad zonas</span>
          </div>
          <div className="admin-metric-card">
            <strong>{adminMetrics.completionsInPeriod}</strong>
            <span>Completadas</span>
          </div>
          <div className="admin-metric-card">
            <strong>{adminMetrics.contributorCount}</strong>
            <span>Contribuyentes</span>
          </div>
          {adminMetrics.avgDurationMin != null && (
            <div className="admin-metric-card">
              <strong>{adminMetrics.avgDurationMin} min</strong>
              <span>Tiempo medio</span>
            </div>
          )}
          {adminMetrics.activeStreaksHome > 0 && (
            <div className="admin-metric-card">
              <strong>{adminMetrics.activeStreaksHome}</strong>
              <span>Rachas activas</span>
            </div>
          )}
        </section>
      )}

      <nav className="admin-tabs" aria-label="Secciones de administración">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "admin-tab active" : "admin-tab"}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            <span className="admin-tab-step">{t.step}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "family" && (
        <section className="admin-panel" aria-labelledby="family-heading">
          <h2 id="family-heading">Familia del hogar</h2>
          <p className="panel-desc">
            Invita por correo a quien viva contigo. Esa persona elegirá su nombre al activar la
            cuenta, creará su contraseña y entrará como <strong>miembro</strong> (puede completar
            tareas y ganar monedas, pero no administrar la casa).
          </p>

          <section className="admin-social-settings">
            <h3>Funciones sociales (opt-in)</h3>
            <p className="panel-desc">
              Por defecto desactivadas. Sin rankings punitivos: el MVP premia equilibrio, no volumen.
            </p>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={socialSettings.mvpEnabled}
                onChange={(e) =>
                  setSocialSettings((s) => ({ ...s, mvpEnabled: e.target.checked }))
                }
              />
              MVP semanal visible en la home
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={socialSettings.rankingEnabled}
                onChange={(e) =>
                  setSocialSettings((s) => ({ ...s, rankingEnabled: e.target.checked }))
                }
              />
              Ranking amistoso (progreso del objetivo común)
            </label>
            <button type="button" className="btn-secondary" onClick={saveSocialSettings}>
              Guardar configuración social
            </button>
          </section>

          <form onSubmit={inviteMember} className="admin-form">
            <Field
              id="invite-email"
              label="Correo electrónico"
              hint="Debe ser un email real; ahí llegará el enlace de activación."
            >
              <input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="maria@ejemplo.com"
                required
              />
            </Field>

            <div className="form-actions">
              <button type="submit">Enviar invitación</button>
            </div>
          </form>

          {inviteDevLink ? (
            <div className="admin-devlink">
              <p className="field-hint">
                <strong>Desarrollo:</strong> el correo no está configurado o estás en local. Copia
                este enlace y ábrelo en el navegador:
              </p>
              <code>{inviteDevLink}</code>
            </div>
          ) : null}

          <h3>Personas del hogar</h3>
          <ItemList empty={!members.length}>
            {members.map((m) => {
              const status = MEMBER_STATUS[m.status] ?? {
                label: m.status,
                className: "badge-member",
              };
              const displayName = m.name?.trim() ? m.name : null;
              return (
                <li key={m.id}>
                  <div className="admin-list-item-main">
                    <strong>{displayName ?? m.email}</strong>
                    {displayName ? <span className="item-meta">{m.email}</span> : null}
                    <span className="item-meta">
                      <span className={status.className}>{status.label}</span>
                      {" · "}
                      {m.role === "admin" ? "Administrador" : "Miembro"}
                    </span>
                  </div>
                  {m.status === "pending" ? (
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => resendInvite(m)}
                      >
                        Reenviar invitación
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ItemList>
        </section>
      )}

      {tab === "zones" && (
        <section className="admin-panel" aria-labelledby="zones-heading">
          <h2 id="zones-heading">Zonas del hogar</h2>
          <p className="panel-desc">
            Cada zona es un espacio (cocina, baño, salón…). Tiene un nivel de <strong>suciedad</strong>{" "}
            de 0 a 5 que sube solo cada día. Al completar tareas en esa zona, la suciedad baja.
          </p>

          <form onSubmit={saveZone} className="admin-form">
            {editingZoneId ? (
              <p className="admin-editing-banner">Editando zona — los cambios se guardan al pulsar «Guardar».</p>
            ) : null}

            <Field
              id="zone-name"
              label="Nombre de la zona"
              hint='Ejemplo: "Cocina", "Baño principal".'
            >
              <input
                id="zone-name"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                placeholder="Cocina"
                required
              />
            </Field>

            <Field
              id="zone-increment"
              label="¿Qué tan rápido se ensucia si no limpias?"
              hint={selectedDirtSpeed.hint}
            >
              <select
                id="zone-increment"
                value={zoneForm.dailyIncrement}
                onChange={(e) =>
                  setZoneForm({ ...zoneForm, dailyIncrement: Number(e.target.value) })
                }
              >
                {DIRT_SPEED_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.summary}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="zone-dirt"
              label={editingZoneId ? "Suciedad actual" : "Suciedad inicial"}
              hint={
                editingZoneId
                  ? "Cómo está la zona ahora mismo. Puedes corregirlo si te has equivocado."
                  : "Cómo está la zona hoy al darla de alta. Lo habitual es «Bien — solo mantenimiento»."
              }
            >
              <select
                id="zone-dirt"
                value={zoneForm.dirtLevel}
                onChange={(e) => setZoneForm({ ...zoneForm, dirtLevel: Number(e.target.value) })}
              >
                {DIRT_LEVELS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="form-actions">
              <button type="submit">{editingZoneId ? "Guardar cambios" : "Añadir zona"}</button>
              {editingZoneId ? (
                <button type="button" className="btn-secondary" onClick={cancelZoneEdit}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <h3>Zonas actuales</h3>
          <ItemList empty={!zones.length}>
            {zones.map((z) => (
              <li key={z.id} className={editingZoneId === z.id ? "admin-list-item-active" : ""}>
                <div className="admin-list-item-main">
                  <strong>{z.name}</strong>
                  <span className="item-meta">
                    Ahora: {dirtLevelLabel(z.dirt_level)} ·{" "}
                    {dirtSpeedFromIncrement(z.daily_increment).label}
                    {tasks.some((t) => t.zone_id === z.id)
                      ? ` · ${tasks.filter((t) => t.zone_id === z.id).length} tarea(s)`
                      : ""}
                  </span>
                </div>
                <div className="item-actions">
                  <button type="button" className="btn-secondary" onClick={() => startZoneEdit(z)}>
                    Editar
                  </button>
                  <button type="button" className="btn-danger" onClick={() => deleteZone(z)}>
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ItemList>
        </section>
      )}

      {tab === "tasks" && (
        <section className="admin-panel" aria-labelledby="tasks-heading">
          <h2 id="tasks-heading">Tareas</h2>
          <p className="panel-desc">
            Las tareas aparecen en el tablero del hogar (Crítico, Hoy, Próximo). Al completarlas el
            usuario gana <strong>monedas</strong> (más si la zona está poco sucia) y baja la suciedad
            de la zona.
          </p>

          {!zones.length && (
            <p className="admin-warn">Primero crea al menos una zona en la pestaña «Zonas».</p>
          )}

          <form onSubmit={saveTask} className="admin-form">
            {editingTaskId ? (
              <p className="admin-editing-banner">Editando tarea — guarda los cambios al pulsar «Guardar».</p>
            ) : null}

            <Field id="task-name" label="Nombre de la tarea" hint='Ejemplo: "Fregar encimera", "Sacar basura".'>
              <input
                id="task-name"
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                placeholder="Fregar encimera"
                required
                disabled={!zones.length}
              />
            </Field>

            <Field id="task-zone" label="Zona" hint="En qué habitación o área se hace esta tarea.">
              <select
                id="task-zone"
                value={taskForm.zoneId}
                onChange={(e) => setTaskForm({ ...taskForm, zoneId: e.target.value })}
                disabled={!zones.length}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="task-type"
              label="Tipo de tarea"
              hint={selectedType?.hint ?? "Define cuánto limpia la zona al completarla."}
            >
              <select
                id="task-type"
                value={taskForm.taskType}
                onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
                disabled={!zones.length}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="field-row">
              <Field
                id="task-difficulty"
                label="Dificultad (1–5)"
                hint="Esfuerzo de la tarea. Afecta las monedas: más dificultad = más recompensa."
              >
                <input
                  id="task-difficulty"
                  type="number"
                  min="1"
                  max="5"
                  value={taskForm.difficulty}
                  onChange={(e) => setTaskForm({ ...taskForm, difficulty: Number(e.target.value) })}
                  disabled={!zones.length}
                />
              </Field>

              <Field
                id="task-duration"
                label="Duración (minutos)"
                hint="Tiempo estimado. También influye en las monedas ganadas."
              >
                <input
                  id="task-duration"
                  type="number"
                  min="1"
                  max="180"
                  value={taskForm.durationMin}
                  onChange={(e) => setTaskForm({ ...taskForm, durationMin: Number(e.target.value) })}
                  disabled={!zones.length}
                />
              </Field>
            </div>

            <fieldset className="field-group" disabled={!zones.length}>
              <legend>Cada cuánto conviene hacerla</legend>
              <p className="field-hint field-hint-block">
                Sirve para ordenar el tablero: si pasa el tiempo «ideal», aparece como pendiente; si
                pasa el «crítico», salta a la columna Crítico.
              </p>
              <div className="field-row">
                <Field
                  id="freq-ideal"
                  label="Cada X días (ideal)"
                  hint="Ritmo deseado. Ej: 2 = cada dos días."
                >
                  <input
                    id="freq-ideal"
                    type="number"
                    min="1"
                    max="90"
                    value={taskForm.frequencyIdealDays}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, frequencyIdealDays: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field
                  id="freq-tolerance"
                  label="Margen (días)"
                  hint="Días extra antes de marcarla «tarde»."
                >
                  <input
                    id="freq-tolerance"
                    type="number"
                    min="0"
                    max="30"
                    value={taskForm.frequencyToleranceDays}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, frequencyToleranceDays: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field
                  id="freq-critical"
                  label="Hasta crítico (días)"
                  hint="Si se pasa este margen, va a Crítico."
                >
                  <input
                    id="freq-critical"
                    type="number"
                    min="1"
                    max="60"
                    value={taskForm.frequencyCriticalDays}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, frequencyCriticalDays: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
            </fieldset>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={taskForm.isCooperative}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, isCooperative: e.target.checked })
                }
                disabled={!zones.length}
              />
              Tarea cooperativa (+15% si 2+ miembros la completan en 48 h)
            </label>

            {members.filter((m) => m.status === "active").length > 0 && (
              <Field
                id="task-assignees"
                label="Asignar a (opcional)"
                hint="Vacío = cualquiera puede hacerla. Solo miembros activos."
              >
                <div className="assignee-chips">
                  {members
                    .filter((m) => m.status === "active")
                    .map((m) => (
                      <label key={m.id} className="assignee-chip">
                        <input
                          type="checkbox"
                          checked={taskForm.assigneeIds.includes(m.id)}
                          onChange={() => toggleAssignee(m.id)}
                        />
                        {m.name || m.email}
                      </label>
                    ))}
                </div>
              </Field>
            )}

            <div className="form-actions">
              <button type="submit" disabled={!zones.length}>
                {editingTaskId ? "Guardar cambios" : "Añadir tarea"}
              </button>
              {editingTaskId ? (
                <button type="button" className="btn-secondary" onClick={cancelTaskEdit}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <h3>Tareas actuales</h3>
          <ItemList empty={!tasks.length}>
            {tasks.map((t) => (
              <li key={t.id} className={editingTaskId === t.id ? "admin-list-item-active" : ""}>
                <div className="admin-list-item-main">
                  <strong>{t.name}</strong>
                  <span className="item-meta">
                    {t.zone_name} · {TASK_TYPES.find((x) => x.value === t.task_type)?.label ?? t.task_type}
                    {" · "}dificultad {t.difficulty} · {t.duration_min} min · cada {t.frequency_ideal_days} d
                    {t.is_cooperative ? " · cooperativa" : ""}
                    {(t.assignees?.length ?? 0) > 0
                      ? ` · ${t.assignees.map((a) => a.name).join(", ")}`
                      : ""}
                  </span>
                </div>
                <div className="item-actions">
                  <button type="button" className="btn-secondary" onClick={() => startTaskEdit(t)}>
                    Editar
                  </button>
                  <button type="button" className="btn-danger" onClick={() => deleteTask(t)}>
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ItemList>
        </section>
      )}

      {tab === "events" && (
        <section className="admin-panel" aria-labelledby="events-heading">
          <h2 id="events-heading">Eventos temporales</h2>
          <p className="panel-desc">
            Solo un evento activo a la vez. <strong>Speedrun</strong>: +50% monedas en tareas ≤15 min.
            <strong> Día perfecto</strong>: bonus si todas las zonas quedan en verde.
          </p>

          <form onSubmit={createEvent} className="admin-form">
            <Field id="event-type" label="Tipo">
              <select
                id="event-type"
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
              >
                <option value="speedrun">Speedrun</option>
                <option value="perfect_day">Día perfecto</option>
              </select>
            </Field>
            <div className="field-row">
              <Field id="event-start" label="Inicio">
                <input
                  id="event-start"
                  type="datetime-local"
                  value={eventForm.startsAt}
                  onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })}
                  required
                />
              </Field>
              <Field id="event-end" label="Fin">
                <input
                  id="event-end"
                  type="datetime-local"
                  value={eventForm.endsAt}
                  onChange={(e) => setEventForm({ ...eventForm, endsAt: e.target.value })}
                  required
                />
              </Field>
            </div>
            <button type="submit">Activar evento</button>
          </form>

          <h3>Eventos</h3>
          <ItemList empty={!events.length}>
            {events.map((ev) => (
              <li key={ev.id}>
                <div className="admin-list-item-main">
                  <strong>
                    {ev.eventType === "speedrun" ? "Speedrun" : "Día perfecto"}
                    {ev.isActive ? " (activo)" : ""}
                  </strong>
                  <span className="item-meta">
                    {new Date(ev.startsAt).toLocaleString()} — {new Date(ev.endsAt).toLocaleString()}
                  </span>
                </div>
                <button type="button" className="btn-danger" onClick={() => deleteEvent(ev)}>
                  Borrar
                </button>
              </li>
            ))}
          </ItemList>
        </section>
      )}

      {tab === "rewards" && (
        <section className="admin-panel" aria-labelledby="rewards-heading">
          <h2 id="rewards-heading">Recompensas (canjes)</h2>
          <p className="panel-desc">
            Un <strong>canje</strong> es un premio que alguien del hogar puede obtener con las{" "}
            <strong>monedas</strong> ganadas al completar tareas (ej. «Elegir película», «Café
            fuera»). Los miembros lo canjean desde la pestaña <strong>Premios</strong> de la app.
          </p>

          <form onSubmit={saveReward} className="admin-form">
            {editingRewardId ? (
              <p className="admin-editing-banner">Editando recompensa — guarda los cambios al pulsar «Guardar».</p>
            ) : null}

            <Field
              id="reward-name"
              label="Nombre de la recompensa"
              hint='Algo claro para toda la familia. Ej: "Noche de pizza", "1 hora de videojuegos".'
            >
              <input
                id="reward-name"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                placeholder="Elegir película del viernes"
                required
              />
            </Field>

            <Field
              id="reward-cost"
              label="Precio en monedas"
              hint="Cuántas monedas cuesta canjearla. Las monedas se ganan al completar tareas en el hogar."
            >
              <input
                id="reward-cost"
                type="number"
                min="1"
                max="9999"
                value={rewardForm.costCoins}
                onChange={(e) => setRewardForm({ ...rewardForm, costCoins: Number(e.target.value) })}
              />
            </Field>

            <div className="form-actions">
              <button type="submit">
                {editingRewardId ? "Guardar cambios" : "Añadir recompensa"}
              </button>
              {editingRewardId ? (
                <button type="button" className="btn-secondary" onClick={cancelRewardEdit}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <h3>Recompensas actuales</h3>
          <ItemList empty={!rewards.length}>
            {rewards.map((r) => (
              <li key={r.id} className={editingRewardId === r.id ? "admin-list-item-active" : ""}>
                <div className="admin-list-item-main">
                  <strong>{r.name}</strong>
                  <span className="item-meta">{r.cost_coins} monedas</span>
                </div>
                <div className="item-actions">
                  <button type="button" className="btn-secondary" onClick={() => startRewardEdit(r)}>
                    Editar
                  </button>
                  <button type="button" className="btn-danger" onClick={() => deleteReward(r)}>
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ItemList>
        </section>
      )}
    </div>
  );
}
