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
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: "48px 36px",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 20px",
              backgroundColor: "rgba(212,168,83,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            🔐
          </div>
          <h1
            style={{ margin: 0, fontSize: 26, fontWeight: 800, color: colors.text, cursor: "pointer" }}
            onClick={() => nav("/")}
          >
            Bienvenido de nuevo
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: colors.textMuted }}>
            Inicia sesión para continuar
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

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14, color: colors.textMuted, fontWeight: 500 }}>
              Correo electrónico
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: "rgba(248,250,252,0.05)",
                color: colors.text,
                fontSize: 15,
                fontFamily: "system-ui",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <div style={{ marginBottom: 6, fontSize: 14, color: colors.textMuted, fontWeight: 500 }}>
              Contraseña
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: "rgba(248,250,252,0.05)",
                color: colors.text,
                fontSize: 15,
                fontFamily: "system-ui",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
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
              marginTop: 8,
            }}
          >
            Iniciar sesión
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span
            onClick={() => nav("/forgot-password")}
            style={{
              color: colors.textMuted,
              cursor: "pointer",
              fontSize: 14,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: `1px solid ${colors.border}`,
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
            ¿No tienes cuenta?{" "}
            <span
              onClick={() => nav("/register")}
              style={{
                color: colors.gold,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Crear cuenta
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
