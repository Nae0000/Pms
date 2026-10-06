// Monthly rent bookkeeping. Every rent payment carries a PERIOD ("yyyy-mm" = which month's rent it pays),
// separate from the date the money arrived. That is what lets a tenant pay in several parts, settle an
// old month later, or pay several months in one transfer.
import { isCounted } from "./finance";

export const num = (v) => parseFloat(String(v ?? "").replace(/[฿,\s]/g, "")) || 0;
const pad = (n) => String(n).padStart(2, "0");

export const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
export const MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const isRentTx = (t) => t.type === "income" && /^(rent|ค่าเช่า)/i.test(t.category || "");

export const keyOf = (y, m) => `${y}-${pad(m + 1)}`; // m is 0-based
export const parseKey = (k) => ({ y: Number(k.slice(0, 4)), m: Number(k.slice(5, 7)) - 1 });
export const addMonths = (k, n) => {
  const { y, m } = parseKey(k);
  const d = new Date(y, m + n, 1);
  return keyOf(d.getFullYear(), d.getMonth());
};
export const labelOf = (k, short = false) => {
  const { y, m } = parseKey(k);
  return `${(short ? MONTHS_SHORT : MONTHS_TH)[m]} ${y + 543}`;
};

// Which month's rent does this payment pay? Old rows without a period count for the month they were received.
export const periodOf = (t) => (/^\d{4}-\d{2}$/.test(String(t.period || "").trim()) ? String(t.period).trim() : String(t.date || "").slice(0, 7));

// period -> { sum, rows } for the money actually received for one room
export function paidMap(transactions, roomName) {
  const map = {};
  (transactions || []).forEach((t) => {
    if (!isRentTx(t) || t.room !== roomName || !isCounted(t)) return;
    const k = periodOf(t);
    if (!/^\d{4}-\d{2}$/.test(k)) return;
    (map[k] = map[k] || { sum: 0, rows: [] });
    map[k].sum += num(t.amount);
    map[k].rows.push(t);
  });
  return map;
}

// First month for which anything was recorded in the app. Earlier months were never tracked here, so they
// are not reported as "overdue" (otherwise the whole history before the app would show as unpaid).
export function trackingStart(transactions) {
  const keys = (transactions || []).filter((t) => isRentTx(t) && isCounted(t)).map(periodOf).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
  return keys[0] || null;
}

// Months before `currentKey` that are still short. With a start date: every month since the contract began
// (and since tracking began). Without one: only months that already got a part-payment.
export function arrearsFor({ rent, tenant, map, currentKey, tracking }) {
  if (!(rent > 0)) return [];
  const out = [];
  const startKey = tenant?.start_date && /^\d{4}-\d{2}/.test(tenant.start_date) ? String(tenant.start_date).slice(0, 7) : null;
  const endKey = tenant?.move_out_date && /^\d{4}-\d{2}/.test(tenant.move_out_date) ? String(tenant.move_out_date).slice(0, 7) : null;
  const floor = addMonths(currentKey, -24);
  let from = startKey || tracking;
  if (!from) return out;
  if (tracking && tracking > from) from = tracking;
  if (floor > from) from = floor;
  for (let k = from; k < currentKey; k = addMonths(k, 1)) {
    if (endKey && k > endKey) break;
    const paid = map[k]?.sum || 0;
    if (paid >= rent - 0.5) continue;
    if (!startKey && paid <= 0) continue; // unknown start: only follow months that already have a part-payment
    out.push({ key: k, need: rent, paid, remaining: rent - paid });
  }
  return out;
}

// Spread one payment over the months that need money: oldest arrears first, then this month, then the
// following months. Returns [{ key, amount, closes, remainingAfter }].
export function allocate(amount, targets) {
  let left = Math.round(amount * 100) / 100;
  const out = [];
  for (const t of targets) {
    if (left <= 0.004) break;
    const need = Math.max(Math.round(t.remaining * 100) / 100, 0);
    if (need <= 0) continue;
    const take = Math.min(left, need);
    out.push({ key: t.key, amount: take, closes: take >= need - 0.004, remainingAfter: need - take });
    left = Math.round((left - take) * 100) / 100;
  }
  // anything beyond the horizon is kept on the last month rather than lost
  if (left > 0.004) {
    if (out.length) out[out.length - 1].amount += left;
    else if (targets.length) out.push({ key: targets[0].key, amount: left, closes: true, remainingAfter: 0 });
  }
  return out;
}
