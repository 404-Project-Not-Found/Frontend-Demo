'use client';

import Badge from '@/components/ui/Badge';

export type RequestRow = {
  id: string;
  task: string;
  change: string;
  requestedBy: string;
  dateRequested: string; // keep strings for now (frontend only)
  status: 'Pending' | 'Approved' | 'Rejected';
  resolutionDate?: string | '—';
};

type Props = {
  data: RequestRow[];
};

export default function RequestsTable({ data }: Props) {
  return (
    <div className="rounded-xl border border-black overflow-hidden bg-white">
      <div className="px-4 py-3 border-b bg-[#fff8f0] text-black">
        <div className="font-semibold">Requests</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm divide-y">
          <thead className="text-gray-600">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Requested Change</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3">Date Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Resolution Date</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.map((r) => (
              <tr key={r.id} className="align-top text-black">
                <td className="whitespace-nowrap px-4 py-3">{r.task}</td>
                <td className="px-4 py-3">{r.change}</td>
                <td className="whitespace-nowrap px-4 py-3">{r.requestedBy}</td>
                <td
                  className="whitespace-nowrap px-4 py-3"
                  dangerouslySetInnerHTML={{ __html: r.dateRequested }}
                />
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      r.status === 'Approved'
                        ? 'green'
                        : r.status === 'Pending'
                          ? 'yellow'
                          : 'red'
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {typeof r.resolutionDate === 'string' ? (
                    <span
                      dangerouslySetInnerHTML={{ __html: r.resolutionDate }}
                    />
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
