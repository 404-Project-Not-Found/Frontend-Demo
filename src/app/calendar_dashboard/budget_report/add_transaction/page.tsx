/**
 * File path: app/calendar_dashboard/budget_report/add_transaction/page.tsx
 * Frontend Author: Devni Wijesinghe (refactor & org-access + mockApi wiring by QY)
 *
 * What this page does now:
 * - Client dropdown shows ONLY clients the current org has APPROVED access to (same logic as Org Access pages).
 * - Carer/Family can submit a new transaction with receipt (stored as Data URL in mockApi).
 * - Management can also add transactions if you keep the button visible; typically Carer uses this page.
 * - On save we create a "Pending" transaction via addTransactionFE(); management later sets status.
 * - Category & Item come from the client's current Budget rows (so Implemented can roll into Budget spent).
 */

'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardChrome from '@/components/top_menu/client_schedule';
import Badge from '@/components/ui/Badge';

import {
  getViewerRoleFE,
  getClientsFE,
  readActiveClientFromStorage,
  writeActiveClientToStorage,
  getBudgetRowsFE,
  addTransactionFE,
  getCurrentOrgIdFE,
  seedOrgStatusDefaultsFE,
  getOrgStatusForClientFE,
  type Client as ApiClient,
  type BudgetRow,
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
};

export default function AddTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <AddTransactionInner />
    </Suspense>
  );
}

/** Convert a File to Data URL (for mockApi to persist the receipt for all roles) */
async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

/** Build clients list with org-access (approved|pending|revoked) for the CURRENT org */
async function loadClientsWithOrgAccess(): Promise<
  { id: string; name: string; orgAccess: 'approved' | 'pending' | 'revoked' }[]
> {
  const all = await getClientsFE();
  // Ensure default statuses exist for this session (Alice approved, Bob pending, Cathy revoked)
  seedOrgStatusDefaultsFE();
  const orgId = getCurrentOrgIdFE();
  return all.map((c: ApiClient) => {
    const s = getOrgStatusForClientFE(c._id, orgId) || 'pending';
    return { id: c._id, name: c.name, orgAccess: s };
  });
}

function AddTransactionInner() {
  const router = useRouter();

  /* ---------- Role (only used for showing hints/buttons if you want) ---------- */
  const [role, setRole] = useState<'family' | 'carer' | 'management'>('family');
  useEffect(() => {
    setRole(getViewerRoleFE());
  }, []);

  /* ---------- Top banner client dropdown (access-controlled) ---------- */
  const [clients, setClients] = useState<
    { id: string; name: string; orgAccess: 'approved' | 'pending' | 'revoked' }[]
  >([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await loadClientsWithOrgAccess();
        setClients(list);

        // Initialize from storage if available AND still approved; fallback to first approved
        const { id, name } = readActiveClientFromStorage();
        const approved = list.filter((c) => c.orgAccess === 'approved');
        let useId: string | null = null;
        let useName = '';

        if (id && approved.find((c) => c.id === id)) {
          useId = id;
          useName = name || approved.find((a) => a.id === id)?.name || '';
        } else if (approved.length > 0) {
          useId = approved[0].id;
          useName = approved[0].name;
        }

        setActiveClientId(useId);
        setActiveClientName(useName);
        if (useId) writeActiveClientToStorage(useId, useName);
      } catch {
        setClients([]);
        setActiveClientId(null);
        setActiveClientName('');
      }
    })();
  }, []);

  const onClientChange = (id: string) => {
    if (!id) {
      setActiveClientId(null);
      setActiveClientName('');
      writeActiveClientToStorage('', '');
      return;
    }
    const c = clients.find((x) => x.id === id);
    const name = c?.name || '';
    setActiveClientId(id);
    setActiveClientName(name);
    writeActiveClientToStorage(id, name);
  };

  /* ---------- Load Budget rows to drive Category/Item ---------- */
  const [rows, setRows] = useState<BudgetRow[]>([]);
  useEffect(() => {
    (async () => {
      if (!activeClientId) {
        setRows([]);
        return;
      }
      try {
        const r = await getBudgetRowsFE(activeClientId);
        setRows(r || []);
      } catch {
        setRows([]);
      }
    })();
  }, [activeClientId]);

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))),
    [rows]
  );
  const itemsForCategory = useMemo(
    () => (cat: string) => rows.filter((r) => r.category === cat).map((r) => r.item),
    [rows]
  );

  /* ---------- Form state ---------- */
  const [category, setCategory] = useState('');
  const [item, setItem] = useState('');
  const [date, setDate] = useState('');
  const [madeBy, setMadeBy] = useState('');
  const [amount, setAmount] = useState<string>(''); // string input; parse on save
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const inputCls =
    'h-12 w-[600px] rounded-sm px-3 bg-white text-black outline-none border';
  const inputStyle = { borderColor: colors.inputBorder };

  const handleSubmit = async () => {
    if (!activeClientId) {
      alert('Please select a client in the pink banner first.');
      return;
    }
    const amt = parseFloat(amount);
    if (!category || !item || !date || !madeBy || !receiptFile || !Number.isFinite(amt)) {
      alert('Please complete Category, Item, Date, Carer, Amount and upload a receipt.');
      return;
    }

    // Persist receipt as Data URL so all roles can open it
    const dataUrl = await fileToDataUrl(receiptFile);

    await addTransactionFE({
      clientId: activeClientId,
      type: 'Purchase',
      date,
      madeBy,
      category,
      item,
      amount: amt,
      receiptDataUrl: dataUrl,
      receiptMimeType: receiptFile.type,
      receiptFilename: receiptFile.name,
      status: 'Pending', // Management will change to Implemented later
    });

    // Back to history
    router.push('/calendar_dashboard/transaction_history');
  };

  return (
    <DashboardChrome
      page="transactions"
      /** Pass full list; the chrome will auto-hide non-approved for management */
      clients={clients}
      onClientChange={onClientChange}
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
            onClick={() => router.push('/calendar_dashboard/transaction_history')}
            className="text-lg font-semibold text-white hover:underline"
          >
            &lt; Back
          </button>
        </div>

        {/* Form area */}
        <div className="w-full max-w-[1120px] mx-auto px-10 py-10">
          <div className="grid grid-cols-[280px_1fr] gap-y-8 gap-x-10">
            {/* Category */}
            <label className="self-center text-2xl font-extrabold" style={{ color: colors.label }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setItem('');
              }}
              className={`${inputCls} appearance-none`}
              style={inputStyle}
            >
              <option value="">- Select a category -</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Item */}
            <label className="self-center text-2xl font-extrabold" style={{ color: colors.label }}>
              Item
            </label>
            <select
              value={item}
              onChange={(e) => setItem(e.target.value)}
              disabled={!category}
              className={`${inputCls} appearance-none`}
              style={inputStyle}
            >
              {!category ? (
                <option value="">- Select a category first -</option>
              ) : itemsForCategory(category).length === 0 ? (
                <option value="">No items available</option>
              ) : (
                <>
                  <option value="">Select an item</option>
                  {itemsForCategory(category).map((it) => (
                    <option key={it} value={it}>
                      {it}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Date */}
            <label className="self-center text-2xl font-extrabold" style={{ color: colors.label }}>
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />

            {/* Made By */}
            <label className="self-center text-2xl font-extrabold" style={{ color: colors.label }}>
              Made By
            </label>
            <input
              type="text"
              value={madeBy}
              onChange={(e) => setMadeBy(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Enter your name"
            />

            {/* Amount */}
            <label className="self-center text-2xl font-extrabold" style={{ color: colors.label }}>
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. 25.50"
            />

            {/* Upload Receipt */}
            <label className="self-center text-2xl font-extrabold" style={{ color: colors.label }}>
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
                  backgroundColor: '#E8D8CE',
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
              onClick={() => router.push('/calendar_dashboard/transaction_history')}
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

          {/* Note */}
          <div className="mt-8 text-sm text-black/70">
            <Badge tone="yellow">Pending</Badge>{' '}
            Management can update the status to <Badge tone="green">Implemented</Badge> later,
            which auto-updates the Budget’s “Spent”.
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
