import MatrixPDF from "../pdf/MatrixPDF";
import { exportMatrixPDF } from "../pdf/exportMatrixPDF";
import { useRef } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/http";

const ZONES = [
  { key: "Área Social", color: "#16a34a", order: 1 },
  { key: "Área Semisocial", color: "#f97316", order: 2 },
  { key: "Área Servicio", color: "#facc15", order: 3 },
  { key: "Área Privada", color: "#ef4444", order: 4 },
];

/* ── Paleta ── */
const C = {
  bg: "#0f172a",
  bgAlt: "#1e293b",
  card: "#1e293b",
  gold: "#d4a853",
  text: "#f8fafc",
  textMuted: "rgba(248,250,252,0.55)",
  border: "rgba(248,250,252,0.1)",
  borderLight: "rgba(248,250,252,0.06)",
  dangerBg: "rgba(239,68,68,0.15)",
  dangerBorder: "rgba(239,68,68,0.3)",
  dangerText: "#fca5a5",
};

export default function ProjectMatrix() {
  const { id } = useParams();
  const projectId = Number(id);
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [matrix, setMatrix] = useState(null);
  const [projectTitle, setProjectTitle] = useState("");

  // editor modal
  const [openEditor, setOpenEditor] = useState(false);
  const [editorComponents, setEditorComponents] = useState([]);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const [data, projects] = await Promise.all([
        api.get(`/projects/${projectId}/matrix`),
        api.get("/projects"),
      ]);

      setMatrix(data);

      const proj = Array.isArray(projects)
        ? projects.find((p) => p.id === projectId)
        : null;
      if (proj?.title) setProjectTitle(proj.title);

      const comps = Array.isArray(data?.components) ? data.components : [];
      setEditorComponents(comps.map((c) => ({ zone: c.zone, name: c.name })));
    } catch (e) {
      setErr(e?.message || "Error al cargar matriz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // --- helpers de vista ---
  const rows = useMemo(() => (Array.isArray(matrix?.rows) ? matrix.rows : []), [matrix]);
  const cols = useMemo(() => (Array.isArray(matrix?.cols) ? matrix.cols : []), [matrix]);
  const cells = useMemo(() => (Array.isArray(matrix?.cells) ? matrix.cells : []), [matrix]);

  const zoneOrderMap = useMemo(() => {
    const m = new Map();
    for (const z of ZONES) m.set(z.key, z.order);
    return m;
  }, []);

  const sortedRows = useMemo(() => {
    const zo = (zone) => zoneOrderMap.get(zone) ?? 999;
    return [...rows].sort((a, b) => {
      const za = zo(a.zone);
      const zb = zo(b.zone);
      if (za !== zb) return za - zb;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [rows, zoneOrderMap]);

  const sortedCols = useMemo(() => {
    const zo = (zone) => zoneOrderMap.get(zone) ?? 999;
    return [...cols].sort((a, b) => {
      const za = zo(a.zone);
      const zb = zo(b.zone);
      if (za !== zb) return za - zb;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [cols, zoneOrderMap]);

  const cellMap = useMemo(() => {
    const m = new Map();
    for (const c of cells) {
      const a = Number(c.row_axis_id);
      const b = Number(c.col_axis_id);
      const v = Number(c.value ?? 0);
      m.set(`${a}-${b}`, v);
      m.set(`${b}-${a}`, v);
    }
    return m;
  }, [cells]);

  const reportRef = useRef(null);
  const STAGE_H = 820;
  const LEFT_W = 360;
  const INNER_W = 1120;
  const HEADER_H = 64;
  const BORDER = "3px solid #111827";

  const exportPDF = async () => {
    await exportMatrixPDF(reportRef, `matriz-relaciones-proyecto-${projectId}.pdf`);
  };

  const getCellValue = (a, b) => Number(cellMap.get(`${a}-${b}`) ?? 0);

  const sumsByIndex = useMemo(() => {
    const n = Math.min(sortedRows.length, sortedCols.length);
    const sums = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const rowId = Number(sortedRows[i].id);
        const colId = Number(sortedCols[j].id);
        const v = getCellValue(rowId, colId);
        sums[i] += v;
        sums[j] += v;
      }
    }
    return sums;
  }, [sortedRows, sortedCols, getCellValue]);

  const rankByIndex = useMemo(() => {
    const items = sortedRows.map((r, idx) => ({
      idx,
      id: Number(r.id),
      name: r.name,
      sum: Number(sumsByIndex[idx] ?? 0),
      order: Number(r.order ?? idx),
    }));
    items.sort((a, b) => {
      if (b.sum !== a.sum) return b.sum - a.sum;
      if (a.order !== b.order) return a.order - b.order;
      return String(a.name).localeCompare(String(b.name));
    });
    const rank = Array(sortedRows.length).fill(0);
    let currentRank = 0;
    let lastSum = null;
    for (const it of items) {
      if (lastSum === null || it.sum !== lastSum) {
        currentRank += 1;
        lastSum = it.sum;
      }
      rank[it.idx] = currentRank;
    }
    return rank;
  }, [sortedRows, sumsByIndex]);

  const sums = sumsByIndex;
  const ranks = rankByIndex;

  const rankingSummary = useMemo(() => {
    const map = new Map();
    sortedRows.forEach((r, idx) => {
      const rk = rankByIndex[idx];
      if (!rk) return;
      if (!map.has(rk)) map.set(rk, []);
      map.get(rk).push(r.name);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rk, names]) => ({ rk, names }));
  }, [sortedRows, rankByIndex]);

  const componentsByZone = useMemo(() => {
    const comps = Array.isArray(matrix?.components) ? matrix.components : [];
    const map = new Map();
    for (const z of ZONES) map.set(z.key, []);
    for (const c of comps) {
      if (!map.has(c.zone)) map.set(c.zone, []);
      map.get(c.zone).push(c.name);
    }
    return map;
  }, [matrix]);

  // --- acciones ---
  const saveCell = async (rowId, colId, value) => {
    try {
      setErr("");
      await api.put(`/projects/${projectId}/matrix/cell`, {
        rowId,
        colId,
        value: Number(value),
      });
      setMatrix((prev) => {
        if (!prev) return prev;
        const nextCells = Array.isArray(prev.cells) ? [...prev.cells] : [];
        const idx = nextCells.findIndex(
          (c) => c.row_axis_id === rowId && c.col_axis_id === colId
        );
        if (idx >= 0) nextCells[idx] = { ...nextCells[idx], value: Number(value) };
        else nextCells.push({ row_axis_id: rowId, col_axis_id: colId, value: Number(value) });
        return { ...prev, cells: nextCells };
      });
    } catch (e) {
      setErr(e?.message || "No se pudo guardar relación");
    }
  };

  const onAddComponent = () => {
    setEditorComponents((prev) => [...prev, { zone: "Área Social", name: "" }]);
  };

  const onRemoveComponent = (idx) => {
    setEditorComponents((prev) => prev.filter((_, i) => i !== idx));
  };

  const onUpdateComponent = (idx, patch) => {
    setEditorComponents((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  };

  const saveAxes = async () => {
    try {
      setErr("");
      const cleaned = editorComponents
        .map((c) => ({
          zone: (c.zone || "").trim(),
          name: (c.name || "").trim(),
        }))
        .filter((c) => c.zone && c.name);

      const seen = new Set();
      const unique = [];
      for (const c of cleaned) {
        const k = `${c.zone}::${c.name.toLowerCase()}`;
        if (seen.has(k)) continue;
        seen.add(k);
        unique.push(c);
      }

      await api.put(`/projects/${projectId}/matrix/axes`, {
        components: unique.map((c) => ({ zone: c.zone, name: c.name })),
      });

      setOpenEditor(false);
      await load();
    } catch (e) {
      setErr(e?.message || "No se pudo guardar componentes");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", width: "100%", backgroundColor: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", color: C.textMuted }}>
        Cargando matriz...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", width: "100%", backgroundColor: C.bg, fontFamily: "system-ui", color: C.text }}>

      {/* ── Top bar ── */}
      <div style={topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 800, cursor: "pointer" }}
            onClick={() => nav("/")}
          >
            Arq <span style={{ color: C.gold }}>Apps</span>
          </h1>
          <span style={{ color: C.border, fontSize: 20, fontWeight: 300 }}>|</span>
          <span style={{ color: C.textMuted, fontSize: 14 }}>Matriz de Relaciones</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => nav("/dashboard")} style={btnOutline}>
            Dashboard
          </button>
          <button onClick={load} style={btnOutline}>
            Recargar
          </button>
          <button onClick={() => setOpenEditor(true)} style={btnGold}>
            Editar componentes
          </button>
          <button onClick={exportPDF} style={btnOutline}>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>

        {err && (
          <div style={alertStyle}>
            {String(err)}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── PANEL IZQ: zonas + componentes ── */}
          <div style={card}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={pill(true)}>ZONAS</div>
              <div style={pill(false)}>COMPONENTES</div>
            </div>

            {ZONES.map((z) => (
              <div key={z.key} style={{ marginBottom: 14 }}>
                <div style={{ background: z.color, color: "#fff", padding: "10px 12px", borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                  {z.key}
                </div>
                <div style={{ padding: "8px 4px" }}>
                  {(componentsByZone.get(z.key) || []).map((name, i) => (
                    <div key={i} style={compItem}>
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
              <strong style={{ color: C.gold }}>Niveles:</strong> 0 = sin relación, 2 = deseada, 4 = necesaria.
            </div>
          </div>

          {/* ── PANEL DER: rombo ── */}
          <div style={card}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                Relaciones <span style={{ color: C.gold }}>(rombo)</span>
              </h2>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                Selecciona 0 / 2 / 4. Se guarda automáticamente.
              </div>
            </div>

            {sortedRows.length < 2 || sortedCols.length < 2 ? (
              <div style={{ color: C.textMuted, fontSize: 14 }}>
                No hay suficientes componentes. Ve a <strong style={{ color: C.gold }}>Editar componentes</strong> y guarda al menos 2.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th} align="left">#</th>
                      {sortedCols.map((c) => (
                        <th key={c.id} style={th} align="center">{c.name}</th>
                      ))}
                      <th style={{ ...th, color: C.gold }} align="center">Σ</th>
                      <th style={{ ...th, color: C.gold }} align="center">R</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedRows.map((r, ri) => (
                      <tr key={r.id}>
                        <td style={{ ...td, fontWeight: 600, color: C.text }}>{r.name}</td>

                        {sortedCols.map((c, ci) => {
                          if (ci <= ri) return <td key={c.id} style={{ ...td, background: "transparent" }} />;

                          const current = getCellValue(r.id, c.id);
                          const cellBg =
                            current === 4 ? "rgba(239,68,68,0.6)" :
                            current === 2 ? "rgba(250,204,21,0.5)" :
                            "rgba(248,250,252,0.06)";

                          return (
                            <td
                              key={c.id}
                              style={{
                                background: cellBg,
                                textAlign: "center",
                                fontWeight: 700,
                                border: `1px solid ${C.border}`,
                                padding: 0,
                              }}
                            >
                              <select
                                value={current}
                                onChange={(e) => saveCell(r.id, c.id, Number(e.target.value))}
                                style={{
                                  width: "100%",
                                  padding: "8px 4px",
                                  background: "transparent",
                                  border: "none",
                                  fontWeight: 700,
                                  textAlign: "center",
                                  cursor: "pointer",
                                  color: C.text,
                                  fontSize: 14,
                                  fontFamily: "system-ui",
                                }}
                              >
                                <option value={0} style={{ background: C.bgAlt, color: C.text }}>0</option>
                                <option value={2} style={{ background: C.bgAlt, color: C.text }}>2</option>
                                <option value={4} style={{ background: C.bgAlt, color: C.text }}>4</option>
                              </select>
                            </td>
                          );
                        })}

                        <td style={{ ...td, textAlign: "center", fontWeight: 800, color: C.text }}>
                          {sumsByIndex[ri] ?? 0}
                        </td>
                        <td style={{ ...td, textAlign: "center", fontWeight: 700, color: C.gold }}>
                          {`R${rankByIndex[ri] ?? "-"}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL EDITOR ── */}
      {openEditor && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>
                Editar Zonas y Componentes
              </h2>
              <button onClick={() => setOpenEditor(false)} style={btnOutline}>
                Cerrar
              </button>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: C.text }}>Componentes</h3>
                <button onClick={onAddComponent} style={btnGold}>
                  + Componente
                </button>
              </div>

              <div style={{ maxHeight: 420, overflow: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                {editorComponents.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "200px 1fr 100px",
                      gap: 10,
                      padding: 12,
                      borderBottom: `1px solid ${C.borderLight}`,
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={c.zone}
                      onChange={(e) => onUpdateComponent(idx, { zone: e.target.value })}
                      style={selectStyle}
                    >
                      {ZONES.map((z) => (
                        <option key={z.key} value={z.key}>{z.key}</option>
                      ))}
                    </select>

                    <input
                      value={c.name}
                      onChange={(e) => onUpdateComponent(idx, { name: e.target.value })}
                      placeholder="Nombre del componente"
                      style={inputStyle}
                    />

                    <button onClick={() => onRemoveComponent(idx)} style={btnDanger}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button onClick={() => setOpenEditor(false)} style={btnOutline}>
                  Cancelar
                </button>
                <button onClick={saveAxes} style={btnGold}>
                  Guardar y actualizar rombo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== REPORTE PARA PDF (oculto, solo para exportación) ====== */}
      <div style={{ overflow: "hidden", height: 0 }}>
        <MatrixPDF
          ref={reportRef}
          ZONES={ZONES}
          sortedRows={sortedRows}
          sortedCols={sortedCols}
          getCellValue={getCellValue}
          sums={sums}
          ranks={ranks}
          STAGE_H={STAGE_H}
          LEFT_W={LEFT_W}
          INNER_W={INNER_W}
          HEADER_H={HEADER_H}
          BORDER={BORDER}
          projectTitle={projectTitle}
        />
      </div>
    </div>
  );
}

/* ══════════ Estilos ══════════ */

const topBar = {
  backgroundColor: C.bgAlt,
  borderBottom: `1px solid ${C.border}`,
  padding: "14px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
};

const btnGold = {
  padding: "9px 18px",
  borderRadius: 6,
  border: "none",
  background: C.gold,
  color: C.bg,
  fontWeight: 700,
  fontSize: 13,
  fontFamily: "system-ui",
  cursor: "pointer",
};

const btnOutline = {
  padding: "9px 18px",
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: "transparent",
  color: C.textMuted,
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "system-ui",
  cursor: "pointer",
};

const btnDanger = {
  padding: "8px 12px",
  borderRadius: 6,
  border: `1px solid ${C.dangerBorder}`,
  background: C.dangerBg,
  color: C.dangerText,
  fontSize: 13,
  fontFamily: "system-ui",
  cursor: "pointer",
  fontWeight: 600,
};

const card = {
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 16,
  background: C.card,
};

const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: `1px solid ${C.border}`,
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: "nowrap",
  color: C.text,
};

const td = {
  padding: "10px 8px",
  borderBottom: `1px solid ${C.borderLight}`,
  whiteSpace: "nowrap",
  fontSize: 14,
  color: C.textMuted,
};

const selectStyle = {
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: "9px 10px",
  background: C.bg,
  color: C.text,
  fontSize: 14,
  fontFamily: "system-ui",
  cursor: "pointer",
};

const inputStyle = {
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: "9px 12px",
  outline: "none",
  width: "100%",
  background: "rgba(248,250,252,0.05)",
  color: C.text,
  fontSize: 14,
  fontFamily: "system-ui",
  boxSizing: "border-box",
};

function pill(active) {
  return {
    background: active ? C.gold : "rgba(248,250,252,0.08)",
    color: active ? C.bg : C.textMuted,
    padding: "6px 12px",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: 0.5,
  };
}

const compItem = {
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: "8px 12px",
  marginBottom: 6,
  background: "rgba(248,250,252,0.04)",
  color: C.text,
  fontSize: 14,
};

const alertStyle = {
  marginBottom: 20,
  padding: 14,
  borderRadius: 8,
  background: C.dangerBg,
  border: `1px solid ${C.dangerBorder}`,
  color: C.dangerText,
  fontSize: 14,
  fontWeight: 600,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  zIndex: 9999,
};

const modalCard = {
  width: "min(880px, 96vw)",
  background: C.bgAlt,
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${C.border}`,
};
