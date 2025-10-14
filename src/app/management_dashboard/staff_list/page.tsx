'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';

import DashboardChrome from '@/components/top_menu/client_schedule';
import RegisterClientPanel from '@/components/accesscode/registration';
import GenerateCode from '@/components/accesscode/generate-code';
import { useActiveClient } from '@/context/ActiveClientContext';
import {
  getViewerRole,
  getClients,
  type Client as ApiClient,
} from '@/lib/data';

// ------------------ Type Definitions ------------------
type OrgAccess = 'approved' | 'pending' | 'revoked';

// Client type for front-end usage
type Client = {
  id: string;
  name: string;
  dashboardType?: 'full' | 'partial';
  orgAccess: OrgAccess;
};
// Organisation history entry returned by API
type OrgHistEntry = {
  status: OrgAccess;
  createdAt: string;
  updatedAt: string;
  organisation?: { _id: string; name: string };
};
// Extended client type with optional organisation history
type ClientWithOrgHist = ApiClient & {
  organisationHistory?: OrgHistEntry[];
};

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  banner: '#F9C9B1',
  header: '#3A0000',
  text: '#2b2b2b',
  help: '#ff9999',
};

export default function ClientListPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading clients…</div>}
    >
      <ClientListInner />
    </Suspense>
  );
}

function ClientListInner() {
  const router = useRouter();
  const [showGenerate, setShowGenerate] = useState(false);

  const { handleClientChange } = useActiveClient();

  // ---- Current viewer role (carer / family / management) ----
  const [role, setRole] = useState<'carer' | 'family' | 'management'>('family');

  // ---- Clients state ----
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');

  // ---- Modal: access denied ----
  const [denyOpen, setDenyOpen] = useState(false);
  const [denyTarget, setDenyTarget] = useState<string>('');
  const [denyReason, setDenyReason] = useState<OrgAccess>('pending');

  // ---- Drawer: register new client ----
  const [showRegister, setShowRegister] = useState(false);
  const addNewClient = () => setShowRegister(true);

  const [orgId, setOrgId] = useState<string | undefined>();

  // ---- Load clients ----
  const loadClients = async (orgId: string) => {
    try {
      // Current user's role
      const viewerRole = await getViewerRole();
      setRole(viewerRole);

      // Fetches all clients
      const list: ClientWithOrgHist[] = await getClients();

      // Maps clients to include their latest organisation status
      const mapped: Client[] = await Promise.all(
        list.map(async (c) => {
          const res = await fetch(
            `/api/v1/clients/${c._id}/organisations/${orgId}`
          );
          const history = (await res.json()) as OrgHistEntry[];

          // Sort by updatedAt or createdAt descending
          const latestOrg = history.sort((a, b) => {
            const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
            const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
            return bTime - aTime;
          })[0];
          return {
            id: c._id,
            name: c.name,
            dashboardType: c.dashboardType,
            orgAccess: latestOrg?.status ?? 'pending',
          };
        })
      );
      // Update state with mapped clients
      setClients(mapped);
    } catch (err) {
      console.error('Error loading clients.', err);
      setClients([]);
    }
  };

  // --- Fetches oragnisation ID and loads clients on mount ---
  useEffect(() => {
    const fetchOrgId = async () => {
      const session = await getSession();
      const orgId = session?.user?.organisation as string | undefined;

      if (!orgId) {
        console.error('No organisation linked to this account.');
        return;
      }

      setOrgId(orgId);

      await loadClients(orgId);
    };

    fetchOrgId();
  }, []);

  // ---- Search filter ----
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? clients.filter((c) => c.name.toLowerCase().includes(t))
      : clients;
  }, [clients, q]);

  // ---- Navigation guard ----
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

  // ---- Management: request access again ----
  const requestAccess = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
      page="staff-list"
      headerTitle="Staff Schedule"
      navItems={[
        { label: 'Staff List', href: '/management_dashboard/staff_list' },
        {
          label: 'Assign Carer',
          href: '/management_dashboard/assign_carer/manage',
        },
      ]}
      showClientPicker={false}
      bannerTitle=""
      clients={[]}
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
      {/* Page body */}
      <div className="w-full h-full" style={{ backgroundColor: colors.pageBg }}>
        <div className="max-w-[1380px] h-[680px] mx-auto px-6">
          {/* Section title */}
          <div
            className="w-full mt-6 rounded-t-xl px-6 py-4 text-white text-2xl md:text-3xl font-extrabold"
            style={{ backgroundColor: colors.header }}
          >
            Staff List
          </div>

          {/* Controls + List */}
          <div
            className="w-full h-[calc(100%-3rem)] rounded-b-xl bg-[#f6efe2] border-x border-b flex flex-col"
            style={{ borderColor: '#3A000022' }}
          >
            {/* Controls */}
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              {/* Search bar */}
              <div className="relative flex-1 max-w-[350px]">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for staff"
                  className="w-full h-12 rounded-full bg-white border text-black px-10 focus:outline-none"
                  style={{ borderColor: '#3A0000' }}
                />
              </div>
              {/* CTA: Register new client */}
              <button
                onClick={() => setShowGenerate(true)}
                className="rounded-xl px-5 py-3 text-lg font-bold text-white hover:opacity-90"
                style={{ backgroundColor: colors.header }}
              >
                + Generate staff invite code
              </button>
              <GenerateCode
                open={showGenerate}
                onClose={() => setShowGenerate(false)}
              />
            </div>

            {/* List area */}
            <div className="flex-1 px-0 pb-6">
              <div
                className="mx-6 rounded-xl overflow-auto max-h-[500px]"
                style={{
                  backgroundColor: '#F2E5D2',
                  border: '1px solid rgba(58,0,0,0.25)',
                }}
              >
                {filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    Loading staffs...
                  </div>
                ) : (
                  <ul className="divide-y divide-[rgba(58,0,0,0.15)]">
                    {filtered.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-5 px-6 py-6 hover:bg-[rgba(255,255,255,0.6)]"
                      >
                        {/* Left: avatar + name */}
                        <div
                          className="flex items-center gap-5 cursor-pointer"
                          onClick={() => tryOpenClient(c)}
                        >
                          {/* Avatar circle */}
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

                          {/* Name + access badge */}
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

                        {/* Right-side actions */}
                        <div className="shrink-0 flex items-center gap-2">
                          {/* Approved -> View profile */}
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

                          {/* Management actions (non-approved only) */}
                          {c.orgAccess !== 'approved' && (
                            <>
                              {c.orgAccess === 'revoked' && (
                                <button
                                  onClick={(e) => requestAccess(e, c.id)}
                                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90"
                                  style={{ backgroundColor: colors.header }}
                                >
                                  Request
                                </button>
                              )}
                              {c.orgAccess === 'pending' && (
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                                  style={{
                                    backgroundColor: '#b07b7b',
                                    color: 'white',
                                    opacity: 0.9,
                                  }}
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

      {/* ---- Access denied modal ---- */}
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
                Your request to access <b>{denyTarget}</b>’s profile is still
                pending.
                <br />
                Please wait until the family approves your request.
              </p>
            )}
            {denyReason === 'revoked' && (
              <p className="text-black/80">
                Your access to <b>{denyTarget}</b> has been revoked.
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

      {/* Right-side registration drawer */}
      <RegisterClientPanel
        open={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </DashboardChrome>
  );
}

/* ---- Badge component: shows access status visually ---- */
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
