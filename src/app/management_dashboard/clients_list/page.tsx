/**
 * File path: src/app/client_list/page.tsx
 * Frontend Author: Qingyue Zhao
 *
 * Mode Safety:
 * - Mock mode (NEXT_PUBLIC_ENABLE_MOCK=1):
 *    • Pure frontend only — no backend requests.
 *    • Clients come from getClientsFE() in mockApi.
 *    • Organisation access is resolved by priority:
 *        1) FE store override: (clientId, currentOrgId) -> status
 *        2) client.orgAccess
 *        3) 'approved' fallback
 *    • "Request again" updates FE store to 'pending' and updates local UI.
 *    • List listens to 'storage' and visibility changes to refresh.
 * - Real mode:
 *    • Uses session.user.organisation and per-client fetches.
 *    • "Request again" POSTs to backend then refreshes.
 */

'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';

import DashboardChrome from '@/components/top_menu/client_schedule';
import RegisterClientPanel from '@/components/accesscode/registration';
import { useActiveClient } from '@/context/ActiveClientContext';

// ---- MOCK (FE) helpers ----
import {
  isMock,                 // boolean
  getClientsFE,           // FE-only client list
  getViewerRoleFE,        // FE-only role
  getCurrentOrgIdFE,      // FE-only: current org id
  getOrgStatusForClientFE,// FE-only: override status
  setOrgStatusForClientFE,// FE-only: set override status
  
  type Client as FEClient,
} from '@/lib/mock/mockApi';

// ---- REAL data helpers (backend mode) ----
import {
  getViewerRole,
  getClients,
  type Client as ApiClient,
} from '@/lib/data';

// ------------------ Types ------------------
type OrgAccess = 'approved' | 'pending' | 'revoked';

type Client = {
  id: string;
  name: string;
  dashboardType?: 'full' | 'partial';
  orgAccess: OrgAccess;
};

type OrgHistEntry = {
  status: OrgAccess;
  createdAt: string;
  updatedAt: string;
  organisation?: { _id: string; name: string };
};

type ClientWithOrgHist = ApiClient & {
  organisationHistory?: OrgHistEntry[];
};

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  banner: '#F9C9B1',
  header: '#3A0000',
  text: '#2b2b2b',
};

export default function ClientListPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading clients…</div>}>
      <ClientListInner />
    </Suspense>
  );
}

function ClientListInner() {
  const router = useRouter();
  const { handleClientChange } = useActiveClient();

  const [role, setRole] = useState<'carer' | 'family' | 'management'>('family');
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');

  const [denyOpen, setDenyOpen] = useState(false);
  const [denyTarget, setDenyTarget] = useState<string>('');
  const [denyReason, setDenyReason] = useState<OrgAccess>('pending');

  const [showRegister, setShowRegister] = useState(false);

  const [orgId, setOrgId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const latestStatus = (history?: OrgHistEntry[]): OrgAccess => {
    if (!history || history.length === 0) return 'approved';
    const latest = [...history].sort((a, b) => {
      const at = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bt = new Date(b.updatedAt ?? b.createdAt).getTime();
      return bt - at;
    })[0];
    return latest?.status ?? 'approved';
  };

  const loadClients = async (realOrgId?: string) => {
    setLoading(true);
    setErrorText(null);
    try {
      // role
      if (isMock) setRole(getViewerRoleFE());
      else setRole(await getViewerRole());

      // mock branch
      if (isMock) {
        const list = await getClientsFE();
        const currentOrgId = getCurrentOrgIdFE();

        const mapped: Client[] = (list as FEClient[]).map((c) => {
          const override = getOrgStatusForClientFE(c._id, currentOrgId) as OrgAccess | undefined;
          return {
            id: c._id,
            name: c.name,
            dashboardType: c.dashboardType,
            orgAccess: override ?? ((c.orgAccess as OrgAccess) ?? 'approved'),
          };
        });

        setClients(mapped);
        return;
      }

      // real branch
      const list: ClientWithOrgHist[] = await getClients();

      if (!realOrgId) {
        setErrorText('No organisation linked to this account.');
        setClients([]);
        return;
      }

      const mapped: Client[] = await Promise.all(
        list.map(async (c) => {
          const res = await fetch(
            `/api/v1/clients/${c._id}/organisations/${realOrgId}`,
            { cache: 'no-store' }
          );
          if (!res.ok) {
            return {
              id: c._id,
              name: c.name,
              dashboardType: c.dashboardType,
              orgAccess: 'pending',
            };
          }
          const history = (await res.json()) as OrgHistEntry[];
          return {
            id: c._id,
            name: c.name,
            dashboardType: c.dashboardType,
            orgAccess: latestStatus(history),
          };
        })
      );

      setClients(mapped);
    } catch (err) {
      console.error('Error loading clients.', err);
      setErrorText('Failed to load clients.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (isMock) {
        await loadClients();
        return;
      }
      const session = await getSession();
      const org = session?.user?.organisation as string | undefined;
      if (!org) {
        setErrorText('No organisation linked to this account.');
        setClients([]);
        return;
      }
      setOrgId(org);
      await loadClients(org);
    })();
  }, []);

  // listen to FE store updates (mock only)
  useEffect(() => {
    if (!isMock) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'orgStatusByClient') {
        loadClients();
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') loadClients();
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? clients.filter((c) => c.name.toLowerCase().includes(t)) : clients;
  }, [clients, q]);

  const tryOpenClient = (c: Client) => {
    if (c.orgAccess !== 'approved') {
      setDenyTarget(c.name);
      setDenyReason(c.orgAccess);
      setDenyOpen(true);
      return;
    }
    handleClientChange(c.id, c.name);
    router.push(`/client_profile?id=${c.id}`);
  };

  // mock: UI-only; real: POST then refresh
  const requestAccess = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (isMock) {
      const currentOrgId = getCurrentOrgIdFE();
      setOrgStatusForClientFE(id, currentOrgId, 'pending'); // override -> pending
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, orgAccess: 'pending' } : c))
      );
      return;
    }

    if (!orgId) {
      console.error('No organisation linked to this account.');
      return;
    }
    try {
      await fetch(`/api/v1/clients/${id}/organisations/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' }),
      });
      await loadClients(orgId);
    } catch (err) {
      console.error('Failed to request access.', err);
    }
  };

  return (
    <DashboardChrome
      page="client-list"
      clients={[]} // not used here
      onClientChange={(id) => {
        const c = clients.find((cl) => cl.id === id);
        if (c) {
          handleClientChange(c.id, c.name);
        }
      }}
      colors={{
        header: colors.header,
        banner: colors.banner,
        text: colors.text,
      }}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      <div className="w-full h-full" style={{ backgroundColor: colors.pageBg }}>
        <div className="max-w-[1380px] h-[680px] mx-auto px-6">
          <div
            className="w-full mt-6 rounded-t-xl px-6 py-4 text-white text-2xl md:text-3xl font-extrabold"
            style={{ backgroundColor: colors.header }}
          >
            Client List
          </div>

          <div
            className="w-full h-[calc(100%-3rem)] rounded-b-xl bg-[#f6efe2] border-x border-b flex flex-col"
            style={{ borderColor: '#3A000022' }}
          >
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="relative flex-1 max-w-[350px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for client"
                  className="w-full h-12 rounded-full bg-white border text-black px-10 focus:outline-none"
                  style={{ borderColor: '#3A0000' }}
                />
              </div>
              <button
                onClick={() => setShowRegister(true)}
                className="rounded-xl px-5 py-3 text-lg font-bold text-white hover:opacity-90"
                style={{ backgroundColor: colors.header }}
              >
                + Register new client
              </button>
            </div>

            <div className="flex-1 px-0 pb-6">
              <div
                className="mx-6 rounded-xl overflow-auto max-h-[500px]"
                style={{
                  backgroundColor: '#F2E5D2',
                  border: '1px solid rgba(58,0,0,0.25)',
                }}
              >
                {loading ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    Loading clients...
                  </div>
                ) : errorText ? (
                  <div className="h-full flex items-center justify-center text-red-600">
                    {errorText}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    No clients.
                  </div>
                ) : (
                  <ul className="divide-y divide-[rgba(58,0,0,0.15)]">
                    {filtered.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-5 px-6 py-6 hover:bg-[rgba(255,255,255,0.6)]"
                      >
                        <div
                          className="flex items-center gap-5 cursor-pointer"
                          onClick={() => tryOpenClient(c)}
                        >
                          <div
                            className="shrink-0 rounded-full flex items-center justify-center"
                            style={{
                              width: 64,
                              height: 64,
                              border: '4px solid #3A0000',
                              backgroundColor: '#fff',
                              color: '#3A0000',
                              fontWeight: 900,
                              fontSize: 20,
                            }}
                            aria-hidden
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex flex-col">
                            <div
                              className="text-xl md:text-2xl font-semibold"
                              style={{ color: colors.text }}
                            >
                              {c.name}
                            </div>
                            <div className="mt-1 text-sm flex items-center gap-2 text-black/70">
                              <span className="opacity-80">
                                Organisation access:
                              </span>
                              <AccessBadge status={c.orgAccess} />
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {c.orgAccess === 'approved' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                tryOpenClient(c);
                              }}
                              className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90"
                              style={{ backgroundColor: colors.header }}
                            >
                              View profile
                            </button>
                          )}

                          {c.orgAccess !== 'approved' && (
                            <>
                              {c.orgAccess === 'revoked' && (
                                <button
                                  onClick={(e) => requestAccess(e, c.id)}
                                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90"
                                  style={{ backgroundColor: colors.header }}
                                >
                                  Request again
                                </button>
                              )}
                              {c.orgAccess === 'pending' && (
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                                  style={{ backgroundColor: '#b07b7b', color: 'white', opacity: 0.9 }}
                                  disabled
                                >
                                  Request sent
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {denyOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-[92%] max-w-[520px] p-6 text-center">
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: colors.header }}
            >
              Access required
            </h3>
            {denyReason === 'pending' && (
              <p className="text-black/80">
                The request to access <b>{denyTarget}</b>’s profile is still pending.
                <br />
                Please wait until the family implements the request.
              </p>
            )}
            {denyReason === 'revoked' && (
              <p className="text-black/80">
                Access to <b>{denyTarget}</b> has been revoked.
                <br />
                To regain access, please submit a new request.
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                className="px-4 py-2 rounded-lg text-white font-semibold"
                style={{ backgroundColor: colors.header }}
                onClick={() => setDenyOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <RegisterClientPanel
        open={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </DashboardChrome>
  );
}

function AccessBadge({ status }: { status: OrgAccess }) {
  const cfg: Record<
    OrgAccess,
    { bg: string; dot: string; label: string; text: string }
  > = {
    approved: {
      bg: 'bg-green-100',
      dot: 'bg-green-500',
      label: 'Approved',
      text: 'text-green-800',
    },
    pending: {
      bg: 'bg-yellow-100',
      dot: 'bg-yellow-500',
      label: 'Pending',
      text: 'text-yellow-800',
    },
    revoked: {
      bg: 'bg-red-100',
      dot: 'bg-red-500',
      label: 'Revoked',
      text: 'text-red-800',
    },
  };
  const c = cfg[status];
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
