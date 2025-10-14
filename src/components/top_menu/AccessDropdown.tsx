'use client';

import React, { useEffect, useState } from 'react';
import {
  getUsersWithAccessFE,
  type AccessUser,
} from '@/lib/mock/mockApi';

export default function AccessMenu({ clientId }: { clientId?: string | null }) {
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!clientId) return setUsers([]);
      setLoading(true);
      try {
        const data = await getUsersWithAccessFE(clientId);
        if (mounted) setUsers(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [clientId]);

  return (
    <div className="relative print:hidden">
      <details className="group">
        <summary className="inline-flex items-center gap-2 list-none cursor-pointer font-extrabold text-xl hover:underline">
          Users with access<span className="text-black/70">▼</span>
        </summary>

        <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 rounded-md border border-black/20 bg-white text-black shadow-2xl z-50">
          {loading ? (
            <div className="px-5 py-4 text-lg font-semibold">Loading…</div>
          ) : users.length === 0 ? (
            <div className="px-5 py-4 text-lg font-semibold text-black/70">
              No users found
            </div>
          ) : (
            <ul className="py-2">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="px-5 py-3 text-lg font-semibold hover:bg-black/5"
                >
                  {u.name} <span className="text-black/60">({u.role})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}
