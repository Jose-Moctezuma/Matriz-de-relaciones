import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/http";

const colors = {
  bg: "#0f172a",
  card: "#1e293b",
  gold: "#d4a853",
  green: "#22c55e",
  text: "#f8fafc",
  textMuted: "rgba(248,250,252,0.7)",
  border: "rgba(248,250,252,0.1)",
};

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", { email, password });
      setSuccess(true);
      setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      setError(err.message || "Error registrando usuario");
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
          maxWidth: 480,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header con gradiente */}
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.gold} 0%, #c9a227 100%)`,
            padding: "36px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: colors.bg }}>
            Únete a Arq Apps
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(15,23,42,0.7)" }}>
            Crea tu cuenta gratuita y comienza a diseñar
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            backgroundColor: colors.card,
            padding: "36px 32px",
          }}
        >
          {success ? (
            <div
              style={{
                textAlign: "center",
                padding: 24,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ margin: "0 0 8px", color: colors.green, fontSize: 20 }}>
                ¡Cuenta creada!
              </h3>
              <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          ) : (
            <>
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
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  Crear mi cuenta
                </button>
              </form>

              {/* Benefits */}
              <div
                style={{
                  marginTop: 28,
                  padding: 20,
                  backgroundColor: "rgba(248,250,252,0.03)",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
                  Al registrarte obtienes:
                </div>
                {[
                  "Acceso a todas las herramientas",
                  "Guarda tus proyectos en la nube",
                  "Exporta a PDF profesional",
                ].map((benefit, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: i < 2 ? 10 : 0,
                      fontSize: 14,
                      color: colors.text,
                    }}
                  >
                    <span style={{ color: colors.green }}>✓</span>
                    {benefit}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 28,
                  paddingTop: 24,
                  borderTop: `1px solid ${colors.border}`,
                  textAlign: "center",
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
                  ¿Ya tienes cuenta?{" "}
                  <span
                    onClick={() => nav("/login")}
                    style={{
                      color: colors.gold,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Iniciar sesión
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
