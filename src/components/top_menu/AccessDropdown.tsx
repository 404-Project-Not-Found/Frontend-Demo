'use client';

import React, { useEffect, useState } from 'react';
import {
  // Users (already in your mockApi)
  getUsersWithAccessFE,
  type AccessUser,
  // ✅ Persisted org helpers
  getCurrentOrgIdFE,
  setCurrentOrgIdFE,
  seedOrgStatusDefaultsFE,
  // Optional: use mock orgs to render choices
  MOCK_ORGS,
} from '@/lib/mock/mockApi';

export default function AccessMenu({ clientId }: { clientId?: string | null }) {
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Persisted currently-selected organisation (defaults inside getCurrentOrgIdFE)
  const [currentOrgId, setCurrentOrgId] = useState<string>('org1');

  // ---------- init: read persisted org ----------
  useEffect(() => {
    setCurrentOrgId(getCurrentOrgIdFE());
  }, []);

  // ---------- load users for the given client ----------
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!clientId) {
        setUsers([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getUsersWithAccessFE(clientId);
        if (mounted) setUsers(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  // ---------- react if another tab changed the org ----------
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === '__org_touch__' || e.key === 'currentOrgId') {
        setCurrentOrgId(getCurrentOrgIdFE());
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        setCurrentOrgId(getCurrentOrgIdFE());
      }
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // ---------- select org and persist ----------
  const selectOrg = (orgId: string) => {
    setCurrentOrgIdFE(orgId);   // persist selection so refresh keeps it
    setCurrentOrgId(orgId);     // reflect immediately in this dropdown
    seedOrgStatusDefaultsFE();  // ensure per-client defaults exist for this org (no override)

    // ping other tabs/pages to re-hydrate
    try {
      localStorage.setItem('__org_touch__', String(Date.now()));
      localStorage.removeItem('__org_touch__');
    } catch {}
  };

  // Simple, compact button UI for org choices
  const OrgPicker = () => (
    <div className="px-5 py-4 border-b border-black/10">
      <div className="text-sm font-semibold mb-2 text-black/70">Organisation</div>
      <div className="flex flex-wrap gap-2">
        {(MOCK_ORGS ?? []).map((o) => (
          <button
            key={o.id}
            onClick={() => selectOrg(o.id)}
            className={`px-3 py-1.5 rounded border text-sm transition
              ${currentOrgId === o.id ? 'bg-black/10 border-black/30' : 'bg-white hover:bg-black/5 border-black/20'}`}
            title={o.name}
          >
            {o.name} {currentOrgId === o.id ? '✓' : ''}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative print:hidden">
      <details className="group">
        <summary className="inline-flex items-center gap-2 list-none cursor-pointer font-extrabold text-xl hover:underline select-none">
          Access menu <span className="text-black/70">▼</span>
        </summary>

        <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-96 rounded-md border border-black/20 bg-white text-black shadow-2xl z-50">
          {/* Organisation picker (persists across refresh) */}
          <OrgPicker />

          {/* Users with access */}
          <div className="px-5 py-3">
            <div className="text-sm font-semibold mb-2 text-black/70">Users with access</div>

            {loading ? (
              <div className="py-2 text-lg font-semibold">Loading…</div>
            ) : users.length === 0 ? (
              <div className="py-2 text-lg font-semibold text-black/70">No users found</div>
            ) : (
              <ul className="py-1 divide-y divide-black/10">
                {users.map((u) => (
                  <li key={u.id} className="py-2 text-lg font-semibold">
                    {u.name}{' '}
                    <span className="text-black/60">({u.role})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
