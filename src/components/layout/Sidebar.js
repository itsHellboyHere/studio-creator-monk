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
  { name: "Overview",    path: "/dashboard",   icon: LayoutDashboard },
  { name: "Team Pods",   path: "/team",        icon: Users },
  { name: "Client List", path: "/clients",     icon: Building2 },
  { name: "Onboarding",  path: "/onboarding",  icon: Rocket },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionCount, setActionCount] = useState(0);

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const fetchCount = async () => {
      const count = await getActionablePostCount();
      setActionCount(count);
    };
    fetchCount();
  }, [pathname]);

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className={styles.mobileBar}>
        <div className={styles.mobileLogo}>
          <Image
            src="/logo1.png"
            alt="CreatorMonk"
            width={120}
            height={34}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <button
          className={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          {actionCount > 0 && !mobileOpen && <span className={styles.mobileToggleDot} />}
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={closeMobile} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileVisible : ""}`}
      >
        {/* Logo */}
        <div className={styles.logoSection}>
          {collapsed ? (
            <div className={styles.logoIcon}>CM</div>
          ) : (
            <Image
              src="/logo1.png"
              alt="CreatorMonk"
              width={130}
              height={36}
              style={{ objectFit: "contain", objectPosition: "left", maxWidth: "100%" }}
              priority
            />
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Nav */}
        <nav className={styles.nav}>
          {!collapsed && <span className={styles.navLabel}>Menu</span>}
          {menuItems.map((item) => {
            const Icon     = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
            const isClientList = item.name === "Client List";
            const showAlert = isClientList && actionCount > 0;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={closeMobile}
                title={collapsed ? item.name : undefined}
              >
                <span className={styles.navIcon}>
                  <Icon size={17} strokeWidth={1.75} />
                  {showAlert && collapsed && <span className={styles.collapsedAlertDot} />}
                </span>

                {!collapsed && (
                  <span className={styles.navName}>{item.name}</span>
                )}

                {showAlert && !collapsed && (
                  <span className={styles.alertBadge}>{actionCount}</span>
                )}

                {isActive && !collapsed && !showAlert && <span className={styles.activeDot} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          {!collapsed && (
            <div className={styles.footerUser}>
              <div className={styles.userAvatar}>A</div>
              <span className={styles.userLabel}>Admin</span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={styles.logoutBtn}
            title="Sign out"
          >
            <LogOut size={15} strokeWidth={1.75} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}