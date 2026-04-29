"use client";
import { 
  TrendingUp, 
  Home as HomeIcon, 
  Users, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from "lucide-react";
import styles from "./page.module.css";
import { useData } from "./context/DataContext";
import Link from "next/link";

export default function Dashboard() {
  const { rooms, tenants, transactions, isInitialLoading } = useData();

  if (isInitialLoading) {
    return (
      <div className="page-container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>กำลังโหลดข้อมูล (Loading...)...</p>
      </div>
    );
  }

  // ==== Calculations ====
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isThisMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isLastMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === lastMonth && d.getFullYear() === year;
  };

  // 1. Monthly Revenue
  const thisMonthIncome = (transactions || [])
    .filter(t => t.type === 'income' && isThisMonth(t.date) && t.status === 'Paid')
    .reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, "") || 0), 0);

  const lastMonthIncome = (transactions || [])
    .filter(t => t.type === 'income' && isLastMonth(t.date) && t.status === 'Paid')
    .reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, "") || 0), 0);

  let revenueTrend = 0;
  if (lastMonthIncome > 0) {
    revenueTrend = ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
  }

  // 2. Occupied Rooms
  const totalRooms = (rooms || []).length;
  const occupiedRooms = (rooms || []).filter(r => r.status === 'occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // 3. Tenants
  const activeTenants = (tenants || []).filter(t => t.status === 'Active');
  const totalActiveTenants = activeTenants.length;

  // 4. Pending Payments (Income that is not Paid)
  const pendingTransactions = (transactions || []).filter(t => t.type === 'income' && (t.status === 'Pending' || t.status === 'Overdue'));
  const pendingAmount = pendingTransactions.reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, "") || 0), 0);
  const pendingRoomsCount = new Set(pendingTransactions.map(t => t.room).filter(Boolean)).size;

  // 5. Recent Activity
  const recentTransactions = [...(transactions || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const formatNumber = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">
        ภาพรวมระบบ (Dashboard Overview)
      </h1>

      <div className={styles.statsGrid}>
        {/* Stat Card 1 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>รายรับรายเดือน (Monthly Revenue)</p>
              <h2 className={styles.statValue}>฿{formatNumber(thisMonthIncome)}</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.primaryBg}`}>
              <TrendingUp size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={`${styles.trend} ${revenueTrend >= 0 ? styles.positive : styles.negative}`}>
              {revenueTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />} 
              {Math.abs(revenueTrend).toFixed(1)}%
            </span>
            <span className={styles.trendLabel}>เทียบกับเดือนที่แล้ว (vs last month)</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>ห้องที่มีผู้เช่า (Occupied Rooms)</p>
              <h2 className={styles.statValue}>{occupiedRooms} / {totalRooms}</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.secondaryBg}`}>
              <HomeIcon size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.trendLabel}>อัตราการเข้าพัก {occupancyRate}% (Occupancy Rate)</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>ผู้เช่าทั้งหมด (Total Tenants)</p>
              <h2 className={styles.statValue}>{totalActiveTenants}</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.infoBg}`}>
              <Users size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.trendLabel}>ผู้เช่าที่กำลังใช้งาน (Active tenants)</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>ยอดค้างชำระ (Pending Payments)</p>
              <h2 className={styles.statValue}>฿{formatNumber(pendingAmount)}</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.dangerBg}`}>
              <AlertCircle size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            {pendingTransactions.length > 0 ? (
              <span className={`${styles.trend} ${styles.negative}`}>
                <ArrowDownRight size={16} /> {pendingRoomsCount}
              </span>
            ) : (
              <span className={`${styles.trend} ${styles.positive}`}>
                0
              </span>
            )}
            <span className={styles.trendLabel}>ห้องที่ยังไม่จ่าย (rooms unpaid)</span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Recent Activity */}
        <div className={`card glass ${styles.recentActivity}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>กิจกรรมล่าสุด (Recent Activity)</h3>
            <Link href="/finances" className={styles.iconBtn}><MoreVertical size={20} /></Link>
          </div>
          
          <div className={styles.activityList}>
            {recentTransactions.length > 0 ? recentTransactions.map((tx, i) => (
              <div key={i} className={styles.activityItem}>
                <div className={`${styles.activityDot} ${tx.type === 'income' ? styles.dotPositive : styles.dotNegative}`}></div>
                <div className={styles.activityInfo}>
                  <p className={styles.activityTitle}>{tx.description || tx.category}</p>
                  <p className={styles.activityTime}>{tx.date} {tx.room ? `• ห้อง ${tx.room}` : ''}</p>
                </div>
                <span className={`${styles.activityAmount} ${tx.type === 'income' ? styles.textPositive : styles.textNegative}`}>
                  {tx.type === 'income' ? '+' : '-'}฿{formatNumber(parseFloat(String(tx.amount).replace(/,/g, "") || 0))}
                </span>
              </div>
            )) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>ไม่มีกิจกรรม (No activity)</p>
            )}
          </div>
          
          <Link href="/finances" style={{ display: 'block', width: '100%', marginTop: '1.5rem', textDecoration: 'none' }}>
            <button className="btn btn-outline" style={{ width: '100%' }}>
              ดูกิจกรรมทั้งหมด (View All Activity)
            </button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className={`card glass ${styles.quickActions}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>เมนูลัด (Quick Actions)</h3>
          </div>
          <div className={styles.actionGrid}>
            <Link href="/rooms" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem', width: '100%', height: '100%' }}>
                <HomeIcon size={24} />
                <span>เพิ่มห้อง (Add Room)</span>
              </button>
            </Link>
            <Link href="/tenants" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem', width: '100%', height: '100%' }}>
                <Users size={24} />
                <span>เพิ่มผู้เช่า (Add Tenant)</span>
              </button>
            </Link>
            <Link href="/finances" style={{ textDecoration: 'none' }}>
              <button className="btn btn-outline" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem', width: '100%', height: '100%' }}>
                <TrendingUp size={24} />
                <span>การเงิน (Finances)</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
