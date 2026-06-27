import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 'var(--px)' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', maxWidth: '600px', width: '100%' }}>
        <h1 style={{ fontSize: '8rem', fontFamily: 'var(--ff-display)', color: 'var(--rose-200)', lineHeight: 1, margin: 0 }}>404</h1>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--ff-display)', margin: '1rem 0' }}>Oops! <em>Bloom</em> not found.</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          The page you are looking for might have been moved, renamed, or no longer exists. Let's get you back on track.
        </p>
        <Link href="/" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
          Return to Home
        </Link>
      </div>
    </div>
  );
}
