"use client";

import { RefreshCw, Table2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useData } from "@/app/context/DataContext";
import { SHEET_URL } from "@/lib/sheetsApi";
import styles from "./StatusBar.module.css";

export default function StatusBar() {
  const { loadError, saveError, setSaveError, saving, isInitialLoading, refresh } = useData();

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
    text = `บันทึกไม่สำเร็จ: ${saveError}`;
  } else if (saving || isInitialLoading) {
    tone = "busy";
    icon = <Loader2 size={16} className={styles.spin} />;
    text = saving ? "กำลังบันทึก..." : "กำลังโหลดข้อมูล...";
  }

  return (
    <div className={`${styles.bar} ${styles[tone]}`} role="status">
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>{text}</span>
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
