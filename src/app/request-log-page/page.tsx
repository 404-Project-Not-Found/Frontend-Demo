/**
 * File path: /src/app/request-log-page/page.tsx
 * Frontend Author: Devni Wijesinghe (refactor by QZ)
 * Last Update: 2025-10-15
 *
 * Notes:
 * - Click Title => open modal (wide horizontal card) showing Details & Reason (read-only).
 * - Modal header uses brown banner; backdrop is black translucent; ESC/Backdrop/✕/Close to dismiss.
 * - Strong typing with RequestLogWithText; no `as any`.
 * - Backward-compat parsing: if old records glued Reason into detail, extract them.
 */

'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
  getRequestsByClientFE,
  setRequestStatusFE,
  type RequestLogFE,
} from '@/lib/mock/mockApi';

type RequestLogWithText = RequestLogFE & { detail?: string; reason?: string };

const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
const normalize = (inList: unknown): RequestLogWithText[] => {
  if (!isArr(inList)) return [];
  return (inList as any[]).map((r) => normalizeOne(r));
};

const splitCombined = (txt: string) => {
  // Accept both "Reason:" 或 "Reason："
  const m = txt.split(/\n+\s*Reason[:：]\s*/i);
  if (m.length >= 2) {
    return { detail: m[0].replace(/^Details[:：]\s*/i, '').trim(), reason: m.slice(1).join('\n').trim() };
  }
  return { detail: txt.trim(), reason: undefined as string | undefined };
};

const normalizeOne = (raw: any): RequestLogWithText => {
  let detail: string | undefined = raw?.detail;
  let reason: string | undefined = raw?.reason;
  if (!reason && typeof detail === 'string' && /Reason[:：]/i.test(detail)) {
    const s = splitCombined(detail);
    detail = s.detail;
    reason  = s.reason;
  }
  return {
    ...raw,
    detail,
    reason,
  } as RequestLogWithText;
};

const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#000000',
};

// Map status → bg/text utility classes for both chip and <select>
const statusStyle = (s: RequestLogFE['status']) => {
  switch (s) {
    case 'Approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Rejected':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Pending
  }
};

export default function RequestLogPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading requests…</div>}>
      <RequestLogInner />
    </Suspense>
  );
}

function RequestLogInner() {
  const router = useRouter();
  const role = getViewerRoleFE();
  const isManagement = role === 'management';

  // Clients for pink banner select (shared pattern)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');

  // Requests
  const [requests, setRequests] = useState<RequestLogWithText[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>('');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [sortKey, setSortKey] = useState<keyof RequestLogFE | 'createdAtLocal' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Modal
  const [modalReq, setModalReq] = useState<RequestLogWithText | null>(null);

  /** Load clients + active client */
  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped = list.map((c: ApiClient) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        const { id, name } = readActiveClientFromStorage();
        const useId = id || mapped[0]?.id || null;
        const useName = name || (mapped.find((m) => m.id === useId)?.name ?? '');
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
        const raw = await getRequestsByClientFE(activeClientId);
        setRequests(normalize(raw));
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

  /** Helpers for sorting */
  const getFieldString = (obj: RequestLogWithText, key: keyof RequestLogFE): string => {
    const value = obj[key as keyof RequestLogWithText];
    return String(value ?? '').toLowerCase();
  };

  /** Search filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [
        r.title,
        r.detail ?? '',
        r.createdBy,
        r.category ?? '',
        r.priority ?? '',
        r.status,
        r.createdAt,
        r.reason ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [requests, search]);

  /** Sorting */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: number | string;
      let vb: number | string;

      if (sortKey === 'createdAt' || sortKey === 'createdAtLocal') {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
      } else {
        va = getFieldString(a, sortKey);
        vb = getFieldString(b, sortKey);
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: keyof RequestLogFE | 'createdAtLocal') => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /** Inline status change (Management only) — color-coded select */
  const handleStatusChange = async (reqId: string, next: RequestLogFE['status']) => {
    if (!isManagement) return;
    // Optimistic UI
    setRequests((prev) => prev.map((r) => (r.id !== reqId ? r : { ...r, status: next })));
    try {
      await setRequestStatusFE(reqId, next);
    } catch {
      // rollback on error
      setRequests((prev) => prev.map((r) => (r.id !== reqId ? r : { ...r, status: 'Pending' })));
    }
  };

  // Little helper to compose <select> class with current color
  const selectClass = (s: RequestLogFE['status']) =>
    `rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle(s)} hover:brightness-[0.98]`;

  // For non-management read view (chip)
  const statusChip = (s: RequestLogFE['status']) => (
    <span className={`${statusStyle(s)} px-3 py-1 rounded-full text-xs font-bold`}>{s}</span>
  );

  // -------- Modal helpers --------
  const openModal = useCallback((req: RequestLogWithText) => setModalReq(req), []);
  const closeModal = useCallback(() => setModalReq(null), []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  return (
    <DashboardChrome
      page="request-log"
      clients={clients}
      onClientChange={onClientChange}
      colors={colors}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      {/* Main content */}
      <div className="flex-1 h-[680px] bg-white/80 overflow-auto">
        {/* Header bar */}
        <div className="w-full flex items-center justify-between px-6 py-5" style={{ backgroundColor: colors.header }}>
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
                  <th className="p-5 cursor-pointer" onClick={() => toggleSort('title')}>
                    Title {sortKey === 'title' ? (sortDir === 'asc' ? '⬆' : '⬇') : '⬍'}
                  </th>
                  <th className="p-5">Category</th>
                  <th className="p-5 cursor-pointer" onClick={() => toggleSort('createdBy')}>
                    Created By {sortKey === 'createdBy' ? (sortDir === 'asc' ? '⬆' : '⬇') : '⬍'}
                  </th>
                  <th className="p-5 cursor-pointer" onClick={() => toggleSort('createdAt')}>
                    Created At {sortKey === 'createdAt' ? (sortDir === 'asc' ? '⬆' : '⬇') : '⬍'}
                  </th>
                  <th className="p-5 cursor-pointer" onClick={() => toggleSort('status')}>
                    Status {sortKey === 'status' ? (sortDir === 'asc' ? '⬆' : '⬇') : '⬍'}
                  </th>
                  <th className="p-5 cursor-pointer" onClick={() => toggleSort('priority')}>
                    Priority {sortKey === 'priority' ? (sortDir === 'asc' ? '⬆' : '⬇') : '⬍'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length > 0 ? (
                  sorted.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b transition hover:bg-[#fff0e6]"  /* row hover */
                    >
                      <td className="p-5 font-semibold">
                        {/* Click title → open modal (Details & Reason) */}
                        <button
                          onClick={() => openModal(req)}
                          className="rounded px-1 underline underline-offset-2 decoration-[#3A0000] hover:bg-[#ffe7d5] hover:no-underline"
                          title="Show details"
                        >
                          {req.title}
                        </button>
                      </td>
                      <td className="p-5">{req.category || '-'}</td>
                      <td className="p-5">{req.createdBy}</td>
                      <td className="p-5">
                        {new Date(req.createdAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-5">
                        {isManagement ? (
                          <select
                            value={req.status}
                            onChange={(e) => handleStatusChange(req.id, e.target.value as RequestLogFE['status'])}
                            className={selectClass(req.status)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        ) : (
                          statusChip(req.status)
                        )}
                      </td>
                      <td className="p-5">{req.priority || '-'}</td>
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

      {/* -------- Modal (Details & Reason) -------- */}
      {modalReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-labelledby="req-modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop: darker, with slight blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" onClick={closeModal} />

          {/* Wide horizontal card  */}
          <div className="relative z-10 w-[min(800px,96vw)] max-h-[82vh] overflow-auto rounded-2xl bg-white shadow-2xl">
            {/* Brown banner header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: colors.header }}>
              <h2 id="req-modal-title" className="text-lg font-bold text-white">
                {modalReq.title}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-md px-3 py-1 text-sm font-medium text-white/90 hover:bg-white/10"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body: two-column horizontal layout */}
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Created By</div>
                  <div className="font-medium">{modalReq.createdBy}</div>
                </div>
                <div>
                  <div className="text-gray-500">Created At</div>
                  <div className="font-medium">
                    {new Date(modalReq.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* Horizontal content blocks */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Details</div>
                  <div className="rounded-lg border p-4 bg-gray-50 whitespace-pre-wrap min-h-[120px]">
                    {modalReq.detail ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Reason</div>
                  <div className="rounded-lg border p-4 bg-gray-50 whitespace-pre-wrap min-h-[120px]">
                    {modalReq.reason ?? '—'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:opacity-80"
                  style={{ backgroundColor: colors.header }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardChrome>
  );
}
