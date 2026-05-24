import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authApi } from "../api/homeops.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell, {
  AuthError,
  AlertIcon,
  LockIcon,
  PasswordInput,
  PasswordStrength,
  Spinner,
} from "../components/AuthShell.jsx";

function InvalidLink() {
  return (
    <AuthShell tagline="Tu hogar, organizado.">
      <div className="auth-illustration">
        <div className="auth-illustration-icon amber">
          <AlertIcon />
        </div>
        <div>
          <h1 className="auth-card-title" style={{ textAlign: "center" }}>
            Enlace inválido
          </h1>
          <p className="auth-card-subtitle" style={{ textAlign: "center", marginTop: "0.5rem" }}>
            Este enlace ha caducado o ya fue usado. Los enlaces son válidos durante 48 horas y de un
            solo uso.
          </p>
        </div>
      </div>
      <p className="auth-footer">
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}

export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const isReset = params.get("mode") === "reset";
  const navigate = useNavigate();
  const { activate } = useAuth();

  const [valid, setValid] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  useEffect(() => {
    if (!token) { setValid(false); return; }
    authApi
      .validateToken(token)
      .then((info) => {
        setTokenInfo(info);
        setValid(true);
      })
      .catch(() => setValid(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (tokenInfo?.needsName && !displayName.trim()) {
      setError("Indica cómo quieres que te llamen");
      return;
    }
    if (mismatch) { setError("Las contraseñas no coinciden"); return; }
    setError("");
    setLoading(true);
    try {
      const body = { token, password, passwordConfirm };
      if (tokenInfo?.needsName) body.name = displayName.trim();
      const res = await authApi.setPassword(body);
      activate(res.token, { ...res.user, coins: 0 });
      navigate("/");
    } catch (err) {
      setError(err.message || "No se pudo activar la cuenta");
    } finally {
      setLoading(false);
    }
  }

  if (valid === null) {
    return (
      <AuthShell tagline="Tu hogar, organizado.">
        <div className="auth-illustration">
          <div className="auth-illustration-icon green">
            <LockIcon />
          </div>
          <p className="auth-card-subtitle">Validando enlace…</p>
        </div>
      </AuthShell>
    );
  }

  if (!valid) return <InvalidLink />;

  return (
    <AuthShell tagline="Ya casi estás dentro.">
      {/* Step indicator */}
      <div className="auth-steps" aria-label="Paso 3 de 3">
        <div className="auth-step-dot done" />
        <div className="auth-step-dot done" />
        <div className="auth-step-dot active" />
      </div>

      <div>
        <h1 className="auth-card-title">
          {isReset || tokenInfo?.purpose === "reset"
            ? "Nueva contraseña"
            : tokenInfo?.needsName
              ? "Únete al hogar"
              : "Crea tu contraseña"}
        </h1>
        <p className="auth-card-subtitle" style={{ marginTop: "0.35rem" }}>
          {isReset || tokenInfo?.purpose === "reset"
            ? "Elige una contraseña nueva para tu cuenta."
            : (
              <>
                {tokenInfo?.homeName ? `Te unes al hogar «${tokenInfo.homeName}». ` : ""}
                {tokenInfo?.needsName
                  ? "Elige cómo quieres que te llamen y crea tu contraseña."
                  : "Mínimo 8 caracteres. Cuanto más variada, mejor."}
              </>
            )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {tokenInfo?.needsName ? (
          <div className="auth-field">
            <label className="auth-label" htmlFor="displayName">Tu nombre</label>
            <input
              id="displayName"
              className="auth-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="María, Papá, Alex…"
              autoComplete="name"
              required
            />
            <p className="auth-field-hint">Así te verán los demás en el hogar.</p>
          </div>
        ) : null}

        <div className="auth-field">
          <label className="auth-label" htmlFor="password">Contraseña</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="passwordConfirm">Repite la contraseña</label>
          <div className="auth-input-wrap">
            <PasswordInput
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {mismatch && (
            <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.15rem 0 0" }}>
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        <AuthError message={error} />

        <button
          type="submit"
          className="auth-btn"
          disabled={
            loading ||
            mismatch ||
            password.length < 8 ||
            (tokenInfo?.needsName && !displayName.trim())
          }
        >
          {loading ? (
            <><Spinner /> Guardando…</>
          ) : isReset || tokenInfo?.purpose === "reset" ? (
            "Guardar contraseña"
          ) : (
            "Activar cuenta"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
