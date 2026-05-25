import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/homeops.js";
import AuthShell, {
  AuthError,
  AlertIcon,
  Spinner,
} from "../components/AuthShell.jsx";

function UnavailableCard() {
  return (
    <AuthShell tagline="Tu hogar, organizado.">
      <div className="auth-illustration">
        <div className="auth-illustration-icon amber">
          <AlertIcon />
        </div>
        <div>
          <h1 className="auth-card-title" style={{ textAlign: "center" }}>
            Registro no disponible
          </h1>
          <p className="auth-card-subtitle" style={{ textAlign: "center", marginTop: "0.5rem" }}>
            Ya existe un hogar registrado. Pide al administrador que te invite por correo desde
            Administrar casa → Familia.
          </p>
        </div>
      </div>
      <p className="auth-footer">
        <Link to="/login">Ir a iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [homeName, setHomeName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi
      .registrationAvailable()
      .then((r) => setAvailable(r.available))
      .catch(() => setAvailable(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register({ email, name, homeName });
      navigate("/revisa-correo", { state: { devLink: res.devLink, email: email.trim() } });
    } catch (err) {
      setError(err.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  }

  if (available === null) {
    return (
      <AuthShell tagline="Tu hogar, organizado.">
        <p className="auth-card-subtitle">Cargando…</p>
      </AuthShell>
    );
  }

  if (!available) return <UnavailableCard />;

  return (
    <AuthShell tagline="Empieza a organizar tu hogar hoy.">
      <div>
        <h1 className="auth-card-title">Crea tu hogar</h1>
        <p className="auth-card-subtitle" style={{ marginTop: "0.35rem" }}>
          Te enviamos un enlace por correo para crear tu contraseña. Sin contraseña aquí.
        </p>
      </div>

      {/* Step indicator */}
      <div className="auth-steps" aria-label="Paso 1 de 3">
        <div className="auth-step-dot active" />
        <div className="auth-step-dot" />
        <div className="auth-step-dot" />
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
          <label className="auth-label" htmlFor="name">Tu nombre</label>
          <input
            id="name"
            type="text"
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="¿Cómo te llamamos?"
            autoComplete="name"
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="homeName">Nombre del hogar</label>
          <input
            id="homeName"
            type="text"
            className="auth-input"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value)}
            placeholder="Casa de los García, El nido…"
            required
          />
        </div>

        <AuthError message={error} />

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <><Spinner /> Enviando enlace…</> : "Continuar"}
        </button>
      </form>

      <p className="auth-footer">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login">Iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
