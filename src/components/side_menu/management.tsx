/**
 * IMPORTANT: this component is no longer in use!!
 *
 * File path: /components/side_menu/management.tsx
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

type Item = { href: string; label: string };

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
  items?: Item[];
};

const palette = {
  pageBg: '#FAEBDC',
  panelBg: '#fdf4e7',
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
};

const defaultItems: Item[] = [
  { href: '/calendar_dashboard/update_details', label: 'Manage your account' },

  // decision need to be made:

  // option 1. path before select client: need to search carer first (or via search from staff list)
  {
    href: '/management_dashboard/assign_carer/search',
    label: 'Manage Carer Assignment',
  },

  // option 2. path after select client: don't need the search page ( or could add 'manage carer access' button on the client list page)
  // { href: "/management_dashboard/assign_carer/manage", label: "Manage Carer access" },

  {
    href: '/management_dashboard/register_client',
    label: 'Register new client',
  },
  { href: '/management_dashboard/clients_list', label: 'List of clients' },
  { href: '/calendar_dashboard', label: 'Clients Schedule' },
  { href: '/management_dashboard/staff_list', label: 'List of staff' },
  { href: '/request-log-page', label: 'request log' },
];

export default function SideMenu({
  open,
  onClose,
  items = defaultItems,
}: SideMenuProps) {
  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // sign-out (mock first, else next-auth)
  const handleSignOut = async () => {
    const isMockEnv = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';
    const hasMockRole =
      typeof window !== 'undefined' &&
      (!!sessionStorage.getItem('mockRole') ||
        ['family', 'carer', 'management'].includes(
          (localStorage.getItem('activeRole') || '').toLowerCase()
        ));

    if (isMockEnv || hasMockRole) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      window.location.replace('/');
      return;
    }

    try {
      await signOut({ callbackUrl: '/' });
    } catch {
      window.location.replace('/');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed left-0 top-0 z-50 h-full w-[300px] max-w-[85vw] transform transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: palette.panelBg,
          borderRight: `3px solid ${palette.header}`,
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ backgroundColor: palette.header, color: palette.white }}
        >
          <div className="text-lg font-semibold">Menu</div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"
            aria-label="Close menu"
            title="Close"
          >
            ×
          </button>
        </div>

        <nav className="flex h-[calc(100%-72px)] flex-col justify-between">
          <ul className="px-3 py-4 space-y-2">
            {items.map((it) => (
              <MenuItem
                key={it.href}
                href={it.href}
                label={it.label}
                onClose={onClose}
              />
            ))}
          </ul>

          <div className="px-4 pb-6 flex justify-end pr-6">
            {/* Button ensures no <Link> routing interferes with logout */}
            <button
              onClick={handleSignOut}
              className="underline underline-offset-4 text-lg"
              style={{ color: palette.header }}
            >
              Sign out
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

function MenuItem({
  href,
  label,
  onClose,
}: {
  href: string;
  label: string;
  onClose: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className="block rounded-xl px-4 py-3 transition
                   hover:bg-[#EADBC4] focus-visible:bg-[#EADBC4] active:bg-[#E1D0B5]
                   outline-none"
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
