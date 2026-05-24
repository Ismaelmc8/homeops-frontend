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
  forgotPassword: (body) =>
    apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
};

export const visualizationApi = {
  overview: () => apiFetch("/api/visualization/overview", { auth: true }),
  heatmap: (days = 30) =>
    apiFetch(`/api/visualization/heatmap?days=${days}`, { auth: true }),
  zone: (zoneId) => apiFetch(`/api/visualization/zones/${zoneId}`, { auth: true }),
  updateLayout: (zones) =>
    apiFetch("/api/visualization/layout", {
      method: "PUT",
      auth: true,
      body: JSON.stringify({ zones }),
      headers: { "Content-Type": "application/json" },
    }),
};

export const templatesApi = {
  list: () => apiFetch("/api/templates", { auth: true }),
  create: (body) =>
    apiFetch("/api/templates", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  update: (id, body) =>
    apiFetch(`/api/templates/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  remove: (id) => apiFetch(`/api/templates/${id}`, { method: "DELETE", auth: true }),
  apply: (id, body) =>
    apiFetch(`/api/templates/${id}/apply`, {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
};

export const tasksApi = {
  kanban: ({ microOnly = false, assignedToMe = false } = {}) => {
    const q = new URLSearchParams();
    if (microOnly) q.set("microOnly", "1");
    if (assignedToMe) q.set("assignedToMe", "1");
    const qs = q.toString();
    return apiFetch(`/api/tasks/kanban${qs ? `?${qs}` : ""}`, { auth: true });
  },
  complete: (id, body = {}) =>
    apiFetch(`/api/tasks/${id}/complete`, {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  list: () => apiFetch("/api/tasks", { auth: true }),
  create: (body) =>
    apiFetch("/api/tasks", { method: "POST", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  update: (id, body) =>
    apiFetch(`/api/tasks/${id}`, { method: "PUT", auth: true, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  remove: (id) => apiFetch(`/api/tasks/${id}`, { method: "DELETE", auth: true }),
  postpone: (id, days = 1) =>
    apiFetch(`/api/tasks/${id}/postpone`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ days }),
      headers: { "Content-Type": "application/json" },
    }),
  split: (id) => apiFetch(`/api/tasks/${id}/split`, { method: "POST", auth: true }),
  quickMicro: (body) =>
    apiFetch("/api/tasks/quick-micro", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
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
  admin: () => apiFetch("/api/metrics/admin", { auth: true }),
  balance: () => apiFetch("/api/metrics/balance", { auth: true }),
};

export const eventsApi = {
  active: () => apiFetch("/api/events/active", { auth: true }),
  list: () => apiFetch("/api/events", { auth: true }),
  create: (body) =>
    apiFetch("/api/events", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  remove: (id) => apiFetch(`/api/events/${id}`, { method: "DELETE", auth: true }),
};

export const goalsApi = {
  weekly: () => apiFetch("/api/goals/weekly", { auth: true }),
  claim: () => apiFetch("/api/goals/weekly/claim", { method: "POST", auth: true }),
};

export const socialApi = {
  catalog: () => apiFetch("/api/social/catalog"),
  settings: () => apiFetch("/api/social/settings", { auth: true }),
  updateSettings: (body) =>
    apiFetch("/api/social/settings", {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  timeline: ({ userId, zoneId, days } = {}) => {
    const q = new URLSearchParams();
    if (userId) q.set("userId", userId);
    if (zoneId) q.set("zoneId", zoneId);
    if (days) q.set("days", days);
    const qs = q.toString();
    return apiFetch(`/api/social/timeline${qs ? `?${qs}` : ""}`, { auth: true });
  },
  kudos: (body) =>
    apiFetch("/api/social/kudos", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  mvp: () => apiFetch("/api/social/mvp", { auth: true }),
  ranking: () => apiFetch("/api/social/ranking", { auth: true }),
  microGoals: () => apiFetch("/api/social/micro-goals", { auth: true }),
};

export { getToken, setToken } from "./authStorage.js";
