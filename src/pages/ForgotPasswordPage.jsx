import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/homeops.js";
import AuthShell, { AuthError, Spinner } from "../components/AuthShell.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message || "No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell tagline="Recupera el acceso a tu hogar.">
      <div>
        <h1 className="auth-card-title">¿Olvidaste la contraseña?</h1>
        <p className="auth-card-subtitle" style={{ marginTop: "0.35rem" }}>
          Te enviaremos un enlace para crear una nueva
        </p>
      </div>

      {sent ? (
        <p className="auth-card-subtitle">
          Si el correo está registrado, recibirás un enlace en unos minutos. Revisa también spam.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <AuthError message={error} />
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <><Spinner /> Enviando…</> : "Enviar enlace"}
          </button>
        </form>
      )}

      <p className="auth-footer">
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
