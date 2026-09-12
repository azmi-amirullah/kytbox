import { NextResponse } from 'next/server';
import { fetchLiveDailyExchangeRates } from '@/features/cashflow/lib/exchange-rates';

export async function GET() {
  const result = await fetchLiveDailyExchangeRates();

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
