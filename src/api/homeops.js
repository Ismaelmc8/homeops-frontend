import { apiFetch } from "./client.js";

export const authApi = {
  registrationAvailable: () => apiFetch("/api/auth/registration-available"),
  register: (body) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  validateToken: (token) => apiFetch(`/api/auth/activation-token?token=${encodeURIComponent(token)}`),
  setPassword: (body) =>
    apiFetch("/api/auth/set-password", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  login: (body) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  me: () => apiFetch("/api/auth/me", { auth: true }),
};

export const tasksApi = {
  kanban: () => apiFetch("/api/tasks/kanban", { auth: true }),
  complete: (id) => apiFetch(`/api/tasks/${id}/complete`, { method: "POST", auth: true }),
  list: () => apiFetch("/api/tasks", { auth: true }),
  create: (body) =>
    apiFetch("/api/tasks", { method: "POST", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  update: (id, body) =>
    apiFetch(`/api/tasks/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  remove: (id) => apiFetch(`/api/tasks/${id}`, { method: "DELETE", auth: true }),
};

export const zonesApi = {
  list: () => apiFetch("/api/zones", { auth: true }),
  create: (body) =>
    apiFetch("/api/zones", { method: "POST", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  update: (id, body) =>
    apiFetch(`/api/zones/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  remove: (id) => apiFetch(`/api/zones/${id}`, { method: "DELETE", auth: true }),
};

export const rewardsApi = {
  list: () => apiFetch("/api/rewards", { auth: true }),
  catalog: () => apiFetch("/api/rewards?catalog=1", { auth: true }),
  redeem: (id) => apiFetch(`/api/rewards/${id}/redeem`, { method: "POST", auth: true }),
  myRedemptions: () => apiFetch("/api/rewards/redemptions/mine", { auth: true }),
  create: (body) =>
    apiFetch("/api/rewards", { method: "POST", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  update: (id, body) =>
    apiFetch(`/api/rewards/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  remove: (id) => apiFetch(`/api/rewards/${id}`, { method: "DELETE", auth: true }),
};

export const walletApi = {
  me: () => apiFetch("/api/wallet/me", { auth: true }),
};

export const membersApi = {
  list: () => apiFetch("/api/members", { auth: true }),
  invite: (body) =>
    apiFetch("/api/members/invite", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  resendInvite: (id) =>
    apiFetch(`/api/members/${id}/resend-invite`, { method: "POST", auth: true }),
};

export const metricsApi = {
  summary: () => apiFetch("/api/metrics/summary", { auth: true }),
};

export { getToken, setToken } from "./authStorage.js";
