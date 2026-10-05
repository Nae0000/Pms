// Rooms bought on installment (ผ่อนห้อง): how many instalments are done, paid so far, and what is left.
const num = (v) => parseFloat(String(v ?? "").replace(/,/g, "")) || 0;
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function installmentInfo(room, now = new Date()) {
  const amount = num(room?.installment);
  const loan = num(room?.loan_amount);
  if (!amount && !loan) return null;

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
  if (total) paidCount = Math.min(paidCount, total);

  const remainingCount = total ? total - paidCount : null;
  const done = total > 0 && paidCount >= total;
  const paidAmount = amount * paidCount;
  // progress: by instalments when the term is known, otherwise by money against the loan
  const percent = total
    ? Math.round((paidCount / total) * 100)
    : loan && amount ? Math.min(100, Math.round((paidAmount / loan) * 100)) : null;
  const started = paidCount > 0 || Number.isFinite(manual) || Boolean(m);
  const status = done ? "done" : amount && started ? "paying" : "todo";
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
    remainingAmount: remainingCount === null ? (loan ? Math.max(loan - paidAmount, 0) : null) : amount * remainingCount,
    percent,
    done,
    endLabel,
    status,
    statusLabel,
  };
}
