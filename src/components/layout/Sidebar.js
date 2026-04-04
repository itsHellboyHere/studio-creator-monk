"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Building2,
  Rocket,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { getActionablePostCount } from "./actions";
import styles from "./Sidebar.module.css";

const menuItems = [
  { name: "Overview",    path: "/dashboard",  icon: LayoutDashboard },
  { name: "Team Pods",   path: "/team",       icon: Users },
  { name: "Client List", path: "/clients",    icon: Building2 },
  { name: "Onboarding",  path: "/onboarding", icon: Rocket },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionCount, setActionCount] = useState(0);

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => { closeMobile(); }, [pathname]);

  useEffect(() => {
    getActionablePostCount().then(setActionCount);
  }, [pathname]);

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className={styles.mobileBar}>
        <Image src="/logo1.png" alt="CreatorMonk" width={140} height={70}
          style={{ objectFit: "contain", objectPosition: "left" }} priority />
        <button className={styles.burgerBtn} onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          {actionCount > 0 && !mobileOpen && <span className={styles.burgerDot} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className={styles.overlay} onClick={closeMobile} />}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileVisible : ""}`}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          {collapsed
            ? <div className={styles.logoMark}>CM</div>
            : <Image src="/logo1.png" alt="CreatorMonk" width={148} height={70}
                style={{ objectFit: "contain", objectPosition: "left", maxWidth: "100%" }} priority />
          }
        </div>

        {/* Desktop collapse toggle — always visible */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(c => !c)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Nav */}
        <nav className={styles.nav}>
          {!collapsed && <span className={styles.navLabel}>Menu</span>}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
            const showAlert = item.name === "Client List" && actionCount > 0;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={closeMobile}
                title={collapsed ? item.name : undefined}
              >
                <span className={styles.iconWrap}>
                  <Icon size={17} strokeWidth={1.8} />
                  {showAlert && collapsed && <span className={styles.iconDot} />}
                </span>
                {!collapsed && <span className={styles.navName}>{item.name}</span>}
                {showAlert && !collapsed && <span className={styles.badge}>{actionCount}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={`${styles.userRow} ${collapsed ? styles.userRowCollapsed : ""}`}>
            <div className={styles.avatar}>A</div>
            {!collapsed && (
              <div className={styles.userText}>
                <span className={styles.userName}>Admin</span>
                <span className={styles.userRole}>Administrator</span>
              </div>
            )}
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutBtn} title="Sign out">
            <LogOut size={14} strokeWidth={1.8} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}