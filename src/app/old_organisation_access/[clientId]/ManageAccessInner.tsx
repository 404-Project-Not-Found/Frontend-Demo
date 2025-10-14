/**
 * IMPORTANT: this page is no longer in use!!
 * Updated version in under /family_dashboard_manage_org_access/[clientId]
 *
 * File path: /family_dashboard/manage_organisation_access/[clientId]/ManageAccessInner.tsx
 * Authors: Qingyue Zhao and Denise Alexander
 * Last Update: 2025-10-03
 *
 * Changes:
 * - Switched to shared DashboardChrome (header + banner).
 * - Full-bleed content (no card borders / rounded panels).
 * - Section header + notice bar consistent with other family pages.
 * - Client dropdown in banner shows only this Client and allows switching.
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { isMock, type Organisation } from '@/lib/mock/mockApi';

interface ClientDoc {
  id: string;
  name: string;
}

const colors = {
  pageBg: '#ffd9b3',
  header: '#3A0000',
  notice: '#F9C9B1',
  text: '#2b2b2b',
};

export default function ManageAccessInner({
  client,
  initialOrgs,
}: {
  client: ClientDoc;
  initialOrgs: Organisation[];
}) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organisation[]>(initialOrgs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Provide a single-item client list to DashboardChrome so the banner dropdown works sensibly
  const chromeClients = useMemo(
    () => [{ id: client.id, name: client.name }],
    [client.id, client.name]
  );

  async function updateOrgStatus(
    orgId: string,
    action: 'approve' | 'reject' | 'revoke'
  ) {
    // ---- Mock path: update UI only
    if (isMock) {
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === orgId
            ? { ...o, status: action === 'approve' ? 'active' : 'revoked' }
            : o
        )
      );
      return;
    }

    // ---- Real backend path
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/clients/${client.id}/organisations/${orgId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || 'Failed to update organisations');

      setOrgs((prev) =>
        prev.map((o) =>
          o.id === orgId
            ? { ...o, status: action === 'approve' ? 'active' : 'revoked' }
            : o
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardChrome
      page="organisation-access"
      clients={chromeClients}
      activeClientId={client.id}
      onClientChange={(id) =>
        router.push(`/family_dashboard/manage_organisation_access/${id}`)
      }
      activeClientName={client.name}
      colors={{
        header: colors.header,
        banner: colors.notice,
        text: colors.text,
      }}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      {/* Full-bleed page body under chrome */}
      <div className="w-full h-full" style={{ backgroundColor: colors.pageBg }}>
        <div className="w-full h-full]">
          {/* Section header with Back button */}
          <div
            className="w-full px-6 py-4 flex items-center justify-between text-white text-2xl md:text-3xl font-extrabold"
            style={{ backgroundColor: colors.header }}
          >
            <span>Manage Organisation Access</span>
            <button
              onClick={() => router.push('/family_dashboard/people_list')}
              className="text-base md:text-lg font-semibold bg-white/10 px-4 py-1.5 rounded hover:bg-white/20 transition"
            >
              &lt; Return
            </button>
          </div>

          {/* Content area (no panels/borders; fills remaining height) */}
          <div
            className="w-full h-[630px] rounded-b-xl bg-[#f6efe2] border-x border-b flex flex-col"
            style={{ borderColor: 'transparent' }} // visually remove outer borders
          >
            {/* Notice bar */}
            <div
              className="w-full px-5 py-3 text-black"
              style={{ backgroundColor: colors.notice }}
            >
              <p className="text-center font-semibold">
                Privacy Notice: This information is visible only to you (family
                / POA) and will not be shared with anyone.
              </p>
            </div>

            {/* Lists: full-width, no inner card borders */}
            <div className="flex-1 px-6 py-6 pb-6 overflow-auto text-black">
              <Group
                title="Organisations with Access"
                items={orgs.filter((o) => o.status === 'active')}
                onRevoke={(id) => updateOrgStatus(id, 'revoke')}
              />
              <hr className="my-5 border-black" />
              <Group
                title="Organisations who have Requested Access"
                items={orgs.filter((o) => o.status === 'pending')}
                onApprove={(id) => updateOrgStatus(id, 'approve')}
                onRemove={(id) => updateOrgStatus(id, 'reject')}
              />
              <hr className="my-5 border-black" />
              <Group
                title="Revoked Organisations"
                items={orgs.filter((o) => o.status === 'revoked')}
              />
            </div>
          </div>

          {/* Loading / error lightweight handling */}
          {loading && <div className="mt-3 text-black/70 px-6">Updating…</div>}
          {error && (
            <div className="mt-3 text-red-600 px-6">Error: {error}</div>
          )}
        </div>
      </div>
    </DashboardChrome>
  );
}

/* ---------- Group list block (full-width, no card styling) ---------- */
function Group({
  title,
  items,
  onRevoke,
  onRemove,
  onApprove,
}: {
  title: string;
  items: Organisation[];
  onRevoke?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApprove?: (id: string) => void;
}) {
  return (
    <section className="text-base">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="text-slate-600">None</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex text-lg items-center justify-between"
            >
              <div>{item.name}</div>
              <div className="flex items-center gap-3 ">
                {item.status === 'active' && onRevoke && (
                  <button
                    onClick={() => onRevoke(item.id)}
                    className="px-4 py-1.5 rounded-xl text-lg font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                  >
                    Revoke
                  </button>
                )}
                {item.status === 'pending' && (
                  <>
                    {onApprove && (
                      <button
                        onClick={() => onApprove(item.id)}
                        className="px-4 py-1.5 rounded-xl text-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => onRemove(item.id)}
                        className="px-4 py-1.5 rounded-xl text-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
