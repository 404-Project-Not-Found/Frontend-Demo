/**
 * File path: /icon_dashboard/page.tsx
 * Author: Denise Alexander & Devni Wijesinghe
 * Function: Role-aware schedule dashboard that shows different actions per role.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { getViewerRoleFE } from '@/lib/mock/mockApi';
import {
  CalendarDays,
  Users,
  FileText,
  Receipt,
  ClipboardList,
  HelpCircle,
} from 'lucide-react';

const palette = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  white: '#FFFFFF',
  pageBg: '#fff5ecff',
};

type Role = 'family' | 'management' | 'carer' | null;
type StrictRole = Exclude<Role, null>;

type ButtonDef = {
  label: string;
  icon: React.ElementType;
  href: string;
};

/**
 * Role -> which buttons to show
 * - family: Client/Staff Schedule + Budget + Transactions + Family Requests + FAQ
 * - management: Client/Staff Schedule + Budget + Transactions + Request Log(renamed) + FAQ
 */
const BUTTONS: Record<StrictRole, ButtonDef[]> = {
  family: [
    { label: 'Client Schedule', icon: CalendarDays, href: '/calendar_dashboard' },
    { label: 'Staff Schedule', icon: Users, href: '/management_dashboard/staff_schedule' },
    { label: 'Budget Report', icon: FileText, href: '/calendar_dashboard/budget_report' },
    { label: 'Transactions', icon: Receipt, href: '/calendar_dashboard/transaction_history' },
    { label: 'Family Requests', icon: ClipboardList, href: '/family_dashboard/request_of_change_page' },
    { label: 'FAQ', icon: HelpCircle, href: '/faq' },
  ],
  carer: [
    { label: 'Client Schedule', icon: CalendarDays, href: '/calendar_dashboard' },
    { label: 'Staff Schedule', icon: Users, href: '/management_dashboard/staff_schedule' },
    { label: 'Budget Report', icon: FileText, href: '/calendar_dashboard/budget_report' },
    { label: 'Transactions', icon: Receipt, href: '/calendar_dashboard/transaction_history' },
    { label: 'Update Details', icon: ClipboardList, href: '/calendar_dashboard/update_details' },
    { label: 'FAQ', icon: HelpCircle, href: '/faq' },
  ],
  management: [
    { label: 'Client Schedule', icon: CalendarDays, href: '/calendar_dashboard' },
    { label: 'Staff Schedule', icon: Users, href: '/management_dashboard/staff_schedule' },
    { label: 'Budget Report', icon: FileText, href: '/calendar_dashboard/budget_report' },
    { label: 'Transactions', icon: Receipt, href: '/calendar_dashboard/transaction_history' },
    { label: 'Request Log', icon: ClipboardList, href: '/request-log-page' },
    { label: 'FAQ', icon: HelpCircle, href: '/faq' },
  ],
};

export default function DashboardPage() {
  const [role, setRole] = useState<Role>(null);
  const [title, setTitle] = useState('Dashboard');
  const router = useRouter();

  // Mock flag
  const isMock =
    process.env.NEXT_PUBLIC_ENABLE_MOCK === '1' ||
    process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';

  useEffect(() => {
    const load = async () => {
      if (isMock) {
        // Try mock role first
        let r = (getViewerRoleFE() as Role) || null;

        // Fallback: infer from lastLoginEmail
        if (!r) {
          const em = (localStorage.getItem('lastLoginEmail') || '').toLowerCase();
          if (em.includes('carer')) r = 'carer';
          else if (em.includes('management')) r = 'management';
          else if (em.includes('family')) r = 'family';
        }

        if (!r) {
          router.replace('/');
          return;
        }

        setRole(r);
        switch (r) {
          case 'family':
            setTitle('Family/POA Dashboard');
            break;
          case 'management':
            setTitle('Management Dashboard');
            break;
          case 'carer':
            setTitle('Carer Dashboard');
            break;
          default:
            setTitle('Dashboard');
        }
        return;
      }

      // Real session role
      const session = await getSession();
      if (!session?.user?.role) {
        router.replace('/');
        return;
      }

      const r = session.user.role as Role;
      setRole(r);
      switch (r) {
        case 'family':
          setTitle('Family/POA Dashboard');
          break;
        case 'management':
          setTitle('Management Dashboard');
          break;
        case 'carer':
          setTitle('Carer Dashboard');
          break;
        default:
          setTitle('Dashboard');
      }
    };
    load();
  }, [router, isMock]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const showAvatar = true;
  const avatarSrc = '/default_profile.png';

  const goProfile = () => {
    setUserMenuOpen(false);
    router.push('/calendar_dashboard/update_details');
  };

  const doSignOut = () => {
    setUserMenuOpen(false);
    router.push('/');
  };

  // Loading state while role is unknown
  if (!role) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3E9D9] text-zinc-900">
        <div className="text-center">
          <p className="text-4xl font-extrabold mb-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const actions = BUTTONS[role as StrictRole];

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: palette.pageBg }}
    >
      {/* ===== Header ===== */}
      <div
        className="w-full flex items-center justify-between px-8 py-5"
        style={{ backgroundColor: palette.header, color: palette.white }}
      >
        {/* Logo + Title */}
        <div className="flex items-center gap-8 flex-wrap">
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={30}
            className="object-contain"
            priority
          />
          <h1 className="text-2xl md:text-3xl font-bold underline">{title}</h1>
        </div>

        {/* Right: Avatar dropdown */}
        <div className="relative flex items-center gap-4">
          {showAvatar && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/80 hover:border-white focus:outline-none focus:ring-2 focus:ring-white/70"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                title="Account"
              >
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  priority
                />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-3 w-80 rounded-md border border-white/30 bg-white text-black shadow-2xl z-50"
                  role="menu"
                >
                  <button
                    className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                    onClick={goProfile}
                  >
                    Update your details
                  </button>
                  <button
                    className="w-full text-left px-5 py-4 text-xl font-semibold hover:bg-black/5"
                    onClick={doSignOut}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== Banner ===== */}
      <div
        className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center gap-3"
        style={{ backgroundColor: palette.banner }}
      >
        <BellIcon />
        <p className="text-base md:text-lg leading-relaxed" style={{ color: palette.header }}>
          {role === 'family'
            ? 'Use the buttons below to view client & staff schedules, budgets, requests and transactions.'
            : role === 'carer'
            ? 'Use the buttons below to view client and staff schedules, budgets and transactions.'
            : 'Use the buttons below to manage client & staff schedules, budget and requests.'}
        </p>
      </div>

      {/* ===== Role-based button grid ===== */}
      <div
        className="flex-1 flex items-center justify-center px-10 py-20"
        style={{ backgroundColor: 'transparent' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-15 w-full max-w-6xl">
          {actions.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className="group flex flex-col items-center justify-center rounded-2xl shadow-lg bg-[#F5D8C2] hover:bg-[#F2C9AA] transition-colors duration-300 p-10 border-2 border-[#3A0000]/20 hover:border-[#2B0000]/30"
            >
              <Icon
                className="w-14 h-14 mb-4 text-[#3A0000] transition-colors duration-200 group-hover:text-[#2B0000]"
                strokeWidth={2.2}
              />
              <span className="text-2xl font-semibold text-[#3A0000] transition-colors duration-200 group-hover:text-[#2B0000]">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Main content placeholder ===== */}
      <section className="w-full flex-1">
        <div className="w-full px-6 md:px-10 py-8 md:py-10">
          {/* Add dashboard widgets here if needed */}
        </div>
      </section>
    </div>
  );
}

/* ===== Helper icon (inline SVG) ===== */
function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[#4A0A0A]"
      aria-hidden="true"
    >
      <path d="M12 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );
}
