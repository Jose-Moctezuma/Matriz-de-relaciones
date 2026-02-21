import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/http";
import { exportMatrixPDF } from "../pdf/exportMatrixPDF";

/* ── Zonas ── */
const ZONES = [
  { key: "Social",     color: "#16a34a", order: 1 },
  { key: "Semisocial", color: "#f97316", order: 2 },
  { key: "Servicio",   color: "#facc15", order: 3 },
  { key: "Privada",    color: "#ef4444", order: 4 },
];
const ZONE_ORDER = ZONES.map(z => z.key);
const ZONE_COLOR = Object.fromEntries(ZONES.map(z => [z.key, z.color]));

function normalizeZone(zone) {
  if (!zone) return "";
  const z = String(zone).toLowerCase();
  if (z.includes("social") && !z.includes("semi")) return "Social";
  if (z.includes("semisocial")) return "Semisocial";
  if (z.includes("servicio") || z.includes("serv")) return "Servicio";
  if (z.includes("privada") || z.includes("priv")) return "Privada";
  return zone;
}

/* ── Paleta ── */
const C = {
  bg: "#0f172a", bgAlt: "#1e293b", card: "#1e293b",
  gold: "#d4a853", goldDark: "#c9a227",
  text: "#f8fafc", textMuted: "rgba(248,250,252,0.65)",
  border: "rgba(248,250,252,0.1)",
};

/* ════════════════════════════════════════════════════
   SVG DIAGRAM — inline en este archivo
════════════════════════════════════════════════════ */
const CENTER_R  = 26;   // radio del círculo central (fijo)
const BUBBLE_R  = 26;   // radio de cada burbuja (fijo)
const LABEL_PAD = 36;   // distancia extra para etiquetas de zona

// Dimensiones dinámicas: cada anillo ocupa al menos 64 px (≥ 2×BUBBLE_R + margen)
function computeSizes(nRanks) {
  const RING_SPACE = 64;
  const outerR  = Math.max(180, CENTER_R + (nRanks + 1) * RING_SPACE);
  const svgSize = Math.round(2 * (outerR + LABEL_PAD + 30));
  return { OUTER_R: outerR, SVG_SIZE: svgSize, CX: svgSize / 2, CY: svgSize / 2 };
}

function getRingRadius(rank, nRanks, outerR) {
  return CENTER_R + rank * (outerR - CENTER_R) / (nRanks + 1);
}

/* Construye los sectores proporcionales al nº de espacios por zona */
function buildSectors(spaces) {
  const total = spaces.length || 1;
  const counts = Object.fromEntries(ZONE_ORDER.map(z => [z, 0]));
  for (const s of spaces) counts[normalizeZone(s.zone)] = (counts[normalizeZone(s.zone)] || 0) + 1;

  const sectors = [];
  let cur = -Math.PI / 2; // empieza desde arriba
  for (const zoneName of ZONE_ORDER) {
    const count = counts[zoneName] || 0;
    if (!count) continue;
    const span = (count / total) * 2 * Math.PI;
    sectors.push({
      zone:   zoneName,
      color:  ZONE_COLOR[zoneName],
      start:  cur,
      end:    cur + span,
      center: cur + span / 2,
      span,
    });
    cur += span;
  }
  return sectors;
}

/* Path SVG de un sector de anillo (de innerR a outerR, de start a end) */
function sectorPath(start, end, innerR, outerR, cx, cy) {
  const large = (end - start) > Math.PI ? 1 : 0;
  const cos = Math.cos, sin = Math.sin;
  const x1i = cx + innerR * cos(start), y1i = cy + innerR * sin(start);
  const x2i = cx + innerR * cos(end),   y2i = cy + innerR * sin(end);
  const x1o = cx + outerR * cos(start), y1o = cy + outerR * sin(start);
  const x2o = cx + outerR * cos(end),   y2o = cy + outerR * sin(end);
  return [
    `M ${x1i} ${y1i}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${x2i} ${y2i}`,
    `L ${x2o} ${y2o}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${x1o} ${y1o}`,
    "Z",
  ].join(" ");
}

/* Restringe θ al sector [start, end] */
function clampToSector(θ, start, end) {
  let a = θ;
  while (a < start) a += 2 * Math.PI;
  while (a >= start + 2 * Math.PI) a -= 2 * Math.PI;
  if (a <= end) return a;
  const distEnd   = a - end;
  const distStart = start + 2 * Math.PI - a;
  return distEnd < distStart ? end : start;
}

function PonderacionesDiagram({ spaces, positions, onPositionChange, onDragEnd, relMap, showBg }) {
  const svgRef  = useRef(null);
  const [drag, setDrag] = useState(null); // {space, sector}
  const posRef  = useRef(positions);
  posRef.current = positions;

  const nRanks  = useMemo(() => Math.max(1, ...spaces.map(s => s.rank)), [spaces]);
  const sectors = useMemo(() => buildSectors(spaces), [spaces]);

  // Tamaño dinámico del SVG según número de rangos
  const { OUTER_R, SVG_SIZE, CX, CY } = useMemo(() => computeSizes(nRanks), [nRanks]);

  const getSector = useCallback((zone) =>
    sectors.find(s => s.zone === normalizeZone(zone)), [sectors]);

  /* Posición en pantalla (SVG coords) de cada burbuja.
     - Si hay posición guardada: usa el ángulo del arquitecto.
     - Si no: distribuye automáticamente los espacios del mismo rango+zona
       a lo ancho del sector para que no se superpongan. */
  const getBubblePos = useCallback((space) => {
    const sector = getSector(space.zone);
    if (!sector) return { x: CX, y: CY };

    let θ;
    const hasSaved = space.id in posRef.current;

    if (hasSaved) {
      θ = sector.center + posRef.current[space.id];
    } else {
      // Agrupar espacios del mismo zona+rango y repartirlos en el sector
      const group = spaces
        .filter(s => s.zone === space.zone && s.rank === space.rank)
        .sort((a, b) => a.id - b.id);
      const idx = group.findIndex(s => s.id === space.id);
      const n   = group.length;
      // Ocupar el 70 % del sector para dejar margen en los bordes
      const spread = sector.span * 0.7;
      const step   = n > 1 ? spread / (n - 1) : 0;
      θ = sector.center - spread / 2 + idx * step;
    }

    const r = getRingRadius(space.rank, nRanks, OUTER_R);
    return { x: CX + r * Math.cos(θ), y: CY + r * Math.sin(θ) };
  }, [getSector, nRanks, spaces, OUTER_R, CX, CY]);

  /* Drag handlers */
  const handleMouseDown = (e, space) => {
    e.preventDefault();
    const sector = getSector(space.zone);
    setDrag({ space, sector });
  };

  const handleMouseMove = useCallback((e) => {
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (SVG_SIZE / rect.width)  - CX;
    const my = (e.clientY - rect.top)  * (SVG_SIZE / rect.height) - CY;

    const θRaw    = Math.atan2(my, mx);
    const clamped = clampToSector(θRaw, drag.sector.start, drag.sector.end);

    // Pequeño margen para que no toque exactamente la línea divisora
    const margin = 0.04;
    const safe = Math.max(drag.sector.start + margin,
                  Math.min(drag.sector.end - margin, clamped));

    const offset = safe - drag.sector.center;
    onPositionChange(drag.space.id, offset);
  }, [drag, onPositionChange, SVG_SIZE, CX, CY]);

  const handleMouseUp = useCallback(() => {
    if (drag) onDragEnd(); // guarda inmediatamente al soltar
    setDrag(null);
  }, [drag, onDragEnd]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{ maxWidth: SVG_SIZE, display: "block", margin: "0 auto",
               cursor: drag ? "grabbing" : "default", userSelect: "none" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ── Rellenos de zona (sectores completos) ── */}
      {showBg && sectors.map(s => (
        <path
          key={`fill-${s.zone}`}
          d={sectorPath(s.start, s.end, CENTER_R, OUTER_R, CX, CY)}
          fill={s.color}
          opacity={0.18}
        />
      ))}

      {/* ── Bandas por anillo (alternar opacidad leve) ── */}
      {showBg && Array.from({ length: nRanks }, (_, i) => {
        const step  = (OUTER_R - CENTER_R) / nRanks;
        const inner = CENTER_R + i * step;
        const outer = CENTER_R + (i + 1) * step;
        return sectors.map(s => (
          <path
            key={`band-${i}-${s.zone}`}
            d={sectorPath(s.start, s.end, inner, outer, CX, CY)}
            fill={s.color}
            opacity={i % 2 === 0 ? 0.10 : 0.04}
          />
        ));
      })}

      {/* ── Círculo interior y exterior ── */}
      <circle cx={CX} cy={CY} r={CENTER_R} fill="none" stroke="#475569" strokeWidth={1.8} />
      <circle cx={CX} cy={CY} r={OUTER_R}  fill="none" stroke="#475569" strokeWidth={1.8} />

      {/* ── Círculos guía en cada anillo (donde se sitúan las burbujas) ── */}
      {Array.from({ length: nRanks }, (_, i) => (
        <circle key={`ring-${i}`} cx={CX} cy={CY} r={getRingRadius(i + 1, nRanks, OUTER_R)}
          fill="none" stroke="#475569" strokeWidth={0.8} strokeDasharray="3 5"
        />
      ))}

      {/* ── Líneas divisoras de sector ── */}
      {sectors.map(s => (
        <line
          key={`div-${s.zone}`}
          x1={CX + CENTER_R * Math.cos(s.start)}
          y1={CY + CENTER_R * Math.sin(s.start)}
          x2={CX + OUTER_R  * Math.cos(s.start)}
          y2={CY + OUTER_R  * Math.sin(s.start)}
          stroke="#475569" strokeWidth={1.2}
        />
      ))}

      {/* ── Números de rango (sobre cada anillo, al norte del círculo) ── */}
      {Array.from({ length: nRanks }, (_, i) => {
        const r = getRingRadius(i + 1, nRanks, OUTER_R);
        // Posicionar en el ángulo del primer sector, cerca del borde superior
        const θ = -Math.PI / 2;
        return (
          <text key={`rn-${i}`}
            x={CX + r * Math.cos(θ)} y={CY + r * Math.sin(θ) - 5}
            textAnchor="middle" dominantBaseline="auto"
            fontSize={10} fontWeight="700" fill="#94a3b8"
          >
            {i + 1}
          </text>
        );
      })}

      {/* ── Etiquetas de zona (fuera del círculo exterior) ── */}
      {sectors.map(s => {
        const r = OUTER_R + LABEL_PAD;
        const θ = s.center;
        // Abbreviation
        const abbrev = s.zone === "Semisocial" ? "SeS" : s.zone.slice(0, 4).toUpperCase();
        return (
          <text key={`zlbl-${s.zone}`}
            x={CX + r * Math.cos(θ)} y={CY + r * Math.sin(θ)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={12} fontWeight="800" fill={s.color}
          >
            {abbrev}
          </text>
        );
      })}

      {/* ── Líneas de relación entre espacios ── */}
      {spaces.map((spaceA, i) =>
        spaces.slice(i + 1).map(spaceB => {
          const v = relMap?.get(`${spaceA.id}-${spaceB.id}`) ?? 0;
          if (!v) return null;
          const posA = getBubblePos(spaceA);
          const posB = getBubblePos(spaceB);
          return (
            <line
              key={`rel-${spaceA.id}-${spaceB.id}`}
              x1={posA.x} y1={posA.y}
              x2={posB.x} y2={posB.y}
              stroke="#111827"
              strokeWidth={v === 4 ? 2.2 : 1.5}
              strokeDasharray={v === 2 ? "7 5" : "none"}
              opacity={0.75}
              pointerEvents="none"
            />
          );
        })
      )}

      {/* ── Burbujas de espacios (arrastrables) ── */}
      {spaces.map(space => {
        const pos    = getBubblePos(space);
        const sector = getSector(space.zone);
        const color  = sector ? sector.color : "#6b7280";
        const label  = space.name.length > 7
          ? space.name.slice(0, 7).toUpperCase()
          : space.name.toUpperCase();
        const isDragging = drag?.space.id === space.id;

        return (
          <g key={space.id} style={{ cursor: "grab" }}
            onMouseDown={e => handleMouseDown(e, space)}>
            {/* Sombra */}
            <circle cx={pos.x + 1.5} cy={pos.y + 1.5} r={BUBBLE_R}
              fill="rgba(0,0,0,0.35)" />
            {/* Burbuja */}
            <circle cx={pos.x} cy={pos.y} r={BUBBLE_R}
              fill={color}
              stroke={isDragging ? "#fff" : "#111827"}
              strokeWidth={isDragging ? 2.5 : 1.5}
            />
            {/* Texto */}
            <text x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={7} fontWeight="800" fill="#111827"
              pointerEvents="none"
            >
              {label}
            </text>
            {/* Rango badge */}
            <text x={pos.x + BUBBLE_R - 3} y={pos.y - BUBBLE_R + 5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={7} fontWeight="900" fill="#111827"
              pointerEvents="none"
            >
              R{space.rank}
            </text>
          </g>
        );
      })}

      {/* ── Círculo central ── */}
      <circle cx={CX} cy={CY} r={CENTER_R}
        fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════════════ */
export default function ProjectPonderaciones({ onLogout }) {
  const { id: projectId } = useParams();
  const navigate           = useNavigate();
  const diagramRef         = useRef(null);

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [projectTitle, setTitle]    = useState("");
  const [spaces, setSpaces]         = useState([]); // [{id, name, zone, rank, sum}]
  const [positions, setPositions]   = useState({}); // {axisId: angleOffset}
  const [relMap, setRelMap]         = useState(new Map()); // "idA-idB" → 2 | 4
  const [showBg, setShowBg]         = useState(true);

  /* Ref sincrónico de posiciones — siempre el valor más reciente sin esperar re-render */
  const positionsRef = useRef({});

  /* ── Carga datos ── */
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/projects/${projectId}/matrix`),
      api.get(`/projects/${projectId}/diagram-positions`),
    ]).then(([matrixData, posData]) => {
      // Título
      setTitle(matrixData.projectTitle || "");

      // --- Igual que ProjectMatrix: rows, cols y cells separados ---
      const rows  = matrixData.rows  || [];
      const cols  = matrixData.cols  || [];
      const cells = matrixData.cells || [];

      // cellMap simétrico (igual que ProjectMatrix)
      const cellMap = new Map();
      for (const c of cells) {
        const a = Number(c.row_axis_id);
        const b = Number(c.col_axis_id);
        const v = Number(c.value ?? 0);
        cellMap.set(`${a}-${b}`, v);
        cellMap.set(`${b}-${a}`, v);
      }

      // Ordenar filas y columnas igual que ProjectMatrix
      const zoneOrder = { Social: 1, Semisocial: 2, Servicio: 3, Privada: 4 };
      const sortFn = (a, b) => {
        const za = zoneOrder[normalizeZone(a.zone)] ?? 99;
        const zb = zoneOrder[normalizeZone(b.zone)] ?? 99;
        return za !== zb ? za - zb : (a.order ?? 0) - (b.order ?? 0);
      };
      const sortedRows = [...rows].sort(sortFn);
      const sortedCols = [...cols].sort(sortFn);

      // Sumatoria — usa sortedRows[i].id (fila) y sortedCols[j].id (columna)
      const n = sortedRows.length;
      const sumArr = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const v = Number(cellMap.get(`${Number(sortedRows[i].id)}-${Number(sortedCols[j].id)}`) ?? 0);
          sumArr[i] += v;
          sumArr[j] += v;
        }
      }

      // Rangos — incremento de 1 cuando cambia la suma (igual que ProjectMatrix)
      const items = sortedRows.map((r, idx) => ({
        idx,
        sum:   sumArr[idx],
        order: Number(r.order ?? idx),
        name:  r.name,
      }));
      items.sort((a, b) => {
        if (b.sum !== a.sum) return b.sum - a.sum;
        if (a.order !== b.order) return a.order - b.order;
        return String(a.name).localeCompare(String(b.name));
      });
      const ranks = Array(n).fill(0);
      let currentRank = 0, lastSum = null;
      for (const it of items) {
        if (lastSum === null || it.sum !== lastSum) { currentRank += 1; lastSum = it.sum; }
        ranks[it.idx] = currentRank;
      }

      setSpaces(sortedRows.map((r, i) => ({
        id:   r.id,
        name: r.name,
        zone: normalizeZone(r.zone),
        sum:  sumArr[i],
        rank: ranks[i],
      })));

      // relMap: pares de row IDs → valor (2 o 4)
      // Permite que el diagrama consulte relaciones usando solo IDs de filas
      const rm = new Map();
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const v = Number(cellMap.get(`${Number(sortedRows[i].id)}-${Number(sortedCols[j].id)}`) ?? 0);
          if (v > 0) {
            rm.set(`${sortedRows[i].id}-${sortedRows[j].id}`, v);
            rm.set(`${sortedRows[j].id}-${sortedRows[i].id}`, v);
          }
        }
      }
      setRelMap(rm);

      // Posiciones guardadas
      const posMap = {};
      for (const p of posData) posMap[p.axis_id] = p.angle_offset;
      console.log("[PONDER] posData cargado:", posData, "→ posMap:", posMap);
      positionsRef.current = posMap;   // sincronizar ref inmediatamente
      setPositions(posMap);
    }).catch(e => {
      setError(e.message || "Error al cargar el proyecto");
    }).finally(() => setLoading(false));
  }, [projectId]);

  /* ── Actualiza posición en estado y en ref (durante drag) ── */
  const handlePositionChange = useCallback((axisId, offset) => {
    positionsRef.current = { ...positionsRef.current, [axisId]: offset }; // sync inmediato
    setPositions(positionsRef.current);
    console.log("[PONDER] drag →", axisId, offset, "ref:", positionsRef.current);
  }, []);

  /* ── Función de guardado — lee siempre de ref para tener el valor más actual ── */
  const savePositions = useCallback(() => {
    const arr = Object.entries(positionsRef.current).map(([id, offset]) => ({
      axis_id: Number(id),
      angle_offset: Number(offset),
    }));
    if (!arr.length) return;
    console.log("[PONDER] guardando:", arr);
    api.put(`/projects/${projectId}/diagram-positions`, { positions: arr })
      .then(() => console.log("[PONDER] guardado OK ✓"))
      .catch(e => console.error("[PONDER] Error guardando:", e));
  }, [projectId]);

  /* ── Guarda al desmontar (cuando el usuario navega a otra página) ── */
  useEffect(() => {
    return () => { savePositions(); };
  }, [savePositions]);

  /* ── Exportar PDF ── */
  const handleExport = async () => {
    await exportMatrixPDF(diagramRef, `ponderaciones-proyecto-${projectId}.pdf`);
  };

  /* ── Render ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex",
                  alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 16 }}>
      Cargando diagrama…
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex",
                  alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 16 }}>
      {error}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui", color: C.text }}>

      {/* ── Top bar ── */}
      <div style={{
        backgroundColor: C.bgAlt, borderBottom: `1px solid ${C.border}`,
        padding: "14px 24px", display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMuted,
                     borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}
          >
            ← Matriz
          </button>
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>
              Etapa 2
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Diagrama de Ponderaciones
              {projectTitle && (
                <span style={{ color: C.gold, marginLeft: 8, fontWeight: 400, fontSize: 14 }}>
                  — {projectTitle}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowBg(v => !v)}
            style={{ background: showBg ? C.bgAlt : "#334155", color: C.textMuted,
                     border: `1px solid ${C.border}`, borderRadius: 6,
                     padding: "9px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            {showBg ? "Ocultar fondos" : "Mostrar fondos"}
          </button>
          <button
            onClick={handleExport}
            style={{ background: C.gold, color: C.bg, border: "none", borderRadius: 6,
                     padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Exportar PDF
          </button>
          <button
            onClick={onLogout}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMuted,
                     borderRadius: 6, padding: "9px 14px", cursor: "pointer", fontSize: 13 }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px",
                    display: "grid", gridTemplateColumns: "1fr 270px", gap: 28, alignItems: "start" }}>

        {/* Diagrama */}
        <div style={{ backgroundColor: C.card, borderRadius: 16, padding: 24,
                      border: `1px solid ${C.border}` }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>
            Diagrama de <span style={{ color: C.gold }}>Ponderaciones</span>
          </h2>

          {spaces.length < 2 ? (
            <div style={{ color: C.textMuted, textAlign: "center", padding: "40px 0" }}>
              Regresa a la matriz y agrega al menos 2 espacios con relaciones.
            </div>
          ) : (
            <div ref={diagramRef} style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
              <PonderacionesDiagram
                spaces={spaces}
                positions={positions}
                onPositionChange={handlePositionChange}
                onDragEnd={savePositions}
                relMap={relMap}
                showBg={showBg}
              />
            </div>
          )}
        </div>

        {/* Panel lateral — lista de espacios por rango ── */}
        <div style={{ backgroundColor: C.card, borderRadius: 16, padding: 24,
                      border: `1px solid ${C.border}` }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>
            Espacios por <span style={{ color: C.gold }}>Rango</span>
          </h3>

          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            Arrastra cada burbuja dentro de su sector y anillo para ajustar la posición.
            Los cambios se guardan automáticamente.
          </div>

          {Array.from(new Set(spaces.map(s => s.rank))).sort((a, b) => a - b).map(rank => (
            <div key={rank} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.gold,
                            letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                R{rank} — Rango {rank}
              </div>
              {spaces.filter(s => s.rank === rank).map(s => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: ZONE_COLOR[s.zone] || "#6b7280", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>Σ{s.sum}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Leyenda */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10,
                          fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Zonas
            </div>
            {ZONES.map(z => (
              <div key={z.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: z.color }} />
                <span style={{ fontSize: 12, color: C.textMuted }}>{z.key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
