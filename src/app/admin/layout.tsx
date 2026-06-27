import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  const userName = profile.full_name ?? user.email ?? 'Admin';
  const userEmail = profile.email ?? user.email ?? '';

  return (
    <div className="admin-shell">
      <AdminSidebar userName={userName} userEmail={userEmail} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
