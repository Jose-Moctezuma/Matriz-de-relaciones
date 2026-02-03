// src/api/http.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

let token = localStorage.getItem("token") || "";

// --- TOKEN HELPERS ---
export function setToken(t) {
  token = t || "";
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function getToken() {
  return token || localStorage.getItem("token") || "";
}

export function clearToken() {
  setToken("");
}

// --- REQUEST HELPER (fetch) ---
async function request(path, { method = "GET", body, headers = {} } = {}) {
  const t = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// --- DEFAULT EXPORT (api client) ---
const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

export default api;
