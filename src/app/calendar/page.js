"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, ChevronLeft, ChevronRight, X, User, Phone, Briefcase, ExternalLink } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

export default function CalendarPage() {
  const rightPanelRef = useRef(null);
  const leftPanelBodyRef = useRef(null);
  const router = useRouter();
  const { rooms, tenants } = useData();
  const [selectedTenant, setSelectedTenant] = useState(null);

  const handleTenantClick = (tenantName) => {
    const t = tenants?.find(t => t.name === tenantName);
    if (t) setSelectedTenant(t);
  };

  // Sync scroll between left panel (Y) and right panel (Y/X)
  const handleScroll = () => {
    if (leftPanelBodyRef.current && rightPanelRef.current) {
      leftPanelBodyRef.current.scrollTop = rightPanelRef.current.scrollTop;
    }
  };

  const dates = Array.from({ length: 31 }, (_, i) => i + 1); // Mock 1-31 days

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.calendarContainer}>
        {/* Toolbar */}
        <div className={styles.calendarToolbar}>
          <h2>ตารางการจอง (Booking Calendar)</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
              <ChevronRight size={16} />
            </button>
            <button className="btn btn-outline" title="Fullscreen" style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem' }}>
              <Maximize2 size={16} />
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
                <div className={styles.monthCell} style={{ width: `${50 * 31}px` }}>เมษายน 2026 (April 2026)</div>
              </div>
              <div className={styles.dateRow}>
                {dates.map((d) => (
                  <div key={d} className={`${styles.dateCell} ${d % 7 === 0 || d % 7 === 6 ? styles.weekend : ''}`}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.gridBody}>
              {rooms.map((room) => (
                <div key={room.id} className={styles.gridRow}>
                  {dates.map((d, colIndex) => (
                    <div key={colIndex} className={`${styles.gridCell} ${d % 7 === 0 || d % 7 === 6 ? styles.weekend : ''}`}>
                      {/* Show Vacant text on empty cells if the room is available globally */}
                      {room.status === 'available' && <span className={styles.vacantText}>ว่าง (Vacant)</span>}
                    </div>
                  ))}
                  
                  {/* Dynamic Bookings based on room status */}
                  {room.status === 'occupied' && (
                    <div 
                      className={`${styles.bookingBar} ${styles['status-occupied']}`} 
                      style={{ left: '100px', width: '400px', cursor: 'pointer' }}
                      onClick={() => handleTenantClick(room.tenant)}
                    >
                      ผู้เช่า (Guest): {room.tenant}
                    </div>
                  )}
                  {room.status === 'maintenance' && (
                    <div className={`${styles.bookingBar} ${styles['status-maintenance']}`} style={{ left: '50px', width: '250px' }}>
                      ซ่อมบำรุง (Maintenance)
                    </div>
                  )}
                </div>
              ))}
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
                  {selectedTenant.nickname && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>"{selectedTenant.nickname}"</span>}
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
