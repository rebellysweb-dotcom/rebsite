import { betterAuth } from 'better-auth';

// Bindings and secrets needed to build the auth instance.
// Provided per request from getCloudflareContext() (see ./session.ts).
export interface AuthEnv {
  DB: D1Database;
  AUTH_SECRET: string;
  /** Public origin of the site, e.g. https://rebellys.com. Required in production. */
  BETTER_AUTH_URL?: string;
  /** Comma-separated extra trusted origins. Defaults to https://rebellys.com. */
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  ENVIRONMENT?: string;
}

// Better Auth 1.7.x accepts a raw D1Database and wraps it in its own
// D1SqliteDialect (no extra adapter package needed).
export function createAuth(env: AuthEnv) {
  const isProd = env.ENVIRONMENT === 'production';
  const baseURL = env.BETTER_AUTH_URL || (isProd ? 'https://rebellys.com' : 'http://localhost:3005');
  const trustedOrigins = (env.BETTER_AUTH_TRUSTED_ORIGINS || 'https://rebellys.com')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!trustedOrigins.includes(new URL(baseURL).origin)) trustedOrigins.push(new URL(baseURL).origin);

  return betterAuth({
    database: env.DB,
    secret: env.AUTH_SECRET,
    baseURL,
    trustedOrigins,
    advanced: {
      useSecureCookies: isProd,
    },
    emailAndPassword: {
      enabled: true,
      // Admin accounts are created out of band; the public sign-up endpoint is closed.
      disableSignUp: true,
      minPasswordLength: 10,
      requireEmailVerification: false,
    },
    // Brute-force protection for sign-in, persisted in D1 (table `rateLimit`, see report).
    rateLimit: {
      enabled: true,
      storage: 'database',
    },
    session: {
      // Cookie cache keeps the session off the DB for a few minutes.
      // Kept short so a role change or revocation takes effect quickly.
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'customer',
          // Not settable by the client on sign-up or update.
          input: false,
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
