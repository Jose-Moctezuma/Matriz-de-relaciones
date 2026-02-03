import { useNavigate } from "react-router-dom";

const colors = {
  bg: "#0f172a",
  bgAlt: "#1e293b",
  gold: "#d4a853",
  goldDark: "#c9a227",
  text: "#f8fafc",
  textMuted: "rgba(248,250,252,0.7)",
};

const blueprintBg = {
  backgroundColor: colors.bg,
  backgroundImage: [
    "repeating-linear-gradient(0deg, rgba(212,168,83,0.04) 0px, rgba(212,168,83,0.04) 1px, transparent 1px, transparent 60px)",
    "repeating-linear-gradient(90deg, rgba(212,168,83,0.04) 0px, rgba(212,168,83,0.04) 1px, transparent 1px, transparent 60px)",
  ].join(", "),
};

const containerStyle = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "0 24px",
};

const btnBase = {
  padding: "14px 32px",
  fontSize: 16,
  fontWeight: 600,
  fontFamily: "system-ui",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const matrixColors = {
  0: "#ef4444",
  2: "#f59e0b",
  4: "#22c55e",
};

const zones = ["Sala", "Comedor", "Cocina", "Dormitorio"];
const sampleData = [
  [null, 4, 2, 0],
  [4, null, 4, 2],
  [2, 4, null, 0],
  [0, 2, 0, null],
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "system-ui", color: colors.text, margin: 0, backgroundColor: colors.bg, width: "100%", minHeight: "100vh" }}>
      {/* ── Hero ── */}
      <section
        style={{
          ...blueprintBg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative grid overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: [
              "repeating-linear-gradient(0deg, rgba(212,168,83,0.06) 0px, rgba(212,168,83,0.06) 1px, transparent 1px, transparent 120px)",
              "repeating-linear-gradient(90deg, rgba(212,168,83,0.06) 0px, rgba(212,168,83,0.06) 1px, transparent 1px, transparent 120px)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        {/* Diagonal accent line */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -100,
            width: 600,
            height: 600,
            border: `1px solid rgba(212,168,83,0.1)`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -300,
            left: -150,
            width: 800,
            height: 800,
            border: `1px solid rgba(212,168,83,0.07)`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div style={{ ...containerStyle, textAlign: "center", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 18px",
              border: `1px solid ${colors.gold}`,
              borderRadius: 4,
              color: colors.gold,
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Herramientas educativas
          </div>

          <h1
            style={{
              fontSize: "clamp(40px, 8vw, 72px)",
              fontWeight: 800,
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            Arq{" "}
            <span style={{ color: colors.gold }}>Apps</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 2.5vw, 22px)",
              color: colors.textMuted,
              maxWidth: 560,
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}
          >
            Plataforma de herramientas educativas para arquitectura
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                ...btnBase,
                backgroundColor: colors.gold,
                color: colors.bg,
              }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{
                ...btnBase,
                backgroundColor: "transparent",
                color: colors.gold,
                border: `2px solid ${colors.gold}`,
              }}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </section>

      {/* ── Matriz de Relaciones ── */}
      <section style={{ backgroundColor: colors.bgAlt, padding: "80px 0" }}>
        <div style={containerStyle}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 700,
              textAlign: "center",
              margin: "0 0 12px",
            }}
          >
            Matriz de Relaciones{" "}
            <span style={{ color: colors.gold }}>Ponderadas</span>
          </h2>

          <p
            style={{
              textAlign: "center",
              color: colors.textMuted,
              maxWidth: 620,
              margin: "0 auto 48px",
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Define zonas, componentes y niveles de relación entre los espacios de
            un proyecto arquitectónico. Visualiza las conexiones y optimiza la
            distribución espacial.
          </p>

          {/* Matrix visual */}
          <div
            style={{
              overflowX: "auto",
              display: "flex",
              justifyContent: "center",
              marginBottom: 36,
            }}
          >
            <table
              style={{
                borderCollapse: "separate",
                borderSpacing: 4,
                fontFamily: "system-ui",
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: 100 }} />
                  {zones.map((z) => (
                    <th
                      key={z}
                      style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.gold,
                        textAlign: "center",
                        letterSpacing: 0.5,
                      }}
                    >
                      {z}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((rowZone, r) => (
                  <tr key={rowZone}>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.gold,
                        textAlign: "right",
                        letterSpacing: 0.5,
                      }}
                    >
                      {rowZone}
                    </td>
                    {sampleData[r].map((val, c) => (
                      <td
                        key={c}
                        style={{
                          width: 52,
                          height: 52,
                          textAlign: "center",
                          verticalAlign: "middle",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 16,
                          backgroundColor:
                            val === null
                              ? "rgba(248,250,252,0.05)"
                              : matrixColors[val] || "#6b7280",
                          color:
                            val === null ? "rgba(248,250,252,0.2)" : "#fff",
                        }}
                      >
                        {val === null ? "—" : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            {[
              { val: 0, label: "Sin relación", color: matrixColors[0] },
              { val: 2, label: "Deseada", color: matrixColors[2] },
              { val: 4, label: "Necesaria", color: matrixColors[4] },
            ].map((item) => (
              <div
                key={item.val}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: item.color,
                  }}
                />
                <span style={{ fontSize: 14, color: colors.textMuted }}>
                  {item.val} — {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: colors.bg, padding: "80px 0" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <h2
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            Comienza a diseñar{" "}
            <span style={{ color: colors.gold }}>hoy</span>
          </h2>

          <p
            style={{
              color: colors.textMuted,
              fontSize: 17,
              maxWidth: 480,
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            Crea tu cuenta gratuita y accede a las herramientas de análisis
            espacial para tus proyectos de arquitectura.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                ...btnBase,
                backgroundColor: colors.gold,
                color: colors.bg,
              }}
            >
              Crear cuenta
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                ...btnBase,
                backgroundColor: "transparent",
                color: colors.gold,
                border: `2px solid ${colors.gold}`,
              }}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          backgroundColor: colors.bg,
          borderTop: "1px solid rgba(248,250,252,0.08)",
          padding: "24px 0",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "rgba(248,250,252,0.35)" }}>
          Arq Apps — Herramientas educativas para arquitectura
        </p>
      </footer>
    </div>
  );
}
