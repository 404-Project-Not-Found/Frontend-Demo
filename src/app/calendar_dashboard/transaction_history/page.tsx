'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
  getTransactionsFE,
} from '@/lib/mock/mockApi';

/** Data shape returned by getTransactionsFE() */
type ApiTransaction = {
  id: string;
  clientId: string;
  type: string;
  date: string;
  madeBy: string;
  items: string[];
  receipt: string;
};

const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#000000',
};

export default function TransactionHistoryPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading transactions…</div>}
    >
      <TransactionHistoryInner />
    </Suspense>
  );
}

function TransactionHistoryInner() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setRole(getViewerRoleFE());
  }, []);
  const isCarer = role === 'carer';
  /** ---------------------------------------------------------------- */

  // Clients for pink banner select
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');

  // Transactions
  const [rows, setRows] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Filters
  const [search, setSearch] = useState<string>('');

  /** Load clients */
  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped = list.map((c: ApiClient) => ({
          id: c._id,
          name: c.name,
        }));
        setClients(mapped);

        const { id, name } = readActiveClientFromStorage();
        const useId = id || mapped[0]?.id || null;
        const useName =
          name || (mapped.find((m) => m.id === useId)?.name ?? '');
        setActiveClientId(useId);
        setActiveClientName(useName);
      } catch {
        setClients([]);
      }
    })();
  }, []);

  /** Load transactions when active client changes */
  useEffect(() => {
    if (!activeClientId) {
      setRows([]);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorText('');
      try {
        const data = await getTransactionsFE(activeClientId);
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setErrorText('Failed to load transactions for this client.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeClientId]);

  /** Pink banner select  */
  const onClientChange = (id: string) => {
    const c = clients.find((x) => x.id === id) || null;
    const name = c?.name || '';
    setActiveClientId(id || null);
    setActiveClientName(name);
    writeActiveClientToStorage(id || '', name);
  };

  /** Filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) =>
      [t.type, t.date, t.madeBy, t.receipt, ...t.items]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      activeClientId={activeClientId}
      onClientChange={onClientChange}
      activeClientName={activeClientName}
      colors={colors}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      {/* Main content */}
      <div className="flex-1 h-[680px] bg-white/80 overflow-auto">
        {/* Header bar */}
        <div
          className="w-full flex items-center justify-between px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          {/* Left side: Title */}
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>

          {/* Right side: Add button + Search bar */}
          <div className="flex items-center gap-7">
            {isCarer && (
              <button
                className="px-4 py-2 rounded-md font-semibold text-black"
                style={{ backgroundColor: '#FFA94D' }}
                onClick={() =>
                  router.push(
                    '/calendar_dashboard/budget_report/add_transaction'
                  )
                }
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

        {/* Table full width */}
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
                  <th className="p-5">Receipt</th>
                  <th className="p-5">Associated Care Items</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b hover:bg-[#fff6ea] transition"
                    >
                      <td className="p-5 font-semibold">{t.type}</td>
                      <td className="p-5">{t.date}</td>
                      <td className="p-5">{t.madeBy}</td>
                      <td className="p-5">{t.receipt}</td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          {t.items.map((i, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2"
                            >
                              <span>{i}</span>
                              {isCarer && (
                                <button
                                  className="px-2 py-1 text-xs bg-[#3d0000] text-white rounded"
                                  onClick={() =>
                                    router.push('/calendar_dashboard')
                                  }
                                >
                                  View Care Item
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No transactions for this client.
                    </td>
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
