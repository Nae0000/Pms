"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RefreshCw, Table2, AlertTriangle, CheckCircle2, Loader2, ListChecks } from "lucide-react";
import { healthCheck } from "@/lib/links";
import { useData } from "@/app/context/DataContext";
import { SHEET_URL } from "@/lib/sheetsApi";
import styles from "./StatusBar.module.css";

export default function StatusBar() {
  const { loadError, saveError, setSaveError, saving, isInitialLoading, refresh, rooms, tenants, transactions, isRefreshing, syncing } = useData();
  const issueCount = useMemo(() => healthCheck({ rooms, tenants, transactions }).filter((i) => i.level !== "todo").length, [rooms, tenants, transactions]);

  let tone = "ok";
  let icon = <CheckCircle2 size={16} />;
  let text = "ซิงค์กับ Google Sheet แล้ว";

  if (loadError === "NOT_CONFIGURED") {
    tone = "warn";
    icon = <AlertTriangle size={16} />;
    text = "ยังไม่ได้เชื่อมต่อ Google Sheet (ดู google-apps-script/README.md)";
  } else if (loadError) {
    tone = "error";
    icon = <AlertTriangle size={16} />;
    text = `โหลดข้อมูลไม่สำเร็จ: ${loadError}`;
  } else if (saveError) {
    tone = "error";
    icon = <AlertTriangle size={16} />;
    text = `ไม่ได้รับคำยืนยันการบันทึก (${saveError}) โหลดข้อมูลล่าสุดให้แล้ว ตรวจดูอีกครั้ง`;
  } else if (saving || isInitialLoading || isRefreshing || syncing) {
    tone = "busy";
    icon = <Loader2 size={16} className={styles.spin} />;
    text = saving ? "กำลังบันทึก..." : isInitialLoading ? "กำลังโหลดข้อมูล..." : syncing ? "กำลังดึงข้อมูลลูกค้าจากแบบสอบถาม..." : "กำลังอัปเดตข้อมูลล่าสุด...";
  }

  return (
    <div className={`${styles.bar} ${styles[tone]}`} role="status">
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>{text}</span>
      {issueCount > 0 && !loadError && !isInitialLoading && !isRefreshing && (
        <Link className={styles.issue} href="/check" title="ข้อมูลที่ซ้ำหรือไม่ตรงกัน">
          <ListChecks size={15} /> {issueCount}
        </Link>
      )}
      {saveError && (
        <button className={styles.btn} onClick={() => setSaveError("")}>ปิด</button>
      )}
      {SHEET_URL && (
        <a className={styles.btn} href={SHEET_URL} target="_blank" rel="noopener noreferrer" title="เปิด Google Sheet">
          <Table2 size={16} />
        </a>
      )}
      <button className={styles.btn} onClick={refresh} disabled={isInitialLoading} title="โหลดข้อมูลใหม่" aria-label="โหลดข้อมูลใหม่">
        <RefreshCw size={16} />
      </button>
    </div>
  );
}
