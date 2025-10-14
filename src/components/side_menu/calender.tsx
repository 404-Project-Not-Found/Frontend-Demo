/**
 * IMPORTANT: THIS FILE IS NO LONGER IN USE, CHANGE TO components/top_menu INSTEAD
 *
 * File path: /app/menu/page.tsx
 * Author: Qingyue Zhao
 * Date Created: 01/10/2025
 *
 * Description:
 * - Implements a reusable left-side Menu Drawer for role-based navigation.
 * - Supports three viewer roles: 'carer', 'family', and 'management'.
 *
 * Features:
 * - Common navigation items: Budget Report, Transaction History. (for all users)
 * - Carer-only item: Manage your account (update details).
 * - Management-only items: Manage tasks, Add new task.
 *
 * Notes:
 *  Some options for family and management are shown on their empty dashboard.
 *  Need to decide whether they should also be shown on the calendar dashboard.
 * （see comments for menu options below)
 */

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { mockSignOut } from '@/lib/mock/mockSignout';

const palette = {
  panelBg: '#F7ECD9',
  header: '#4A0A0A',
  text: '#2b2b2b',
  white: '#FFFFFF',
};

/* ================= Reusable Menu Drawer ================= */
export function MenuDrawer({
  open,
  onClose,
  viewer, // optional: 'carer' | 'family' | 'management'
}: {
  open: boolean;
  onClose: () => void;
  viewer?: 'carer' | 'family' | 'management';
}) {
  // Close drawer with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Detect "family" viewer even if prop not provided
  const isFamilyViewer =
    viewer === 'family' ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem('activeRole') || '').toLowerCase() === 'family');

  // Detect "management" viewer
  const isManagementViewer =
    viewer === 'management' ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem('activeRole') || '').toLowerCase() ===
        'management');

  // Detect "management" viewer
  const isCarerViewer =
    viewer === 'carer' ||
    (typeof window !== 'undefined' &&
      (localStorage.getItem('activeRole') || '').toLowerCase() === 'carer');

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
        style={{
          backgroundColor: palette.panelBg,
          borderRight: `3px solid ${palette.header}`,
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          <div className="flex items-center gap-3">
            <HamburgerIcon size={22} color={palette.white} />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex h-[calc(100%-56px)] flex-col justify-between">
          <ul className="px-3 py-4 space-y-2">
            {/* Existing items for all user */}

            <MenuItem
              href="/calendar_dashboard/budget_report"
              label="Budget Report"
            />
            <MenuItem
              href="/calendar_dashboard/transaction_history"
              label="View Transactions"
            />

            {/* Extra entries only for CARER viewer */}
            {isCarerViewer && (
              <MenuItem
                href="/calendar_dashboard/update_details"
                label="Manage your account"
              />
            )}

            {/* Extra entries only for FAMILY viewer */}
            {isFamilyViewer && (
              <>
                {/* <MenuItem
                  href="/people_list" 
                  label="Manage people with special needs"
                /> */}
              </>
            )}

            {/* Extra entry only for MANAGEMENT viewer */}
            {isManagementViewer && (
              <>
                {/* <MenuItem
                  href="/assign_carer"
                  label="Manage carer assignment"
                /> */}
                <MenuItem
                  href="/management_dashboard/manage_care_item/add"
                  label="Add new care item"
                />
                <MenuItem
                  href="/management_dashboard/manage_care_item/edit"
                  label="Edit care item"
                />
              </>
            )}
          </ul>

          <div className="px-4 pb-6 flex justify-end pr-6">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                mockSignOut();
              }}
              className="underline underline-offset-4 focus:outline-none rounded text-lg"
              style={{ color: palette.header }}
            >
              Sign out
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

export default function MenuPage() {
  const [open, setOpen] = React.useState(true);
  return <MenuDrawer open={open} onClose={() => setOpen(false)} />;
}

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
        className="block rounded-xl px-4 py-3 transition-colors outline-none
                   hover:bg-[#EADBC4] focus-visible:bg-[#EADBC4] active:bg-[#E1D0B5]"
        style={{ color: palette.text }}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: '#FF5C5C' }}
          />
          <div className="text-lg font-medium">{label}</div>
        </div>
      </Link>
    </li>
  );
}
