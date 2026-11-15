// Read-only integration check: requires the backend's configured MySQL database.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { muscleGroups } from "../src/data/muscleGroups.js";
import { boneGroups } from "../src/data/boneGroups.js";

const require = createRequire(new URL("../../../Backend/server/package.json", import.meta.url));
require("dotenv").config({ path: fileURLToPath(new URL("../../../Backend/server/.env", import.meta.url)), quiet: true });
const db = require("./config/db");
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
app.use("/api/anatomy", require("./middleware/authMiddleware"), require("./routes/AnatomyRoutes"));
app.use((error, req, res, next) => res.status(500).json({ message: error.message }));

const organs = {
  brain: "brain", heart: "heart", lung_l: "lungs", lung_r: "lungs",
  liver: "liver", kidney_l: "kidneys", kidney_r: "kidneys", small_intestine: "small_intestine",
};
const muscleFields = ["estimated_recovery", "soreness", "fatigue", "strength", "endurance"];
const boneFields = ["bone_density", "bone_structure", "bone_strength", "bone_building", "bone_breakdown"];
let http;
let vite;
let checked = 0;
const renderPanel = (Panel, selection) => renderToStaticMarkup(
  React.createElement(MemoryRouter, null, React.createElement(Panel, { selection, onClear() {} }))
);

try {
  http = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { http.once("listening", resolve); http.once("error", reject); });
  const base = `http://127.0.0.1:${http.address().port}/api/anatomy`;
  vite = await createServer({
    server: { middlewareMode: true, hmr: false }, appType: "custom",
    plugins: [{
      name: "anatomy-status-check", enforce: "pre",
      transform(code, id) {
        if (id.replaceAll("\\", "/").endsWith("/src/components/useAnatomyStatus.js")) {
          return "export function useAnatomyStatus(category, key) { return globalThis.__anatomyStatusCheck(category, key); }";
        }
      },
    }],
  });
  const { default: Muscle } = await vite.ssrLoadModule("/src/components/MuscleStatusPanel.jsx");
  const { default: Bone } = await vite.ssrLoadModule("/src/components/BoneStatusPanel.jsx");
  const { default: Organ } = await vite.ssrLoadModule("/src/components/OrganStatusPanel.jsx");
  const catalog = (await import("../src/data/anatomyCatalog.json", { with: { type: "json" } })).default;
  const [users] = await db.query("SELECT DISTINCT user_id FROM muscle_status");
  assert(users.length > 0, "Database needs anatomy measurements for at least one user.");

  async function request(path, token) {
    return fetch(`${base}/${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  }

  for (const { user_id: userId } of users) {
    const token = jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "5m" });
    const cases = [
      ...muscleGroups.map(selection => ({ category: "muscles", table: "muscle_status", selection, Panel: Muscle, fields: muscleFields })),
      ...boneGroups.map(selection => ({ category: "bones", table: "bone_status", selection, Panel: Bone, fields: boneFields })),
      ...Object.entries(organs).map(([key, table]) => ({ category: "organs", table, selection: catalog.find(part => part.key === key), Panel: Organ })),
    ];
    for (const { category, table, selection, Panel, fields } of cases) {
      const params = [userId];
      let sql = `SELECT * FROM \`${table}\` WHERE user_id = ?`;
      if (category !== "organs") { sql += " AND region_key = ?"; params.push(selection.key); }
      const [rows] = await db.execute(sql, params);
      assert(rows[0], `Missing ${table}/${selection.key} for user ${userId}`);
      const response = await request(`${category}/${selection.key}`, token);
      assert.equal(response.status, 200, `${category}/${selection.key}`);
      const payload = await response.json();
      const keys = fields || Object.keys(rows[0]).filter(key => key !== "user_id");
      for (const key of keys) assert.equal(payload.data[key], rows[0][key], `API field mismatch: ${category}/${selection.key}/${key}`);
      globalThis.__anatomyStatusCheck = (requestedCategory, requestedKey) => {
        assert.equal(requestedCategory, category);
        assert.equal(requestedKey, selection.key);
        return { data: payload.data, loading: false, error: "" };
      };
      const markup = renderPanel(Panel, selection);
      assert(!markup.includes("NaN") && !markup.includes("—"), `Blank or invalid metric: ${category}/${selection.key}`);
      for (const key of keys) {
        const value = key === "bone_density" ? Number(rows[0][key]).toFixed(3)
          : muscleFields.includes(key) || boneFields.includes(key) ? String(Number(rows[0][key])) : String(rows[0][key]);
        assert(markup.includes(renderToStaticMarkup(value)), `Missing rendered ${key}: ${category}/${selection.key}`);
      }
      checked++;
    }
    assert.equal((await request("muscles/not_a_region", token)).status, 404);
    assert.equal((await request("organs/not_an_organ", token)).status, 404);
  }
  assert.equal((await request("muscles/right_arm")).status, 401);
  const absentToken = jwt.sign({ id: "2147483647" }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "5m" });
  const absent = await request("muscles/right_arm", absentToken);
  assert.equal(absent.status, 404);
  assert.match((await absent.json()).message, /No measurements/);

  for (const selection of catalog.filter(part => part.system === "organs" && !organs[part.key])) {
    const markup = renderPanel(Organ, selection);
    assert(markup.includes("No database-backed measurements for this organ yet."));
  }
  const { StatusScore } = await vite.ssrLoadModule("/src/components/AnatomyStatusPanel.jsx");
  const missingScore = renderToStaticMarkup(React.createElement(StatusScore, { label: "Missing", value: "—", accent: "strength" }));
  assert(!missingScore.includes("NaN"));
  assert(missingScore.includes("width:0%"));
  console.log(`Passed ${checked} authenticated anatomy responses and rendered panels for ${users.length} users; auth, missing-data, unsupported-organ and empty-score checks passed.`);
} finally {
  delete globalThis.__anatomyStatusCheck;
  if (vite) await vite.close();
  if (http) await new Promise(resolve => http.close(resolve));
  await db.end();
}
