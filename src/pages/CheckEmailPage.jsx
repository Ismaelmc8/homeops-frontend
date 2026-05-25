import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { authApi } from "../api/homeops.js";
import AuthShell, { EnvelopeIcon } from "../components/AuthShell.jsx";

export default function CheckEmailPage() {
  const { state } = useLocation();
  const devLink = state?.devLink;
  const email = state?.email ?? "";
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      const res = await authApi.resendActivation({ email });
      setResendMsg(res.message);
      if (res.devLink) window.location.href = res.devLink;
    } catch (e) {
      setResendMsg(e.message);
    } finally {
      setResending(false);
    }
  }

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

      {email && (
        <p className="auth-footer">
          <button type="button" className="btn-link" onClick={handleResend} disabled={resending}>
            {resending ? "Enviando…" : "Reenviar enlace de activación"}
          </button>
          {resendMsg && <span className="field-hint" style={{ display: "block" }}>{resendMsg}</span>}
        </p>
      )}

      <p className="auth-footer" style={{ marginTop: "0" }}>
        ¿Ya tienes contraseña?{" "}
        <Link to="/login">Iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
