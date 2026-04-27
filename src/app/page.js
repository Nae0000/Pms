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

export default function Dashboard() {
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
              <h2 className={styles.statValue}>฿125,000</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.primaryBg}`}>
              <TrendingUp size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={`${styles.trend} ${styles.positive}`}>
              <ArrowUpRight size={16} /> 12%
            </span>
            <span className={styles.trendLabel}>เทียบกับเดือนที่แล้ว (vs last month)</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>ห้องที่มีผู้เช่า (Occupied Rooms)</p>
              <h2 className={styles.statValue}>42 / 50</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.secondaryBg}`}>
              <HomeIcon size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.trendLabel}>อัตราการเข้าพัก 84% (Occupancy Rate)</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>ผู้เช่าทั้งหมด (Total Tenants)</p>
              <h2 className={styles.statValue}>56</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.infoBg}`}>
              <Users size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={`${styles.trend} ${styles.positive}`}>
              <ArrowUpRight size={16} /> 3
            </span>
            <span className={styles.trendLabel}>ผู้เช่าใหม่เดือนนี้ (new this month)</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>ยอดค้างชำระ (Pending Payments)</p>
              <h2 className={styles.statValue}>฿12,500</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.dangerBg}`}>
              <AlertCircle size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={`${styles.trend} ${styles.negative}`}>
              <ArrowDownRight size={16} /> 4
            </span>
            <span className={styles.trendLabel}>ห้องที่ยังไม่จ่าย (rooms unpaid)</span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Recent Activity */}
        <div className={`card glass ${styles.recentActivity}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>กิจกรรมล่าสุด (Recent Activity)</h3>
            <button className={styles.iconBtn}><MoreVertical size={20} /></button>
          </div>
          
          <div className={styles.activityList}>
            {[
              { title: "ชำระค่าเช่า: ห้อง 101", time: "2 ชั่วโมงที่แล้ว", amount: "+฿5,000", type: "income" },
              { title: "ซ่อมบำรุง: แอร์ห้อง 204", time: "5 ชั่วโมงที่แล้ว", amount: "-฿1,200", type: "expense" },
              { title: "ผู้เช่าใหม่: ห้อง 305", time: "1 วันที่แล้ว", amount: "+฿10,000", type: "income" },
              { title: "จ่ายบิลค่าน้ำประปา", time: "2 วันที่แล้ว", amount: "-฿3,450", type: "expense" },
            ].map((activity, i) => (
              <div key={i} className={styles.activityItem}>
                <div className={`${styles.activityDot} ${activity.type === 'income' ? styles.dotPositive : styles.dotNegative}`}></div>
                <div className={styles.activityInfo}>
                  <p className={styles.activityTitle}>{activity.title}</p>
                  <p className={styles.activityTime}>{activity.time}</p>
                </div>
                <span className={`${styles.activityAmount} ${activity.type === 'income' ? styles.textPositive : styles.textNegative}`}>
                  {activity.amount}
                </span>
              </div>
            ))}
          </div>
          
          <button className="btn btn-outline" style={{ width: '100%', marginTop: '1.5rem' }}>
            ดูกิจกรรมทั้งหมด (View All Activity)
          </button>
        </div>

        {/* Quick Actions */}
        <div className={`card glass ${styles.quickActions}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>เมนูลัด (Quick Actions)</h3>
          </div>
          <div className={styles.actionGrid}>
            <button className="btn btn-primary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <HomeIcon size={24} />
              <span>เพิ่มห้อง (Add Room)</span>
            </button>
            <button className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <Users size={24} />
              <span>เพิ่มผู้เช่า (Add Tenant)</span>
            </button>
            <button className="btn btn-outline" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <TrendingUp size={24} />
              <span>บันทึกรายรับ (Income)</span>
            </button>
            <button className="btn btn-outline" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <AlertCircle size={24} />
              <span>บันทึกรายจ่าย (Expense)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
