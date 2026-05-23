const DEFAULT_API_URL = "http://localhost:4000";

/**
 * URL base del API (sin barra final). Solo usa variables con prefijo VITE_.
 * @returns {string}
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed) {
    return trimmed.replace(/\/+$/, "");
  }
  if (import.meta.env.DEV) {
    console.warn(
      "[config] VITE_API_URL no está definida; usando valor por defecto:",
      DEFAULT_API_URL
    );
  }
  return DEFAULT_API_URL;
}
