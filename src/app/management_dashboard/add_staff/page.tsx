/**
 * File path: /management_dashboard/add_staff/page.tsx
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterClientPage() {
  const [role, setRole] = useState<'management' | 'carer'>('carer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInviteCode(null);
    setLoading(true);

    try {
      // Call the api endpoint to generate invite
      const res = await fetch('/api/v1/management/generate_invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      // If api returns an error
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invite.');
      }

      // Invite code generated
      setInviteCode(data.invite.code);
    } catch (err) {
      // Handles errors
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#fff4e6] rounded-2xl shadow-md w-full max-w-lg border border-[#3d0000]/20">
        {/* Maroon header */}
        <h1 className="text-xl font-semibold px-6 py-4 bg-[#3d0000] text-white rounded-t-2xl">
          Generate staff invite code
        </h1>

        <form onSubmit={handleGenerate} className="p-6 space-y-5 text-black">
          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-md text-sm bg-rose-100 border border-rose-300 text-rose-700"
            >
              {error}
            </div>
          )}
          {inviteCode && (
            <div className="mb-4 px-4 py-3 rounded-md text-sm bg-green-100 border border-green-300 text-green-700">
              Invite Code: <strong>{inviteCode}</strong>. This code will
              automatically expire after 15 minutes.
            </div>
          )}
          <div>
            <label className="block mb-1 font-medium">Role</label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'management' | 'carer')
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="carer">Carer</option>
              <option value="management">Management</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/management_dashboard/staff_list')}
              className="px-4 py-2 rounded-md border hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-[#e07a5f] text-white font-semibold hover:bg-[#d06950]"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
