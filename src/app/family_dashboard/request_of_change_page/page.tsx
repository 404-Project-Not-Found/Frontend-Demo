/**
 * File path: /app/request_form/page.tsx
 * Frontend Author: Devni Wijesinghe
 * Last Update by Qingyue Zhao: 2025-10-03
 *
 * Description:
 * - Family-facing "Request of Change" form, built on top of shared <DashboardChrome />.
 * - Full-bleed layout; section header → notice → form → footer buttons.
 * - Validates required fields (task name, details, reason) before submit.
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import {
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  FULL_DASH_ID,
  NAME_BY_ID,
  type Client as ApiClient,
  getTasksFE,
  type Task as ApiTask,
  getTaskCatalogFE,
} from '@/lib/mock/mockApi';

/* UI colors to match chrome */
const chromeColors = {
  header: '#3A0000',
  banner: '#F9C9B1',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

const palette = {
  pageBg: '#FAEBDC',
  sectionHeader: '#3A0000',
  notice: '#F9C9B1',
  text: '#1c130f',
  inputBorder: '#7c5040',
  button: '#F39C6B',
  buttonHover: '#ef8a50',
  danger: '#8B0000',
  white: '#FFFFFF',
  help: '#ff9900',
};

type Client = { id: string; name: string };

export default function RequestChangeFormPage() {
  const router = useRouter();

  /* ---------- Top bar client dropdown ---------- */
  const [clients, setClients] = useState<Client[]>([]);
  const [{ id: activeId, name: activeName }, setActive] = useState<{
    id: string | null;
    name: string;
  }>({ id: null, name: '' });

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
        // IMPORTANT: use resolvedId here
        setActive({ id: resolvedId, name: resolvedName });
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

  const onLogoClick = () => router.push('/empty_dashboard');

  /* ---------- Form state ---------- */
  const [allTasks, setAllTasks] = useState<ApiTask[]>([]);
  const [taskName, setTaskName] = useState(''); // Care Item Sub Category
  const [category, setCategory] = useState(''); // Care Item Category
  const [details, setDetails] = useState('');
  const [reason, setReason] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  // Catalog & helpers
  const catalog = useMemo(() => getTaskCatalogFE(), []);
  const labelToCategory = useMemo(() => {
    const m = new Map<string, string>();
    catalog.forEach((c) => c.tasks.forEach((t) => m.set(t.label, c.category)));
    return m;
  }, [catalog]);

  const norm = (s?: string) => (s || '').trim().toLowerCase();

  // Load tasks (with migration handled in mockApi if needed)
  useEffect(() => {
    (async () => {
      try {
        const list = await getTasksFE();
        setAllTasks(list || []);
      } catch {
        setAllTasks([]);
      }
    })();
  }, []);

  // Compute tasks by current client
  const tasksForClient = useMemo(() => {
    if (!activeId) return [];
    return (allTasks || []).filter((t: ApiTask) => t.clientId === activeId);
  }, [allTasks, activeId]);

  // Category-filtered tasks (fallback to catalog mapping if task.category is missing)
  const tasksForClientAndCategory = useMemo(() => {
    if (!category) return [];
    const target = norm(category);
    return tasksForClient.filter((t: ApiTask) => {
      const cat = t.category || labelToCategory.get(t.title) || '';
      return norm(cat) === target;
    });
  }, [tasksForClient, category, labelToCategory]);

  // When a task is selected, also backfill category if empty (defensive)
  const onTaskChange = (value: string) => {
    setTaskName(value);
    setSubmitMessage('');
    if (!category) {
      const auto = labelToCategory.get(value) || '';
      setCategory(auto);
    }
  };

  const handleSubmit = () => {
    if (
      !taskName.trim() ||
      !category.trim() ||
      !details.trim() ||
      !reason.trim()
    ) {
      setSubmitMessage('Please fill in all fields before submitting.');
      return;
    }
    router.push('/calendar_dashboard');
  };

  const handleCancel = () => {
    setTaskName('');
    setCategory('');
    setDetails('');
    setReason('');
    setSubmitMessage('');
    router.push('/calendar_dashboard');
  };

  return (
    <DashboardChrome
      page="request-form"
      colors={chromeColors}
      onLogoClick={onLogoClick}
      clients={clients}
      activeClientId={activeId}
      activeClientName={activeName}
      onClientChange={onClientChange}
    >
      {/* Fill entire area below the top bar */}
      <div
        className="w-full h-[680px]"
        style={{ backgroundColor: palette.pageBg, color: palette.text }}
      >
        {/* Section header */}
        <div
          className="px-6 py-3 text-white"
          style={{ backgroundColor: palette.sectionHeader }}
        >
          <h2 className="text-xl md:text-3xl font-extrabold px-5">
            Request of Change Form
          </h2>
        </div>

        {/* Notice banner */}
        <div className="px-6 py-4" style={{ backgroundColor: palette.notice }}>
          <h3 className="text-base md:text-lg px-5 text-black">
            <strong>Notice:</strong> Please describe what you’d like to change
            about the care item. Management will review your request and respond
            accordingly.
          </h3>
        </div>

        {/* Form body */}
        <div className="flex-1 p-10 text-lg md:text-xl">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Care Item Category */}
            <Field label="Care Item Category">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setTaskName(''); // reset task when category changes
                  setSubmitMessage('');
                }}
                className="w-full rounded-lg bg-white border px-3 py-2 outline-none focus:ring-4 text-black"
                style={{ borderColor: `${palette.inputBorder}66` }}
              >
                <option value="">Select a category</option>
                {catalog.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            </Field>

            {/* Care Item Sub Category (depends on category + client) */}
            <Field label="Care Item Sub Category">
              <select
                value={taskName}
                onChange={(e) => onTaskChange(e.target.value)}
                disabled={!activeId || !category}
                className="w-full rounded-lg bg-white border px-3 py-2 outline-none focus:ring-4 text-black disabled:opacity-60"
                style={{ borderColor: `${palette.inputBorder}66` }}
              >
                {!activeId ? (
                  <option value="">Select a client first</option>
                ) : !category ? (
                  <option value="">Select a category first</option>
                ) : tasksForClientAndCategory.length === 0 ? (
                  <option value="">No tasks available</option>
                ) : (
                  <>
                    <option value="">Select a task…</option>
                    {tasksForClientAndCategory.map((t: ApiTask) => (
                      <option key={t.id} value={t.title}>
                        {t.title}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </Field>

            {/* Details of change */}
            <Field label="Details of change">
              <textarea
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value);
                  setSubmitMessage('');
                }}
                className="w-full rounded-lg bg-white border px-3 py-2 min-h-[110px] outline-none focus:ring-4 text-black"
                style={{ borderColor: `${palette.inputBorder}66` }}
              />
            </Field>

            {/* Reason for request */}
            <Field label="Reason for request">
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setSubmitMessage('');
                }}
                className="w-full rounded-lg bg-white border px-3 py-2 min-h-[90px] outline-none focus:ring-4 text-black"
                style={{ borderColor: `${palette.inputBorder}66` }}
              />
            </Field>

            {/* Footer buttons */}
            <div className="pt-2 flex items-center justify-center gap-20">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-full border text-gray-800 hover:bg-gray-200"
                style={{ borderColor: chromeColors.header }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-full text-[#1c130f] font-bold px-7.5 py-2.5 shadow"
                style={{ backgroundColor: palette.button }}
              >
                Submit
              </button>
            </div>

            {/* Validation message */}
            {submitMessage && (
              <div className="font-semibold text-red-600">{submitMessage}</div>
            )}
          </div>
        </div>
      </div>

      {/* Help bubble */}
      <div className="fixed bottom-6 right-6">
        <div className="group relative">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: palette.help, color: palette.white }}
            aria-label="Help"
          >
            ?
          </button>
          <div className="absolute bottom-12 right-0 hidden w-64 max-w-[90vw] rounded bg-white border p-2 text-sm text-black group-hover:block shadow-lg">
            Fill in the task and category, describe the change, and provide a
            reason. Click <b>Submit</b> to send, or <b>Cancel</b> to return to
            the menu.
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}

/* Field wrapper */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[240px_1fr] items-center gap-4">
      <div className="text-lg md:text-xl font-semibold text-[#1c130f] whitespace-nowrap">
        {label}
      </div>
      {children}
    </div>
  );
}
