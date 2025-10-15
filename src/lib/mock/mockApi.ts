/**
 * File path: /src/lib/mock/mockApi.ts
 * Author: Qingyue Zhao
 * Date Created: 28/09/2025
 *
 * Mock mode (NEXT_PUBLIC_ENABLE_MOCK=1):
 *   - Clients: hardcoded mock list
 *   - Tasks:   localStorage('tasks') or seeded demo tasks
 *   - Budget:  per-client mock data + auto-spend updates on Implemented transactions
 *   - Txns:    localStorage('transactions') (rich shape with receipt Data URLs)
 *   - Role:    session/local storage; "re-login" resets org overrides & re-seeds
 *
 * Real backend mode:
 *   - Clients: /api/v1/clients, /api/v1/clients/:id
 *   - Tasks:   /api/v1/tasks
 *   - Budget:  /api/v1/clients/:id/budget
 *   - Txns:    /api/v1/clients/:id/transactions
 */

// ========================= Flags & Shared =========================

export const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

export const FULL_DASH_ID = 'mock1';       // Alice
export const PARTIAL_DASH_ID = 'mock2';    // Bob
export const CATHY_ID = 'mock-cathy';      // Cathy

export const LS_ACTIVE_CLIENT_ID = 'activeClientId';
export const LS_CURRENT_CLIENT_NAME = 'currentClientName';

// ========================= Role (FE) ==============================

export type ViewerRole = 'family' | 'carer' | 'management';
export const LS_ACTIVE_ROLE = 'activeRole';         // persists
export const SS_MOCK_ROLE = 'mockRole';             // session-scoped
const SS_ORG_SEEDED_FLAG = 'orgSeededThisSession';  // session flag to seed once

export function setViewerRoleFE(role: ViewerRole): void {
  if (typeof window === 'undefined') return;
  // Treat this as a new login in mock mode:
  // 1) Set role (session & long-lived)
  localStorage.setItem(LS_ACTIVE_ROLE, role);
  try {
    sessionStorage.setItem(SS_MOCK_ROLE, role);
  } catch {}

  // 2) Reset org overrides and session seeded flag to force defaults for the new login
  try {
    localStorage.removeItem(ORG_STATUS_BY_CLIENT_KEY);
    sessionStorage.removeItem(SS_ORG_SEEDED_FLAG);
  } catch {}
}

export function getViewerRoleFE(): ViewerRole {
  if (typeof window === 'undefined') return 'family';

  if (isMock) {
    const s = (sessionStorage.getItem(SS_MOCK_ROLE) || '').toLowerCase();
    if (s === 'family' || s === 'carer' || s === 'management') return s as ViewerRole;
  }

  const l = (localStorage.getItem(LS_ACTIVE_ROLE) || '').toLowerCase();
  if (l === 'family' || l === 'carer' || l === 'management') return l as ViewerRole;

  return 'family';
}

export function clearViewerRoleFE(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_ACTIVE_ROLE);
  try {
    sessionStorage.removeItem(SS_MOCK_ROLE);
    sessionStorage.removeItem(SS_ORG_SEEDED_FLAG);
  } catch {}
}

// ====================== Clients & Organisations ===================

export type Client = {
  _id: string;
  name: string;
  dob: string;
  dashboardType?: 'full' | 'partial';
  accessCode?: string;
  notes?: string[];
  avatarUrl?: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
  medicalNotes?: string;
  emergencyContact?: string;
  address?: string;
};

export type Organisation = {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'revoked';
};

export const NAME_BY_ID: Record<string, string> = {
  [FULL_DASH_ID]: 'Mock Alice',
  [PARTIAL_DASH_ID]: 'Mock Bob',
  [CATHY_ID]: 'Mock Cathy',
};

export function readActiveClientFromStorage(): { id: string | null; name: string } {
  if (typeof window === 'undefined') return { id: null, name: '' };
  const id = localStorage.getItem(LS_ACTIVE_CLIENT_ID);
  let name = localStorage.getItem(LS_CURRENT_CLIENT_NAME) || '';
  if (!name && id) name = NAME_BY_ID[id] || '';
  return { id, name };
}

export function writeActiveClientToStorage(id: string, name?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ACTIVE_CLIENT_ID, id);
  if (name) localStorage.setItem(LS_CURRENT_CLIENT_NAME, name);
}

/* ---------- FE store for per-(client, org) access status ----------

localStorage:
  'currentOrgId'        -> string (e.g., 'org1')
  'orgStatusByClient'   -> JSON: { [clientId]: { [orgId]: 'approved'|'pending'|'revoked' } }

sessionStorage:
  'orgSeededThisSession' -> '1' if defaults were seeded once this login
------------------------------------------------------------------ */

export type OrgStatusFE = 'approved' | 'pending' | 'revoked';
type OrgStatusMap = Record<string, Record<string, OrgStatusFE>>;
const ORG_STATUS_BY_CLIENT_KEY = 'orgStatusByClient';

export function getCurrentOrgIdFE(): string {
  if (typeof window === 'undefined') return 'org1';
  return localStorage.getItem('currentOrgId') || 'org1';
}

export function setCurrentOrgIdFE(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('currentOrgId', id);
}

function readStatusMap(): OrgStatusMap {
  try {
    const raw = localStorage.getItem(ORG_STATUS_BY_CLIENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function writeStatusMap(m: OrgStatusMap) {
  try {
    localStorage.setItem(ORG_STATUS_BY_CLIENT_KEY, JSON.stringify(m));
  } catch {}
}

/** Return override for (clientId, orgId); undefined if not set. */
export function getOrgStatusForClientFE(clientId: string, orgId: string): OrgStatusFE | undefined {
  const m = readStatusMap();
  return m[clientId]?.[orgId];
}

/** Persist override for (clientId, orgId). Triggers live sync via storage event. */
export function setOrgStatusForClientFE(clientId: string, orgId: string, status: OrgStatusFE) {
  const m = readStatusMap();
  m[clientId] = m[clientId] || {};
  m[clientId][orgId] = status;
  writeStatusMap(m);
}

/**
 * Seed per-client initial org status ONLY once per session.
 * Defaults:
 *   - mock1 (Alice) -> approved
 *   - mock2 (Bob)   -> pending
 *   - mock-cathy    -> revoked
 */
export function seedOrgStatusDefaultsFE() {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(SS_ORG_SEEDED_FLAG) === '1') return; // already seeded this login

    const orgId = getCurrentOrgIdFE();
    const m = readStatusMap();

    const ensure = (clientId: string, status: OrgStatusFE) => {
      m[clientId] = m[clientId] || {};
      if (!m[clientId][orgId]) {
        m[clientId][orgId] = status;
      }
    };

    ensure(FULL_DASH_ID, 'approved');   // Alice
    ensure(PARTIAL_DASH_ID, 'pending'); // Bob
    ensure(CATHY_ID, 'revoked');        // Cathy

    writeStatusMap(m);
    sessionStorage.setItem(SS_ORG_SEEDED_FLAG, '1');
  } catch {}
}

/** Demo organisations */
export const MOCK_ORGS: Organisation[] = [
  { id: 'org1', name: 'Sunrise Care', status: 'active' },
  { id: 'org2', name: 'North Clinic', status: 'pending' },
  { id: 'org3', name: 'Old Town Care', status: 'revoked' },
];

// ============================== Clients API (FE) ==============================

export async function getClientsFE(): Promise<Client[]> {
  if (isMock) {
    const base: Client[] = [
      { _id: FULL_DASH_ID,  name: 'Mock Alice', dob: '1943-09-19', dashboardType: 'full',    orgAccess: 'approved' },
      { _id: PARTIAL_DASH_ID, name: 'Mock Bob',   dob: '1950-01-02', dashboardType: 'partial', orgAccess: 'pending'  },
      { _id: CATHY_ID,        name: 'Mock Cathy', dob: '1962-11-05', dashboardType: 'full',    orgAccess: 'revoked'  },
    ];
    return base;
  }

  const res = await fetch('/api/v1/clients', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch clients (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Client[]) : [];
}

export async function getClientByIdFE(id: string): Promise<Client | null> {
  if (isMock) {
    const all = await getClientsFE();
    return all.find((c) => c._id === id) || null;
  }
  const res = await fetch(`/api/v1/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as Client;
}

// ============================== Tasks API ==============================

export type Task = {
  id: string;
  clientId: string;
  title: string;
  category?: string;
  frequency: string;
  lastDone: string; // YYYY-MM-DD
  nextDue: string;  // YYYY-MM-DD
  status: 'Pending' | 'Overdue' | 'Completed';
  comments: string[];
  files: string[];  // legacy demo filenames (not used by new uploader)
};

const TASKS_LS_KEY = 'tasks';

const DEMO_TASKS: Task[] = [
  // Alice
  {
    id: '1',
    clientId: FULL_DASH_ID,
    title: 'Dental Appointment',
    category: 'Appointments',
    frequency: 'Monthly',
    lastDone: '2025-09-15',
    nextDue: '2025-10-01',
    status: 'Pending',
    comments: ['Carer note: Arrived on time, patient was calm.'],
    files: [],
  },
  {
    id: '2',
    clientId: FULL_DASH_ID,
    title: 'Replace Toothbrush Head',
    category: 'Hygiene',
    frequency: 'Every 3 months',
    lastDone: '2025-07-13',
    nextDue: '2025-10-13',
    status: 'Pending',
    comments: ['Carer note: Current head slightly worn.'],
    files: [],
  },
  // Bob
  {
    id: '3',
    clientId: PARTIAL_DASH_ID,
    title: 'Submit Report',
    category: 'Administration',
    frequency: 'Weekly',
    lastDone: '2025-09-18',
    nextDue: '2025-09-25',
    status: 'Overdue',
    comments: [],
    files: [],
  },
];

export async function getTasksFE(): Promise<Task[]> {
  if (isMock) {
    try {
      const raw = localStorage.getItem(TASKS_LS_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hydrated = parsed.map((t, idx): Task => {
            const p = t as Partial<Task>;
            return {
              id: p.id ?? `${idx + 1}`,
              clientId: p.clientId ?? FULL_DASH_ID,
              title: typeof p.title === 'string' ? p.title : `Task ${idx + 1}`,
              category: p.category ?? '',
              frequency: p.frequency ?? '',
              lastDone: p.lastDone ?? p.nextDue ?? '',
              nextDue: p.nextDue ?? '',
              status: (p.status as Task['status']) ?? 'Pending',
              comments: p.comments ?? [],
              files: p.files ?? [],
            };
          });
          localStorage.setItem(TASKS_LS_KEY, JSON.stringify(hydrated));
          return hydrated;
        }
      }
    } catch {}
    try {
      localStorage.setItem(TASKS_LS_KEY, JSON.stringify(DEMO_TASKS));
    } catch {}
    return DEMO_TASKS;
  }

  const res = await fetch('/api/v1/tasks', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch tasks (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Task[]) : [];
}

export async function saveTasksFE(tasks: Task[]): Promise<void> {
  if (isMock) {
    try {
      localStorage.setItem(TASKS_LS_KEY, JSON.stringify(tasks));
    } catch {}
    return;
  }
  const res = await fetch('/api/v1/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tasks),
  });
  if (!res.ok) throw new Error(`Failed to save tasks (${res.status})`);
}

// ============================== Task Files (cross-role) ==============================
// Shared map used by the calendar page to store uploaded files (Data URLs) by taskId.

export type UploadedFileFE = {
  name: string;
  dataUrl: string;
  mimeType: string;
};

export type FilesMapFE = Record<string, UploadedFileFE[]>; // taskId -> files
const TASK_FILES_KEY = 'taskFiles';

export function readTaskFilesMapFE(): FilesMapFE {
  try {
    const raw = localStorage.getItem(TASK_FILES_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') return obj as FilesMapFE;
    }
  } catch {}
  return {};
}

export function writeTaskFilesMapFE(m: FilesMapFE) {
  try {
    localStorage.setItem(TASK_FILES_KEY, JSON.stringify(m));
  } catch {}
}

export function appendTaskFilesFE(taskId: string, files: UploadedFileFE[]) {
  const m = readTaskFilesMapFE();
  m[taskId] = [...(m[taskId] ?? []), ...files];
  writeTaskFilesMapFE(m);
}

// ============================== Budget API (FE) ==============================

export type BudgetRow = {
  item: string;     // e.g., 'Dental Appointments'
  category: string; // e.g., 'Appointments'
  allocated: number;
  spent: number;
};

const BUDGET_LS_KEY = 'budgetByClient'; // new: persist budgets so changes survive refresh

/** Default budgets (used to seed when empty) */
const DEFAULT_BUDGET_BY_CLIENT: Record<string, BudgetRow[]> = {
  [FULL_DASH_ID]: [
    { item: 'Dental Appointments', category: 'Appointments', allocated: 600, spent: 636 },
    { item: 'Toothbrush Heads',    category: 'Hygiene',      allocated: 30,  spent: 28  },
    { item: 'Socks',               category: 'Clothing',     allocated: 176, spent: 36  },
  ],
  [PARTIAL_DASH_ID]: [
    { item: 'GP Checkup', category: 'Appointments', allocated: 400, spent: 300 },
    { item: 'Shampoo',    category: 'Hygiene',      allocated: 50,  spent: 45  },
    { item: 'Jacket',     category: 'Clothing',     allocated: 200, spent: 120 },
  ],
  [CATHY_ID]: [
    { item: 'Eye Test',  category: 'Appointments', allocated: 500, spent: 100 },
    { item: 'Body Wash', category: 'Hygiene',      allocated: 40,  spent: 15  },
    { item: 'Shoes',     category: 'Clothing',     allocated: 300, spent: 280 },
  ],
};

function readBudgetMap(): Record<string, BudgetRow[]> {
  try {
    const raw = localStorage.getItem(BUDGET_LS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, BudgetRow[]>;
  } catch {}
  // seed when empty
  try {
    localStorage.setItem(BUDGET_LS_KEY, JSON.stringify(DEFAULT_BUDGET_BY_CLIENT));
  } catch {}
  return { ...DEFAULT_BUDGET_BY_CLIENT };
}

function writeBudgetMap(m: Record<string, BudgetRow[]>) {
  try {
    localStorage.setItem(BUDGET_LS_KEY, JSON.stringify(m));
  } catch {}
}

export async function getBudgetRowsFE(clientId: string): Promise<BudgetRow[]> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 60));
    const m = readBudgetMap();
    return m[clientId] ?? [];
  }

  const res = await fetch(`/api/v1/clients/${clientId}/budget`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch budget rows (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as BudgetRow[]) : [];
}

/** Increase spent for a given (category, item) by `amount`; create row if missing. */
export function applyTransactionToBudgetFE(clientId: string, category: string, item: string, amount: number) {
  const m = readBudgetMap();
  const rows = m[clientId] ?? [];
  const idx = rows.findIndex((r) => r.category === category && r.item === item);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], spent: Number(rows[idx].spent) + Number(amount || 0) };
  } else {
    rows.push({ item, category, allocated: 0, spent: Number(amount || 0) });
  }
  m[clientId] = rows;
  writeBudgetMap(m);
}

// ============================== Transactions API (FE) ==============================

export type Transaction = {
  id: string;
  clientId: string;
  type: 'Purchase' | 'Refund' | 'Adjustment';
  date: string;         // ISO or YYYY-MM-DD
  madeBy: string;       // e.g., user display name
  category: string;     // e.g., 'Appointments'
  item: string;         // e.g., 'Dental Appointments'
  amount: number;       // positive number (refunds can be negative if desired)
  // Receipt file saved as Data URL so all roles can open it:
  receiptDataUrl?: string;
  receiptMimeType?: string;
  receiptFilename?: string;
  // Workflow status (carer uploads -> management confirms):
  status?: 'Pending' | 'Implemented' | 'Rejected';
};

const TRANSACTIONS_LS_KEY = 'transactions';

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    clientId: FULL_DASH_ID,
    type: 'Purchase',
    date: '2025-09-20',
    madeBy: 'Carer John',
    category: 'Appointments',
    item: 'Dental Appointments',
    amount: 36,
    status: 'Implemented',
  },
  {
    id: 't2',
    clientId: FULL_DASH_ID,
    type: 'Refund',
    date: '2025-09-21',
    madeBy: 'Family Alice',
    category: 'Hygiene',
    item: 'Toothbrush Heads',
    amount: -2,
    status: 'Implemented',
  },
  {
    id: 't3',
    clientId: FULL_DASH_ID,
    type: 'Purchase',
    date: '2025-09-28',
    madeBy: 'Carer Mary',
    category: 'Hygiene',
    item: 'Mouthwash',
    amount: 8.5,
    status: 'Pending',
  },
  {
    id: 't4',
    clientId: PARTIAL_DASH_ID,
    type: 'Purchase',
    date: '2025-09-22',
    madeBy: 'Family Bob',
    category: 'Clothing',
    item: 'Socks',
    amount: 12,
    status: 'Implemented',
  },
];

function readTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_LS_KEY);
    if (raw) return JSON.parse(raw) as Transaction[];
  } catch {}
  try {
    localStorage.setItem(TRANSACTIONS_LS_KEY, JSON.stringify(DEMO_TRANSACTIONS));
  } catch {}
  return DEMO_TRANSACTIONS;
}

function writeTransactions(all: Transaction[]) {
  try {
    localStorage.setItem(TRANSACTIONS_LS_KEY, JSON.stringify(all));
  } catch {}
}

export async function getTransactionsFE(clientId: string): Promise<Transaction[]> {
  if (isMock) {
    const all = readTransactions();
    return all.filter((tx) => tx.clientId === clientId);
  }

  const res = await fetch(`/api/v1/clients/${clientId}/transactions`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch transactions (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Transaction[]) : [];
}

/**
 * Carer (or any role) can create a transaction with a receipt (Data URL).
 * Use this from your UI after reading a File via FileReader.readAsDataURL.
 */
export async function addTransactionFE(tx: Omit<Transaction, 'id' | 'status'> & { status?: Transaction['status'] }): Promise<string> {
  if (isMock) {
    const all = readTransactions();
    const withId: Transaction = { ...tx, id: `t${Date.now()}`, status: tx.status ?? 'Pending' };
    all.push(withId);
    writeTransactions(all);
    return withId.id;
  }

  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error(`Failed to save transaction (${res.status})`);
  const created = await res.json();
  return created?.id ?? '';
}

/**
 * Management flow: set transaction status.
 * When status becomes 'Implemented', budget.spent is updated accordingly.
 */
export async function setTransactionStatusFE(txId: string, status: 'Pending' | 'Implemented' | 'Rejected'): Promise<void> {
  if (!isMock) return; // backend mode would post to API

  const all = readTransactions();
  const idx = all.findIndex((t) => t.id === txId);
  if (idx < 0) return;

  const prev = all[idx];
  all[idx] = { ...prev, status };
  writeTransactions(all);

  // Apply to budget when implemented
  if (status === 'Implemented') {
    applyTransactionToBudgetFE(prev.clientId, prev.category, prev.item, Number(prev.amount || 0));
  }
}

// ============================ Users & Access (FE) ============================

export type AccessUser = {
  id: string;
  name: string;
  role: ViewerRole; // 'family' | 'carer' | 'management'
};

/** Per-client mock users who can access this client's data */
const MOCK_USERS_BY_CLIENT: Record<string, AccessUser[]> = {
  [FULL_DASH_ID]: [
    { id: 'u-alice-family', name: 'Alice Nguyen', role: 'family' },
    { id: 'u-john-carer',   name: 'John Turner',  role: 'carer' },
    { id: 'u-mgr-1',        name: 'Clinic Manager', role: 'management' },
  ],
  [PARTIAL_DASH_ID]: [
    { id: 'u-bobjr-family', name: 'Bob Smith Jr.', role: 'family' },
    { id: 'u-david-carer',  name: 'David Lee',     role: 'carer' },
  ],
  [CATHY_ID]: [
    { id: 'u-emma-family',    name: 'Emma Clark',       role: 'family' },
    { id: 'u-opslead-mgmt',   name: 'Operations Lead',  role: 'management' },
  ],
};

/**
 * Fetch users who have access to a given client (mock or backend).
 * In mock mode this is instant; in real mode, adjust the endpoint to your API.
 */
export async function getUsersWithAccessFE(clientId: string): Promise<AccessUser[]> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 60)); // tiny demo delay
    return MOCK_USERS_BY_CLIENT[clientId] ?? [];
  }

  const res = await fetch(`/api/v1/clients/${clientId}/access`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as AccessUser[]) : [];
}
