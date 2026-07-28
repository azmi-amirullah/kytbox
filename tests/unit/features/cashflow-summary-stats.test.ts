import { getCashflowSummaryRatios } from '@/features/cashflow/components/CashflowSummaryStats'

describe('getCashflowSummaryRatios', () => {
  it('keeps ratios above 100 percent for deficits', () => {
    expect(getCashflowSummaryRatios(100, 250, -150)).toEqual({
      expenseRatio: 250,
      savingsRatio: -150,
      deficitRatio: 150,
      isPositiveBalance: false,
    })
  })

  it('calculates savings for a positive balance', () => {
    expect(getCashflowSummaryRatios(100, 25, 75)).toEqual({
      expenseRatio: 25,
      savingsRatio: 75,
      deficitRatio: 0,
      isPositiveBalance: true,
    })
  })

  it('returns neutral ratios when there is no income', () => {
    expect(getCashflowSummaryRatios(0, 250, -250)).toEqual({
      expenseRatio: 0,
      savingsRatio: 0,
      deficitRatio: 0,
      isPositiveBalance: false,
    })
  })
})
