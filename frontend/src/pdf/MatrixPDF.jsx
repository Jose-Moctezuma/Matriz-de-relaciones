import React, { forwardRef, useMemo } from "react";

const zoneAbbrev = (zkey) => {
  const k = String(zkey || "").toLowerCase();
  if (k.includes("social") && !k.includes("semi")) return "SOC";
  if (k.includes("semisocial")) return "SeS";
  if (k.includes("serv")) return "SERV";
  if (k.includes("priv")) return "PRIV";
  return "AREA";
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const normalizeZoneName = (zoneName) => {
  if (!zoneName) return "";
  const name = String(zoneName).trim();

  const lower = name.toLowerCase();
  if (lower.includes("social") && !lower.includes("semi")) return "Social";
  if (lower.includes("semisocial")) return "Semisocial";
  if (lower.includes("servicio") || lower.includes("serv")) return "Servicio";
  if (lower.includes("privada") || lower.includes("priv")) return "Privada";

  return name;
};

const MatrixPDF = forwardRef(function MatrixPDF(
  {
    ZONES,
    sortedRows,
    sortedCols,
    getCellValue,
    sums,
    ranks,
    STAGE_H,
    LEFT_W,
    INNER_W,
    HEADER_H,
    BORDER,
    projectTitle,
  },
  ref
) {
  const n = sortedRows.length;

  const rowsByZone = useMemo(() => {
    const m = new Map();
    for (const z of ZONES) {
      const normalizedKey = normalizeZoneName(z.key);
      m.set(normalizedKey, []);
    }
    sortedRows.forEach((r) => {
      const normalizedZone = normalizeZoneName(r.zone);
      if (!m.has(normalizedZone)) m.set(normalizedZone, []);
      m.get(normalizedZone).push(r);
    });
    return m;
  }, [ZONES, sortedRows]);

  const zoneColorMap = useMemo(() => {
    const m = new Map();
    m.set("Social", "#16a34a");
    m.set("Semisocial", "#f97316");
    m.set("Servicio", "#facc15");
    m.set("Privada", "#ef4444");

    for (const z of ZONES) {
      const normalizedKey = normalizeZoneName(z.key);
      if (!m.has(normalizedKey)) {
        m.set(normalizedKey, z.color);
      }
    }

    return m;
  }, [ZONES]);

  /* ── Layout constants ── */
  const TITLE_H = 50;
  const LEFT_MARGIN = 44;
  const LEGEND_H = 130;
  const FOOTER_ROWS_H = 80; // Espacio extra para sumatoria y rango
  const bottomSafe = 18;
  const availableHForDiamondArea = STAGE_H - TITLE_H - LEGEND_H - FOOTER_ROWS_H - bottomSafe;
  const rowH = clamp(Math.floor((availableHForDiamondArea - HEADER_H) / n), 26, 46);
  const leftH = HEADER_H + n * rowH;
  const TOP_Y = TITLE_H;
  const rightMargin = 12;
  const availableW = INNER_W - LEFT_MARGIN - LEFT_W - rightMargin;

  let CELL = Math.round(rowH / Math.SQRT2);
  CELL = clamp(CELL, 14, 50);
  let gridSide = n * CELL;
  let boundingW = gridSide * Math.SQRT2;

  if (boundingW > availableW) {
    CELL = Math.round((availableW / Math.SQRT2) / n);
    CELL = clamp(CELL, 14, 50);
    gridSide = n * CELL;
  }

  // desiredLeft: el CENTRO de las celdas diagonales queda en el borde derecho del panel.
  // El panel se dibuja encima del rombo (zIndex mayor), cubriendo la mitad izquierda
  // de cada celda diagonal. Solo la mitad derecha (triángulo) queda visible.
  // desiredTop: la fila 0 del rombo alinea con la primera fila de datos del panel.
  const desiredLeft = LEFT_MARGIN + LEFT_W;
  const desiredTop = TOP_Y + HEADER_H + 3;

  const rot45 = (px, py) => {
    const x0 = px - gridSide / 2;
    const y0 = py - gridSide / 2;
    const xr = (x0 - y0) / Math.SQRT2;
    const yr = (x0 + y0) / Math.SQRT2;
    return { xr, yr };
  };

  const triPts = [
    { x: CELL, y: 0 },
    { x: gridSide, y: 0 },
    { x: gridSide, y: gridSide - CELL },
    { x: CELL, y: CELL },
  ];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of triPts) {
    const r = rot45(p.x, p.y);
    minX = Math.min(minX, r.xr);
    maxX = Math.max(maxX, r.xr);
    minY = Math.min(minY, r.yr);
    maxY = Math.max(maxY, r.yr);
  }

  const cx = desiredLeft - minX;
  const cy = desiredTop - minY;
  const bottomTip = rot45(gridSide, gridSide);
  const diamondBottomX = cx + bottomTip.xr;
  const diamondBottomY = cy + bottomTip.yr;

  const diagStep = CELL / Math.SQRT2;

  // Función para obtener posición de celda extendida (como si hubiera columnas n y n+1)
  // Esto posiciona las celdas a lo largo del borde derecho del rombo (hipotenusa)
  const getExtendedCellPos = (row, extraCol) => {
    // Columna n + extraCol (extraCol = 0 para SUMATORIA, 1 para RANGO)
    const cellCenterX = (n + extraCol) * CELL + CELL / 2;
    const cellCenterY = row * CELL + CELL / 2;
    const rotated = rot45(cellCenterX, cellCenterY);
    return {
      x: cx + rotated.xr,
      y: cy + rotated.yr
    };
  };

  const labelOffsetX = Math.round(CELL * 4.5);
  const labelOffsetY = Math.round(CELL * 0.3);

  return (
    <div ref={ref} data-matrix-pdf style={{ position: "relative", width: "100%", height: `${STAGE_H}px`, background: "#fff" }}>

      {/* ── Título centrado ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: TITLE_H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <span
          style={{
            fontWeight: 900,
            fontSize: 28,
            color: "#111827",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Matriz de Relaciones Ponderadas
        </span>
        {projectTitle && (
          <span
            style={{
              fontWeight: 700,
              fontSize: 20,
              color: "#374151",
              letterSpacing: 0.5,
            }}
          >
            {projectTitle}
          </span>
        )}
      </div>

      {/* ── Panel izquierdo (zonas + ambientes) — zIndex mayor para tapar el rombo ── */}
      <div
        style={{
          position: "absolute",
          left: LEFT_MARGIN,
          top: TOP_Y,
          width: LEFT_W,
          height: leftH,
          border: BORDER,
          boxSizing: "border-box",
          background: "#fff",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "52px 1fr",
            borderBottom: "2px solid #111827",
          }}
        >
          <div style={{ borderRight: "2px solid #111827", display: "grid", placeItems: "center", fontWeight: 900 }}>
            AREA
          </div>
          <div style={{ padding: "10px 12px", fontWeight: 900 }}>
            ESPACIOS (AMBIENTES)
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "52px 1fr", height: leftH - HEADER_H }}>
          <div style={{ borderRight: "2px solid #111827" }}>
            {ZONES.map((z) => {
              const normalizedKey = normalizeZoneName(z.key);
              const items = rowsByZone.get(normalizedKey) || [];
              if (!items.length) return null;
              return (
                <div
                  key={z.key}
                  style={{
                    height: items.length * rowH,
                    background: z.color,
                    borderBottom: "2px solid #111827",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    color: "#0b1220",
                  }}
                >
                  {zoneAbbrev(z.key)}
                </div>
              );
            })}
          </div>

          <div>
            {sortedRows.map((r) => {
              const normalizedZone = normalizeZoneName(r.zone);
              return (
                <div
                  key={r.id}
                  style={{
                    height: rowH,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    borderBottom: "1px solid #111827",
                    fontWeight: 900,
                    color: "#111827",
                    background: zoneColorMap.get(normalizedZone) || "#ffffff",
                  }}
                >
                  {r.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Rombo (diamond grid) ── */}
      <div
        style={{
          position: "absolute",
          left: desiredLeft,
          top: desiredTop,
          width: Math.ceil(gridSide * Math.SQRT2),
          height: Math.ceil(gridSide * Math.SQRT2),
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: cx - desiredLeft,
            top: cy - desiredTop,
            width: gridSide,
            height: gridSide,
            transform: "translate(-50%, -50%) rotate(45deg)",
            transformOrigin: "center",
            display: "grid",
            gridTemplateColumns: `repeat(${n}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`,
          }}
        >
          {sortedRows.map((r, i) =>
            sortedCols.map((c, j) => {
              if (j < i) {
                return (
                  <div
                    key={`${r.id}-${c.id}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      visibility: "hidden",
                    }}
                  />
                );
              }
              if (j === i) {
                const normalizedZone = normalizeZoneName(r.zone);
                return (
                  <div
                    key={`${r.id}-${c.id}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      boxSizing: "border-box",
                      background: zoneColorMap.get(normalizedZone) || "#ffffff",
                    }}
                  />
                );
              }
              const v = getCellValue(r.id, c.id);
              const sameZone = normalizeZoneName(r.zone) === normalizeZoneName(c.zone);
              const cellBg = sameZone
                ? zoneColorMap.get(normalizeZoneName(r.zone)) || "#ffffff"
                : "#ffffff";

              return (
                <div
                  key={`${r.id}-${c.id}`}
                  style={{
                    width: CELL,
                    height: CELL,
                    boxSizing: "border-box",
                    border: "1px solid #6b7280",
                    background: cellBg,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <div style={{ transform: "rotate(-45deg)", fontWeight: 900, fontSize: 12, color: "#111827" }}>
                    {v ? v : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Sumatoria + Rango (a lo largo del borde derecho/hipotenusa) ── */}
      {/* SUMATORIA: columna n (extensión del grid) */}
      {Array.from({ length: n }).map((_, i) => {
        const pos = getExtendedCellPos(i, 0);
        return (
          <div
            key={`sum-${i}`}
            style={{
              position: "absolute",
              left: pos.x - CELL / 2,
              top: pos.y - CELL / 2,
              width: CELL,
              height: CELL,
              boxSizing: "border-box",
              border: "2px solid #111827",
              background: "#ffffff",
              display: "grid",
              placeItems: "center",
              transform: "rotate(45deg)",
            }}
          >
            <span style={{ transform: "rotate(-45deg)", fontWeight: 900, fontSize: 12, color: "#111827" }}>
              {sums[i] ?? 0}
            </span>
          </div>
        );
      })}
      {/* RANGO: columna n+1 (extensión del grid) */}
      {Array.from({ length: n }).map((_, i) => {
        const pos = getExtendedCellPos(i, 1);
        return (
          <div
            key={`rk-${i}`}
            style={{
              position: "absolute",
              left: pos.x - CELL / 2,
              top: pos.y - CELL / 2,
              width: CELL,
              height: CELL,
              boxSizing: "border-box",
              border: "2px solid #111827",
              background: "#ffffff",
              display: "grid",
              placeItems: "center",
              transform: "rotate(45deg)",
            }}
          >
            <span style={{ transform: "rotate(-45deg)", fontWeight: 900, fontSize: 12, color: "#111827" }}>
              {`R${ranks[i] ?? "-"}`}
            </span>
          </div>
        );
      })}

      {/* ── Labels SUMATORIA / RANGO ── */}
      {(() => {
        // Posición del label debajo de la última celda de cada columna
        const sumPos = getExtendedCellPos(n - 1, 0);
        const rkPos = getExtendedCellPos(n - 1, 1);

        return (
          <>
            <div
              style={{
                position: "absolute",
                left: sumPos.x - CELL * 2.8,
                top: sumPos.y + CELL * 0.1,
                transform: "rotate(-45deg)",
                transformOrigin: "right center",
                fontWeight: 900,
                color: "#111827",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontSize: 9,
                whiteSpace: "nowrap",
              }}
            >
              SUMATORIA
            </div>

            <div
              style={{
                position: "absolute",
                left: rkPos.x - CELL * 2,
                top: rkPos.y + CELL * 0.4,
                transform: "rotate(-45deg)",
                transformOrigin: "right center",
                fontWeight: 900,
                color: "#111827",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontSize: 9,
                whiteSpace: "nowrap",
              }}
            >
              RANGO
            </div>
          </>
        );
      })()}

      {/* ── Leyenda PONDERACION ── */}
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 28,
          border: "3px solid #111827",
          borderRadius: 4,
          padding: "16px 28px",
          background: "#fff",
          fontWeight: 900,
          color: "#111827",
          lineHeight: 2.2,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 10, fontSize: 16, letterSpacing: 2, textTransform: "uppercase" }}>
          Ponderación
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <polygon points="14,2 26,14 14,26 2,14" fill="#111827" />
            <text x="14" y="18" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900">4</text>
          </svg>
          <span>Relación Necesaria</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <polygon points="14,2 26,14 14,26 2,14" fill="#111827" />
            <text x="14" y="18" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900">2</text>
          </svg>
          <span>Relación Deseable</span>
        </div>
      </div>

    </div>
  );
});

export default MatrixPDF;
