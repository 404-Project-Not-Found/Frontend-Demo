'use client';

import Badge from '@/components/ui/Badge';

export type CostRow = {
  id: string;
  item: string;
  category: string;
  allocated: number;
  spent: number;
  status: 'Exceeded' | 'Nearly Exceeded' | 'Within Limit';
};

type Props = {
  items: CostRow[];
  year: string;
};

export default function OverspentTable({ items, year }: Props) {
  return (
    <div className="rounded-xl border border-black/10 bg-white text-black">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-[#fff8f0] flex items-center justify-between">
        <div className="font-semibold">Overspent Items: {items.length}</div>
        <div className="text-sm">Year: {year}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="text-gray-600">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Allocated Budget</th>
              <th className="px-4 py-3">Amount Spent</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {items.map((r) => {
              const rem = r.allocated - r.spent;
              const tone =
                r.status === 'Exceeded'
                  ? 'red'
                  : r.status === 'Nearly Exceeded'
                    ? 'yellow'
                    : 'green';

              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.item}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3">${r.allocated}</td>
                  <td className="px-4 py-3">${r.spent}</td>
                  <td className={`px-4 py-3 ${rem < 0 ? 'text-red-600' : ''}`}>
                    {rem < 0 ? `-$${Math.abs(rem)}` : `$${rem}`}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tone}>{r.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
