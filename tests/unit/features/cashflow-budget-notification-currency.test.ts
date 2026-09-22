import { describe, it, expect } from 'vitest';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

describe('Budget Alert Notification Currency Localization', () => {
  it('formats overage correctly with IDR currency without decimal places', () => {
    const totalSpent = 149000;
    const budgetAmount = 100000;
    const overage = totalSpent - budgetAmount;
    const category = 'food';
    const userCurrency = 'IDR';

    const formattedOverage = formatCurrency(overage, userCurrency);
    const body = `${category} is over budget by ${formattedOverage}`;

    expect(body).not.toContain('$');
    expect(body).not.toMatch(/,\d{2}$/);
    expect(body).toContain('Rp');
    expect(body).toContain('49.000');
  });

  it('formats budget warning correctly with IDR currency', () => {
    const budgetAmount = 100000;
    const ratio = 0.85;
    const percentage = Math.round(ratio * 100);
    const category = 'food';
    const userCurrency = 'IDR';

    const formattedBudget = formatCurrency(budgetAmount, userCurrency);
    const body = `${category} reached ${percentage}% of ${formattedBudget} budget`;

    expect(body).not.toContain('$');
    expect(body).toContain('85% of Rp');
    expect(body).toContain('100.000');
  });

  it('formats overage correctly with USD currency with 2 decimal places', () => {
    const totalSpent = 145;
    const budgetAmount = 100;
    const overage = totalSpent - budgetAmount;
    const category = 'Food';
    const userCurrency = 'USD';

    const formattedOverage = formatCurrency(overage, userCurrency);
    const body = `${category} is over budget by ${formattedOverage}`;

    expect(body).toContain('$45.00');
  });

  it('falls back to DEFAULT_CURRENCY (USD) when profile default_currency is missing', () => {
    const totalSpent = 145;
    const budgetAmount = 100;
    const overage = totalSpent - budgetAmount;
    const category = 'Food';
    const profileCurrency = null;
    const userCurrency = profileCurrency || DEFAULT_CURRENCY;

    const formattedOverage = formatCurrency(overage, userCurrency);
    const body = `${category} is over budget by ${formattedOverage}`;

    expect(body).toContain('$45.00');
  });
});
