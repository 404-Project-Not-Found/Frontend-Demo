/**
 * IMPORTANT: this component is no longer in use!!
 *
 * File path: /components/side_menu/family.tsx
 * Author: Denise Alexander
 * Date Created: 25/09/2025
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

type Item = { href: string; label: string };

const palette = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#FAEBDC',
};

type sideMenuProps = {
  open: boolean;
  onBackdropClick: () => void;
  items?: Item[];
};

const defaultMenuItems: Item[] = [
  { href: '/calendar_dashboard/update_details', label: 'Manage your account' },
  { href: '/family_dashboard/people_list', label: 'My Clients' },
  {
    href: '/family_dashboard/request_of_change_page',
    label: 'Request to change a task',
  },
];

export default function FamilySideMenu({
  open,
  onBackdropClick,
  items = defaultMenuItems,
}: sideMenuProps) {
  // sign-out (mock first, else next-auth) ----
  const handleSignOut = async () => {
    const isMockEnv = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';
    const hasMockRole =
      typeof window !== 'undefined' &&
      (!!sessionStorage.getItem('mockRole') ||
        ['family', 'carer', 'management'].includes(
          (localStorage.getItem('activeRole') || '').toLowerCase()
        ));

    if (isMockEnv || hasMockRole) {
      // clear FE state and hard-redirect to login
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* ignore storage errors */
      }
      // use replace() to prevent back navigation into authed pages
      window.location.replace('/');
      return;
    }

    // Real next-auth logout (backend)
    try {
      await signOut({ callbackUrl: '/' });
    } catch {
      window.location.replace('/');
    }
  };

  return (
    <>
      {open && (
        <div
          onClick={onBackdropClick}
          className="fixed inset-0 z-30 bg-black/30"
          aria-hidden="true"
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed left-0 top-0 z-40 h-full w-[300px] max-w-[85vw] transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: palette.pageBg }}
      >
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          <div className="flex items-center gap-3">
            <HamburgerIcon size={22} color={palette.white} />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <button
            onClick={onBackdropClick}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
            aria-label="Close menu"
            title="Close"
          >
            ✕
          </button>
        </div>

        <nav className="flex h-[calc(100%-72px)] flex-col justify-between">
          <nav className="p-2 space-y-1">
            {items.map((it) => (
              <MenuItem key={it.href} href={it.href} label={it.label} />
            ))}
          </nav>

          <div className="px-4 pb-6 flex justify-end pr-6">
            {/* Button ensures no <Link> routing interferes with logout */}
            <button
              onClick={handleSignOut}
              className="underline underline-offset-4 focus:outline-none rounded text-lg"
              style={{ color: palette.header }}
            >
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

/* ===== Helper icons ===== */
function HamburgerIcon({
  size = 24,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function MenuItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-xl px-4 py-3 transition-colors outline-none hover:bg-[#EADBC4] focus-visible:bg-[#EADBC4] active:bg-[#E1D0B5]"
        style={{ color: palette.text }}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-full shrink-0 mt-[6px]"
            style={{ backgroundColor: '#FF5C5C' }}
          />
          <div className="text-lg font-medium leading-7">{label}</div>
        </div>
      </Link>
    </li>
  );
}
