"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, MessageCircle, CheckCircle2, Clock, AlertTriangle, Undo2 } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

const DEFAULT_DUE_DAY = 5;
const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const ORDER = { overdue: 0, due: 1, paid: 2 };

const num = (v) => parseFloat(String(v ?? "").replace(/,/g, "")) || 0;
const baht = (n) => `฿${Math.round(n).toLocaleString("en-US")}`;
const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const isRent = (t) => t.type === "income" && /^(rent|ค่าเช่า)/i.test(t.category || "");

export default function MonthlyPage() {
  const { rooms, tenants, transactions, addTransaction, updateTransaction, isInitialLoading } = useData();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [filter, setFilter] = useState("all");

  if (isInitialLoading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const monthKey = `${cursor.y}-${pad(cursor.m + 1)}`;
  const today = todayStr();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();

  const shift = (delta) => setCursor(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const items = (rooms || [])
    .filter((r) => r.status === "occupied" && r.tenant && r.tenant !== "-")
    .map((room) => {
      const tenant = (tenants || []).find((t) => t.name === room.tenant);
      const rent = num(room.price);
      const due = Math.min(Math.max(parseInt(tenant?.due_day, 10) || DEFAULT_DUE_DAY, 1), daysInMonth);
      const dueDate = `${monthKey}-${pad(due)}`;
      const payments = (transactions || []).filter(
        (t) => isRent(t) && t.room === room.name && String(t.date || "").startsWith(monthKey) && t.status === "Paid"
      );
      const paid = payments.reduce((s, t) => s + num(t.amount), 0);
      const isPaid = rent > 0 ? paid >= rent : payments.length > 0;
      const status = isPaid ? "paid" : today > dueDate ? "overdue" : "due";
      return { room, tenant, rent, dueDate, due, paid, payments, status };
    })
    .sort((a, b) => (ORDER[a.status] - ORDER[b.status]) ||
      a.dueDate.localeCompare(b.dueDate) ||
      (a.room.name || "").localeCompare(b.room.name || "", undefined, { numeric: true }));

  const expected = items.reduce((s, i) => s + i.rent, 0);
  const collected = items.reduce((s, i) => s + (i.rent > 0 ? Math.min(i.paid, i.rent) : i.paid), 0);
  const counts = {
    all: items.length,
    overdue: items.filter((i) => i.status === "overdue").length,
    due: items.filter((i) => i.status === "due").length,
    paid: items.filter((i) => i.status === "paid").length,
  };
  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);
  const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

  const markPaid = (it) => {
    const remaining = it.rent - it.paid;
    addTransaction({
      date: today,
      description: `ค่าเช่า ${MONTHS_TH[cursor.m]} ${cursor.y + 543} - ${it.room.name}`,
      category: "Rent",
      type: "income",
      expense_type: "",
      amount: String(remaining > 0 ? remaining : it.rent),
      status: "Paid",
      room: it.room.name,
    });
  };

  const undo = (it) => {
    const last = it.payments[it.payments.length - 1];
    if (last && confirm(`ยกเลิกรายการรับชำระ ${baht(num(last.amount))} ของ ${it.room.name} ?`)) {
      updateTransaction(last.id, { status: "Cancelled" });
    }
  };

  const tabs = [
    ["all", "ทั้งหมด"],
    ["overdue", "เกินกำหนด"],
    ["due", "รอจ่าย"],
    ["paid", "จ่ายแล้ว"],
  ];

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">ค่าเช่ารายเดือน</h1>

      <div className={styles.monthBar}>
        <button className={styles.navBtn} onClick={() => shift(-1)} aria-label="เดือนก่อน"><ChevronLeft size={22} /></button>
        <div className={styles.monthLabel}>{MONTHS_TH[cursor.m]} {cursor.y + 543}</div>
        <button className={styles.navBtn} onClick={() => shift(1)} aria-label="เดือนถัดไป"><ChevronRight size={22} /></button>
      </div>

      <div className={`card glass ${styles.summary}`}>
        <div className={styles.summaryTop}>
          <div>
            <div className={styles.sLabel}>เก็บแล้ว</div>
            <div className={styles.sBig}>{baht(collected)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className={styles.sLabel}>เป้าหมาย</div>
            <div className={styles.sMid}>{baht(expected)}</div>
          </div>
        </div>
        <div className={styles.bar} aria-label={`เก็บแล้ว ${pct}%`}><div className={styles.barFill} style={{ width: `${pct}%` }} /></div>
        <div className={styles.sFoot}>
          <span>ค้าง {baht(Math.max(expected - collected, 0))}</span>
          <span>{counts.paid}/{counts.all} ห้องจ่ายแล้ว</span>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={filter === key}
            className={`${styles.tab} ${filter === key ? styles.tabActive : ""}`} onClick={() => setFilter(key)}>
            {label} <span className={styles.tabCount}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          {items.length === 0 ? "ยังไม่มีห้องที่มีผู้เช่า (ตั้งสถานะห้องเป็น occupied และใส่ชื่อผู้เช่าใน Sheet หรือหน้าห้องพัก)" : "ไม่มีรายการในหมวดนี้"}
        </div>
      ) : (
        <div className={styles.list}>
          {shown.map((it) => {
            const t = it.tenant;
            const contact = (t?.socialContact || "").trim();
            const lineMatch = contact.match(/line\s*(?:id)?\s*[:：]?\s*@?\s*([\w.\-]+)/i);
            const lineId = lineMatch ? lineMatch[1] : "";
            const contractEnd = t?.contractEnd || "";
            return (
              <div key={it.room.id} className={`card ${styles.item} ${styles["st_" + it.status]}`}>
                <div className={styles.itemTop}>
                  <div className={styles.itemMain}>
                    <div className={styles.roomName}>{it.room.name}</div>
                    <div className={styles.tenantName}>
                      {t?.name || it.room.tenant}{t?.nickname ? ` (${t.nickname})` : ""}
                    </div>
                  </div>
                  <div className={styles.amount}>{baht(it.rent)}</div>
                </div>

                <div className={styles.itemMid}>
                  {it.status === "paid" && <span className="badge badge-success"><CheckCircle2 size={13} /> จ่ายแล้ว</span>}
                  {it.status === "due" && <span className="badge badge-warning"><Clock size={13} /> ครบกำหนด {it.due} {MONTHS_TH[cursor.m]}</span>}
                  {it.status === "overdue" && <span className="badge badge-danger"><AlertTriangle size={13} /> เกินกำหนด (วันที่ {it.due})</span>}
                  {it.paid > 0 && it.status !== "paid" && <span className={styles.partial}>จ่ายแล้ว {baht(it.paid)}</span>}
                  {contractEnd && <span className={styles.contract}>สัญญาถึง {contractEnd}</span>}
                </div>

                <div className={styles.actions}>
                  {t?.phone && <a className={styles.act} href={`tel:${String(t.phone).replace(/[^\d+]/g, "")}`}><Phone size={16} /> โทร</a>}
                  {lineId && <a className={styles.act} href={`https://line.me/R/ti/p/~${encodeURIComponent(lineId)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> LINE</a>}
                  <span style={{ flex: 1 }} />
                  {it.status === "paid" ? (
                    <button className={styles.undo} onClick={() => undo(it)}><Undo2 size={16} /> ยกเลิก</button>
                  ) : (
                    <button className={styles.pay} onClick={() => markPaid(it)}><CheckCircle2 size={18} /> รับชำระ</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
