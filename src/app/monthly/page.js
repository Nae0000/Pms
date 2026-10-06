"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, MessageCircle, CheckCircle2, Clock, AlertTriangle, History, X, Trash2, PlusCircle, CircleDot } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";
import { monthlyCommonFee } from "@/lib/fees";
import { installmentInfo } from "@/lib/installment";
import { isCounted } from "@/lib/finance";
import { num, isRentTx, keyOf, addMonths, labelOf, paidMap, trackingStart, arrearsFor, allocate, MONTHS_TH } from "@/lib/rent";

const DEFAULT_DUE_DAY = 5;
const ORDER = { overdue: 0, partial: 1, due: 2, paid: 3 };

const baht = (n) => `฿${Math.round(n).toLocaleString("en-US")}`;
const money = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Bottom sheet: record one payment. It can be a part-payment, the full month, an old debt or several months at once.
function PaySheet({ item, monthKey, supportsPeriod, onClose, onSave }) {
  const { room, rent, paid, arrears, map } = item;
  const remaining = Math.max(rent - paid, 0);
  const arrearsTotal = arrears.reduce((s, a) => s + a.remaining, 0);

  const [amount, setAmount] = useState(String(remaining || ""));
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [auto, setAuto] = useState(true);

  // where money goes, in order: older months still short -> this month -> the next months
  const targets = [];
  arrears.forEach((a) => targets.push({ key: a.key, remaining: a.remaining }));
  if (remaining > 0) targets.push({ key: monthKey, remaining });
  for (let i = 1; i <= 12; i++) {
    const k = addMonths(monthKey, i);
    targets.push({ key: k, remaining: Math.max(rent - (map[k]?.sum || 0), 0) });
  }

  const value = num(amount);
  const useAuto = auto && supportsPeriod;
  const plan = value > 0
    ? useAuto
      ? allocate(value, targets)
      : [{ key: monthKey, amount: value, closes: value >= remaining - 0.004, remainingAfter: Math.max(remaining - value, 0) }]
    : [];

  const chips = [];
  if (remaining > 0) chips.push([`จ่ายเต็มเดือนนี้ ${baht(remaining)}`, remaining]);
  if (supportsPeriod && arrearsTotal > 0) chips.push([`ยอดค้างทั้งหมด ${baht(arrearsTotal + remaining)}`, arrearsTotal + remaining]);
  if (remaining > 1) chips.push([`ครึ่งหนึ่ง ${baht(remaining / 2)}`, Math.round(remaining / 2)]);
  if (remaining <= 0 && rent > 0) chips.push([`ล่วงหน้า 1 เดือน ${baht(rent)}`, rent]);

  const submit = (e) => {
    e.preventDefault();
    if (!plan.length) return;
    const rows = plan.map((a) => ({
      date,
      description: `ค่าเช่า ${labelOf(a.key)} - ${room.name}${a.closes ? "" : " (บางส่วน)"}${note.trim() ? ` · ${note.trim()}` : ""}`,
      category: "Rent",
      type: "income",
      expense_type: "",
      amount: String(Math.round(a.amount * 100) / 100),
      status: "Paid",
      room: room.name,
      period: a.key,
    }));
    onSave(rows);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 600 }}>รับชำระ {room.name}</h2>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ค่าเช่า {baht(rent)}/เดือน · {labelOf(monthKey)}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className={styles.sheetBody}>
          <div className={styles.sheetStatus}>
            <div><span>จ่ายแล้ว</span><b>{baht(paid)}</b></div>
            <div><span>ค้างเดือนนี้</span><b style={{ color: remaining > 0 ? "var(--warning)" : "var(--secondary)" }}>{baht(remaining)}</b></div>
            {arrearsTotal > 0 && <div><span>ค้างยกมา</span><b style={{ color: "var(--danger)" }}>{baht(arrearsTotal)}</b></div>}
          </div>

          <label className={styles.sheetField}>
            <span>จำนวนเงินที่ได้รับ (บาท)</span>
            <input className="input-field" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="เช่น 2,000" />
          </label>

          {chips.length > 0 && (
            <div className={styles.chips}>
              {chips.map(([label, v]) => (
                <button type="button" key={label} className={styles.chip} onClick={() => setAmount(String(v))}>{label}</button>
              ))}
            </div>
          )}

          <div className={styles.sheetRow}>
            <label className={styles.sheetField}>
              <span>วันที่รับเงิน</span>
              <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className={styles.sheetField}>
              <span>หมายเหตุ (ถ้ามี)</span>
              <input className="input-field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น โอนเข้าบัญชี" />
            </label>
          </div>

          {supportsPeriod ? (
            <label className={styles.autoToggle}>
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              <span>ตัดยอดอัตโนมัติ: ค้างเก่าก่อน → เดือนนี้ → เดือนถัดไป</span>
            </label>
          ) : (
            <p className={styles.sheetNote}>บันทึกเข้าเดือนนี้เท่านั้น (ตัดยอดย้อนหลัง/ล่วงหน้าจะใช้ได้หลังอัปเดตสคริปต์ Google Sheet)</p>
          )}

          {plan.length > 0 && (
            <div className={styles.preview}>
              <div className={styles.previewTitle}>จะบันทึก {plan.length} รายการ รวม {baht(plan.reduce((s, a) => s + a.amount, 0))}</div>
              {plan.map((a) => (
                <div key={a.key} className={styles.previewRow}>
                  <span>{labelOf(a.key)}</span>
                  <b>{money(a.amount)}</b>
                  <em className={a.closes ? styles.okTxt : styles.warnTxt}>{a.closes ? "ปิดยอดงวดนี้" : `ยังค้าง ${baht(a.remainingAfter)}`}</em>
                </div>
              ))}
            </div>
          )}

          <p className={styles.sheetNote}>กดบันทึกแล้วยอดขึ้นหน้าจอทันที ระบบจะส่งเข้า Google Sheet ให้อัตโนมัติ (อาจใช้เวลาถึง ~30 วินาที) ไม่ต้องกดซ้ำ</p>

          <button className="btn btn-primary" type="submit" disabled={!plan.length} style={{ width: "100%", minHeight: 48 }}>
            {plan.length ? `บันทึกรับชำระ ${baht(plan.reduce((s, a) => s + a.amount, 0))}` : "กรอกจำนวนเงิน"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MonthlyPage() {
  const { rooms, tenants, transactions, addTransactions, deleteTransaction, isInitialLoading, loanPayments, features, unsyncedIds } = useData();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [filter, setFilter] = useState("all");
  const [sheetRoom, setSheetRoom] = useState(null); // room id
  const [openHistory, setOpenHistory] = useState({});

  if (isInitialLoading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const monthKey = keyOf(cursor.y, cursor.m);
  const today = todayStr();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const supportsPeriod = Boolean(features && features.period);
  const tracking = trackingStart(transactions);

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
      const map = paidMap(transactions, room.name);
      const cur = map[monthKey] || { sum: 0, rows: [] };
      const payments = [...cur.rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const paid = cur.sum;
      const arrears = arrearsFor({ rent, tenant, map, currentKey: monthKey, tracking });
      const arrearsTotal = arrears.reduce((s, a) => s + a.remaining, 0);
      const isPaid = rent > 0 ? paid >= rent - 0.5 : payments.length > 0;
      const status = isPaid ? "paid" : paid > 0 ? "partial" : today > dueDate ? "overdue" : "due";
      return { room, tenant, rent, dueDate, due, paid, payments, status, map, arrears, arrearsTotal, fee: monthlyCommonFee(room) };
    })
    .sort((a, b) => (ORDER[a.status] - ORDER[b.status]) ||
      a.dueDate.localeCompare(b.dueDate) ||
      (a.room.name || "").localeCompare(b.room.name || "", undefined, { numeric: true }));

  const expected = items.reduce((s, i) => s + i.rent, 0);
  const collected = items.reduce((s, i) => s + (i.rent > 0 ? Math.min(i.paid, i.rent) : i.paid), 0);
  const arrearsAll = items.reduce((s, i) => s + i.arrearsTotal, 0);
  // money that actually arrived in this calendar month, whichever month's rent it paid
  const cashIn = (transactions || [])
    .filter((t) => isRentTx(t) && isCounted(t) && String(t.date || "").startsWith(monthKey))
    .reduce((s, t) => s + num(t.amount), 0);
  // The owner pays common-area fees on every managed room, occupied or not.
  const feeTotal = (rooms || []).reduce((sum, r) => sum + monthlyCommonFee(r), 0);
  const instTotal = (rooms || []).map((r) => installmentInfo(r, new Date(), (loanPayments || []).filter((p) => p.room === r.name))).filter((i) => i && !i.done).reduce((sum, i) => sum + i.amount, 0);
  const net = collected - feeTotal - instTotal;
  const counts = {
    all: items.length,
    overdue: items.filter((i) => i.status === "overdue" || i.arrearsTotal > 0).length,
    partial: items.filter((i) => i.status === "partial").length,
    due: items.filter((i) => i.status === "due").length,
    paid: items.filter((i) => i.status === "paid").length,
  };
  const shown = filter === "all" ? items
    : filter === "overdue" ? items.filter((i) => i.status === "overdue" || i.arrearsTotal > 0)
    : items.filter((i) => i.status === filter);
  const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

  const removePayment = (room, t) => {
    if (confirm(`ลบรายการรับชำระ ${baht(num(t.amount))} (${t.date}) ของ ${room.name} ?`)) deleteTransaction(t.id);
  };

  const tabs = [
    ["all", "ทั้งหมด"],
    ["overdue", "ค้าง/เกินกำหนด"],
    ["partial", "จ่ายบางส่วน"],
    ["due", "รอจ่าย"],
    ["paid", "จ่ายแล้ว"],
  ];

  const sheetItem = sheetRoom ? items.find((i) => i.room.id === sheetRoom) : null;

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
            <div className={styles.sLabel}>เก็บแล้ว (ค่าเช่างวดเดือนนี้)</div>
            <div className={styles.sBig}>{baht(collected)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className={styles.sLabel}>เป้าหมาย</div>
            <div className={styles.sMid}>{baht(expected)}</div>
          </div>
        </div>
        <div className={styles.bar} aria-label={`เก็บแล้ว ${pct}%`}><div className={styles.barFill} style={{ width: `${pct}%` }} /></div>
        <div className={styles.sFoot}>
          <span>ค้างเดือนนี้ {baht(Math.max(expected - collected, 0))}</span>
          <span>{counts.paid}/{counts.all} ห้องจ่ายครบ</span>
        </div>
        {(arrearsAll > 0 || cashIn !== collected) && (
          <div className={styles.feeBox}>
            {arrearsAll > 0 && <div className={styles.feeRow}><span>ยอดค้างยกมาจากเดือนก่อน</span><span style={{ color: "var(--danger)" }}>{baht(arrearsAll)}</span></div>}
            <div className={styles.feeRow}><span>เงินเข้าจริงในเดือนนี้ (ทุกงวด)</span><span>{baht(cashIn)}</span></div>
          </div>
        )}
        {(feeTotal > 0 || instTotal > 0) && (
          <div className={styles.feeBox}>
            {feeTotal > 0 && <div className={styles.feeRow}><span>ค่าส่วนกลาง (เฉลี่ย/เดือน)</span><span>−{baht(feeTotal)}</span></div>}
            {instTotal > 0 && <div className={styles.feeRow}><span>ค่างวดผ่อนห้อง/เดือน</span><span>−{baht(instTotal)}</span></div>}
            <div className={`${styles.feeRow} ${styles.feeNet}`}>
              <span>เหลือหลังหักค่าใช้จ่าย</span>
              <span style={{ color: net >= 0 ? "var(--secondary)" : "var(--danger)" }}>{net < 0 ? "−" : ""}{baht(Math.abs(net))}</span>
            </div>
          </div>
        )}
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
            const remaining = Math.max(it.rent - it.paid, 0);
            const cls = it.status === "partial" ? (today > it.dueDate ? "st_overdue" : "st_partial") : "st_" + it.status;
            const showHistory = openHistory[it.room.id];
            return (
              <div key={it.room.id} className={`card ${styles.item} ${styles[cls]}`}>
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
                  {it.status === "paid" && <span className="badge badge-success"><CheckCircle2 size={13} /> จ่ายครบแล้ว</span>}
                  {it.status === "partial" && <span className="badge badge-warning"><CircleDot size={13} /> จ่ายบางส่วน</span>}
                  {it.status === "due" && <span className="badge badge-warning"><Clock size={13} /> ครบกำหนด {it.due} {MONTHS_TH[cursor.m]}</span>}
                  {(it.status === "overdue" || (it.status === "partial" && today > it.dueDate)) && <span className="badge badge-danger"><AlertTriangle size={13} /> เกินกำหนด (วันที่ {it.due})</span>}
                  {it.payments.some((p) => unsyncedIds.includes(p.id)) && <span className="badge badge-warning">กำลังบันทึกลง Sheet…</span>}
                  {contractEnd && <span className={styles.contract}>สัญญาถึง {contractEnd}</span>}
                  {it.fee > 0 && <span className={styles.contract}>ค่าส่วนกลางเฉลี่ย {baht(it.fee)}/เดือน</span>}
                </div>

                {it.paid > 0 && it.rent > 0 && (
                  <div className={styles.partialBox}>
                    <div className={styles.partialNums}>
                      <span>จ่ายแล้ว <b>{baht(it.paid)}</b> จาก {baht(it.rent)}</span>
                      {remaining > 0 ? <span className={styles.warnTxt}>ค้าง <b>{baht(remaining)}</b></span> : it.paid > it.rent + 0.5 ? <span className={styles.okTxt}>จ่ายเกิน {baht(it.paid - it.rent)}</span> : null}
                    </div>
                    <div className={styles.miniBar}><div className={styles.miniFill} style={{ width: `${Math.min(100, Math.round((it.paid / it.rent) * 100))}%` }} /></div>
                  </div>
                )}

                {it.arrearsTotal > 0 && (
                  <div className={styles.arrears}>
                    <AlertTriangle size={14} /> ค้างยกมา <b>{baht(it.arrearsTotal)}</b>
                    <span> ({it.arrears.map((a) => labelOf(a.key, true)).join(", ")})</span>
                  </div>
                )}

                <div className={styles.actions}>
                  {t?.phone && <a className={styles.act} href={`tel:${String(t.phone).replace(/[^\d+]/g, "")}`}><Phone size={16} /> โทร</a>}
                  {lineId && <a className={styles.act} href={`https://line.me/R/ti/p/~${encodeURIComponent(lineId)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> LINE</a>}
                  <span style={{ flex: 1 }} />
                  {it.payments.length > 0 && (
                    <button className={styles.undo} onClick={() => setOpenHistory((o) => ({ ...o, [it.room.id]: !o[it.room.id] }))} aria-expanded={Boolean(showHistory)}>
                      <History size={16} /> {it.payments.length}
                    </button>
                  )}
                  {it.status === "paid" && it.arrearsTotal === 0 ? (
                    <button className={styles.undo} onClick={() => setSheetRoom(it.room.id)}><PlusCircle size={16} /> รับเพิ่ม</button>
                  ) : (
                    <button className={styles.pay} onClick={() => setSheetRoom(it.room.id)}><CheckCircle2 size={18} /> รับชำระ</button>
                  )}
                </div>

                {showHistory && (
                  <div className={styles.history}>
                    {it.payments.map((p) => (
                      <div key={p.id} className={styles.historyRow}>
                        <span>{p.date}</span>
                        <b>{baht(num(p.amount))}</b>
                        {unsyncedIds.includes(p.id) ? <em className={styles.sending}>กำลังบันทึกลง Sheet…</em> : (
                        <button type="button" className={styles.histDel} onClick={() => removePayment(it.room, p)} aria-label="ลบรายการนี้"><Trash2 size={15} /></button>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sheetItem && (
        <PaySheet
          key={sheetItem.room.id}
          item={sheetItem}
          monthKey={monthKey}
          supportsPeriod={supportsPeriod}
          onClose={() => setSheetRoom(null)}
          onSave={addTransactions}
        />
      )}
    </div>
  );
}
