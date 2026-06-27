'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './AdminSidebar.module.css';

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/orders', label: 'Orders', icon: '📦', exact: false },
  { href: '/admin/products', label: 'Products', icon: '🌹', exact: false },
  { href: '/admin/events', label: 'Events', icon: '🎉', exact: false },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️', exact: false },
];

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
}

export default function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoText}>🌸 Rebelly&apos;s</span>
        <span className={styles.logoSub}>Admin Panel</span>
      </div>

      {/* Nav Links */}
      <nav className={styles.nav} aria-label="Admin navigation">
        {NAV_LINKS.map(({ href, label, icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navLink} ${isActive(href, exact) ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* User Area */}
      <div className={styles.userArea}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>{getInitials(userName)}</div>
          <div style={{ minWidth: 0 }}>
            <div className={styles.userName}>{userName}</div>
            <div className={styles.userEmail}>{userEmail}</div>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={handleSignOut}>
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
