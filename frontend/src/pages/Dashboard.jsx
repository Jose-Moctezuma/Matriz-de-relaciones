import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearToken, getToken } from "../api/http";

const colors = {
  bg: "#0f172a",
  bgAlt: "#1e293b",
  card: "#1e293b",
  cardHover: "#253348",
  gold: "#d4a853",
  goldDark: "#c9a227",
  text: "#f8fafc",
  textMuted: "rgba(248,250,252,0.55)",
  border: "rgba(248,250,252,0.1)",
  danger: "#ef4444",
  dangerBg: "rgba(239,68,68,0.15)",
};

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  backgroundColor: colors.bg,
  fontFamily: "system-ui",
  color: colors.text,
};

const topBar = {
  backgroundColor: colors.bgAlt,
  borderBottom: `1px solid ${colors.border}`,
  padding: "16px 32px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
};

const btnGold = {
  padding: "10px 20px",
  borderRadius: 6,
  border: "none",
  background: colors.gold,
  color: colors.bg,
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "system-ui",
  cursor: "pointer",
};

const btnOutline = {
  padding: "10px 20px",
  borderRadius: 6,
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.textMuted,
  fontWeight: 600,
  fontSize: 14,
  fontFamily: "system-ui",
  cursor: "pointer",
};

const btnSmall = {
  padding: "6px 14px",
  borderRadius: 5,
  border: `1px solid ${colors.border}`,
  background: "rgba(248,250,252,0.05)",
  color: colors.text,
  fontSize: 13,
  fontFamily: "system-ui",
  cursor: "pointer",
  fontWeight: 500,
};

const btnDanger = {
  ...btnSmall,
  border: "1px solid rgba(239,68,68,0.3)",
  color: "#fca5a5",
  background: colors.dangerBg,
};

export default function Dashboard() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const list = await api.get("/projects");
      setProjects(Array.isArray(list) ? list : []);

      if (selected && !list.some(p => p.id === selected.id)) {
        setSelected(null);
      }
    } catch (e) {
      setErr(e?.message || "Error cargando dashboard");
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      nav("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function newProject() {
    setErr("");
    try {
      const title = window.prompt("Nombre de la matriz:", "Matriz nueva");
      if (!title) return;
      const p = await api.post("/projects", { title });
      await load();
      if (p?.id) nav(`/project/${p.id}`);
    } catch (e) {
      setErr(e?.message || "Error creando proyecto");
    }
  }

  async function renameProject(p) {
    setErr("");
    try {
      const title = window.prompt("Nuevo nombre de la matriz:", p.title || "Matriz");
      if (!title) return;
      await api.put(`/projects/${p.id}`, { title });
      await load();
    } catch (e) {
      setErr(e?.message || "Error renombrando");
    }
  }

  async function deleteProject(p) {
    setErr("");
    try {
      const ok = window.confirm(`¿Eliminar definitivamente "${p.title || "Matriz"}" (ID: ${p.id})?`);
      if (!ok) return;
      await api.del(`/projects/${p.id}`);
      setSelected(null);
      await load();
    } catch (e) {
      setErr(e?.message || "Error eliminando");
    }
  }

  function openProject(p) {
    nav(`/project/${p.id}`);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/login");
  }

  return (
    <div style={pageStyle}>
      {/* ── Top bar ── */}
      <div style={topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 800, cursor: "pointer" }}
            onClick={() => nav("/")}
          >
            Arq <span style={{ color: colors.gold }}>Apps</span>
          </h1>
          <span style={{ color: colors.border, fontSize: 20, fontWeight: 300 }}>|</span>
          <span style={{ color: colors.textMuted, fontSize: 14 }}>Dashboard</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={load} style={btnOutline}>Recargar</button>
          <button onClick={logout} style={btnOutline}>Cerrar sesión</button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {err && (
          <div
            style={{
              marginBottom: 24,
              padding: 14,
              background: colors.dangerBg,
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              color: "#fca5a5",
              fontSize: 14,
            }}
          >
            {err}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 28,
            alignItems: "start",
          }}
        >
          {/* ── Project list ── */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                Mis proyectos
              </h2>
              <button onClick={newProject} style={btnGold}>
                + Nueva matriz
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: colors.textMuted,
                    border: `1px dashed ${colors.border}`,
                    borderRadius: 10,
                  }}
                >
                  No hay proyectos aún. Crea una nueva matriz.
                </div>
              ) : (
                projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      border: `1px solid ${selected?.id === p.id ? colors.gold : colors.border}`,
                      borderRadius: 10,
                      padding: 16,
                      cursor: "pointer",
                      background: selected?.id === p.id ? "rgba(212,168,83,0.08)" : colors.card,
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>
                          {p.title || "Matriz"}
                        </div>
                        <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                          Tipo: {p.type} · ID: {p.id}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openProject(p); }}
                        style={btnGold}
                      >
                        Abrir
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); renameProject(p); }}
                        style={btnSmall}
                      >
                        Renombrar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProject(p); }}
                        style={btnDanger}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Detail panel ── */}
          <div
            style={{
              position: "sticky",
              top: 24,
              backgroundColor: colors.bgAlt,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
              Detalle
            </h3>

            {selected ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: colors.gold, marginTop: 12 }}>
                  {selected.title || "Matriz"}
                </div>
                <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                  ID: {selected.id}
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => openProject(selected)} style={btnGold}>
                    Abrir
                  </button>
                  <button onClick={() => renameProject(selected)} style={btnSmall}>
                    Renombrar
                  </button>
                  <button onClick={() => deleteProject(selected)} style={btnDanger}>
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                Selecciona un proyecto de la lista para ver sus detalles, o presiona{" "}
                <strong style={{ color: colors.gold }}>Abrir</strong> para editar la matriz.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
