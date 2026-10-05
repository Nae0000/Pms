// Client for the Google Apps Script web app that fronts the Google Sheet.
// See google-apps-script/README.md for setup.
const API_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_SHEETS_API_KEY || "";

export const SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL || "";
export const isConfigured = Boolean(API_URL);

async function parse(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json;
}

export async function fetchAll() {
  const res = await fetch(`${API_URL}?key=${encodeURIComponent(API_KEY)}`, { cache: "no-store" });
  return parse(res);
}

// text/plain avoids a CORS preflight, which Apps Script cannot answer.
async function post(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ key: API_KEY, ...payload }),
  });
  return parse(res);
}

export const insertRow = (table, data) => post({ action: "insert", table, data }).then(r => r.data);
export const insertRows = (table, data) => post({ action: "bulkInsert", table, data }).then(r => r.data);
export const updateRow = (table, id, data) => post({ action: "update", table, id, data });
export const deleteRow = (table, id) => post({ action: "delete", table, id });
