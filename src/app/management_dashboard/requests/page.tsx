'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import RequestsTable, {
  type RequestRow,
} from '@/components/requests/RequestsTable';
import RequestsHeader from '@/components/requests/RequestHeader';
import AlertStrip from '@/components/requests/AlertStrip';

const REQUESTS: RequestRow[] = [
  {
    id: '1',
    task: 'Replace Toothbrush Head',
    change: 'Change frequency to every 2 months',
    requestedBy: 'John (Family)',
    dateRequested: '28 June 2025',
    status: 'Pending',
    resolutionDate: '—',
  },
  {
    id: '2',
    task: 'Dental Appointments',
    change: 'Add an oral cancer screening appointment on the 6 June 2025',
    requestedBy: 'Mary (POA)',
    dateRequested: '19th May 2025',
    status: 'Approved',
    resolutionDate: '25 May 2025',
  },
];

export default function RequestsPage() {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return REQUESTS;
    return REQUESTS.filter((r) =>
      [r.task, r.change, r.requestedBy].some((x) => x.toLowerCase().includes(t))
    );
  }, [q]);

  const alertMsg = 'You requested a change on the 28 June 2025';

  return (
    <main>
      <div className="min-h-screen bg-[#F7ECD9]">
        <RequestsHeader q={q} setQ={setQ} />

        <section className="px-6 py-6 relative">
          <AlertStrip message={alertMsg} />
          <RequestsTable data={filtered} />

          <Link
            href="/help"
            aria-label="Help"
            className="fixed bottom-6 right-6 inline-flex items-center justify-center h-9 w-9 rounded-full bg-[#E37E72] text-white"
          >
            ?
          </Link>
        </section>
      </div>
    </main>
  );
}
