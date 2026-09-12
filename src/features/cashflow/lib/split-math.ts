import type { CashflowSplitGroupExpenseDTO } from '@/types/dto';

export interface ParticipantNetBalance {
  name: string;
  paid: number;
  share: number;
  netBalance: number; // positive = is owed money, negative = owes money
}

export interface SimplifiedDebtSettlement {
  from: string; // debtor
  to: string;   // creditor
  amount: number;
}

export interface NetBalanceResult {
  totalGroupSpend: number; // strictly excludes settlements!
  totalSettlementAmount: number;
  participants: string[];
  balances: ParticipantNetBalance[];
  settlements: SimplifiedDebtSettlement[];
}

/**
 * Normalizes participant name case-insensitively while preserving display capitalization.
 */
export function canonicalizeName(
  rawName: string,
  canonicalMap: Map<string, string>
): string {
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  if (canonicalMap.has(lower)) {
    return canonicalMap.get(lower)!;
  }
  canonicalMap.set(lower, trimmed);
  return trimmed;
}

/**
 * Calculates net balances and simplified debt settlement transactions.
 * Guardrails:
 * - Settlements (`is_settlement = true`) adjust balances but are EXCLUDED from totalGroupSpend.
 * - Names are canonicalized case-insensitively.
 * - Floating point cents are rounded cleanly.
 */
export function calculateNetBalances(
  expenses: CashflowSplitGroupExpenseDTO[]
): NetBalanceResult {
  const canonicalMap = new Map<string, string>();
  const paidMap = new Map<string, number>();
  const shareMap = new Map<string, number>();

  let totalGroupSpend = 0;
  let totalSettlementAmount = 0;

  for (const exp of expenses) {
    const amount = Number(exp.amount) || 0;
    if (amount <= 0) continue;

    const payer = canonicalizeName(exp.paid_by, canonicalMap);

    if (exp.is_settlement) {
      // Settlement: direct payoff from paid_by to split_between[0]
      totalSettlementAmount += amount;
      paidMap.set(payer, (paidMap.get(payer) || 0) + amount);

      const recipientRaw = exp.split_between[0] || 'Unknown';
      const recipient = canonicalizeName(recipientRaw, canonicalMap);
      shareMap.set(recipient, (shareMap.get(recipient) || 0) + amount);
    } else {
      // Normal Group Expense: contributes to trip spend
      totalGroupSpend += amount;
      paidMap.set(payer, (paidMap.get(payer) || 0) + amount);

      const beneficiaries = exp.split_between && exp.split_between.length > 0
        ? exp.split_between
        : [payer];

      const splitCount = beneficiaries.length;
      const sharePerPerson = amount / splitCount;

      for (const beneficiaryRaw of beneficiaries) {
        const beneficiary = canonicalizeName(beneficiaryRaw, canonicalMap);
        shareMap.set(beneficiary, (shareMap.get(beneficiary) || 0) + sharePerPerson);
      }
    }
  }

  // Build unique participants list
  const allNames = Array.from(canonicalMap.values());
  const balances: ParticipantNetBalance[] = allNames.map((name) => {
    const paid = Math.round((paidMap.get(name) || 0) * 100) / 100;
    const share = Math.round((shareMap.get(name) || 0) * 100) / 100;
    const netBalance = Math.round((paid - share) * 100) / 100;

    return {
      name,
      paid,
      share,
      netBalance,
    };
  });

  // Sort: biggest creditors first, then debtors
  balances.sort((a, b) => b.netBalance - a.netBalance);

  // Compute minimal simplified debt settlements
  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .map((b) => ({ name: b.name, owes: Math.abs(b.netBalance) }))
    .sort((a, b) => b.owes - a.owes);

  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .map((b) => ({ name: b.name, isOwed: b.netBalance }))
    .sort((a, b) => b.isOwed - a.isOwed);

  const settlements: SimplifiedDebtSettlement[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.owes, creditor.isOwed);
    const roundedSettle = Math.round(settleAmount * 100) / 100;

    if (roundedSettle > 0) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: roundedSettle,
      });
    }

    debtor.owes = Math.round((debtor.owes - settleAmount) * 100) / 100;
    creditor.isOwed = Math.round((creditor.isOwed - settleAmount) * 100) / 100;

    if (debtor.owes < 0.01) dIdx++;
    if (creditor.isOwed < 0.01) cIdx++;
  }

  return {
    totalGroupSpend: Math.round(totalGroupSpend * 100) / 100,
    totalSettlementAmount: Math.round(totalSettlementAmount * 100) / 100,
    participants: allNames,
    balances,
    settlements,
  };
}
