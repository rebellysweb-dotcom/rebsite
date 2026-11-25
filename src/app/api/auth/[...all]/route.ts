import { getAuth } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// Better Auth handles every /api/auth/* sub-route (sign-in, sign-up, sign-out, get-session, ...).
export async function GET(request: Request) {
  const auth = await getAuth();
  return auth.handler(request);
}

export async function POST(request: Request) {
  const auth = await getAuth();
  return auth.handler(request);
}
