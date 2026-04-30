"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  Wallet,
  CalendarDays
} from "lucide-react";
import styles from "./BottomNav.module.css";

const navItems = [
  { name: "หน้าหลัก", href: "/", icon: LayoutDashboard },
  { name: "ห้องพัก", href: "/rooms", icon: Home },
  { name: "ผู้เช่า", href: "/tenants", icon: Users },
  { name: "การเงิน", href: "/finances", icon: Wallet },
  { name: "ปฏิทิน", href: "/calendar", icon: CalendarDays },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
          >
            <div className={styles.iconWrapper}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && <div className={styles.activeIndicator} />}
            </div>
            <span className={styles.navLabel}>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
