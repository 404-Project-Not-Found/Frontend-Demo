/**
 * File path: app/calendar_dashboard/category-cost/[category]/page.tsx
 * Frontend Author: Qingyue Zhao
 *
 * Purpose:
 * - Category Budget Report page for a specific category (e.g., Appointments).
 * - Uses the SAME full-bleed layout & chrome as the annual Budget Report page.
 * - Reached by clicking a category link on the annual report.
 * - Fetches rows via getBudgetRowsFE(activeClientId).
 *
 * TO DO: requires back-end integration
 */

'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRole,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';
import { getBudgetRowsFE, type BudgetRow } from '@/lib/mock/mockApi';

/* ------------------------------- Utils ------------------------------- */
const unslug = (s: string) =>
  s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number): { tone: Tone; label: string } => {
  if (remaining < 0) return { tone: 'red', label: 'Exceeded' };
  if (remaining <= 5) return { tone: 'yellow', label: 'Nearly Exceeded' };
  return { tone: 'green', label: 'Within Limit' };
};

/* ------------------------------- Chrome colors ------------------------------- */
const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
};

/* ---------------------------------- Types ---------------------------------- */
type Client = { id: string; name: string };
type Role = 'carer' | 'family' | 'management';

export default function CategoryCostPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-gray-600">Loading category...</div>}
    >
      <CategoryCostInner />
    </Suspense>
  );
}

function CategoryCostInner() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const categorySlug = params.category;
  const categoryName = unslug(categorySlug);

  /* ===== Role ===== */
  const [role, setRole] = useState<Role>('family');
  useEffect(() => {
    (async () => {
      const r = await getViewerRole();
      setRole(r);
    })();
  }, []);
  const isManagement = role === 'management';

  /* ===== Clients ===== */
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  /* ===== Budget rows ===== */
  const [rowsAll, setRowsAll] = useState<BudgetRow[]>([]);

  /** Load clients */
  useEffect(() => {
    (async () => {
      try {
        const list = await getClients();
        const mapped: Client[] = list.map((c: ApiClient) => ({
          id: c._id,
          name: c.name,
        }));
        setClients(mapped);

        const active = await getActiveClient();
        if (active.id) {
          setActiveClientId(active.id);
          setDisplayName(
            active.name || mapped.find((m) => m.id === active.id)?.name || ''
          );
        }
      } catch {
        setClients([]);
      }
    })();
  }, []);

  /** Load budget rows when active client changes */
  useEffect(() => {
    if (!activeClientId) {
      setRowsAll([]);
      return;
    }
    (async () => {
      try {
        const budgetRows = await getBudgetRowsFE(activeClientId);
        setRowsAll(budgetRows);
      } catch {
        setRowsAll([]);
      }
    })();
  }, [activeClientId]);

  /** Handle client change in banner */
  const onClientChange = async (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      await setActiveClient(null);
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    await setActiveClient(id, name);
  };

  const onLogoClick = () => {
    router.push('/icon_dashboard');
  };

  /* ===== Local state ===== */
  const [q, setQ] = useState('');
  const [year, setYear] = useState('2025');

  /** Filter rows for this category */
  const rows = useMemo(
    () =>
      rowsAll.filter(
        (r) => r.category.toLowerCase() === categoryName.toLowerCase()
      ),
    [rowsAll, categoryName]
  );

  /** Apply search */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.item.toLowerCase().includes(t) || r.category.toLowerCase().includes(t)
    );
  }, [q, rows]);

  /** Totals */
  const baseTotals = useMemo(() => {
    const allocated = filtered.reduce((s, r) => s + r.allocated, 0);
    const spent = filtered.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [filtered]);

  const [isEditing, setIsEditing] = useState(false);
  const [categoryBudgetOverride, setCategoryBudgetOverride] = useState<
    number | null
  >(null);
  const [categoryBudgetInput, setCategoryBudgetInput] = useState<string>('');

  const effectiveAllocated = categoryBudgetOverride ?? baseTotals.allocated;
  const effectiveRemaining = effectiveAllocated - baseTotals.spent;

  const firstExceeded = filtered.find((r) => r.spent > r.allocated);

  return (
    <DashboardChrome
      page="budget"
      clients={clients}
      onClientChange={onClientChange}
      colors={colors}
      onLogoClick={onLogoClick}
    >
      <div className="flex-1 h-[680px] bg-white/50 overflow-auto">
        {/* Top bar */}
        <div className="w-full bg-[#3A0000] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/calendar_dashboard/budget_report"
              className="text-white/90 hover:text-white font-semibold"
            >
              &lt; Back
            </Link>
            <h2 className="text-white text-2xl font-semibold">
              {categoryName} Budget
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="h-9 rounded-full bg-white text-black px-4 border"
            />
            {isManagement &&
              (!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setCategoryBudgetInput(
                      String(categoryBudgetOverride ?? baseTotals.allocated)
                    );
                  }}
                  className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const val = parseFloat(categoryBudgetInput);
                      if (!Number.isFinite(val) || val < 0) return;
                      setCategoryBudgetOverride(val);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCategoryBudgetInput('');
                    }}
                    className="px-3 py-1 rounded-md bg-white/80 text-black font-semibold hover:bg-white"
                  >
                    Cancel
                  </button>
                </>
              ))}
          </div>
        </div>

        {/* Warning banner */}
        {firstExceeded && (
          <div className="w-full bg-[#fde7e4] border-y border-[#f5c2c2] px-6 py-3">
            <p className="text-[#9b2c2c] font-semibold">
              WARNING: {firstExceeded.item} budget exceeded by{' '}
              <b>
                $
                {(
                  firstExceeded.spent - firstExceeded.allocated
                ).toLocaleString()}
              </b>
            </p>
          </div>
        )}

        {/* Content */}
        <div className="w-full px-12 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-18 mb-10 text-center">
            <div className="rounded-2xl border px-6 py-8 bg-[#F8CBA6]">
              {isManagement && isEditing ? (
                <>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={categoryBudgetInput}
                    onChange={(e) => setCategoryBudgetInput(e.target.value)}
                    className="w-full max-w-[220px] mx-auto text-center text-2xl font-bold rounded-md bg-white text-black px-3 py-2 border"
                  />
                  <div className="text-sm mt-2">{categoryName} Budget</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${effectiveAllocated.toLocaleString()}
                  </div>
                  <div className="text-sm">{categoryName} Budget</div>
                </>
              )}
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div className="text-2xl font-bold">
                ${baseTotals.spent.toLocaleString()}
              </div>
              <div className="text-sm">Spent to Date</div>
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div
                className={`text-2xl font-bold ${effectiveRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {effectiveRemaining < 0
                  ? `-$${Math.abs(effectiveRemaining).toLocaleString()}`
                  : `$${effectiveRemaining.toLocaleString()}`}
              </div>
              <div className="text-sm">Remaining Balance</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#3A0000] bg-white overflow-hidden">
            <table className="w-full text-left text-sm bg-white">
              <thead className="bg-[#3A0000] text-lg text-white">
                <tr>
                  <th className="px-4 py-4">Item</th>
                  <th className="px-4 py-4">Allocated</th>
                  <th className="px-4 py-4">Spent</th>
                  <th className="px-5 py-5">Remaining</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const remaining = r.allocated - r.spent;
                  const status = getStatus(remaining);
                  return (
                    <tr
                      key={i}
                      className="border-b last:border-b border-[#3A0000]/20"
                    >
                      <td className="px-4 py-5 font-semibold">{r.item}</td>
                      <td className="px-4 py-5">${r.allocated}</td>
                      <td className="px-4 py-5">${r.spent}</td>
                      <td
                        className={`px-4 py-5 ${remaining < 0 ? 'text-red-600' : ''}`}
                      >
                        {remaining < 0
                          ? `-$${Math.abs(remaining)}`
                          : `$${remaining}`}
                      </td>
                      <td className="px-4 py-5">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
