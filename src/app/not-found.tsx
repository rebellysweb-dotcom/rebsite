import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: "Page Not Found | Rebelly's",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>This page is not here.</h1>
        <p className={styles.text}>
          The link may be old, or the page may have moved. The shop, the collection and our contact details are all one click away.
        </p>
        <div className={styles.actions}>
          <Link href="/" className="btn btn-primary">Return to home</Link>
          <Link href="/collections" className="btn btn-outline">Browse flowers</Link>
        </div>
      </div>
    </div>
  );
}
