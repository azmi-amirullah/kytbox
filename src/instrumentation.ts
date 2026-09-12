import { env } from './env';
import * as Sentry from '@sentry/nextjs';

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

    // Instant warmup: fetch ECB daily rates on server startup/deployment if not already cached
    void import('@/features/cashflow/lib/exchange-rates')
      .then(({ fetchLiveDailyExchangeRates }) => {
        return fetchLiveDailyExchangeRates({ forceInstant: true });
      })
      .then((res) => {
        if (res?.isLive) {
          console.log('[App Boot] Central Bank live exchange rates warmed up:', res.date);
        }
      })
      .catch(() => {
        // Non-blocking, fallback matrix remains ready
      });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

type RequestInfo = Parameters<typeof Sentry.captureRequestError>[1];
type ErrorContext = Parameters<typeof Sentry.captureRequestError>[2];

export function onRequestError(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('Failed to find Server Action')) {
    const headers = request?.headers || {};
    const hasNextActionHeader = Boolean(
      headers['next-action'] || headers['Next-Action'],
    );
    const path = request?.path || '';
    const isBotPath = path === '/index' || path.endsWith('/index');

    // Drop automated bot probes and scanner requests with no Next-Action header or targeting invalid paths
    if (!hasNextActionHeader || isBotPath) {
      return;
    }

    // Legitimate deployment skew: Capture with 'warning' level and tag for release health tracking
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setTag('error.category', 'deployment_skew');
      Sentry.captureRequestError(error, request, context);
    });
    return;
  }

  Sentry.captureRequestError(error, request, context);
}
