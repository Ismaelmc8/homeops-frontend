import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/* ── Inline icons ─────────────────────────────── */
function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPerson() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconCoin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M9 10.5C9 9.1 10.3 8 12 8s3 1.1 3 2.5S13.7 13 12 13s-3 1.1-3 2.5S10.3 18 12 18s3-1.1 3-2.5" />
    </svg>
  );
}

/* ── Nav item helper ──────────────────────────── */
function NavItem({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item${isActive ? " nav-item--active" : ""}`}
    >
      {icon}
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

/* ── Layout ──────────────────────────────────── */
export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="shell">
      {/* Top bar */}
      <header className="topbar" role="banner">
        <span className="topbar-brand">HomeOps</span>
        <div className="topbar-coins" aria-label={`${user?.coins ?? 0} monedas`}>
          <IconCoin />
          <span>{user?.coins ?? 0}</span>
        </div>
      </header>

      {/* Page content */}
      <main className="shell-main">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="bottom-nav" aria-label="Navegación principal">
        <NavItem to="/" icon={<IconHome />} label="Inicio" end />
        <NavItem to="/recompensas" icon={<IconGift />} label="Premios" />
        <NavItem to="/historial" icon={<IconHistory />} label="Historial" />
        <NavItem to="/perfil" icon={<IconPerson />} label="Perfil" />
        {user?.role === "admin" && (
          <NavItem to="/admin" icon={<IconSettings />} label="Admin" />
        )}
      </nav>
    </div>
  );
}
