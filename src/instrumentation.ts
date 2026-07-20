import { env } from './env';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    // This executes exclusively during the Server build and Node initialization phases.
    // T3-Env's createEnv validates all inputs strictly. The initial require ('./env')
    // instantly triggers Zod's internal validation against local/runtime process config.
    // A missing SUPABASE or REGIS payload string halts everything here before accepting hits securely.
    console.log('[App Boot] Validating environment secrets securely...', {
      NODE_ENV: env.NODE_ENV,
      url: env.NEXT_PUBLIC_SITE_URL,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
