import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/http";

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

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.message || "Error al solicitar recuperación");
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
            Recuperar contraseña
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

        {sent ? (
          <div>
            <div
              style={{
                padding: 16,
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 8,
                color: "#86efac",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Si el correo existe, se generó un token de recuperación.
              Revisa la consola del servidor.
            </div>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "center",
                gap: 16,
                fontSize: 14,
              }}
            >
              <span onClick={() => nav("/reset-password")} style={link}>
                Ingresar token
              </span>
              <span style={{ color: colors.border }}>|</span>
              <span onClick={() => nav("/login")} style={link}>
                Volver al login
              </span>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={label}>Correo</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  style={input}
                />
              </div>
              <button type="submit" style={btn}>Enviar</button>
            </form>

            <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: colors.textMuted }}>
              <span onClick={() => nav("/login")} style={link}>Volver al login</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
