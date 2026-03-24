import React from 'react';

declare module '@vercel/analytics/next' {
  export const Analytics: React.FC<{
    nonce?: string;
    beforeSend?: (event: unknown) => unknown | null;
    debug?: boolean;
    mode?: 'auto' | 'development' | 'production';
    scriptSrc?: string;
    endpoint?: string;
    dsn?: string;
  }>;
}

declare module '@vercel/speed-insights/next' {
  export const SpeedInsights: React.FC<{
    nonce?: string;
    dsn?: string;
    sampleRate?: number;
    beforeSend?: (data: unknown) => unknown | null | undefined | false;
    debug?: boolean;
    scriptSrc?: string;
    endpoint?: string;
  }>;
}
