// Client for the Google Apps Script web app that fronts the Google Sheet.
// See google-apps-script/README.md for setup.
const API_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_SHEETS_API_KEY || "";

export const SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL || "";
export const isConfigured = Boolean(API_URL);

// A hung request would leave the page "saving…" forever.
function fetchWithTimeout(url, options = {}, ms = 60000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal })
    .catch((err) => {
      throw err && err.name === "AbortError" ? new Error("หมดเวลารอ Google Sheet") : err;
    })
    .finally(() => clearTimeout(timer));
}

async function parse(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Apps Script now and then answers with a Google error page (HTTP 404) or times out.
// Reads are safe to repeat, so try a few times before giving up.
async function withRetry(fn, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Google sometimes answers a valid request with "unauthorized" or an HTML error page, so every
      // failure is retried; a genuinely wrong key just fails the same way each time.
      if (i < tries - 1) await sleep(1200 * (i + 1));
    }
  }
  throw lastErr;
}

export async function fetchAll() {
  return withRetry(async () => {
    const res = await fetchWithTimeout(`${API_URL}?key=${encodeURIComponent(API_KEY)}`, { cache: "no-store" });
    return parse(res);
  });
}

// text/plain avoids a CORS preflight, which Apps Script cannot answer.
// Updates and deletes can be repeated safely; inserts cannot (a retry could add the row twice).
async function post(payload) {
  const send = async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ key: API_KEY, ...payload }),
    });
    return parse(res);
  };
  const repeatable = ["update", "delete", "batch"].includes(payload.action);
  return repeatable ? withRetry(send, 3) : send();
}

export const insertRow = (table, data) => post({ action: "insert", table, data }).then(r => r.data);
export const insertRows = (table, data) => post({ action: "bulkInsert", table, data }).then(r => r.data);
export const updateRow = (table, id, data) => post({ action: "update", table, id, data });
export const deleteRow = (table, id) => post({ action: "delete", table, id });
// ops: [{ table, id, data }] — returns true when every row was found and updated
export const batchUpdate = (ops) => post({ action: "batch", ops }).then((r) => r.results.every(Boolean));
