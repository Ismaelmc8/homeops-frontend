import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { socialApi } from "../api/homeops.js";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mvp, setMvp] = useState(null);
  const [microGoal, setMicroGoal] = useState(null);

  useEffect(() => {
    socialApi.mvp().then(setMvp).catch(() => {});
    socialApi.microGoals().then(setMicroGoal).catch(() => {});
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  const roleLabel = user.role === "admin" ? "Administrador" : "Miembro";
  const roleBadgeClass = user.role === "admin" ? "badge badge-admin" : "badge badge-member";

  return (
    <div className="page-content">
      {/* User card */}
      <section className="profile-card">
        <Avatar name={user.name} />
        <div className="profile-card-info">
          <h1 className="profile-name">{user.name}</h1>
          <span className={roleBadgeClass}>{roleLabel}</span>
        </div>
      </section>

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

      {/* Details */}
      <section className="profile-details">
        <h2 className="section-title">Información</h2>
        <div className="profile-rows">
          <InfoRow label="Correo" value={user.email} />
          {user.home && <InfoRow label="Hogar" value={user.home.name} />}
          <InfoRow label="Monedas" value={`${user.coins ?? 0} 🪙`} />
          {user.xp !== undefined && <InfoRow label="XP acumulado" value={`${user.xp} puntos`} />}
        </div>
      </section>

      {/* Logout */}
      <section className="profile-actions">
        <button type="button" className="btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}
