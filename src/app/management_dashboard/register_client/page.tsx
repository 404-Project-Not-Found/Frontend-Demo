/**
 * IMPORTANT: This page is no longer in use, refer to /components/accesscode/Registration.tsx
 * for the updated use and design.
 *
 * File path: /management_dashboard/register_client/page.tsx
 * Authors: Vanessa Teo & Denise Alexander
 * Date Created: 22/09/2025
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ----- Color palette -----
const palette = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  header: '#3A0000',
  text: '#2b2b2b',
  border: '#3A0000',
  help: '#ff9999',
  white: '#ffffff',
};

export default function RegisterClientPage() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const code = accessCode.trim();
    if (!code) {
      setError('Access code cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/v1/management/register_client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: code }), // Keep original payload
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to register client.');
      }

      // success
      setMessage(data?.message || 'Client registered successfully.');
      setAccessCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.cardBg, color: palette.text }}
    >
      {/* Header with logo */}
      <header className="w-full px-6 py-5 flex items-center">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={200}
          height={50}
          priority
        />
      </header>

      {/* Banner (maroon) */}
      <div
        className="w-full text-white"
        style={{ backgroundColor: palette.header }}
      >
        <div className="px-6 py-5 relative">
          <Link
            href="/empty_dashboard"
            aria-label="Back to Management Dashboard"
            className="absolute left-6 top-1/2 -translate-y-1/2 font-semibold tracking-wide
                       text-lg md:text-xl lg:text-2xl px-2 py-1 text-white"
          >
            {'<'} back
          </Link>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-center">
            Register Client with Access Code
          </h1>
        </div>
      </div>

      {/* Form */}
      <section className="flex-1 w-full flex justify-center px-6 py-25">
        <form onSubmit={onSubmit} className="w-full max-w-2xl space-y-9">
          {/* Alerts */}
          {error && (
            <div
              role="alert"
              className="mx-auto w-full max-w-2xl rounded-xl border px-4 py-3 shadow-sm text-xl"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.border,
                color: palette.text,
              }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              role="status"
              className="mx-auto w-full max-w-2xl rounded-xl border px-4 py-3 shadow-sm text-xl"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.border,
                color: palette.text,
              }}
            >
              {message}
            </div>
          )}

          {/* Access code (required) */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <label
              htmlFor="accessCode"
              className="md:w-1/3 text-lg md:text-xl font-medium flex items-center gap-2"
              style={{ color: palette.text }}
            >
              <span>Client Access Code</span>
              <InfoDot />
            </label>
            <input
              id="accessCode"
              name="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="md:flex-1 w-full rounded-xl border px-4 py-3 text-lg shadow-sm tracking-wide focus:outline-none focus:ring-4 focus:ring-zinc-300/50"
              style={{
                borderColor: palette.border,
                backgroundColor: palette.white,
                color: palette.text,
              }}
            />
          </div>

          {/* Actions */}
          <div className="mt-10 md:mt-16 flex items-center justify-center gap-[12px]">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full px-10 md:px-12 py-3 md:py-4 text-base md:text-xl
                         font-semibold text-white shadow-md transition active:scale-95
                         disabled:opacity-60 min-w-[200px]"
              style={{ backgroundColor: palette.header }}
            >
              {loading ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </section>

      <HelpButton />
    </main>
  );
}

function InfoDot({ title }: { title?: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[12px] leading-none select-none"
      style={{ backgroundColor: palette.help, color: palette.white }}
    >
      i
    </span>
  );
}

function HelpButton() {
  return (
    <Link
      href="" //need to add help info
      aria-label="QnA"
      className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg"
      title="QnA"
      style={{ backgroundColor: palette.help, color: palette.white }}
    >
      ?
    </Link>
  );
}
