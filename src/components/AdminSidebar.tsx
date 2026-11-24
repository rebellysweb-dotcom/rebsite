'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon, { type IconName } from './icons/Icon';
import styles from './AdminSidebar.module.css';

const NAV_LINKS: { href: string; label: string; exact: boolean; icon: IconName }[] = [
  { href: '/admin', label: 'Dashboard', exact: true, icon: 'dashboard' },
  { href: '/admin/orders', label: 'Orders', exact: false, icon: 'orders' },
  { href: '/admin/products', label: 'Products', exact: false, icon: 'products' },
  { href: '/admin/events', label: 'Events', exact: false, icon: 'calendar' },
  { href: '/admin/settings', label: 'Settings', exact: false, icon: 'settings' },
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
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Wordmark */}
      <div className={styles.logo}>
        <span className={styles.logoText}>Rebelly&apos;s</span>
        <span className={styles.logoSub}>Admin</span>
      </div>

      {/* Nav Links */}
      <nav className={styles.nav} aria-label="Admin navigation">
        {NAV_LINKS.map(({ href, label, exact, icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navLink} ${isActive(href, exact) ? styles.active : ''}`}
          >
            <Icon name={icon} size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* User Area */}
      <div className={styles.userArea}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>{getInitials(userName)}</div>
          <div className={styles.userText}>
            <div className={styles.userName}>{userName}</div>
            <div className={styles.userEmail}>{userEmail}</div>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={handleSignOut}>
          <Icon name="sign-out" size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
