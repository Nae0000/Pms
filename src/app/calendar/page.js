"use client";

import React, { useRef } from "react";
import { Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

export default function CalendarPage() {
  const rightPanelRef = useRef(null);
  const leftPanelBodyRef = useRef(null);
  const { rooms } = useData();

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
                    <div className={`${styles.bookingBar} ${styles['status-occupied']}`} style={{ left: '100px', width: '400px' }}>
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
    </div>
  );
}
