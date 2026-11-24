import { betterAuth } from 'better-auth';

// Bindings and secrets needed to build the auth instance.
// Provided per request from getCloudflareContext() (see ./session.ts).
export interface AuthEnv {
  DB: D1Database;
  AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
}

// Better Auth 1.7.x accepts a raw D1Database and wraps it in its own
// D1SqliteDialect (no extra adapter package needed).
export function createAuth(env: AuthEnv) {
  return betterAuth({
    database: env.DB,
    secret: env.AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
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
