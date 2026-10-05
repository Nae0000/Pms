"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";
import { installmentInfo } from "@/lib/installment";

const baht = (n) => `฿${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

const FIELDS = [
  { key: "loan_amount", label: "ยอดกู้ (บาท)", type: "text", inputMode: "numeric", ph: "เช่น 1,200,000" },
  { key: "installment", label: "ค่างวด/เดือน", type: "text", inputMode: "numeric", ph: "เช่น 8,000" },
  { key: "installment_months", label: "ผ่อนทั้งหมด (งวด)", type: "number", inputMode: "numeric", ph: "เช่น 120" },
  { key: "installment_start", label: "เริ่มผ่อน", type: "date" },
];

// One row per room. Every box saves as soon as you leave it.
function LoanRow({ room, onSave }) {
  const info = installmentInfo(room);
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
            {info.endLabel && !info.done && <span>ผ่อนหมด {info.endLabel}</span>}
          </div>
        </div>
      )}

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
          <small>{hasManual ? "ตัวเลขที่กรอกเอง" : info && room.installment_start ? "คำนวณจากวันเริ่มผ่อน" : "ยังไม่ได้กรอก"}</small>
        </div>
        <div className={styles.stepper}>
          <button type="button" className={styles.step} onClick={() => setPaid(paid - 1)} disabled={!info || paid <= 0} aria-label="ลดหนึ่งงวด">−</button>
          <input
            className={`input-field ${styles.paidInput}`}
            type="number"
            inputMode="numeric"
            min="0"
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
          <button type="button" className={`${styles.step} ${styles.plus}`} onClick={() => setPaid(paid + 1)} disabled={!info} aria-label="เพิ่มหนึ่งงวด">
            <Plus size={16} /> 1 งวด
          </button>
        </div>
      </div>
      {!info && <p className={styles.hint}>กรอกค่างวด/เดือน หรือยอดกู้ก่อน แล้วจะเห็นหลอดความคืบหน้า</p>}
    </div>
  );
}

export default function LoansPage() {
  const { rooms, updateRoom, isInitialLoading } = useData();

  if (isInitialLoading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const list = [...(rooms || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
  const infos = list.map((r) => installmentInfo(r)).filter(Boolean);
  const totalLoan = infos.reduce((s, i) => s + i.loan, 0);
  const totalPaid = infos.reduce((s, i) => s + i.paidAmount, 0);
  const monthly = infos.filter((i) => !i.done).reduce((s, i) => s + i.amount, 0);

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.head}>
        <h1 className="page-title">ผ่อนห้อง</h1>
        <Link href="/rooms" className="btn btn-outline">กลับหน้าห้องพัก</Link>
      </div>
      <p className={styles.intro}>กรอกแยกแต่ละห้อง ช่องไหนแก้แล้วกดออกจากช่อง ระบบบันทึกลง Google Sheet ให้อัตโนมัติ</p>

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
            <LoanRow key={room.id} room={room} onSave={updateRoom} />
          ))}
        </div>
      )}
    </div>
  );
}
