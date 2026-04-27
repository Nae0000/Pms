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
        Dashboard Overview
      </h1>

      <div className={styles.statsGrid}>
        {/* Stat Card 1 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>Total Monthly Revenue</p>
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
            <span className={styles.trendLabel}>vs last month</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>Occupied Rooms</p>
              <h2 className={styles.statValue}>42 / 50</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.secondaryBg}`}>
              <HomeIcon size={24} color="white" />
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.trendLabel}>84% Occupancy Rate</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>Total Tenants</p>
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
            <span className={styles.trendLabel}>new this month</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="card glass">
          <div className={styles.statHeader}>
            <div>
              <p className={styles.statLabel}>Pending Payments</p>
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
            <span className={styles.trendLabel}>rooms unpaid</span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Recent Activity */}
        <div className={`card glass ${styles.recentActivity}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Recent Activity</h3>
            <button className={styles.iconBtn}><MoreVertical size={20} /></button>
          </div>
          
          <div className={styles.activityList}>
            {[
              { title: "Rent Paid: Room 101", time: "2 hours ago", amount: "+฿5,000", type: "income" },
              { title: "Maintenance: AC Repair 204", time: "5 hours ago", amount: "-฿1,200", type: "expense" },
              { title: "New Tenant: Room 305", time: "1 day ago", amount: "+฿10,000", type: "income" },
              { title: "Water Bill Payment", time: "2 days ago", amount: "-฿3,450", type: "expense" },
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
            View All Activity
          </button>
        </div>

        {/* Quick Actions */}
        <div className={`card glass ${styles.quickActions}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Quick Actions</h3>
          </div>
          <div className={styles.actionGrid}>
            <button className="btn btn-primary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <HomeIcon size={24} />
              <span>Add Room</span>
            </button>
            <button className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <Users size={24} />
              <span>Add Tenant</span>
            </button>
            <button className="btn btn-outline" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <TrendingUp size={24} />
              <span>Record Income</span>
            </button>
            <button className="btn btn-outline" style={{ padding: '1rem', flexDirection: 'column', gap: '0.75rem' }}>
              <AlertCircle size={24} />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
