"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, User, Phone, Briefcase, ExternalLink } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";
import { findTenant, isBlank } from "@/lib/links";

const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const CELL = 50; // px per day, matches .gridCell
const parseDate = (v) => {
  const m = String(v || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

export default function CalendarPage() {
  const rightPanelRef = useRef(null);
  const leftPanelBodyRef = useRef(null);
  const router = useRouter();
  const { rooms, tenants } = useData();
  const [selectedTenant, setSelectedTenant] = useState(null);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const shift = (delta) => setCursor(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const handleTenantClick = (tenantName) => {
    const t = findTenant(tenants, tenantName);
    if (t) setSelectedTenant(t);
  };

  // Sync scroll between left panel (Y) and right panel (Y/X)
  const handleScroll = () => {
    if (leftPanelBodyRef.current && rightPanelRef.current) {
      leftPanelBodyRef.current.scrollTop = rightPanelRef.current.scrollTop;
    }
  };

  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthStart = new Date(cursor.y, cursor.m, 1);
  const monthEnd = new Date(cursor.y, cursor.m, daysInMonth);
  const today = new Date();
  const todayDay = today.getFullYear() === cursor.y && today.getMonth() === cursor.m ? today.getDate() : null;
  const dow = (d) => new Date(cursor.y, cursor.m, d).getDay();
  const isWeekend = (d) => dow(d) === 0 || dow(d) === 6;

  // A tenant's stay, clipped to the month shown. No dates in the sheet = the whole month.
  const stayFor = (room) => {
    const t = findTenant(tenants, room.tenant);
    const start = parseDate(t?.start_date) || monthStart;
    const contractEnd = parseDate(t?.contractEnd);
    const movedOut = parseDate(t?.move_out_date);
    const end = (movedOut && (!contractEnd || movedOut < contractEnd) ? movedOut : contractEnd) || monthEnd;
    const from = start > monthStart ? start : monthStart;
    const to = end < monthEnd ? end : monthEnd;
    if (from > to) return null; // contract not running in this month
    return { startDay: from.getDate(), endDay: to.getDate(), tenant: t };
  };

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.calendarContainer}>
        {/* Toolbar */}
        <div className={styles.calendarToolbar}>
          <h2>ตารางห้อง</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-outline" aria-label="เดือนก่อน" style={{ padding: '0.25rem 0.5rem' }} onClick={() => shift(-1)}>
              <ChevronLeft size={16} />
            </button>
            <strong style={{ minWidth: '9rem', textAlign: 'center' }}>{MONTHS_TH[cursor.m]} {cursor.y + 543}</strong>
            <button className="btn btn-outline" aria-label="เดือนถัดไป" style={{ padding: '0.25rem 0.5rem' }} onClick={() => shift(1)}>
              <ChevronRight size={16} />
            </button>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }} onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}>
              วันนี้
            </button>
          </div>
        </div>

        {/* Scheduler Main */}
        <div className={styles.schedulerWrapper}>
          
          {/* Left Panel (Rooms) */}
          <div className={styles.leftPanel}>
            <div className={styles.leftHeader}>
              รายชื่อห้อง (Room Name)
            </div>
            <div className={styles.leftBody} ref={leftPanelBodyRef}>
              {rooms.map((room) => (
                <div key={room.id} className={styles.roomRow}>{room.name || `Room ${room.id}`}</div>
              ))}
            </div>
          </div>

          {/* Right Panel (Timeline) */}
          <div className={styles.rightPanel} ref={rightPanelRef} onScroll={handleScroll}>
            <div className={styles.rightHeader}>
              <div className={styles.monthRow}>
                <div className={styles.monthCell} style={{ width: `${CELL * daysInMonth}px` }}>{MONTHS_TH[cursor.m]} {cursor.y + 543}</div>
              </div>
              <div className={styles.dateRow}>
                {dates.map((d) => (
                  <div key={d} className={`${styles.dateCell} ${isWeekend(d) ? styles.weekend : ''}`} style={d === todayDay ? { color: 'var(--primary)', fontWeight: 700 } : undefined}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.gridBody}>
              {rooms.length === 0 && <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>ยังไม่มีห้อง</div>}
              {rooms.map((room) => {
                const stay = room.status === 'occupied' ? stayFor(room) : null;
                return (
                  <div key={room.id} className={styles.gridRow}>
                    {dates.map((d) => (
                      <div
                        key={d}
                        className={`${styles.gridCell} ${isWeekend(d) ? styles.weekend : ''}`}
                        style={d === todayDay ? { background: 'rgba(79, 70, 229, 0.12)' } : undefined}
                      >
                        {room.status === 'available' && d === 1 && <span className={styles.vacantText}>ว่าง</span>}
                      </div>
                    ))}

                    {stay && (
                      <div
                        className={`${styles.bookingBar} ${styles['status-occupied']}`}
                        style={{ left: `${(stay.startDay - 1) * CELL}px`, width: `${(stay.endDay - stay.startDay + 1) * CELL}px` }}
                        onClick={() => handleTenantClick(room.tenant)}
                      >
                        {isBlank(room.tenant) ? 'ไม่ระบุผู้เช่า' : room.tenant}
                      </div>
                    )}
                    {room.status === 'occupied' && !stay && (
                      <div className={styles.vacantText} style={{ position: 'absolute', left: 8, top: 10 }}>สัญญาไม่อยู่ในเดือนนี้</div>
                    )}
                    {room.status === 'reserved' && (
                      <div className={styles.bookingBar} style={{ left: 0, width: `${CELL * daysInMonth}px`, background: 'var(--warning)' }}>
                        จอง
                      </div>
                    )}
                    {room.status === 'maintenance' && (
                      <div className={`${styles.bookingBar} ${styles['status-maintenance']}`} style={{ left: 0, width: `${CELL * daysInMonth}px` }}>
                        ซ่อมบำรุง
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Tenant Quick View Modal */}
      {selectedTenant && (
        <div className="modal-overlay" onClick={() => setSelectedTenant(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {(selectedTenant.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{selectedTenant.name}</h3>
                  {selectedTenant.nickname && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&quot;{selectedTenant.nickname}&quot;</span>}
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
                <User size={18} style={{ color: 'var(--primary)' }} />
                <span><strong>ห้อง (Room):</strong> {selectedTenant.room || "-"}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
                <Phone size={18} style={{ color: 'var(--primary)' }} />
                <span><strong>ติดต่อ (Phone):</strong> {selectedTenant.phone || "-"}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
                <Briefcase size={18} style={{ color: 'var(--primary)' }} />
                <span><strong>อาชีพ (Job):</strong> {selectedTenant.occupation || "-"}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => {
                setSelectedTenant(null);
                router.push(`/tenants?search=${encodeURIComponent(selectedTenant.name)}`);
              }}
            >
              <ExternalLink size={18} />
              ดูรายละเอียดทั้งหมด / แก้ไข (View & Edit)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
