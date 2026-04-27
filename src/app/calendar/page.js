"use client";

import React, { useRef, useEffect } from "react";
import { Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./page.module.css";

export default function CalendarPage() {
  const rightPanelRef = useRef(null);
  const leftPanelBodyRef = useRef(null);

  // Sync scroll between left panel (Y) and right panel (Y/X)
  const handleScroll = () => {
    if (leftPanelBodyRef.current && rightPanelRef.current) {
      leftPanelBodyRef.current.scrollTop = rightPanelRef.current.scrollTop;
    }
  };

  const rooms = [
    "A-1. AniYuki",
    "B-5. Guest House",
    "B-6. TOMA HOUSE",
    "FRONTIER VILLAGE@1",
    "FRONTIER VILLAGE@2",
    "FRONTIER VILLAGE@3",
    "HB-1. Miyata",
    "HB-2. Miyata",
    "HR-1. Y51@Y51",
    "INN BETWEEN WAVES@101",
    "INN BETWEEN WAVES@102",
    "INN BETWEEN WAVES@103",
    "IZ.-1. Oyado Nikoni",
  ];

  const dates = Array.from({ length: 31 }, (_, i) => i + 1); // Mock 1-31 days

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.calendarContainer}>
        {/* Toolbar */}
        <div className={styles.calendarToolbar}>
          <h2>Booking Calendar (予約カレンダー)</h2>
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
              Room Name (物件名)
            </div>
            <div className={styles.leftBody} ref={leftPanelBodyRef}>
              {rooms.map((room, i) => (
                <div key={i} className={styles.roomRow}>{room}</div>
              ))}
            </div>
          </div>

          {/* Right Panel (Timeline) */}
          <div className={styles.rightPanel} ref={rightPanelRef} onScroll={handleScroll}>
            <div className={styles.rightHeader}>
              <div className={styles.monthRow}>
                <div className={styles.monthCell} style={{ width: `${50 * 31}px` }}>April 2026 (4月 2026)</div>
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
              {rooms.map((room, rowIndex) => (
                <div key={rowIndex} className={styles.gridRow}>
                  {dates.map((d, colIndex) => (
                    <div key={colIndex} className={`${styles.gridCell} ${d % 7 === 0 || d % 7 === 6 ? styles.weekend : ''}`}>
                      {/* Randomly mock some empty slots */}
                      {Math.random() > 0.8 && <span className={styles.vacantText}>空室</span>}
                    </div>
                  ))}
                  
                  {/* Mock Bookings absolute positioned */}
                  {rowIndex === 1 && (
                    <div className={`${styles.bookingBar} ${styles['status-occupied']}`} style={{ left: '100px', width: '200px' }}>
                      Guest: Smith (Paid)
                    </div>
                  )}
                  {rowIndex === 3 && (
                    <div className={`${styles.bookingBar} ${styles['status-preblock']}`} style={{ left: '250px', width: '100px' }}>
                      前後ブロック (Block)
                    </div>
                  )}
                  {rowIndex === 6 && (
                    <div className={`${styles.bookingBar} ${styles['status-maintenance']}`} style={{ left: '500px', width: '150px' }}>
                      Maintenance
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
