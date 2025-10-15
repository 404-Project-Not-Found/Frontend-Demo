/**
 * File path: app/calendar_dashboard/transaction_history/page.tsx
 * Author: Qingyue Zhao
 *
 * Features:
 * - Client dropdown shows ONLY org-approved clients (like Budget Report).
 * - Management can change status via a badge-styled <select>; others see read-only badges.
 * - When status becomes "Implemented", budget.spent updates (handled in mockApi.ts).
 * - Receipt column: DataURL first; if not available, falls back to /public/receipts/<filename>.
 */

'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  getTransactionsFE,
  setTransactionStatusFE,
  getCurrentOrgIdFE,
  seedOrgStatusDefaultsFE,
  getOrgStatusForClientFE,
  type Client as ApiClient,
  type Transaction as ApiTransaction,
} from '@/lib/mock/mockApi';

const colors = { header: '#3A0000', banner: '#F9C9B1', text: '#000000' };

export default function TransactionHistoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading transactions…</div>}>
      <TransactionHistoryInner />
    </Suspense>
  );
}

/* -------------------------- UI helpers -------------------------- */
function statusTone(s?: ApiTransaction['status']): 'green' | 'yellow' | 'red' {
  switch (s) {
    case 'Approved': return 'green';
    case 'Rejected': return 'red';
    default: return 'yellow';
  }
}
function statusSelectClass(s?: ApiTransaction['status']): string {
  const base =
    'rounded-full px-3 py-1 text-sm font-semibold border focus:outline-none focus:ring-2 appearance-none pr-7';
  switch (s) {
    case 'Approved': return `${base} bg-green-100 text-green-800 border-green-300 focus:ring-green-300`;
    case 'Rejected': return `${base} bg-red-100 text-red-800 border-red-300 focus:ring-red-300`;
    default: return `${base} bg-yellow-100 text-yellow-800 border-yellow-300 focus:ring-yellow-300`;
  }
}
function SelectCaret() {
  return <span className="pointer-events-none -ml-6 inline-block translate-y-[1px] text-black/50">▾</span>;
}

/** Build client list gated by org access (approved only) */
async function loadClientsWithOrgAccess(): Promise<
  { id: string; name: string; orgAccess: 'approved' | 'pending' | 'revoked' }[]
> {
  const all = await getClientsFE();
  seedOrgStatusDefaultsFE();
  const orgId = getCurrentOrgIdFE();
  return all.map((c: ApiClient) => {
    const s = getOrgStatusForClientFE(c._id, orgId) || 'pending';
    return { id: c._id, name: c.name, orgAccess: s };
  });
}

/* ----------------------------- Page ----------------------------- */
function TransactionHistoryInner() {
  const router = useRouter();

  // role
  const [role, setRole] = useState<'family' | 'carer' | 'management' | null>(null);
  useEffect(() => { setRole(getViewerRoleFE()); }, []);
  const isCarer = role === 'carer';
  const isManagement = role === 'management';

  // clients
  const [clients, setClients] = useState<
    { id: string; name: string; orgAccess: 'approved' | 'pending' | 'revoked' }[]
  >([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');
  useEffect(() => {
    (async () => {
      try {
        const list = await loadClientsWithOrgAccess();
        setClients(list);
        const approved = list.filter((c) => c.orgAccess === 'approved');
        const { id, name } = readActiveClientFromStorage();
        let useId: string | null = null;
        let useName = '';
        if (id && approved.find((c) => c.id === id)) {
          useId = id; useName = name || approved.find((a) => a.id === id)?.name || '';
        } else if (approved.length > 0) {
          useId = approved[0].id; useName = approved[0].name;
        }
        setActiveClientId(useId);
        setActiveClientName(useName);
        if (useId) writeActiveClientToStorage(useId, useName);
      } catch { setClients([]); }
    })();
  }, []);

  // transactions
  const [rows, setRows] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  useEffect(() => {
    (async () => {
      if (!activeClientId) { setRows([]); return; }
      setLoading(true); setErrorText('');
      try {
        const data = await getTransactionsFE(activeClientId);
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setErrorText('Failed to load transactions for this client.');
        setRows([]);
      } finally { setLoading(false); }
    })();
  }, [activeClientId]);

  const onClientChange = (id: string) => {
    const c = clients.find((x) => x.id === id) || null;
    const name = c?.name || '';
    setActiveClientId(id || null);
    setActiveClientName(name);
    writeActiveClientToStorage(id || '', name);
  };

  // search
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) =>
      [
        t.type, t.date, t.madeBy, t.category, t.item,
        String(t.amount), t.status || '', t.receiptFilename || '',
      ].join(' ').toLowerCase().includes(q)
    );
  }, [rows, search]);

  // status update
  const updateStatus = async (txId: string, next: NonNullable<ApiTransaction['status']>) => {
    await setTransactionStatusFE(txId, next);
    if (activeClientId) {
      const data = await getTransactionsFE(activeClientId);
      setRows(Array.isArray(data) ? data : []);
    }
  };

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      onClientChange={onClientChange}
      colors={colors}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      <div className="flex-1 h-[680px] bg-white/80 overflow-auto">
        {/* Header */}
        <div className="w-full flex items-center justify-between px-6 py-5" style={{ backgroundColor: colors.header }}>
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
          <div className="flex items-center gap-7">
            {isCarer && (
              <button
                className="px-4 py-2 rounded-md font-semibold text-black"
                style={{ backgroundColor: '#FFA94D' }}
                onClick={() => router.push('/calendar_dashboard/budget_report/add_transaction')}
              >
                Add new transaction
              </button>
            )}
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none focus:outline-none w-56 text-black text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-auto">
          {loading ? (
            <div className="p-6 text-gray-600">Loading transactions…</div>
          ) : errorText ? (
            <div className="p-6 text-red-600">{errorText}</div>
          ) : (
            <table className="w-full border-collapse text-sm text-black">
              <thead className="sticky top-0 bg-[#F9C9B1] shadow-sm">
                <tr className="text-left">
                  <th className="p-5">Type</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Made By</th>
                  <th className="p-5">Category</th>
                  <th className="p-5">Item</th>
                  <th className="p-5">Amount</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-[#fff6ea] transition">
                      <td className="p-5 font-semibold">{t.type}</td>
                      <td className="p-5">{t.date}</td>
                      <td className="p-5">{t.madeBy}</td>
                      <td className="p-5">{t.category}</td>
                      <td className="p-5">{t.item}</td>
                      <td className="p-5">${Number(t.amount || 0).toLocaleString()}</td>

                      {/* Status */}
                      <td className="p-5">
                        {isManagement ? (
                          <div className="inline-flex items-center">
                            <select
                              value={t.status || 'Pending'}
                              onChange={(e) =>
                                updateStatus(t.id, e.target.value as 'Pending' | 'Approved' | 'Rejected')
                              }
                              className={statusSelectClass(t.status)}
                              aria-label="Change status"
                              title="Change status"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                            <SelectCaret />
                          </div>
                        ) : (
                          <Badge tone={statusTone(t.status)}>{t.status || 'Pending'}</Badge>
                        )}
                      </td>

                      {/* Receipt */}
                      <td className="p-5">
                        {t.receiptDataUrl ? (
                          <a
                            href={t.receiptDataUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={t.receiptFilename || 'receipt'}
                            className="underline hover:opacity-80"
                          >
                            {t.receiptFilename ? t.receiptFilename : 'Open receipt'}
                          </a>
                        ) : t.receiptFilename ? (
                          <a
                            href={`/receipts/${encodeURIComponent(t.receiptFilename)}`}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="underline hover:opacity-80"
                          >
                            {t.receiptFilename}
                          </a>
                        ) : (
                          <span className="text-black/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">No transactions for this client.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}
