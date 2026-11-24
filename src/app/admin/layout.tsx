import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import AdminSidebar from '@/components/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();

  // The login page sits under this layout. Middleware sets x-pathname on every /admin request.
  if (h.get('x-pathname') === '/admin/login') {
    return <>{children}</>;
  }

  // Server-side validation of the Better Auth session and role.
  const check = await requireAdmin(h);
  if (check.status === 401) {
    redirect('/admin/login');
  }
  if (check.status === 403) {
    redirect('/');
  }

  const userName = check.user.name || check.user.email;
  const userEmail = check.user.email;

  return (
    <div className="admin-shell">
      <AdminSidebar userName={userName} userEmail={userEmail} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
