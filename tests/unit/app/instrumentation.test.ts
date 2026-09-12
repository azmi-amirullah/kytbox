import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { onRequestError } from '@/instrumentation';

type RequestInfo = Parameters<typeof onRequestError>[1];
type ErrorContext = Parameters<typeof onRequestError>[2];

vi.mock('@/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SITE_URL: 'https://kytbox.com',
  },
}));

vi.mock('@sentry/nextjs', () => ({
  captureRequestError: vi.fn(),
  withScope: vi.fn((callback) => {
    const mockScope = {
      setLevel: vi.fn(),
      setTag: vi.fn(),
    };
    callback(mockScope);
  }),
}));

describe('onRequestError instrumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards standard application errors to Sentry directly', () => {
    const error = new Error('Database connection failed');
    const request: RequestInfo = {
      path: '/api/transactions',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    };
    const context: ErrorContext = {
      routerKind: 'App Router',
      routePath: '/api/transactions',
      routeType: 'route',
    };

    onRequestError(error, request, context);

    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, request, context);
  });

  it('drops "Failed to find Server Action" bot scans targeting /index without Next-Action header', () => {
    const error = new Error('Failed to find Server Action. This request might be from an older or newer deployment.');
    const request: RequestInfo = {
      path: '/index',
      method: 'POST',
      headers: {
        'user-agent': 'Chrome Mobile iOS 152.0.7977',
      },
    };
    const context: ErrorContext = {
      routerKind: 'App Router',
      routePath: '/(marketing)/page',
      routeType: 'render',
    };

    onRequestError(error, request, context);

    expect(Sentry.captureRequestError).not.toHaveBeenCalled();
    expect(Sentry.withScope).not.toHaveBeenCalled();
  });

  it('drops "Failed to find Server Action" bot probes targeting page routes without Next-Action header', () => {
    const error = new Error('Failed to find Server Action. This request might be from an older or newer deployment.');
    const request: RequestInfo = {
      path: '/',
      method: 'POST',
      headers: {},
    };
    const context: ErrorContext = {
      routerKind: 'App Router',
      routePath: '/(marketing)/page',
      routeType: 'render',
    };

    onRequestError(error, request, context);

    expect(Sentry.captureRequestError).not.toHaveBeenCalled();
    expect(Sentry.withScope).not.toHaveBeenCalled();
  });

  it('captures genuine deployment skew as warning with deployment_skew tag when Next-Action header exists', () => {
    const error = new Error('Failed to find Server Action. This request might be from an older or newer deployment.');
    const request: RequestInfo = {
      path: '/cashflow',
      method: 'POST',
      headers: {
        'next-action': '7a2ed9b69eb40b87d0acdda28dfd292f792ec696',
      },
    };
    const context: ErrorContext = {
      routerKind: 'App Router',
      routePath: '/cashflow/page',
      routeType: 'action',
    };

    onRequestError(error, request, context);

    expect(Sentry.withScope).toHaveBeenCalledTimes(1);
    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, request, context);
  });
});
