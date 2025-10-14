/**
 * File name: Request Log
 * File path: src/app/request-log-page/page.tsx
 * Frontend Author: Devni Wijesinghe
 *
 * - Uses <DashboardChrome /> to keep the same header + pink banner across the app.
 * - Loads the active client (from localStorage) and fetches that client's requests
 *   via getRequestsByClientFE(clientId). Switching the client in the pink banner
 *   reloads the table for the newly selected client.
 * - Management users can change the Status inline; the <select> is color-coded.
 * - The table section is flush to the white panel’s edges (no inner horizontal padding).
 */

'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
  getRequestsByClientFE,
} from '@/lib/mock/mockApi';

/** Data shape returned by getRequestsByClientFE() */
type ApiRequest = {
  id: string;
  clientId: string;
  task: string;
  change: string;
  requestedBy: string;
  dateRequested: string;
  status: 'Pending' | 'Implemented';
  resolutionDate: string;
};

const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#000000',
};

/* ---------------------------- Page wrapper ---------------------------- */
export default function RequestLogPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading requests…</div>}
    >
      <RequestLogInner />
    </Suspense>
  );
}

/* ----------------------------- Utilities ----------------------------- */
const parseDateString = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return new Date(0);
  const cleanStr = dateStr.replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const d = new Date(cleanStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

/** Utility for status color classes */
const statusClasses = (value: 'Pending' | 'Implemented') =>
  value === 'Pending'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
    : 'bg-green-100 text-green-800 border-green-300';

/* ------------------------------ Content ------------------------------ */
function RequestLogInner() {
  const router = useRouter();
  const role = getViewerRoleFE();
  const isManagement = role === 'management';

  // Clients for pink banner select
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');

  // Requests
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>('');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [sortKey, setSortKey] = useState<keyof ApiRequest | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  /** Load requests when active client changes */
  useEffect(() => {
    if (!activeClientId) {
      setRequests([]);
      return;
    }
    (async () => {
      setLoading(true);
      setErrorText('');
      try {
        const data = await getRequestsByClientFE(activeClientId);
        setRequests(Array.isArray(data) ? data : []);
      } catch {
        setErrorText('Failed to load requests for this client.');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeClientId]);

  /** Pink banner select */
  const onClientChange = (id: string) => {
    const c = clients.find((x) => x.id === id) || null;
    const name = c?.name || '';
    setActiveClientId(id || null);
    setActiveClientName(name);
    writeActiveClientToStorage(id || '', name);
  };

  /** Filter + sort */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [
        r.task,
        r.change,
        r.requestedBy,
        r.dateRequested,
        r.status,
        r.resolutionDate,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [requests, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: string | number;
      let vb: string | number;

      if (sortKey === 'dateRequested' || sortKey === 'resolutionDate') {
        va = parseDateString(a[sortKey]).getTime();
        vb = parseDateString(b[sortKey]).getTime();
      } else {
        va = String(a[sortKey]).toLowerCase();
        vb = String(b[sortKey]).toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: keyof ApiRequest) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /** Inline status change (Management only) */
  const handleStatusChange = (reqId: string, next: 'Pending' | 'Implemented') => {
    if (!isManagement) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id !== reqId
          ? r
          : {
              ...r,
              status: next,
              resolutionDate:
                next === 'Implemented'
                  ? new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '-',
            }
      )
    );
  };

  return (
    <DashboardChrome
      page="request-log"
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
          <h1 className="text-2xl font-bold text-white">Request Log</h1>
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

        {/* Table full width */}
        <div className="w-full overflow-auto">
          {loading ? (
            <div className="p-6 text-gray-600">Loading requests…</div>
          ) : errorText ? (
            <div className="p-6 text-red-600">{errorText}</div>
          ) : (
            <table className="w-full border-collapse text-sm text-black">
              <thead className="sticky top-0 bg-[#F9C9B1] shadow-sm">
                <tr className="text-left">
                  <th
                    className="p-5 cursor-pointer"
                    onClick={() => toggleSort('task')}
                  >
                    Task{' '}
                    {sortKey === 'task'
                      ? sortDir === 'asc'
                        ? '⬆'
                        : '⬇'
                      : '⬍'}
                  </th>
                  <th className="p-5">Requested Change</th>
                  <th
                    className="p-5 cursor-pointer"
                    onClick={() => toggleSort('requestedBy')}
                  >
                    Requested By{' '}
                    {sortKey === 'requestedBy'
                      ? sortDir === 'asc'
                        ? '⬆'
                        : '⬇'
                      : '⬍'}
                  </th>
                  <th
                    className="p-5 cursor-pointer"
                    onClick={() => toggleSort('dateRequested')}
                  >
                    Date Requested{' '}
                    {sortKey === 'dateRequested'
                      ? sortDir === 'asc'
                        ? '⬆'
                        : '⬇'
                      : '⬍'}
                  </th>
                  <th
                    className="p-5 cursor-pointer"
                    onClick={() => toggleSort('status')}
                  >
                    Status{' '}
                    {sortKey === 'status'
                      ? sortDir === 'asc'
                        ? '⬆'
                        : '⬇'
                      : '⬍'}
                  </th>
                  <th className="p-5">Resolution Date</th>
                </tr>
              </thead>

              <tbody>
                {sorted.length > 0 ? (
                  sorted.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b hover:bg-[#fff6ea] transition"
                    >
                      <td className="p-5 font-semibold">{req.task}</td>
                      <td className="p-5">{req.change}</td>
                      <td className="p-5">{req.requestedBy}</td>
                      <td className="p-5">{req.dateRequested}</td>
                      <td className="p-5">
                        {isManagement ? (
                          <select
                            value={req.status}
                            onChange={(e) =>
                              handleStatusChange(
                                req.id,
                                e.target.value as 'Pending' | 'Implemented'
                              )
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(
                              req.status
                            )}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Implemented">Implemented</option>
                          </select>
                        ) : req.status === 'Pending' ? (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                            Pending
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                            Implemented
                          </span>
                        )}
                      </td>
                      <td className="p-5">{req.resolutionDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No requests for this client.
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
