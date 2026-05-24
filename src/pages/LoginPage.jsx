import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell, {
  AuthError,
  PasswordInput,
  Spinner,
} from "../components/AuthShell.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell tagline="Haz que el hogar funcione solo.">
      <div>
        <h1 className="auth-card-title">Bienvenido/a</h1>
        <p className="auth-card-subtitle" style={{ marginTop: "0.35rem" }}>
          Inicia sesión para ver el estado de tu hogar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            inputMode="email"
            required
          />
        </div>

        <div className="auth-field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label className="auth-label" htmlFor="password">Contraseña</label>
            <Link to="/olvide-contrasena" className="auth-link-small">¿Olvidaste?</Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <AuthError message={error} />

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <><Spinner /> Entrando…</> : "Entrar"}
        </button>
      </form>

      <p className="auth-footer">
        ¿No tienes cuenta?{" "}
        <Link to="/registro">Crear hogar</Link>
      </p>
    </AuthShell>
  );
}
