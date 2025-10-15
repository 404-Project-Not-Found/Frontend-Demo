/**
 * File path: /app/request_form/page.tsx
 * Frontend Author: Devni Wijesinghe (refactor by QZ)
 * Last Update: 2025-10-15
 *
 * Description (EN):
 * - Family-facing "Request of Change" form using the *new* unified FE API layer.
 * - Shares the same three demo clients across the whole app (no per-page divergence).
 * - On submit, we persist a RequestLog entry via addRequestFE() and navigate to Request Log.
 * - Category/task dropdowns are driven by the *flat* task catalog (getTaskCatalogFE).
 * - Client switching uses the same pattern as transactions/budget pages:
 *   readActiveClientFromStorage() for initial, writeActiveClientToStorage() on change.
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  FULL_DASH_ID,
  NAME_BY_ID,
  type Client as ApiClient,

  // NEW unified APIs
  getTaskCatalogFE,          // flat array: { id, title, category, ... }
  getTasksFE,                // current per-client tasks (calendar uses the same)
  addRequestFE,              // persist a new request log item
  type Task as ApiTask,
  type TaskCatalogItemFE,
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

  /* ---------- Top bar client dropdown (shared pattern) ---------- */
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

  /* ---------- Form state ---------- */
  const role = getViewerRoleFE();
  const [category, setCategory] = useState(''); // Care Item Category
  const [taskName, setTaskName] = useState(''); // Care Item Sub Category
  const [details, setDetails] = useState('');
  const [reason, setReason] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  // Catalog: flat list → derive categories and category→tasks
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

  const categoryOptions = useMemo(
    () => Array.from(new Set(catalog.map((i) => i.category))).sort(),
    [catalog]
  );

  // All tasks (for current client). We only use this to *prefer* existing tasks.
  const [allTasks, setAllTasks] = useState<ApiTask[]>([]);
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

  // Client-specific tasks
  const tasksForClient = useMemo(() => {
    if (!activeId) return [];
    return (allTasks || []).filter((t: ApiTask) => t.clientId === activeId);
  }, [allTasks, activeId]);

  // Category-filtered catalog
  const catalogByCategory = useMemo(() => {
    const map = new Map<string, TaskCatalogItemFE[]>();
    for (const row of catalog) {
      const arr = map.get(row.category) || [];
      arr.push(row);
      map.set(row.category, arr);
    }
    return map;
  }, [catalog]);

  // Options for the sub-category:
  // Prefer tasks that the client already has in this category; if none, fall back to catalog items of this category.
  const subcategoryOptions = useMemo(() => {
    if (!category) return [];
    const existing = tasksForClient
      .filter((t) => (t.category || '').toLowerCase() === category.toLowerCase())
      .map((t) => t.title);

    if (existing.length > 0) {
      return Array.from(new Set(existing)).sort();
    }
    const fromCatalog = (catalogByCategory.get(category) || []).map((i) => i.title);
    return Array.from(new Set(fromCatalog)).sort();
  }, [tasksForClient, category, catalogByCategory]);

  const onTaskChange = (value: string) => {
    setTaskName(value);
    setSubmitMessage('');
  };

  const createdByFromRole = (r: string) =>
    r === 'family' ? 'Family User'
      : r === 'carer' ? 'Carer User'
      : 'Management User';

  const handleSubmit = async () => {
    if (!activeId) {
      setSubmitMessage('Please select a client.');
      return;
    }
    if (!taskName.trim() || !category.trim() || !details.trim() || !reason.trim()) {
      setSubmitMessage('Please fill in all fields before submitting.');
      return;
    }

    try {
      await addRequestFE({
        clientId: activeId,
        createdBy: createdByFromRole(role),
        title: `${taskName} – Change Request`,
        detail: details,        
        reason: reason,  
        category,
        priority: 'Medium',
      });
      router.push('/request-log-page'); // go see the newly added record
    } catch {
      setSubmitMessage('Failed to submit. Please try again.');
    }
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
      onLogoClick={() => router.push('/empty_dashboard')}
      clients={clients}
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
            <strong>Notice:</strong> Describe what you’d like to change for this care item.
            Management will review and respond accordingly.
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
                  setTaskName('');
                  setSubmitMessage('');
                }}
                className="w-full rounded-lg bg-white border px-3 py-2 outline-none focus:ring-4 text-black"
                style={{ borderColor: `${palette.inputBorder}66` }}
              >
                <option value="">Select a category</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            {/* Care Item Sub Category */}
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
                ) : subcategoryOptions.length === 0 ? (
                  <option value="">No tasks available</option>
                ) : (
                  <>
                    <option value="">Select a task…</option>
                    {subcategoryOptions.map((title) => (
                      <option key={title} value={title}>
                        {title}
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

            {/* Validation / error message */}
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
            Fill category & task, describe the change and reason, then <b>Submit</b>.
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
