"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  Wallet, 
  CalendarDays,
  Building
} from "lucide-react";
import styles from "./Sidebar.module.css";

const navItems = [
  { name: "หน้าหลัก (Dashboard)", href: "/", icon: LayoutDashboard },
  { name: "ห้องพัก (Rooms)", href: "/rooms", icon: Home },
  { name: "ผู้เช่า (Tenants)", href: "/tenants", icon: Users },
  { name: "การเงิน (Finances)", href: "/finances", icon: Wallet },
  { name: "ปฏิทิน (Calendar)", href: "/calendar", icon: CalendarDays },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Building size={20} />
        </div>
        <span>Luma Estate</span>
      </div>
      
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>A</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>แอดมิน (Admin User)</span>
            <span className={styles.userRole}>ผู้ดูแลระบบ (Property Manager)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
