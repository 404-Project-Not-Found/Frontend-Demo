'use client';

import Budget from './BudgetCard';
type Props = {
  summary: {
    totalAnnualBudget: number | string;
    spentToDate: number | string;
    remainingBalance: number | string;
  };
};

function format(v: number | string) {
  return typeof v === 'number' ? `$${v.toLocaleString()}` : v;
}

export default function BudgetSummaryGrid({ summary }: Props) {
  const { totalAnnualBudget, spentToDate, remainingBalance } = summary;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-black">
      <Budget title="Total Annual Budget" value={format(totalAnnualBudget)} />
      <Budget title="Spent to Date" value={format(spentToDate)} />
      <Budget
        title="Remaining Balance"
        value={format(remainingBalance)}
        positive
      />
    </div>
  );
}
