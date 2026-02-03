// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setToken } from "../api/http";

const colors = {
  bg: "#0f172a",
  card: "#1e293b",
  gold: "#d4a853",
  text: "#f8fafc",
  textMuted: "rgba(248,250,252,0.7)",
  border: "rgba(248,250,252,0.1)",
};

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  backgroundColor: colors.bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "system-ui",
  padding: 24,
  backgroundImage: [
    "repeating-linear-gradient(0deg, rgba(212,168,83,0.03) 0px, rgba(212,168,83,0.03) 1px, transparent 1px, transparent 80px)",
    "repeating-linear-gradient(90deg, rgba(212,168,83,0.03) 0px, rgba(212,168,83,0.03) 1px, transparent 1px, transparent 80px)",
  ].join(", "),
};

const cardStyle = {
  width: "100%",
  maxWidth: 420,
  backgroundColor: colors.card,
  borderRadius: 12,
  padding: "40px 32px",
  border: `1px solid ${colors.border}`,
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  backgroundColor: "rgba(248,250,252,0.05)",
  color: colors.text,
  fontSize: 15,
  fontFamily: "system-ui",
  outline: "none",
  boxSizing: "border-box",
};

const label = {
  marginBottom: 6,
  fontSize: 14,
  color: colors.textMuted,
  fontWeight: 500,
};

const btn = {
  padding: 14,
  borderRadius: 8,
  border: "0",
  background: colors.gold,
  color: colors.bg,
  fontWeight: 700,
  fontSize: 15,
  fontFamily: "system-ui",
  cursor: "pointer",
  width: "100%",
};

const link = {
  color: colors.gold,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export default function Login({ onLogin }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await api.post("/auth/login", { email, password });

      if (!data?.token) throw new Error("El backend no devolvió token");

      setToken(data.token);

      if (onLogin) {
        onLogin(data.user || null);
      }

      nav("/dashboard");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div
          style={{ textAlign: "center", marginBottom: 32, cursor: "pointer" }}
          onClick={() => nav("/")}
        >
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: colors.text }}>
            Arq <span style={{ color: colors.gold }}>Apps</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: colors.textMuted }}>
            Inicia sesión en tu cuenta
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              color: "#fca5a5",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
          <div>
            <div style={label}>Correo</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
          </div>

          <div>
            <div style={label}>Contraseña</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
          </div>

          <button type="submit" style={btn}>Entrar</button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: colors.textMuted }}>
          <span onClick={() => nav("/forgot-password")} style={link}>
            ¿Olvidaste tu contraseña?
          </span>
        </p>

        <p style={{ marginTop: 8, textAlign: "center", fontSize: 14, color: colors.textMuted }}>
          ¿No tienes cuenta?{" "}
          <span onClick={() => nav("/register")} style={link}>Crear cuenta</span>
        </p>
      </div>
    </div>
  );
}
