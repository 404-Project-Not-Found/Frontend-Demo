/**
 * File path: /app/management_dashboard/manage_care_item/add/page.tsx
 * Frontend Author: Qingyue Zhao
 * Last Update: 2025-10-02
 *
 * Description:
 * - This page provides the "Add New Care Item" form for management users.
 * - Built on top of the shared <DashboardChrome /> component to ensure consistent
 *   layout and navigation across the application.
 * - Allows selecting the active client, and creating a new care task with details:
 *   category, name, date range, repeat interval, status, etc.
 * - Tasks are stored in localStorage (mock mode) and persisted across reloads.
 * - Buttons at the bottom support Cancel (navigate back) and Add (save task).
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import DashboardChrome from '@/components/top_menu/client_schedule';
import {
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  getClientsFE,
  FULL_DASH_ID,
  NAME_BY_ID,
  type Client as ApiClient,
} from '@/lib/mock/mockApi';

type Unit = 'day' | 'week' | 'month' | 'year';

type Task = {
  label: string;
  slug: string;
  status: string;
  category: string;
  clientName?: string;
  deleted?: boolean;
  frequency?: string;
  lastDone?: string;
  frequencyDays?: number;
  frequencyCount?: number;
  frequencyUnit?: Unit;
  dateFrom?: string;
  dateTo?: string;
};

function saveTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function loadTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('tasks') || '[]') as Task[];
  } catch {
    return [];
  }
}

const unitToDays: Record<Unit, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};
const toDays = (count: number, unit: Unit) =>
  Math.max(1, Math.floor(count || 1)) * unitToDays[unit];
const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const chromeColors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

type Client = { id: string; name: string };

export default function AddTaskPage() {
  const router = useRouter();

  // Topbar client list
  const [clients, setClients] = useState<Client[]>([]);
  const [{ id: activeId, name: activeName }, setActive] = useState<{
    id: string | null;
    name: string;
  }>({
    id: null,
    name: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped: Client[] = list.map((c: ApiClient) => ({
          id: c._id,
          name: c.name,
        }));
        setClients(mapped);

        const stored = readActiveClientFromStorage();
        const resolvedId = stored.id || FULL_DASH_ID;
        const resolvedName = stored.name || NAME_BY_ID[resolvedId] || '';
        setActive({ id: stored.id || null, name: resolvedName });
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    if (!id) {
      setActive({ id: null, name: '' });
      writeActiveClientToStorage('', '');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActive({ id, name });
    writeActiveClientToStorage(id, name);
  };

  // Form states
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState('in progress');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notes, setNotes] = useState('');

  const [frequencyCountStr, setFrequencyCountStr] = useState<string>('');
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>('day');

  const statusOptions = useMemo(
    () => ['in progress', 'Completed', 'Not started', 'Paused', 'Cancelled'],
    []
  );

  const onCreate = () => {
    const name = label.trim();
    if (!name) {
      alert('Please enter the task name.');
      return;
    }
    const tasks = loadTasks();

    const base = slugify(name) || 'task';
    let slug = base;
    let i = 2;
    while (tasks.some((t) => t.slug === slug)) slug = `${base}-${i++}`;

    const countNum = parseInt(frequencyCountStr, 10);
    const hasFrequency = Number.isFinite(countNum) && countNum > 0;
    const frequencyDays = hasFrequency
      ? toDays(countNum, frequencyUnit)
      : undefined;
    const legacyStr = hasFrequency
      ? `${countNum} ${frequencyUnit}${countNum > 1 ? 's' : ''}`
      : undefined;

    const newTask: Task = {
      clientName: activeName,
      label: name,
      slug,
      status: status.trim(),
      category: category.trim(),
      frequencyCount: hasFrequency ? countNum : undefined,
      frequencyUnit: hasFrequency ? frequencyUnit : undefined,
      frequencyDays,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      frequency: legacyStr,
      lastDone: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : '',
      deleted: false,
    };

    saveTasks([...(tasks || []), newTask]);
    router.push('/calendar_dashboard');
  };

  const onLogoClick = () => {
    router.push('/empty_dashboard');
  };

  return (
    <DashboardChrome
      page="care-add"
      clients={clients}
      activeClientId={activeId}
      activeClientName={activeName}
      onClientChange={onClientChange}
      colors={chromeColors}
      onLogoClick={onLogoClick}
    >
      {/* Fill entire area below the topbar */}
      <div className="w-full h-[720px] bg-[#FAEBDC] flex flex-col">
        {/* Section title bar */}
        <div className="bg-[#3A0000] text-white px-6 py-3">
          <h2 className="text-xl md:text-3xl font-extrabold px-5">
            Add New Care Item
          </h2>
        </div>

        {/* Form content */}
        <div className="flex-1 p-16 text-xl">
          <div className="space-y-6 max-w-3xl mx-auto">
            <Field label="Care Item Sub Category">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                placeholder="e.g., Replace Toothbrush Head"
              />
            </Field>

            <Field label="Category">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                placeholder="e.g., Appointments"
              />
            </Field>

            <Field label="Date Range">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                />
                <span className="text-[#1c130f] text-lg">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className="w-40 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                />
              </div>
            </Field>

            <Field label="Repeat Every">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={frequencyCountStr}
                  onChange={(e) =>
                    setFrequencyCountStr(e.target.value.replace(/[^\d]/g, ''))
                  }
                  className="w-28 rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                  placeholder="e.g., 90"
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

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notes">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#7c5040]/40 px-3 py-2 text-lg outline-none focus:ring-4 focus:ring-[#7c5040]/20 text-black"
                placeholder="e.g., add notes for this care item here"
              />
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4">
      <div className="text-xl font-semibold text-[#1c130f]">{label}</div>
      {children}
    </div>
  );
}
