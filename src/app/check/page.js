"use client";
import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Wrench, ExternalLink } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";
import { healthCheck, mergeOps } from "@/lib/links";
import { SHEET_URL } from "@/lib/sheetsApi";

export default function CheckPage() {
  const { rooms, tenants, transactions, applyFixes, saving, isInitialLoading, isRefreshing, loadError } = useData();

  const issues = useMemo(() => healthCheck({ rooms, tenants, transactions }), [rooms, tenants, transactions]);
  const fixable = issues.filter((i) => i.level === "fix");
  const manual = issues.filter((i) => i.level === "warn");

  if (isInitialLoading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const fixAll = () => applyFixes(mergeOps(fixable.flatMap((i) => i.ops || [])));

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">ตรวจสอบข้อมูล</h1>
      <p className={styles.intro}>
        ห้อง ผู้เช่า และรายการเงินอ้างอิงกันด้วย <strong>ชื่อ</strong> หน้านี้ตรวจว่าข้อมูลซ้ำหรือไม่ตรงกันตรงไหน
      </p>

      <div className={`card glass ${styles.summary}`}>
        <div><strong>{rooms.length}</strong><span>ห้อง</span></div>
        <div><strong>{tenants.length}</strong><span>ผู้เช่า</span></div>
        <div><strong>{transactions.length}</strong><span>รายการเงิน</span></div>
        <div className={issues.length ? styles.bad : styles.good}><strong>{issues.length}</strong><span>จุดที่ต้องดู</span></div>
      </div>

      {loadError && loadError !== "NOT_CONFIGURED" && (
        <div className={`card ${styles.item} ${styles.warn}`}>โหลดข้อมูลไม่สำเร็จ ผลตรวจอาจไม่ครบ: {loadError}</div>
      )}

      {issues.length === 0 && !loadError && (
        <div className={`card ${styles.ok}`}>
          <CheckCircle2 size={28} />
          <div>
            <strong>ข้อมูลตรงกันทั้งหมด</strong>
            <p>ไม่พบชื่อซ้ำ และห้อง/ผู้เช่า/รายการเงินเชื่อมกันถูกต้อง</p>
          </div>
        </div>
      )}

      {fixable.length > 0 && (
        <section>
          <div className={styles.sectionHead}>
            <h2><Wrench size={18} /> แก้ให้ตรงกันได้เลย ({fixable.length})</h2>
            <button className="btn btn-primary" onClick={fixAll} disabled={saving || isRefreshing}>
              {saving ? "กำลังบันทึก..." : "เชื่อมข้อมูลทั้งหมด"}
            </button>
          </div>
          <div className={styles.list}>
            {fixable.map((i) => (
              <div key={i.id} className={`card ${styles.item} ${styles.fix}`}>
                <div className={styles.title}>{i.title}</div>
                <div className={styles.detail}>{i.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {manual.length > 0 && (
        <section>
          <div className={styles.sectionHead}>
            <h2><AlertTriangle size={18} /> ต้องตัดสินใจเอง ({manual.length})</h2>
            {SHEET_URL && (
              <a className="btn btn-outline" href={SHEET_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} /> เปิด Sheet
              </a>
            )}
          </div>
          <div className={styles.list}>
            {manual.map((i) => (
              <div key={i.id} className={`card ${styles.item} ${styles.warn}`}>
                <div className={styles.title}>{i.title}</div>
                <div className={styles.detail}>{i.detail}</div>
              </div>
            ))}
          </div>
          <p className={styles.hint}>
            แก้ได้ที่ <Link href="/rooms">ห้องพัก</Link> / <Link href="/tenants">ผู้เช่า</Link> หรือแก้ใน Google Sheet แล้วกลับมาที่หน้านี้ (ข้อมูลโหลดใหม่อัตโนมัติ)
          </p>
        </section>
      )}
    </div>
  );
}
