import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <p className={styles.mark}>Rebelly&apos;s</p>
      <span className={styles.line} aria-hidden="true" />
      <p className={styles.text}>Loading</p>
    </div>
  );
}
