/**
 * File path: app/calendar_dashboard/category-cost/[category]/page.tsx
 * Frontend Author: Qingyue Zhao (revised)
 *
 * What’s new in this version:
 * - Also maps {_id -> id} when passing data to DashboardChrome.
 * - Adds an optional override value for “Category Total Budget”, which is persisted in localStorage (by clientId + year + category).
 * - All roles can view the override values saved by management.
 */

'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
} from '@/lib/mock/mockApi';
import { getBudgetRowsFE, type BudgetRow } from '@/lib/mock/mockApi';

/* ------------------------------- Helpers ------------------------------- */
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

const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
};

type Role = 'carer' | 'family' | 'management';
type ClientLite = { id: string; name: string; orgAccess?: 'approved' | 'pending' | 'revoked' };

/** ---------- Category override persistence ---------- */
const CAT_OVERRIDE_KEY = 'categoryBudgetOverrideByClientYearCategory';
// shape: { [clientId]: { [year]: { [categoryName]: number } } }
function readCatOverrides(): Record<string, Record<string, Record<string, number>>> {
  try {
    const raw = localStorage.getItem(CAT_OVERRIDE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function writeCatOverrides(m: Record<string, Record<string, Record<string, number>>>) {
  try {
    localStorage.setItem(CAT_OVERRIDE_KEY, JSON.stringify(m));
  } catch {}
}
function getCatOverride(clientId: string, year: string, category: string): number | null {
  const m = readCatOverrides();
  const v = m[clientId]?.[year]?.[category];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function setCatOverride(clientId: string, year: string, category: string, value: number) {
  const m = readCatOverrides();
  m[clientId] = m[clientId] || {};
  m[clientId][year] = m[clientId][year] || {};
  m[clientId][year][category] = value;
  writeCatOverrides(m);
}

export default function CategoryCostPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading category...</div>}>
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
    setRole(getViewerRoleFE());
  }, []);
  const isManagement = role === 'management';

  /* ===== Clients ===== */
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  /* ===== Budget rows ===== */
  const [rowsAll, setRowsAll] = useState<BudgetRow[]>([]);

  /* ===== Local state ===== */
  const [q, setQ] = useState('');
  const [year, setYear] = useState('2025');

  const [isEditing, setIsEditing] = useState(false);
  const [categoryBudgetOverride, setCategoryBudgetOverride] = useState<number | null>(null);
  const [categoryBudgetInput, setCategoryBudgetInput] = useState<string>('');

  /** Load clients */
  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped: ClientLite[] = list.map((c: ApiClient) => ({
          id: c._id,
          name: c.name,
          orgAccess: c.orgAccess,
        }));
        setClients(mapped);

        const { id, name } = readActiveClientFromStorage();
        if (id) {
          setActiveClientId(id);
          setDisplayName(name || mapped.find((m) => m.id === id)?.name || '');
        } else if (mapped.length) {
          const first = mapped[0];
          setActiveClientId(first.id);
          setDisplayName(first.name);
          writeActiveClientToStorage(first.id, first.name);
        }
      } catch {
        setClients([]);
      }
    })();
  }, []);

  /** Load budget rows & category override when active client/year/category changes */
  useEffect(() => {
    if (!activeClientId) {
      setRowsAll([]);
      setCategoryBudgetOverride(null);
      return;
    }
    (async () => {
      try {
        const budgetRows = await getBudgetRowsFE(activeClientId);
        setRowsAll(budgetRows);
      } catch {
        setRowsAll([]);
      }
      const override = getCatOverride(activeClientId, year, categoryName);
      setCategoryBudgetOverride(override);
    })();
  }, [activeClientId, year, categoryName]);

  /** Handle client change in banner */
  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setDisplayName('');
      writeActiveClientToStorage('', '');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setDisplayName(name);
    writeActiveClientToStorage(id, name);

    const override = getCatOverride(id, year, categoryName);
    setCategoryBudgetOverride(override);
  };

  const onLogoClick = () => router.push('/icon_dashboard');

  /** Rows for this category */
  const rows = useMemo(
    () =>
      rowsAll.filter(
        (r) => r.category.toLowerCase() === categoryName.toLowerCase()
      ),
    [rowsAll, categoryName]
  );

  /** Search */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.item.toLowerCase().includes(t) || r.category.toLowerCase().includes(t)
    );
  }, [q, rows]);

  /** Totals (base from actual rows) */
  const baseTotals = useMemo(() => {
    const allocated = filtered.reduce((s, r) => s + r.allocated, 0);
    const spent = filtered.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [filtered]);

  const effectiveAllocated = categoryBudgetOverride ?? baseTotals.allocated;
  const effectiveRemaining = effectiveAllocated - baseTotals.spent;

  const firstExceeded = filtered.find((r) => r.spent > r.allocated);

  return (
    <DashboardChrome
      page="budget"
      clients={clients}                // ✅ 已映射
      onClientChange={onClientChange}
      colors={colors}
      onLogoClick={onLogoClick}
    >
      <div className="flex-1 h-[680px] bg-white/50 overflow-auto">
        {/* Top bar */}
        <div className="w-full bg-[#3A0000] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/calendar_dashboard/budget_report" className="text-white/90 hover:text-white font-semibold">
              &lt; Back
            </Link>
            <h2 className="text-white text-2xl font-semibold">{categoryName} Budget</h2>
            <div className="flex items-center gap-2 ml-8">
              <span className="font-semibold text-white text-lg">Select year:</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-md bg-white text-sm px-3 py-1 border"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
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
                    setCategoryBudgetInput(String(categoryBudgetOverride ?? baseTotals.allocated));
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
                      if (!Number.isFinite(val) || val < 0 || !activeClientId) return;
                      setCategoryBudgetOverride(val);
                      setCatOverride(activeClientId, year, categoryName, val); // ✅ 持久化（跨角色共享）
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
              <b>${(firstExceeded.spent - firstExceeded.allocated).toLocaleString()}</b>
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
                  <div className="text-2xl font-bold">${effectiveAllocated.toLocaleString()}</div>
                  <div className="text-sm">{categoryName} Budget</div>
                </>
              )}
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div className="text-2xl font-bold">${baseTotals.spent.toLocaleString()}</div>
              <div className="text-sm">Spent to Date</div>
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div className={`text-2xl font-bold ${effectiveRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
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
                    <tr key={i} className="border-b last:border-b border-[#3A0000]/20">
                      <td className="px-4 py-5 font-semibold">{r.item}</td>
                      <td className="px-4 py-5">${r.allocated}</td>
                      <td className="px-4 py-5">${r.spent}</td>
                      <td className={`px-4 py-5 ${remaining < 0 ? 'text-red-600' : ''}`}>
                        {remaining < 0 ? `-$${Math.abs(remaining)}` : `$${remaining}`}
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
