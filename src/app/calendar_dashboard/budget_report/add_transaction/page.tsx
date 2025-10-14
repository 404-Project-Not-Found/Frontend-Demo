/*
 * File path: /calendar_dashboard/add_transaction/page.tsx
 * Frontend Author: Devni Wijesinghe (refactor to use DashboardChrome by QY)
 */

'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import { useTransactions } from '@/context/TransactionContext';

import {
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  type Client as ApiClient,
  getTaskCatalogFE,
  getTasksFE,
  type Task as ApiTask,
} from '@/lib/mock/mockApi';

const colors = {
  pageBg: '#FAEBDC',
  sectionBar: '#3A0000',
  label: '#000000',
  inputBorder: '#6C2B2B',
  banner: '#F9C9B1',
  header: '#3A0000',
  help: '#ED5F4F',
  btnPill: '#D2BCAF',
  btnPillHover: '#C7AEA0',
  fileBtn: '#E8D8CE',
};

export default function AddTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <AddTransactionInner />
    </Suspense>
  );
}

function AddTransactionInner() {
  const router = useRouter();
  const { addTransaction } = useTransactions();

  /* ---------- Top bar client dropdown ---------- */
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await getClientsFE();
        const mapped = list.map((c: ApiClient) => ({
          id: c._id,
          name: c.name,
        }));
        setClients(mapped);

        const { id, name } = readActiveClientFromStorage();
        const useId = id || mapped[0]?.id || null;
        const useName =
          name || (mapped.find((m) => m.id === useId)?.name ?? '');
        setActiveClientId(useId);
        setActiveClientName(useName);
      } catch {
        setClients([]);
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    const c = clients.find((x) => x.id === id) || null;
    const name = c?.name || '';
    setActiveClientId(id || null);
    setActiveClientName(name);
    writeActiveClientToStorage(id || '', name);
  };

  /* ---------- Care Item Catalog + Tasks ---------- */
  const [allTasks, setAllTasks] = useState<ApiTask[]>([]);
  const catalog = useMemo(() => getTaskCatalogFE(), []); // 返回 [{category, tasks:[{label}]}]

  const labelToCategory = useMemo(() => {
    const m = new Map<string, string>();
    catalog.forEach((c) => c.tasks.forEach((t) => m.set(t.label, c.category)));
    return m;
  }, [catalog]);

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

  /* ---------- Form state ---------- */
  const [category, setCategory] = useState('');
  const [taskName, setTaskName] = useState('');
  const [date, setDate] = useState('');
  const [carer, setCarer] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 根据 clientId + category 过滤 tasks
  const tasksForClient = useMemo(() => {
    if (!activeClientId) return [];
    return (allTasks || []).filter((t) => t.clientId === activeClientId);
  }, [allTasks, activeClientId]);

  const tasksForClientAndCategory = useMemo(() => {
    if (!category) return [];
    return tasksForClient.filter((t: ApiTask) => {
      const cat = t.category || labelToCategory.get(t.title) || '';
      return cat.toLowerCase() === category.toLowerCase();
    });
  }, [tasksForClient, category, labelToCategory]);

  const handleSubmit = () => {
    if (!activeClientId) {
      alert('Please select a client in the pink banner first.');
      return;
    }
    if (!category || !taskName || !date || !carer || !receiptFile) {
      alert(
        'Please complete Category, Name, Date, Carer, and upload a receipt.'
      );
      return;
    }

    addTransaction({
      type: category,
      date,
      madeBy: carer,
      receipt: receiptFile.name,
      items: [taskName],
    });

    router.push('/calendar_dashboard/transaction_history');
  };

  const inputCls =
    'h-12 w-[600px] rounded-sm px-3 bg-white text-black outline-none border';
  const inputStyle = { borderColor: colors.inputBorder };

  return (
    <DashboardChrome
      page="transactions"
      clients={clients}
      activeClientId={activeClientId}
      onClientChange={onClientChange}
      activeClientName={activeClientName}
      colors={{ header: colors.header, banner: colors.banner, text: '#000' }}
      onLogoClick={() => router.push('/empty_dashboard')}
    >
      <div
        className="flex-1 h-[680px] overflow-auto"
        style={{ backgroundColor: colors.pageBg }}
      >
        {/* Section bar */}
        <div
          className="w-full flex items-center justify-between px-8 py-4 text-white text-3xl font-extrabold"
          style={{ backgroundColor: colors.sectionBar }}
        >
          <span>Add Transaction</span>
          <button
            onClick={() =>
              router.push('/calendar_dashboard/transaction_history')
            }
            className="text-lg font-semibold text-white hover:underline"
          >
            &lt; Back
          </button>
        </div>

        {/* Form area */}
        <div className="w-full max-w-[1120px] mx-auto px-25 py-15">
          <div className="grid grid-cols-[280px_1fr] gap-y-8 gap-x-10">
            {/* Category */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Care Item Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setTaskName('');
              }}
              className={`${inputCls} appearance-none`}
              style={inputStyle}
            >
              <option value="">- Select a category -</option>
              {catalog.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>

            {/* Care Item Sub Category */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Care Item Sub Category
            </label>
            <select
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              disabled={!activeClientId || !category}
              className={`${inputCls} appearance-none`}
              style={inputStyle}
            >
              {!category ? (
                <option value="">- Select a category first -</option>
              ) : tasksForClientAndCategory.length === 0 ? (
                <option value="">No tasks available</option>
              ) : (
                <>
                  <option value="">Select a Care Item</option>
                  {tasksForClientAndCategory.map((t: ApiTask) => (
                    <option key={t.id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Date */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />

            {/* Carer Name */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Carer Name
            </label>
            <input
              type="text"
              value={carer}
              onChange={(e) => setCarer(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Enter carer name"
            />

            {/* Upload Receipt */}
            <label
              className="self-center text-2xl font-extrabold"
              style={{ color: colors.label }}
            >
              Upload Receipt
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) setReceiptFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-md font-semibold"
                style={{
                  backgroundColor: colors.fileBtn,
                  border: `1px solid ${colors.inputBorder}`,
                  color: '#1a1a1a',
                }}
              >
                Choose file
              </button>
              <span className="text-black">
                {receiptFile ? receiptFile.name : 'No file chosen'}
              </span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-14 flex items-center justify-center gap-40">
            <button
              className="px-8 py-3 rounded-2xl text-2xl font-extrabold"
              style={{ backgroundColor: colors.btnPill, color: '#1a1a1a' }}
              onClick={() =>
                router.push('/calendar_dashboard/transaction_history')
              }
            >
              Cancel
            </button>
            <button
              className="px-10 py-3 rounded-2xl text-2xl font-extrabold hover:opacity-95"
              style={{ backgroundColor: colors.btnPill, color: '#1a1a1a' }}
              onClick={handleSubmit}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
