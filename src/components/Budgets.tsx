'use client';

type BudgetProps = {
  title: string;
  value: string;
  positive?: boolean;
};

export default function Budget({
  title,
  value,
  positive = false,
}: BudgetProps) {
  return (
    <div className="rounded-xl border border-black bg-white px-5 py-4">
      <div className="text-2xl font-extrabold">{value}</div>
      <div
        className={`text-sm mt-1 ${positive ? 'text-green-700' : 'text-gray-700'}`}
      >
        {title}
      </div>
    </div>
  );
}
