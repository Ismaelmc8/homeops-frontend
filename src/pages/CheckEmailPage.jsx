import { useLocation, Link } from "react-router-dom";
import AuthShell, { EnvelopeIcon } from "../components/AuthShell.jsx";

export default function CheckEmailPage() {
  const { state } = useLocation();
  const devLink = state?.devLink;

  return (
    <AuthShell tagline="Casi listo, un paso más.">
      {/* Step indicator */}
      <div className="auth-steps" aria-label="Paso 2 de 3">
        <div className="auth-step-dot done" />
        <div className="auth-step-dot active" />
        <div className="auth-step-dot" />
      </div>

      <div className="auth-illustration">
        <div className="auth-illustration-icon green">
          <EnvelopeIcon />
        </div>
        <div>
          <h1 className="auth-card-title">Revisa tu correo</h1>
          <p className="auth-card-subtitle" style={{ marginTop: "0.5rem" }}>
            Te hemos enviado un enlace para crear tu contraseña. Puede tardar unos segundos en llegar.
            Revisa también la carpeta de spam si no lo ves.
          </p>
        </div>
      </div>

      {devLink && (
        <div className="auth-devlink">
          <strong>🔧 Enlace de desarrollo</strong>
          <a href={devLink}>{devLink}</a>
        </div>
      )}

      <p className="auth-footer" style={{ marginTop: "0" }}>
        ¿Ya tienes contraseña?{" "}
        <Link to="/login">Iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
