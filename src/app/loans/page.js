"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown, ChevronUp, Trash2, ClipboardPaste } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";
import { installmentInfo, scheduleRows, scheduleTotals } from "@/lib/installment";

const num = (v) => parseFloat(String(v ?? "").replace(/[฿,\s]/g, "")) || 0;
const baht = (n) => `฿${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const money2 = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FIELDS = [
  { key: "loan_amount", label: "ยอดกู้ (บาท)", type: "text", inputMode: "numeric", ph: "เช่น 1,200,000" },
  { key: "installment", label: "ค่างวด/เดือน", type: "text", inputMode: "numeric", ph: "เช่น 8,000" },
  { key: "installment_months", label: "ผ่อนทั้งหมด (งวด)", type: "number", inputMode: "numeric", ph: "เช่น 120" },
  { key: "installment_start", label: "เริ่มผ่อน", type: "date" },
];

const COLS = [
  { key: "month_no", label: "เดือน", w: "3.2rem" },
  { key: "installment", label: "งวดละ" },
  { key: "principal", label: "เงินต้น" },
  { key: "interest", label: "ดอกเบี้ย" },
  { key: "extra", label: "เงินทบ (เงินต้น)" },
];

// Turns text copied from Excel / Google Sheets into rows: month, instalment, principal, interest, extra
function parsePaste(text) {
  const out = [];
  String(text || "").split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const cells = line.split(/\t|\s{2,}/).map((c) => c.trim());
    const month = parseInt(cells[0], 10);
    if (!Number.isFinite(month)) return; // header or junk line
    const n = (i) => (cells[i] === undefined || cells[i] === "" ? "" : String(num(cells[i])));
    out.push({ month_no: String(month), installment: n(1), principal: n(2), interest: n(3), extra: n(4) });
  });
  return out;
}

function Schedule({ room, payments, onAdd, onBulk, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [draft, setDraft] = useState({});
  const rows = scheduleRows(payments);
  const tot = scheduleTotals(payments);

  const dk = (id, k) => `${id}:${k}`;
  // shown formatted (3,515.00); while being edited it is the raw text
  const cell = (p, k) => {
    if (dk(p.id, k) in draft) return draft[dk(p.id, k)];
    const raw = p[k] ?? "";
    return k === "month_no" || String(raw).trim() === "" ? raw : money2(num(raw));
  };
  const startEdit = (p, k) => setDraft((d) => (dk(p.id, k) in d ? d : { ...d, [dk(p.id, k)]: String(p[k] ?? "") }));
  const commit = (p, k) => {
    if (!(dk(p.id, k) in draft)) return;
    const raw = String(draft[dk(p.id, k)]).trim();
    setDraft((d) => { const { [dk(p.id, k)]: _g, ...rest } = d; return rest; });
    const next = raw === "" ? "" : String(num(raw));
    if (next !== String(p[k] ?? "").trim()) onUpdate(p.id, { [k]: next });
  };

  const parsed = parsePaste(pasteText);
  const have = new Set(rows.map((r) => String(parseInt(r.month_no, 10))));
  const fresh = parsed.filter((r) => !have.has(r.month_no));

  const addNext = () => {
    const last = rows.at(-1);
    onAdd({ room: room.name, month_no: String((last ? parseInt(last.month_no, 10) || rows.length : 0) + 1), installment: last ? String(last.installment ?? "") : String(num(room.installment) || ""), principal: "", interest: "", extra: "", note: "" });
  };

  return (
    <div className={styles.sched}>
      <button type="button" className={styles.schedToggle} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>
          <b>ตารางการผ่อน</b> ({tot.count} งวด)
          {tot.count > 0 && <small> เงินต้นที่ตัดแล้ว {baht(tot.principal)} · ดอกเบี้ย {baht(tot.interest)}</small>}
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className={styles.schedBody}>
          {rows.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {COLS.map((c) => <th key={c.key}>{c.label}</th>)}
                    <th>จ่ายจริง</th>
                    <th aria-label="ลบ" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className={String(p.extra ?? "").trim() !== "" ? styles.hasExtra : undefined}>
                      {COLS.map((c) => (
                        <td key={c.key}>
                          <input
                            className={styles.cellInput}
                            style={c.w ? { width: c.w, textAlign: "center", fontWeight: 700 } : undefined}
                            inputMode="decimal"
                            value={cell(p, c.key)}
                            onFocus={() => startEdit(p, c.key)}
                            onChange={(e) => setDraft((d) => ({ ...d, [dk(p.id, c.key)]: e.target.value }))}
                            onBlur={() => commit(p, c.key)}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            aria-label={`${c.label} เดือน ${p.month_no}`}
                          />
                        </td>
                      ))}
                      <td className={styles.cashCell}>{money2(p.cash)}</td>
                      <td>
                        <button type="button" className={styles.delBtn} aria-label={`ลบเดือน ${p.month_no}`}
                          onClick={() => { if (window.confirm(`ลบงวดที่ ${p.month_no} ?`)) onDelete(p.id); }}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>รวม</td>
                    <td colSpan={2}>เงินต้น {money2(tot.principal)}</td>
                    <td colSpan={2}>ดอกเบี้ย {money2(tot.interest)}</td>
                    <td>{money2(tot.cash)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className={styles.hint}>ยังไม่มีตาราง กด &quot;เพิ่มงวด&quot; หรือวางตารางที่คัดลอกจาก Excel/Google Sheet</p>
          )}
          <p className={styles.legend}>ช่อง &quot;เงินทบ&quot; คือเงินต้นที่ตัดจริงในเดือนนั้น (รวมค่างวดแล้ว) ถ้าเว้นว่างจะใช้ช่อง &quot;เงินต้น&quot;</p>

          <div className={styles.schedActions}>
            <button type="button" className="btn btn-outline" onClick={addNext}><Plus size={16} /> เพิ่มงวด</button>
            <button type="button" className="btn btn-outline" onClick={() => setPasteOpen((o) => !o)}><ClipboardPaste size={16} /> วางตารางจาก Excel</button>
          </div>

          {pasteOpen && (
            <div className={styles.paste}>
              <p>คัดลอกแถวจากตารางของคุณ (เดือน, งวดละ, เงินต้น, ดอกเบี้ย, เงินทบ) แล้ววางที่นี่</p>
              <textarea
                className="input-field"
                rows={6}
                placeholder={"1\t4520\t3515.00\t1005.00\n2\t4520\t2241.19\t2278.81"}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <div className={styles.pasteFoot}>
                <span>
                  พบ {parsed.length} แถว{parsed.length - fresh.length > 0 ? ` (ข้าม ${parsed.length - fresh.length} เดือนที่มีอยู่แล้ว)` : ""}
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!fresh.length}
                  onClick={async () => {
                    const n = await onBulk(fresh.map((r) => ({ ...r, room: room.name, note: "" })));
                    if (n) { setPasteText(""); setPasteOpen(false); }
                  }}
                >
                  นำเข้า {fresh.length} งวด
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// One block per room. Every box saves as soon as you leave it.
function LoanRow({ room, payments, onSave, onAdd, onBulk, onUpdate, onDelete }) {
  const info = installmentInfo(room, new Date(), payments);
  const [draft, setDraft] = useState({});
  const val = (k) => (k in draft ? draft[k] : room[k] || "");

  const commit = (k) => {
    if (!(k in draft)) return;
    const next = String(draft[k]).trim();
    setDraft((d) => { const { [k]: _gone, ...rest } = d; return rest; });
    if (next !== String(room[k] || "").trim()) onSave(room.id, { [k]: next });
  };

  const paid = info ? info.paidCount : 0;
  const setPaid = (n) => onSave(room.id, { installment_paid: String(Math.max(n, 0)) });
  const hasManual = String(room.installment_paid ?? "").trim() !== "";
  const locked = Boolean(info && info.fromTable);

  return (
    <div className={`card ${styles.row}`}>
      <div className={styles.rowHead}>
        <h2>{room.name}</h2>
        {info ? (
          <span className={`${styles.badge} ${styles["b_" + info.status]}`}>{info.statusLabel}</span>
        ) : (
          <span className={`${styles.badge} ${styles.b_todo}`}>ยังไม่ได้กรอก</span>
        )}
      </div>

      {info && (
        <div className={styles.summary}>
          <div className={styles.nums}>
            <span>ยอดกู้ <b>{info.loan ? baht(info.loan) : "-"}</b></span>
            <span>ผ่อนไปแล้ว <b>{baht(info.paidAmount)}</b></span>
            {info.remainingAmount !== null && <span>คงเหลือ <b>{baht(info.remainingAmount)}</b></span>}
          </div>
          <div className={styles.bar}><div className={styles.fill} style={{ width: `${info.percent ?? 0}%` }} /></div>
          <div className={styles.foot}>
            <span>{info.paidCount}{info.total ? ` / ${info.total}` : ""} งวด{info.percent !== null ? ` · ${info.percent}%` : ""}</span>
            {info.fromTable ? <span>เงินต้น {baht(info.principalPaid)} · ดอกเบี้ย {baht(info.interestPaid)}</span> : info.endLabel && !info.done && <span>ผ่อนหมด {info.endLabel}</span>}
          </div>
        </div>
      )}

      <Schedule room={room} payments={payments} onAdd={onAdd} onBulk={onBulk} onUpdate={onUpdate} onDelete={onDelete} />

      <div className={styles.fields}>
        {FIELDS.map((f) => (
          <label key={f.key} className={styles.field}>
            <span>{f.label}</span>
            <input
              className="input-field"
              type={f.type}
              inputMode={f.inputMode}
              placeholder={f.ph}
              value={val(f.key)}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              onBlur={() => commit(f.key)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
          </label>
        ))}
      </div>

      <div className={styles.paidRow}>
        <div className={styles.paidLabel}>
          ผ่อนไปแล้ว (งวด)
          <small>{locked ? "นับจากตารางการผ่อนด้านบน" : hasManual ? "ตัวเลขที่กรอกเอง" : info && room.installment_start ? "คำนวณจากวันเริ่มผ่อน" : "ยังไม่ได้กรอก"}</small>
        </div>
        <div className={styles.stepper}>
          <button type="button" className={styles.step} onClick={() => setPaid(paid - 1)} disabled={!info || locked || paid <= 0} aria-label="ลดหนึ่งงวด">−</button>
          <input
            className={`input-field ${styles.paidInput}`}
            type="number"
            inputMode="numeric"
            min="0"
            disabled={locked}
            value={"paid" in draft ? draft.paid : paid}
            onChange={(e) => setDraft((d) => ({ ...d, paid: e.target.value }))}
            onBlur={() => {
              if (!("paid" in draft)) return;
              const n = parseInt(draft.paid, 10);
              setDraft((d) => { const { paid: _g, ...rest } = d; return rest; });
              if (Number.isFinite(n) && n !== paid) setPaid(n);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          />
          <button type="button" className={`${styles.step} ${styles.plus}`} onClick={() => setPaid(paid + 1)} disabled={!info || locked} aria-label="เพิ่มหนึ่งงวด">
            <Plus size={16} /> 1 งวด
          </button>
        </div>
      </div>
      {!info && <p className={styles.hint}>กรอกค่างวด/เดือน หรือยอดกู้ก่อน แล้วจะเห็นหลอดความคืบหน้า</p>}
    </div>
  );
}

export default function LoansPage() {
  const { rooms, updateRoom, isInitialLoading, loanPayments, addLoanPayment, addLoanPayments, updateLoanPayment, deleteLoanPayment } = useData();

  if (isInitialLoading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const list = [...(rooms || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
  const paymentsOf = (r) => (loanPayments || []).filter((p) => p.room === r.name);
  const infos = list.map((r) => installmentInfo(r, new Date(), paymentsOf(r))).filter(Boolean);
  const totalLoan = infos.reduce((s, i) => s + i.loan, 0);
  const totalPaid = infos.reduce((s, i) => s + i.paidAmount, 0);
  const monthly = infos.filter((i) => !i.done).reduce((s, i) => s + i.amount, 0);

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.head}>
        <h1 className="page-title">ผ่อนห้อง</h1>
        <Link href="/rooms" className="btn btn-outline">กลับหน้าห้องพัก</Link>
      </div>
      <p className={styles.intro}>กรอกแยกแต่ละห้อง ช่องไหนแก้แล้วกดออกจากช่อง ระบบบันทึกลง Google Sheet ให้อัตโนมัติ กด &quot;ตารางการผ่อน&quot; เพื่อดูหรือแก้รายเดือน</p>

      <div className={`card glass ${styles.totals}`}>
        <div><span>ยอดกู้รวม</span><strong>{baht(totalLoan)}</strong></div>
        <div><span>ผ่อนไปแล้วรวม</span><strong style={{ color: "var(--secondary)" }}>{baht(totalPaid)}</strong></div>
        <div><span>ค่างวดรวม/เดือน</span><strong>{baht(monthly)}</strong></div>
      </div>

      {list.length === 0 ? (
        <div className={`card ${styles.empty}`}>ยังไม่มีห้อง เพิ่มห้องที่หน้าห้องพักก่อน</div>
      ) : (
        <div className={styles.list}>
          {list.map((room) => (
            <LoanRow
              key={room.id}
              room={room}
              payments={paymentsOf(room)}
              onSave={updateRoom}
              onAdd={addLoanPayment}
              onBulk={addLoanPayments}
              onUpdate={updateLoanPayment}
              onDelete={deleteLoanPayment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
