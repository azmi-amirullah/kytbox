import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getSplitGroupByTokenAction,
  SplitGroupView,
} from '@/features/cashflow';


interface SplitPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: SplitPageProps): Promise<Metadata> {
  const { token } = await params;
  const res = await getSplitGroupByTokenAction(token);

  if (!res.success || !res.group) {
    return {
      title: 'Split Group Not Found | Kytbox',
    };
  }

  return {
    title: `${res.group.title} — Shared Expenses | Kytbox`,
    description: `Zero-signup shared expense group for ${res.group.title}. Track balances, split IOUs, and settle up with no account needed.`,
  };
}

export default async function SplitGroupPage({ params }: SplitPageProps) {
  const { token } = await params;
  const res = await getSplitGroupByTokenAction(token);

  if (!res.success || !res.group || !res.expenses || !res.mathResult) {
    notFound();
  }

  return (
    <SplitGroupView
      group={res.group}
      initialExpenses={res.expenses}
      initialMath={res.mathResult}
    />
  );
}
