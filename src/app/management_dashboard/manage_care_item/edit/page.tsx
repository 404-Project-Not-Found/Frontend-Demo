/**
 * File path: /app/management_dashboard/manage_care_item/add/page.tsx
 * Frontend Author: Qingyue Zhao (updated to *new* FE API)
 * Last Update: 2025-10-15
 *
 * Description (EN):
 * - "Add New Care Item" using the unified FE layer (getTasksFE/saveTasksFE/getTaskCatalogFE).
 * - Client selection follows the same pattern as other pages (shared 3 clients).
 * - Catalog is *flat*; we build Category -> Task titles from it for dropdowns.
 * - Saved tasks use the *calendar-compatible* Task shape from mockApi.ts.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  FULL_DASH_ID,
  NAME_BY_ID,
  type Client as ApiClient,

  // NEW task APIs (calendar-compatible)
  getTasksFE,
  saveTasksFE,
  getTaskCatalogFE,
  type Task as CalendarTask,
  type TaskCatalogItemFE,
} from '@/lib/mock/mockApi';

type Client = { id: string; name: string };

const chromeColors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

type Unit = 'day' | 'week' | 'month' | 'year';
const unitToDays: Record<Unit, number> = { day: 1, week: 7, month: 30, year: 365 };
const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

export default function AddTaskPage() {
  const router = useRouter();

  // Topbar client list (shared three clients)
  const [clients, setClients] = useState<Client[]>([]);
  const [{ id: activeId, name: activeName }, setActive] = useState<{ id: string | null; name: string }>({
    id: null,
    name: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped: Client[] = list.map((c: ApiClient) => ({ id: c._id, name: c.name }));
        setClients(mapped);

        const stored = readActiveClientFromStorage();
        const resolvedId = stored.id || FULL_DASH_ID;
        const resolvedName = stored.name || NAME_BY_ID[resolvedId] || '';
        setActive({ id: resolvedId, name: resolvedName });
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActive({ id: id || null, name });
    writeActiveClientToStorage(id || '', name);
  };

  // Catalog (flat) -> categories & titles
  const [catalog, setCatalog] = useState<TaskCatalogItemFE[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await getTaskCatalogFE();
        setCatalog(data || []);
      } catch {
        setCatalog([]);
      }
    })();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((i) => i.category))).sort(),
    [catalog]
  );
  const titlesByCategory = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const i of catalog) {
      const arr = m.get(i.category) || [];
      arr.push(i.title);
      m.set(i.category, arr);
    }
    for (const [k, arr] of m) m.set(k, Array.from(new Set(arr)).sort());
    return m;
  }, [catalog]);

  // Form states (simple)
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [frequencyCount, setFrequencyCount] = useState<string>(''); // numeric string
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>('month');
  const [dateFrom, setDateFrom] = useState<string>(''); // YYYY-MM-DD

  const onCreate = async () => {
    if (!activeId) {
      alert('Please select a client.');
      return;
    }
    if (!category.trim()) {
      alert('Please select a category.');
      return;
    }
    const finalTitle = title.trim();
    if (!finalTitle) {
      alert('Please select or enter a task title.');
      return;
    }

    // Load existing calendar-compatible tasks
    let list = await getTasksFE();

    // Generate id
    const nextId = `${Date.now()}`;

    // Compute frequency string and nextDue
    const countNum = Number(frequencyCount || '0');
    const hasFreq = Number.isFinite(countNum) && countNum > 0;
    const freqStr = hasFreq ? `Every ${countNum} ${frequencyUnit}${countNum > 1 ? 's' : ''}` : '';
    const lastDone = dateFrom || '';
    const nextDue =
      hasFreq && dateFrom
        ? addDays(dateFrom, countNum * unitToDays[frequencyUnit])
        : dateFrom || '';

    const newTask: CalendarTask = {
      id: nextId,
      clientId: activeId,
      title: finalTitle,
      category,
      frequency: freqStr,
      lastDone,
      nextDue,
      status: 'Pending',
      comments: [],
      files: [],
    };

    await saveTasksFE([...(list || []), newTask]);
    router.push('/calendar_dashboard');
  };

  return (
    <DashboardChrome
      page="care-add"
      clients={clients}
      onClientChange={onClientChange}
      colors={chromeColors}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      {/* Fill entire area below the topbar */}
      <div className="w-full h-[720px] bg-[#FAEBDC] flex flex-col">
        {/* Section title bar */}
        <div className="bg-[#3A0000] text-white px-6 py-3">
          <h2 className="text-xl md:text-3xl font-extrabold px-5">Add New Care Item</h2>
        </div>

        {/* Form content */}
        <div className="flex-1 p-16 text-xl">
          <div className="space-y-6 max-w-3xl mx-auto">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setTitle('');
                }}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Task Name">
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!category}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black disabled:opacity-60"
              >
                <option value="">{category ? 'Select a task…' : 'Choose a category first'}</option>
                {(titlesByCategory.get(category) || []).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Start Date">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              />
            </Field>

            <Field label="Repeat Every">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={frequencyCount}
                  onChange={(e) => setFrequencyCount(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-28 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                  placeholder="e.g., 3"
                />
                <select
                  value={frequencyUnit}
                  onChange={(e) => setFrequencyUnit(e.target.value as Unit)}
                  className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                >
                  <option value="day">day(s)</option>
                  <option value="week">week(s)</option>
                  <option value="month">month(s)</option>
                  <option value="year">year(s)</option>
                </select>
              </div>
            </Field>

            {/* Footer buttons */}
            <div className="pt-6 flex items-center justify-center gap-30">
              <button
                onClick={() => router.push('/calendar_dashboard')}
                className="px-6 py-2.5 rounded-full border border-[#3A0000] text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                className="rounded-full bg-[#F39C6B] hover:bg-[#ef8a50] text-[#1c130f] text-xl font-bold px-8 py-2.5 shadow"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <div className="text-xl font-semibold text-[#1c130f]">{label}</div>
      {children}
    </div>
  );
}
