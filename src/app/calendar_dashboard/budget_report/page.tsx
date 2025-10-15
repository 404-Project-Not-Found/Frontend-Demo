/**
 * File path: app/calendar_dashboard/budget_report/page.tsx
 * Frontend Authors: Vanessa Teo & Qingyue Zhao (revised)
 *
 * What’s new in this version:
 * - Fix: clients prop now maps {_id -> id, name, orgAccess} so DashboardChrome 
 * - Persisted Annual Budget override to localStorage by (clientId + year) so ALL roles see the same value.
 * - When switching client/year， the override input box updates to show the correct value.
 */

'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  getBudgetRowsFE,
  type Client as ApiClient,
  type BudgetRow,
} from '@/lib/mock/mockApi';

/* ---------------------------------- Types ---------------------------------- */
type Role = 'carer' | 'family' | 'management';
type ClientLite = { id: string; name: string; orgAccess?: 'approved' | 'pending' | 'revoked' };

/* ------------------------------- Chrome colors ------------------------------- */
const colors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
};

/* ---------------------------------- Utils ---------------------------------- */
type Tone = 'green' | 'yellow' | 'red';
const getStatus = (remaining: number): { tone: Tone; label: string } => {
  if (remaining < 0) return { tone: 'red', label: 'Exceeded' };
  if (remaining <= 5) return { tone: 'yellow', label: 'Nearly Exceeded' };
  return { tone: 'green', label: 'Within Limit' };
};

/** ---------- Annual override persistence (shared across roles) ---------- */
const ANNUAL_OVERRIDE_KEY = 'annualBudgetOverrideByClientYear';
// shape: { [clientId]: { [year]: number } }
function readAnnualOverrides(): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(ANNUAL_OVERRIDE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function writeAnnualOverrides(m: Record<string, Record<string, number>>) {
  try {
    localStorage.setItem(ANNUAL_OVERRIDE_KEY, JSON.stringify(m));
  } catch {}
}
function getAnnualOverride(clientId: string, year: string): number | null {
  const m = readAnnualOverrides();
  const v = m[clientId]?.[year];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function setAnnualOverride(clientId: string, year: string, value: number) {
  const m = readAnnualOverrides();
  m[clientId] = m[clientId] || {};
  m[clientId][year] = value;
  writeAnnualOverrides(m);
}

export default function BudgetReportPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading budget report...</div>}>
      <BudgetReportInner />
    </Suspense>
  );
}

function BudgetReportInner() {
  const router = useRouter();

  // ===== Role =====
  const [role, setRole] = useState<Role>('family');
  useEffect(() => {
    setRole(getViewerRoleFE());
  }, []);
  const isManagement = role === 'management';

  // ===== Clients =====
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  // ===== Budget rows =====
  const [rows, setRows] = useState<BudgetRow[]>([]);

  // ===== Editing state =====
  const [isEditing, setIsEditing] = useState(false);
  const [annualBudgetOverride, setAnnualBudgetOverride] = useState<number | null>(null);
  const [annualBudgetInput, setAnnualBudgetInput] = useState<string>('');

  // ===== Local UI state =====
  const [q, setQ] = useState('');
  const [year, setYear] = useState('2025');

  /** Load clients & set active client */
  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE(); // ApiClient[]
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
          // fall back to first client if nothing is selected
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

  /** Load budget rows + annual override when active client or year changes */
  useEffect(() => {
    if (!activeClientId) {
      setRows([]);
      setAnnualBudgetOverride(null);
      return;
    }
    (async () => {
      try {
        const budgetRows = await getBudgetRowsFE(activeClientId);
        setRows(budgetRows);
      } catch {
        setRows([]);
      }
      // read persisted override
      const override = getAnnualOverride(activeClientId, year);
      setAnnualBudgetOverride(override);
    })();
  }, [activeClientId, year]);

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
    // when client changes, load its override for current year
    const override = getAnnualOverride(id, year);
    setAnnualBudgetOverride(override);
  };

  const onLogoClick = () => {
    if (typeof window !== 'undefined') localStorage.setItem('activeRole', role);
    router.push('/empty_dashboard');
  };

  /** Search filter */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.item.toLowerCase().includes(t) || r.category.toLowerCase().includes(t)
    );
  }, [q, rows]);

  /** Totals from rows */
  const totals = useMemo(() => {
    const allocated = filtered.reduce((s, r) => s + r.allocated, 0);
    const spent = filtered.reduce((s, r) => s + r.spent, 0);
    return { allocated, spent, remaining: allocated - spent };
  }, [filtered]);

  const effectiveAllocated = annualBudgetOverride ?? totals.allocated;
  const effectiveRemaining = effectiveAllocated - totals.spent;

  /* ===== Render ===== */
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
          {/* LEFT: title + year */}
          <div className="flex items-center gap-10">
            <h2 className="text-white text-2xl font-semibold">Annual Budget</h2>
            <div className="flex items-center gap-2">
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

          {/* RIGHT: search + edit */}
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="h-9 rounded-full bg-white text-black px-4 border"
            />
            {role === 'management' &&
              (!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setAnnualBudgetInput(String(annualBudgetOverride ?? totals.allocated));
                  }}
                  className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const val = parseFloat(annualBudgetInput);
                      if (!Number.isFinite(val) || val < 0 || !activeClientId) return;
                      setAnnualBudgetOverride(val);
                      setAnnualOverride(activeClientId, year, val); 
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-black/10"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setAnnualBudgetInput('');
                    }}
                    className="px-3 py-1 rounded-md bg-white/80 text-black font-semibold hover:bg-white"
                  >
                    Cancel
                  </button>
                </>
              ))}
          </div>
        </div>

        {/* Main content */}
        <div className="w-full px-12 py-10">
          {/* Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-18 mb-10 text-center">
            <div className="rounded-2xl border px-6 py-8 bg-[#F8CBA6]">
              {role === 'management' && isEditing ? (
                <>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={annualBudgetInput}
                    onChange={(e) => setAnnualBudgetInput(e.target.value)}
                    className="w-full max-w-[220px] mx-auto text-center text-2xl font-bold rounded-md bg-white text-black px-3 py-2 border"
                  />
                  <div className="text-sm mt-2">Annual Budget</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">${effectiveAllocated.toLocaleString()}</div>
                  <div className="text-sm">Annual Budget</div>
                </>
              )}
            </div>

            <div className="rounded-2xl border px-6 py-8 bg-white">
              <div className="text-2xl font-bold">${totals.spent.toLocaleString()}</div>
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

          {/* Table */}
          <div className="rounded-2xl border border-[#3A0000] bg-white overflow-hidden">
            <table className="w-full text-left text-sm bg-white">
              <thead className="bg-[#3A0000] text-lg text-white">
                <tr>
                  <th className="px-4 py-4">Category</th>
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
                      <td className="px-4 py-5">
                        <Link
                          href={`/calendar_dashboard/budget_report/category-cost/${encodeURIComponent(
                            r.category.trim().toLowerCase().replace(/\s+/g, '-')
                          )}`}
                          className="font-bold text-black underline"
                        >
                          {r.category}
                        </Link>
                      </td>
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
