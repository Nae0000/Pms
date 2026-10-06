// Rooms bought on installment (ผ่อนห้อง): how many instalments are done, paid so far, and what is left.
const num = (v) => parseFloat(String(v ?? "").replace(/,/g, "")) || 0;
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// The month-by-month table: "extra" (เงินทบ) is the principal actually cut that month when it is filled in
// (it already includes the normal instalment); otherwise the "principal" column is used.
export function scheduleRows(payments) {
  const rows = [...(payments || [])].sort((a, b) => num(a.month_no) - num(b.month_no));
  return rows.map((p) => {
    const principalCut = String(p.extra ?? "").trim() !== "" ? num(p.extra) : num(p.principal);
    const interest = num(p.interest);
    return { ...p, principalCut, interest, cash: principalCut + interest };
  });
}

export function scheduleTotals(payments) {
  const rows = scheduleRows(payments);
  return {
    count: rows.length,
    principal: rows.reduce((s, r) => s + r.principalCut, 0),
    interest: rows.reduce((s, r) => s + r.interest, 0),
    cash: rows.reduce((s, r) => s + r.cash, 0),
  };
}

// Rooms bought outright (ซื้อสด) have no loan: no instalments, no monthly cost.
export const isCash = (room) => String(room?.purchase_type ?? "").trim().toLowerCase() === "cash";

export function installmentInfo(room, now = new Date(), payments = null) {
  if (isCash(room)) return null;
  const sched = payments && payments.length ? scheduleTotals(payments) : null;
  const lastRow = sched ? scheduleRows(payments).at(-1) : null;
  const amount = num(room?.installment) || (lastRow ? num(lastRow.installment) : 0);
  const loan = num(room?.loan_amount);
  if (!amount && !loan && !sched) return null;

  const total = parseInt(room.installment_months, 10) || 0; // 0 = unknown / open-ended
  const m = String(room.installment_start || "").match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  const manual = String(room.installment_paid ?? "").trim() !== "" ? parseInt(room.installment_paid, 10) : NaN;

  let paidCount = 0;
  if (Number.isFinite(manual)) {
    paidCount = Math.max(manual, 0);
  } else if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3] || 1)];
    // one instalment falls due on the start day of every month, starting with the start month
    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - mo);
    paidCount = months < 0 ? 0 : months + (now.getDate() >= d ? 1 : 0);
  }
  if (sched) paidCount = sched.count; // the real table beats any estimate
  if (total) paidCount = Math.min(paidCount, total);

  const remainingCount = total ? total - paidCount : null;
  const paidAmount = sched ? sched.cash : amount * paidCount;
  const done = sched && loan > 0 ? sched.principal >= loan - 1 : total > 0 && paidCount >= total;
  // progress: by principal against the loan when there is a real table, else by instalments, else by money
  const percent = sched && loan
    ? Math.min(100, Math.round((sched.principal / loan) * 100))
    : total
      ? Math.round((paidCount / total) * 100)
      : loan && amount ? Math.min(100, Math.round((paidAmount / loan) * 100)) : null;
  const started = paidCount > 0 || Number.isFinite(manual) || Boolean(m);
  const status = done ? "done" : (amount || sched) && started ? "paying" : "todo";
  const statusLabel = { done: "ผ่อนครบแล้ว", paying: "กำลังผ่อน", todo: "ยังไม่ได้กรอกข้อมูลผ่อน" }[status];

  let endLabel = "";
  if (m && total) {
    const end = new Date(Number(m[1]), Number(m[2]) - 1 + total - 1, 1);
    endLabel = `${MONTHS_TH[end.getMonth()]} ${end.getFullYear() + 543}`;
  }

  return {
    amount,
    loan,
    total,
    paidCount,
    paidAmount,
    remainingCount,
    remainingAmount: sched ? (loan ? Math.max(loan - sched.principal, 0) : null) : remainingCount === null ? (loan ? Math.max(loan - paidAmount, 0) : null) : amount * remainingCount,
    principalPaid: sched ? sched.principal : null,
    interestPaid: sched ? sched.interest : null,
    fromTable: Boolean(sched),
    percent,
    done,
    endLabel,
    status,
    statusLabel,
  };
}
