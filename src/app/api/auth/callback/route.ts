import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function safeNext(value: string | null): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in search params, use it as the redirection URL
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const ALLOWED_HOSTS = new Set([
        'rebellys.com',
        'www.rebellys.com',
        ...(process.env.NEXT_PUBLIC_SITE_URL
          ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).host]
          : []),
      ])

      const rawForwardedHost = request.headers.get('x-forwarded-host')
      const forwardedHost =
        rawForwardedHost && ALLOWED_HOSTS.has(rawForwardedHost) ? rawForwardedHost : null

      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that next-url and origin are the same
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
