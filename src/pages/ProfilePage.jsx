import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { socialApi, rpgApi } from "../api/homeops.js";

function Avatar({ name }) {
  const initials = name
    ? name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";
  return <div className="profile-avatar">{initials}</div>;
}

function InfoRow({ label, value }) {
  return (
    <div className="profile-row">
      <span className="profile-row-label">{label}</span>
      <span className="profile-row-value">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [mvp, setMvp] = useState(null);
  const [microGoal, setMicroGoal] = useState(null);
  const [rpg, setRpg] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    socialApi.mvp().then(setMvp).catch(() => {});
    socialApi.microGoals().then(setMicroGoal).catch(() => {});
    rpgApi.profile().then(setRpg).catch(() => {});
  }, []);

  useEffect(() => {
    if (!rpg) return;
    document.body.classList.remove("theme-spring", "theme-frame-green");
    if (rpg.equippedCosmeticKey === "cosmetic_theme_spring") {
      document.body.classList.add("theme-spring");
    }
    if (rpg.equippedCosmeticKey === "cosmetic_frame_green") {
      document.body.classList.add("theme-frame-green");
    }
    return () => document.body.classList.remove("theme-spring", "theme-frame-green");
  }, [rpg?.equippedCosmeticKey]);

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3500);
  }

  async function pickSpec(key) {
    try {
      const res = await rpgApi.setSpecialization(key);
      flash(res.message);
      const p = await rpgApi.profile();
      setRpg(p);
    } catch (e) {
      flash(e.message);
    }
  }

  async function equipTitle(key) {
    try {
      await rpgApi.equipTitle(key);
      setRpg(await rpgApi.profile());
      flash("Título actualizado");
    } catch (e) {
      flash(e.message);
    }
  }

  async function buyItem(key) {
    try {
      const res = await rpgApi.purchase(key);
      flash(res.message);
      await refresh();
      setRpg(await rpgApi.profile());
    } catch (e) {
      flash(e.message);
    }
  }

  async function revokeSessions() {
    try {
      const res = await rpgApi.revokeSessions();
      flash(res.message);
      logout();
      navigate("/login", { replace: true });
    } catch (e) {
      flash(e.message);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  const roleLabel = user.role === "admin" ? "Administrador" : "Miembro";
  const roleBadgeClass = user.role === "admin" ? "badge badge-admin" : "badge badge-member";
  const equippedTitle = rpg?.titles?.find((t) => t.equipped);

  return (
    <div className="page-content profile-page">
      {msg && <p className="toast" role="status">{msg}</p>}

      <section className="profile-card">
        <Avatar name={user.name} />
        <div className="profile-card-info">
          <h1 className="profile-name">{user.name}</h1>
          {equippedTitle && <span className="profile-title-badge">{equippedTitle.label}</span>}
          <span className={roleBadgeClass}>{roleLabel}</span>
        </div>
      </section>

      {rpg && (
        <section className="profile-details profile-rpg">
          <h2 className="section-title">Progresión RPG</h2>
          <p className="profile-rpg-rank">
            Nivel {rpg.level} · {rpg.rank.label} · {rpg.xp} XP
          </p>
          <div className="profile-level-bar">
            <div className="profile-level-fill" style={{ width: `${rpg.levelProgressPercent}%` }} />
          </div>
          <p className="field-hint">Siguiente nivel: {rpg.xpToNextLevel} XP</p>

          <h3 className="profile-subtitle">Especialización</h3>
          {rpg.specCooldownDaysLeft > 0 && (
            <p className="field-hint">Cambio disponible en {rpg.specCooldownDaysLeft} día(s)</p>
          )}
          <div className="spec-grid">
            {rpg.specializationCatalog.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`spec-chip${rpg.specialization === s.key ? " spec-chip--active" : ""}`}
                disabled={rpg.specCooldownDaysLeft > 0 && rpg.specialization !== s.key}
                onClick={() => pickSpec(s.key)}
              >
                <strong>{s.label}</strong>
                <span>{s.hint}</span>
              </button>
            ))}
          </div>

          <h3 className="profile-subtitle">Stats (30 días)</h3>
          <ul className="stats-grid">
            {rpg.stats.map((s) => (
              <li key={s.key}>
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </li>
            ))}
          </ul>

          <h3 className="profile-subtitle">Logros</h3>
          <ul className="achievement-list">
            {rpg.achievements.map((a) => (
              <li key={a.key} className={a.unlocked ? "achievement--done" : ""}>
                {a.unlocked ? "✓" : "○"} {a.label}
              </li>
            ))}
          </ul>

          {rpg.titles.some((t) => t.unlocked) && (
            <>
              <h3 className="profile-subtitle">Títulos</h3>
              <div className="chip-row">
                {rpg.titles.filter((t) => t.unlocked).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`chip-btn${t.equipped ? " chip-btn--active" : ""}`}
                    onClick={() => equipTitle(t.equipped ? null : t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {rpg.activeBuffs.length > 0 && (
            <>
              <h3 className="profile-subtitle">Buffs activos</h3>
              <ul className="buff-list">
                {rpg.activeBuffs.map((b) => (
                  <li key={b.key}>
                    {b.key} — hasta {new Date(b.expiresAt).toLocaleString("es-ES")}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="profile-subtitle">Tienda RPG</h3>
          <ul className="shop-list">
            {rpg.shop.map((item) => (
              <li key={item.key} className="shop-item">
                <div>
                  <strong>{item.name}</strong>
                  <p className="field-hint">{item.description}</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={item.owned}
                  onClick={() => buyItem(item.key)}
                >
                  {item.owned ? "En tu poder" : `${item.costCoins} 🪙`}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mvp?.enabled && mvp.mvp && (
        <section className="profile-mvp">
          <p>
            ⭐ MVP del hogar esta semana: <strong>{mvp.mvp.name}</strong>
          </p>
          <p className="profile-mvp-hint">{mvp.mvp.label}</p>
        </section>
      )}

      {microGoal && (
        <section className="profile-details">
          <h2 className="section-title">Microobjetivo de hoy</h2>
          <p>
            {microGoal.label}: {microGoal.progress}/{microGoal.target}
            {microGoal.met ? " ✓" : ""}
          </p>
        </section>
      )}

      <section className="profile-details">
        <h2 className="section-title">Información</h2>
        <div className="profile-rows">
          <InfoRow label="Correo" value={user.email} />
          {user.home && <InfoRow label="Hogar" value={user.home.name} />}
          <InfoRow label="Monedas" value={`${user.coins ?? 0} 🪙`} />
          {user.xp !== undefined && <InfoRow label="XP acumulado" value={`${user.xp} puntos`} />}
        </div>
      </section>

      <section className="profile-actions">
        <button type="button" className="btn-secondary" onClick={revokeSessions}>
          Cerrar sesión en todos los dispositivos
        </button>
        <button type="button" className="btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}
