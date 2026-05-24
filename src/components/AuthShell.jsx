import { useState } from "react";
import "../pages/auth.css";

/* ── Logo SVG ── */
export function HomeOpsIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <rect width="46" height="46" rx="13" fill="rgba(255,255,255,0.18)" />
      <path d="M23 10L9 21.5V37h9.5V28h9V37H37V21.5L23 10z" fill="white" />
      <circle cx="35" cy="15" r="6" fill="#52b788" />
      <path d="M32.5 15l2 2 3-3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Icons ── */
export function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1={1} y1={1} x2={23} y2={23} />
    </svg>
  );
}

export function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={8} x2={12} y2={12} />
      <line x1={12} y1={16} x2="12.01" y2={16} />
    </svg>
  );
}

export function EnvelopeIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2="12.01" y2={17} />
    </svg>
  );
}

/* ── Password input with show/hide ── */
export function PasswordInput({ id, value, onChange, placeholder = "••••••••", minLength, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        className="auth-input has-toggle"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="auth-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

/* ── Password strength ── */
function scorePassword(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 4);
}

const STRENGTH = [
  { color: "#ef4444", label: "Muy débil", pct: "25%" },
  { color: "#f97316", label: "Débil",     pct: "50%" },
  { color: "#eab308", label: "Aceptable", pct: "75%" },
  { color: "#22c55e", label: "Fuerte",    pct: "100%" },
];

export function PasswordStrength({ password }) {
  if (!password) return null;
  const score = scorePassword(password);
  if (score === 0) return null;
  const cfg = STRENGTH[score - 1];
  return (
    <div className="auth-strength">
      <div className="auth-strength-track">
        <div className="auth-strength-bar" style={{ width: cfg.pct, background: cfg.color }} />
      </div>
      <span className="auth-strength-label" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

/* ── Error message ── */
export function AuthError({ message }) {
  if (!message) return null;
  return (
    <div className="auth-error" role="alert">
      <ErrorIcon />
      <span>{message}</span>
    </div>
  );
}

/* ── Loading spinner ── */
export function Spinner() {
  return <span className="auth-spinner" aria-hidden="true" />;
}

/* ── Root layout ── */
export default function AuthShell({ tagline = "Tu hogar, organizado.", children }) {
  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="auth-logo">
          <HomeOpsIcon />
          <span className="auth-logo-name">HomeOps</span>
        </div>
        <p className="auth-tagline">{tagline}</p>
      </div>
      <div className="auth-card">{children}</div>
    </div>
  );
}
