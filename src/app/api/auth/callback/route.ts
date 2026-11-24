export const runtime = 'edge';
// Auth callbacks are now handled by Better Auth at /api/auth/[...all]
// This file is kept as a redirect stub for any old links
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL || 'https://rebellys.com'));
}
