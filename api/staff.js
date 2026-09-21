/**
 * Vercel serverless: prefer live Google Sheets CSV, else status.json on this deployment.
 * Set SHEETS_CSV_URL env to override. Sheet must be shared "Anyone with the link" (Viewer).
 */

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") {}
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => String(c).trim())).map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fromSheetRows(rows) {
  return rows.map((r) => ({
    id: slugify(r.Staff || r.staff || r.name),
    name: r.Staff || r.staff || r.name || "",
    lane: r.Lane || r.lane || "",
    priority: r.Priority || r.priority || "",
    status: r.Status || r.status || "Pending",
    now: r.Now || r.now || "",
    target: r.Target || r.target || "",
    startedAt: r.StartedAt || r.startedAt || "",
    lastUpdated: r.UpdatedAt || r.lastUpdated || "",
    effortMins: Number(r.EffortMins || r.effortMins || 0) || 0,
    outcome: r.Outcome || r.outcome || "",
    notes: r.Notes || r.notes || "",
  })).filter((s) => s.name);
}

const DEFAULT_SHEET =
  "https://docs.google.com/spreadsheets/d/1FCmS05SFPVDoz0aT8FO-mxlC06AJU13MYP5gzxzGhfA/export?format=csv&gid=0";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const csvUrl = process.env.SHEETS_CSV_URL || DEFAULT_SHEET;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";

  try {
    const r = await fetch(csvUrl, {
      redirect: "follow",
      headers: { "User-Agent": "StaffCommandDashboard/1.0" },
    });
    const text = await r.text();
    const looksPrivate =
      !r.ok ||
      text.includes("ServiceLogin") ||
      text.includes("accounts.google.com") ||
      text.trim().startsWith("<!");
    if (!looksPrivate) {
      const staff = fromSheetRows(parseCsv(text));
      if (staff.length) {
        return res.status(200).json({
          source: "google-sheets",
          updatedAt: new Date().toISOString(),
          sheetCsvUrl: csvUrl,
          staff,
        });
      }
    }
  } catch (e) {}

  try {
    const fallback = `${proto}://${host}/status.json`;
    const r = await fetch(fallback, { cache: "no-store" });
    const data = await r.json();
    return res.status(200).json({
      source: "status.json",
      updatedAt: data.updatedAt || new Date().toISOString(),
      note: "Sheets not publicly readable yet — share StaffNow as Anyone with the link (Viewer).",
      staff: data.staff || [],
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
