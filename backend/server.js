// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Soporte para MYSQL_URL (Railway) o variables individuales (Aiven, local, etc.)
const dbConfig = process.env.MYSQL_URL
  ? { uri: process.env.MYSQL_URL, waitForConnections: true, connectionLimit: 10, queueLimit: 0 }
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "arq_apps",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    };

console.log("DB Config:", { host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, database: process.env.DB_NAME, ssl: process.env.DB_SSL });
const pool = mysql.createPool(dbConfig);

// ---------- AUTH MIDDLEWARE ----------
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: "No autorizado" });
  }
}

async function assertProjectOwner(projectId, userId) {
  const [rows] = await pool.execute(
    "SELECT id, user_id FROM projects WHERE id = ? LIMIT 1",
    [projectId]
  );
  if (!rows.length) {
    const err = new Error("Proyecto no encontrado");
    err.status = 404;
    throw err;
  }
  if (rows[0].user_id !== userId) {
    const err = new Error("No autorizado");
    err.status = 403;
    throw err;
  }
}

// ---------- HEALTH ----------
app.get("/api/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ api: "ok", db: "ok", detail: "" });
  } catch (e) {
    res.status(500).json({ api: "ok", db: "fail", detail: e.message });
  }
});

// ---------- AUTH ROUTES ----------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

    const [exist] = await pool.execute("SELECT id FROM users WHERE email=? LIMIT 1", [email]);
    if (exist.length) return res.status(400).json({ error: "El correo ya existe" });

    const hash = await bcrypt.hash(password, 10);
    await pool.execute("INSERT INTO users (email, password_hash) VALUES (?,?)", [email, hash]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error interno", detail: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error("LOGIN ERROR REAL:", err);
    res.status(500).json({ error: "Error interno en login", detail: err.message });
  }
});

// ---------- FORGOT PASSWORD ----------
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Faltan datos" });

    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length) {
      const token = crypto.randomBytes(32).toString("hex");
      await pool.execute(
        "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
        [rows[0].id, token]
      );
      console.log(`🔑 RESET TOKEN para ${email}: ${token}`);
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error interno", detail: e.message });
  }
});

// ---------- RESET PASSWORD ----------
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: "Faltan datos" });

    const [rows] = await pool.execute(
      "SELECT pr.id, pr.user_id FROM password_resets pr WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW() LIMIT 1",
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, rows[0].user_id]);
    await pool.execute("UPDATE password_resets SET used = TRUE WHERE id = ?", [rows[0].id]);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error interno", detail: e.message });
  }
});

// ---------- PROJECTS ----------
app.get("/api/projects", auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, user_id, title, type, created_at, updated_at FROM projects WHERE user_id=? ORDER BY id DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error interno", detail: e.message });
  }
});

// ---------- PROJECT: RENAME ----------
app.put("/api/projects/:id", auth, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    await assertProjectOwner(projectId, req.user.id);

    const title = String(req.body?.title || "").trim();
    if (!title) return res.status(400).json({ error: "Título inválido" });
    if (title.length > 120) return res.status(400).json({ error: "Título demasiado largo" });

    await pool.execute(
      "UPDATE projects SET title=? WHERE id=? AND user_id=?",
      [title, projectId, req.user.id]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: "Error interno", detail: e.message });
  }
});


app.post("/api/projects", auth, async (req, res) => {
  try {
    const { title, type } = req.body || {};
    const projectTitle = title || "Nueva matriz";
    const projectType = type || "matrix";

    const [r] = await pool.execute(
      "INSERT INTO projects (user_id, title, type, data) VALUES (?,?,?,?)",
      [req.user.id, projectTitle, projectType, null]
    );
    res.json({ id: r.insertId });
  } catch (e) {
    res.status(500).json({ error: "Error interno", detail: e.message });
  }
});

app.delete("/api/projects/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await assertProjectOwner(id, req.user.id);

    await pool.execute("DELETE FROM matrix_cells WHERE project_id=?", [id]);
    await pool.execute("DELETE FROM matrix_axes WHERE project_id=?", [id]);
    await pool.execute("DELETE FROM projects WHERE id=? AND user_id=?", [id, req.user.id]);

    res.json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Error interno", detail: e.detail || "" });
  }
});

// ---------- MATRIX: GET ----------
app.get("/api/projects/:id/matrix", auth, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    await assertProjectOwner(projectId, req.user.id);

    const [axes] = await pool.execute(
      "SELECT id, axis_type, zone, component, order_index FROM matrix_axes WHERE project_id=? ORDER BY order_index ASC, id ASC",
      [projectId]
    );

    const rows = axes
      .filter((a) => a.axis_type === "row")
      .map((a) => ({ id: a.id, name: a.component, zone: a.zone, order: a.order_index }));

    const cols = axes
      .filter((a) => a.axis_type === "col")
      .map((a) => ({ id: a.id, name: a.component, zone: a.zone, order: a.order_index }));

    const [cells] = await pool.execute(
      "SELECT row_axis_id, col_axis_id, value FROM matrix_cells WHERE project_id=?",
      [projectId]
    );

    // componentes para el editor (sin duplicar): usamos las filas
    const components = rows.map((r) => ({ zone: r.zone, name: r.name }));

    res.json({ projectId, rows, cols, cells, components });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Error interno", detail: e.detail || "" });
  }
});


// ---------- MATRIX: SAVE AXES FROM COMPONENTS (preservando relaciones) ----------
app.put("/api/projects/:id/matrix/axes", auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const projectId = Number(req.params.id);
    await assertProjectOwner(projectId, req.user.id);

    const { components } = req.body || {};
    if (!Array.isArray(components) || components.length < 2) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    // 1) Limpieza + normalización
    const clean = components
      .map((c) => ({
        zone: String(c.zone || "").trim(),
        name: String(c.name || "").trim(),
      }))
      .filter((c) => c.zone && c.name);

    if (clean.length < 2) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    // 2) Únicos por (zone+name) preservando orden
    const seen = new Set();
    const uniq = [];
    for (const c of clean) {
      const k = `${c.zone}|||${c.name}`;
      if (!seen.has(k)) {
        seen.add(k);
        uniq.push(c);
      }
    }

    if (uniq.length < 2) {
      return res.status(400).json({ error: "Se requieren al menos 2 componentes" });
    }

    await conn.beginTransaction();

    // 3) Leer estado actual para conservar relaciones (por nombre de componente)
    // OJO: aquí usamos axis_type y component (coincide con tu GET)
    const [oldAxes] = await conn.execute(
      "SELECT id, axis_type, component FROM matrix_axes WHERE project_id=? ORDER BY order_index ASC, id ASC",
      [projectId]
    );

    const idToComponent = new Map(oldAxes.map((a) => [a.id, a.component]));

    const [oldCells] = await conn.execute(
      "SELECT row_axis_id, col_axis_id, value FROM matrix_cells WHERE project_id=?",
      [projectId]
    );

    // Mapa por par de componentes "A|||B" estable
    const oldValueByPair = new Map();
    for (const cell of oldCells) {
      const rn = idToComponent.get(cell.row_axis_id);
      const cn = idToComponent.get(cell.col_axis_id);
      if (!rn || !cn) continue;

      const a = String(rn);
      const b = String(cn);
      const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
      oldValueByPair.set(key, Number(cell.value));
    }

    // 4) Borrar axes (si tu FK tiene ON DELETE CASCADE, esto borra celdas;
    // si no lo tiene, igual está bien porque abajo insertamos todo de nuevo).
    await conn.execute("DELETE FROM matrix_axes WHERE project_id=?", [projectId]);

    // 5) Insertar nuevos axes (rows + cols)
    const rowIds = [];
    const colIds = [];

    for (let i = 0; i < uniq.length; i++) {
      const c = uniq[i];
      const [r] = await conn.execute(
        "INSERT INTO matrix_axes (project_id, axis_type, zone, component, order_index) VALUES (?,?,?,?,?)",
        [projectId, "row", c.zone, c.name, i]
      );
      rowIds.push(r.insertId);
    }

    for (let j = 0; j < uniq.length; j++) {
      const c = uniq[j];
      const [r] = await conn.execute(
        "INSERT INTO matrix_axes (project_id, axis_type, zone, component, order_index) VALUES (?,?,?,?,?)",
        [projectId, "col", c.zone, c.name, j]
      );
      colIds.push(r.insertId);
    }

    // 6) Insertar celdas triángulo superior conservando valores (0/2/4)
    for (let i = 0; i < rowIds.length; i++) {
      for (let j = i + 1; j < colIds.length; j++) {
        const a = uniq[i].name;
        const b = uniq[j].name;
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;

        const vRaw = oldValueByPair.has(key) ? oldValueByPair.get(key) : 0;
        const v = [0, 2, 4].includes(Number(vRaw)) ? Number(vRaw) : 0;

        await conn.execute(
          "INSERT INTO matrix_cells (project_id, row_axis_id, col_axis_id, value, updated_at) VALUES (?,?,?,?, NOW())",
          [projectId, rowIds[i], colIds[j], v]
        );
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    res.status(e.status || 500).json({ error: "Error interno", detail: e.message });
  } finally {
    conn.release();
  }
});

// ---------- MATRIX: SAVE CELL (0/2/4) ----------
app.put("/api/projects/:id/matrix/cell", auth, async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    await assertProjectOwner(projectId, req.user.id);

    const body = req.body || {};
    const rowId = body.rowId ?? body.row_axis_id;
    const colId = body.colId ?? body.col_axis_id;
    const v = Number(body.value);

    if (!rowId || !colId || ![0, 2, 4].includes(v)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    await pool.execute(
      "DELETE FROM matrix_cells WHERE project_id=? AND row_axis_id=? AND col_axis_id=?",
      [projectId, rowId, colId]
    );
    await pool.execute(
      "INSERT INTO matrix_cells (project_id, row_axis_id, col_axis_id, value, updated_at) VALUES (?,?,?,?, NOW())",
      [projectId, rowId, colId, v]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: "Error interno", detail: e.message });
  }
});

// ---------- SERVIR FRONTEND EN PRODUCCIÓN ----------
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
});
