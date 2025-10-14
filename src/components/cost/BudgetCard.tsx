'use client';

type BudgetCardProps = {
  title: string;
  value: string | number;
  positive?: boolean;
};

export default function BudgetCard({
  title,
  value,
  positive = false,
}: BudgetCardProps) {
  const display =
    typeof value === 'number' ? `$${value.toLocaleString()}` : value;

  return (
    <div className="rounded-xl border border-black bg-white px-5 py-4">
      <div className="text-2xl font-extrabold">{display}</div>
      <div
        className={`text-sm mt-1 ${positive ? 'text-green-700' : 'text-gray-700'}`}
      >
        {title}
      </div>
    </div>
  );
}
