import { useNavigate } from "react-router-dom";

const colors = {
  bg: "#0f172a",
  bgAlt: "#1e293b",
  bgCard: "#263449",
  gold: "#d4a853",
  goldDark: "#c9a227",
  text: "#f8fafc",
  textMuted: "rgba(248,250,252,0.7)",
  border: "rgba(248,250,252,0.1)",
};

const containerStyle = {
  maxWidth: 1100,
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
  transition: "all 0.2s",
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "system-ui", color: colors.text, margin: 0, backgroundColor: colors.bg, width: "100%", minHeight: "100vh" }}>

      {/* ══════════ HERO ══════════ */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background image with overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.3)",
          }}
        />

        {/* Gold grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: [
              "repeating-linear-gradient(0deg, rgba(212,168,83,0.03) 0px, rgba(212,168,83,0.03) 1px, transparent 1px, transparent 80px)",
              "repeating-linear-gradient(90deg, rgba(212,168,83,0.03) 0px, rgba(212,168,83,0.03) 1px, transparent 1px, transparent 80px)",
            ].join(", "),
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
              backgroundColor: "rgba(15,23,42,0.6)",
            }}
          >
            Herramientas para Arquitectura
          </div>

          <h1
            style={{
              fontSize: "clamp(42px, 9vw, 80px)",
              fontWeight: 800,
              margin: "0 0 20px",
              lineHeight: 1.05,
            }}
          >
            Arq <span style={{ color: colors.gold }}>Apps</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(17px, 2.5vw, 22px)",
              color: colors.textMuted,
              maxWidth: 600,
              margin: "0 auto 44px",
              lineHeight: 1.7,
            }}
          >
            Herramientas digitales para el diseño y análisis de proyectos de arquitectura bioclimática
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => document.getElementById("herramientas").scrollIntoView({ behavior: "smooth" })}
              style={{
                ...btnBase,
                backgroundColor: colors.gold,
                color: colors.bg,
              }}
            >
              Explorar herramientas
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                ...btnBase,
                backgroundColor: "rgba(15,23,42,0.6)",
                color: colors.gold,
                border: `2px solid ${colors.gold}`,
              }}
            >
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            color: colors.textMuted,
            fontSize: 13,
            textAlign: "center",
            zIndex: 1,
          }}
        >
          <div style={{ marginBottom: 8 }}>Descubre más</div>
          <div style={{ fontSize: 20, animation: "bounce 2s infinite" }}>↓</div>
        </div>
      </section>

      {/* ══════════ SOBRE NOSOTROS ══════════ */}
      <section style={{ backgroundColor: colors.bgAlt, padding: "100px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                margin: "0 0 16px",
              }}
            >
              Sobre <span style={{ color: colors.gold }}>Nosotros</span>
            </h2>
            <p
              style={{
                color: colors.textMuted,
                fontSize: 18,
                maxWidth: 600,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Un equipo multidisciplinario combinando tecnología y arquitectura sustentable
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 32,
            }}
          >
            {/* Laura */}
            <div
              style={{
                backgroundColor: colors.bgCard,
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  height: 200,
                  backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }}
              />
              <div style={{ padding: 28 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
                  Laura
                </h3>
                <div
                  style={{
                    color: colors.gold,
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 16,
                    letterSpacing: 0.5,
                  }}
                >
                  Arquitecta Bioclimática
                </div>
                <p style={{ margin: 0, color: colors.textMuted, fontSize: 15, lineHeight: 1.6 }}>
                  Especialista en diseño sustentable y eficiencia energética en edificaciones.
                  Enfocada en crear espacios que respeten el medio ambiente y maximicen el confort.
                </p>
              </div>
            </div>

            {/* Tú */}
            <div
              style={{
                backgroundColor: colors.bgCard,
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  height: 200,
                  backgroundImage: "url('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }}
              />
              <div style={{ padding: 28 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
                  José
                </h3>
                <div
                  style={{
                    color: colors.gold,
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 16,
                    letterSpacing: 0.5,
                  }}
                >
                  Ing. Sistemas y Matemáticas Aplicadas
                </div>
                <p style={{ margin: 0, color: colors.textMuted, fontSize: 15, lineHeight: 1.6 }}>
                  Desarrollador de software especializado en crear herramientas digitales
                  que faciliten el proceso de diseño arquitectónico mediante tecnología accesible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HERRAMIENTAS ══════════ */}
      <section id="herramientas" style={{ backgroundColor: colors.bg, padding: "100px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                margin: "0 0 16px",
              }}
            >
              Nuestras <span style={{ color: colors.gold }}>Herramientas</span>
            </h2>
            <p
              style={{
                color: colors.textMuted,
                fontSize: 18,
                maxWidth: 600,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Aplicaciones diseñadas para optimizar el proceso de diseño arquitectónico
            </p>
          </div>

          {/* Tool Card - Matriz de Relaciones */}
          <div
            style={{
              backgroundColor: colors.bgAlt,
              borderRadius: 20,
              overflow: "hidden",
              border: `1px solid ${colors.border}`,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: 280,
              }}
            />
            <div style={{ padding: 40, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  backgroundColor: "rgba(212,168,83,0.15)",
                  color: colors.gold,
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1,
                  marginBottom: 16,
                  alignSelf: "flex-start",
                }}
              >
                DISPONIBLE
              </div>

              <h3 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 700 }}>
                Matriz de Relaciones Ponderadas
              </h3>

              <p style={{ margin: "0 0 24px", color: colors.textMuted, fontSize: 15, lineHeight: 1.7 }}>
                Define zonas, espacios y niveles de relación entre los ambientes de un proyecto.
                Visualiza las conexiones necesarias y deseables para optimizar la distribución espacial.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
                {["Zonas", "Espacios", "Relaciones", "Exportar PDF"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "rgba(248,250,252,0.06)",
                      borderRadius: 20,
                      fontSize: 13,
                      color: colors.textMuted,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate("/login")}
                style={{
                  ...btnBase,
                  backgroundColor: colors.gold,
                  color: colors.bg,
                  alignSelf: "flex-start",
                }}
              >
                Usar herramienta
              </button>
            </div>
          </div>

          {/* Coming soon placeholder */}
          <div
            style={{
              marginTop: 40,
              padding: 40,
              backgroundColor: colors.bgAlt,
              borderRadius: 16,
              border: `1px dashed ${colors.border}`,
              textAlign: "center",
              maxWidth: 900,
              margin: "40px auto 0",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
            <h4 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
              Más herramientas próximamente
            </h4>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
              Estamos desarrollando nuevas herramientas para arquitectura bioclimática
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section
        style={{
          backgroundColor: colors.bgAlt,
          padding: "100px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            border: `1px solid rgba(212,168,83,0.1)`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div style={{ ...containerStyle, textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            Comienza a diseñar <span style={{ color: colors.gold }}>hoy</span>
          </h2>

          <p
            style={{
              color: colors.textMuted,
              fontSize: 18,
              maxWidth: 520,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            Crea tu cuenta gratuita y accede a herramientas profesionales para el análisis
            y diseño de tus proyectos de arquitectura.
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
              Crear cuenta gratis
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
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer
        style={{
          backgroundColor: colors.bg,
          borderTop: `1px solid ${colors.border}`,
          padding: "40px 0",
        }}
      >
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>
            Arq <span style={{ color: colors.gold }}>Apps</span>
          </h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: colors.textMuted }}>
            Herramientas digitales para arquitectura bioclimática
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(248,250,252,0.35)" }}>
            © {new Date().getFullYear()} Arq Apps. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
