import { getApiBaseUrl } from "../config/env.js";
import { getToken } from "./authStorage.js";

/** Error HTTP o de red con contexto para la UI o logs. */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, body?: unknown }} [meta]
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = "ApiError";
    this.status = meta.status ?? 0;
    this.body = meta.body ?? null;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Petición al API con base URL desde env, timeout y cancelación vía AbortSignal.
 * @param {string} path Ruta absoluta, p. ej. "/api/health"
 * @param {RequestInit & { timeoutMs?: number }} [options] timeoutMs por defecto 15000; usa 0 para desactivar
 * @returns {Promise<unknown>} JSON parseado o null si el cuerpo está vacío
 */
export async function apiFetch(path, options = {}) {
  const base = getApiBaseUrl();
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${pathname}`;

  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: userSignal, headers, auth = false, ...rest } =
    options;

  const timeoutController = new AbortController();
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId;
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  }

  const signal =
    userSignal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([userSignal, timeoutController.signal])
      : userSignal ?? (timeoutMs > 0 ? timeoutController.signal : undefined);

  try {
    const hdrs = headers instanceof Headers ? headers : new Headers(headers);
    if (auth) {
      const token = getToken();
      if (token) hdrs.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(url, {
      method: rest.method ?? "GET",
      ...rest,
      signal,
      headers: hdrs,
    });

    const text = await res.text();
    /** @type {unknown} */
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!res.ok) {
      const msg =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
          ? body.error
          : res.statusText || `HTTP ${res.status}`;
      throw new ApiError(msg, { status: res.status, body });
    }

    return body;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw err;
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || "Error de red", { status: 0 });
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Comprueba que el API responde (útil en desarrollo).
 * @param {RequestInit & { timeoutMs?: number }} [options]
 */
export function getHealth(options = {}) {
  return apiFetch("/api/health", { method: "GET", ...options });
}
