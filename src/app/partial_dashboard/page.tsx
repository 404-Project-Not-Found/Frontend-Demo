/* Partial client dashboard before the management finishes the registration process */

'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const palette = {
  darkBg: '#ffd9b3',
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC',
};

export default function PartialDashboardPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-xl">Loading dashboard...</div>}
    >
      <PartialDashboardInner />
    </Suspense>
  );
}

function PartialDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');

  // Load name/dob from query; fallback to localStorage if absent
  useEffect(() => {
    const qName = searchParams.get('name');
    const qDob = searchParams.get('dob') || '';

    if (qName) {
      setName(qName);
      setDob(qDob);
      try {
        localStorage.setItem('currentClientName', qName);
        localStorage.setItem('currentClientDob', qDob);
      } catch {
        // ignore storage errors
      }
      return;
    }

    try {
      const savedName = localStorage.getItem('currentClientName');
      const savedDob = localStorage.getItem('currentClientDob') || '';
      if (savedName) {
        setName(savedName);
        setDob(savedDob);
      }
    } catch {
      // ignore storage errors
    }
  }, [searchParams]);

  // Navigate to client profile with the same name/dob as query
  function handleProfileClick() {
    const q = new URLSearchParams();
    if (name) q.set('name', name);
    if (dob) q.set('dob', dob);
    router.push(`/client_profile?${q.toString()}`);
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* Full-width header (no borders) */}
      <div
        className="w-full flex items-center justify-center px-8 py-5 relative"
        style={{ backgroundColor: palette.header, color: palette.white }}
      >
        {/* Back to list */}
        <button
          onClick={() => router.push('/family_dashboard/people_list')}
          className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 focus:outline-none"
          title="Back to client list"
          aria-label="Back"
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-lg md:text-xl">Back</span>
        </button>

        {/* Title — use your preferred wording */}
        <h2 className="text-2xl md:text-3xl font-bold">Client Dashboard</h2>

        {/* Right: quick profile link */}
        <div
          className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4 cursor-pointer"
          onClick={handleProfileClick}
          title="View profile"
        >
          <span className="text-lg md:text-xl">{name || '…'}</span>
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden">
            <Image
              src="/default_profile.png"
              alt="Default user avatar"
              width={56}
              height={56}
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Full-width banner (no borders) */}
      <div
        className="w-full px-6 md:px-8 py-5 md:py-6"
        style={{ backgroundColor: palette.banner }}
      >
        <p
          className="text-base md:text-lg leading-relaxed"
          style={{ color: palette.header }}
        >
          This dashboard currently has partial functionality until management
          completes the registration process for your person with special needs.
          You will receive an email once registration is complete and all the
          care items of this person will be shown on this page.
        </p>
      </div>

      {/* Content area (borderless, full-bleed section) */}
      <section className="w-full flex-1">
        <div className="w-full px-6 md:px-10 py-8 md:py-10">
          {/* TODO: put dashboard widgets here */}
        </div>
      </section>
    </div>
  );
}
