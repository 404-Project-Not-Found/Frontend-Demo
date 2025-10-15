/**
 * File path: /src/lib/mock/mockApi.ts
 * Author: Qingyue Zhao
 * Date Created: 28/09/2025
 *
 * Notes:
 * - Frontend mock mode (NEXT_PUBLIC_ENABLE_MOCK=1):
 *     - Clients: hardcoded mock list
 *     - Tasks:   localStorage('tasks') or seeded demo tasks
 *     - Budget:  per-client mock data
 *     - Txns:    per-client mock data in localStorage('transactions')
 *     - Role:    session/local storage
 * - Real backend mode:
 *     - Clients: /api/v1/clients, /api/v1/clients/:id
 *     - Tasks:   /api/v1/tasks
 *     - Budget:  /api/v1/clients/:id/budget
 *     - Txns:    /api/v1/clients/:id/transactions
 */

// ### Common exports expected by pages

// - **Environment & Role**
//   - `isMock`
//   - `setViewerRoleFE(role)` / `getViewerRoleFE()` / `clearViewerRoleFE()`

// - **Clients**
//   - `getClientsFE()` / `getClientByIdFE(id)`
//   - `readActiveClientFromStorage()` / `writeActiveClientToStorage(id, name?)`
//   - Demo constants: `FULL_DASH_ID`, `PARTIAL_DASH_ID`, `NAME_BY_ID`

// - **Tasks**
//   - `getTasksFE()` / `saveTasksFE(tasks)`
//   - Dropdown helpers: `getTaskCatalogFE()` / `getFrequencyOptionsByTaskSlugFE(slug)`

// - **Budget**
//   - `getBudgetRowsFE(clientId)`

// - **Transactions**
//   - `getTransactionsFE(clientId)` / `addTransactionFE(tx)`

// - **Requests (Change Log)**
//   - `getRequestsByClientFE(clientId)` / `saveRequestsFE(requests)`

/* =========================
 * Flags & Shared Constants
 * ========================= */

export const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

export const FULL_DASH_ID = 'mock1';       // Mock Alice (full dashboard)
export const PARTIAL_DASH_ID = 'mock2';    // Mock Bob (partial dashboard)
export const CATHY_ID = 'mock-cathy';      // Mock Cathy (full dashboard)

export const LS_ACTIVE_CLIENT_ID = 'activeClientId';
export const LS_CURRENT_CLIENT_NAME = 'currentClientName';

/* =================
 * Viewer Role (FE)
 * ================= */

export type ViewerRole = 'family' | 'carer' | 'management';
export const LS_ACTIVE_ROLE = 'activeRole'; // long-lived
export const SS_MOCK_ROLE = 'mockRole';     // session-scoped for mock

export function setViewerRoleFE(role: ViewerRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ACTIVE_ROLE, role);
  try {
    sessionStorage.setItem(SS_MOCK_ROLE, role);
  } catch {}
}

export function getViewerRoleFE(): ViewerRole {
  if (typeof window === 'undefined') return 'family';

  if (isMock) {
    const s = (sessionStorage.getItem(SS_MOCK_ROLE) || '').toLowerCase();
    if (s === 'family' || s === 'carer' || s === 'management')
      return s as ViewerRole;
  }

  const l = (localStorage.getItem(LS_ACTIVE_ROLE) || '').toLowerCase();
  if (l === 'family' || l === 'carer' || l === 'management')
    return l as ViewerRole;

  return 'family';
}

export function clearViewerRoleFE(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_ACTIVE_ROLE);
  try {
    sessionStorage.removeItem(SS_MOCK_ROLE);
  } catch {}
}

/* ============================
 * Clients & Organisations API
 * ============================ */

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

/** Fallback name map (when currentClientName not set) */
export const NAME_BY_ID: Record<string, string> = {
  [FULL_DASH_ID]: 'Mock Alice',
  [PARTIAL_DASH_ID]: 'Mock Bob',
  [CATHY_ID]: 'Mock Cathy',
};

export function readActiveClientFromStorage(): {
  id: string | null;
  name: string;
} {
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

/* ---------------------------------------------
 * FE store for per-(client, org) access status
 * ---------------------------------------------
 * Key layout in localStorage:
 *   'currentOrgId'           -> string (e.g., 'org1')
 *   'orgStatusByClient'      -> JSON: { [clientId]: { [orgId]: 'approved'|'pending'|'revoked' } }
 */

type OrgStatusFE = 'approved' | 'pending' | 'revoked';
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

/** Read override for (clientId, orgId); returns undefined if not set. */
export function getOrgStatusForClientFE(
  clientId: string,
  orgId: string
): OrgStatusFE | undefined {
  const m = readStatusMap();
  return m[clientId]?.[orgId];
}

/** Persist override for (clientId, orgId) and emit storage. */
export function setOrgStatusForClientFE(
  clientId: string,
  orgId: string,
  status: OrgStatusFE
) {
  const m = readStatusMap();
  m[clientId] = m[clientId] || {};
  m[clientId][orgId] = status;
  writeStatusMap(m);
}

/**
 * Seed per-client initial org status (only when missing):
 * - mock1 (Alice) -> approved
 * - mock2 (Bob)   -> pending
 * - mock-cathy    -> revoked
 */
export function seedOrgStatusDefaultsFE() {
  if (typeof window === 'undefined') return;
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
}

/** Optional: mock organisations for UI demo (unchanged) */
export const MOCK_ORGS: Organisation[] = [
  { id: 'org1', name: 'Sunrise Care', status: 'active' },
  { id: 'org2', name: 'North Clinic', status: 'pending' },
  { id: 'org3', name: 'Old Town Care', status: 'revoked' },
];

/* ==========
 * Clients API (FE)
 * ========== */

/** Fetch all clients (mock or backend) */
export async function getClientsFE(): Promise<Client[]> {
  if (isMock) {
    const baseClients: (Client & {
      orgAccess?: 'approved' | 'pending' | 'revoked';
    })[] = [
      {
        _id: FULL_DASH_ID,
        name: 'Mock Alice',
        dob: '1943-09-19',
        dashboardType: 'full',
        accessCode: '',
        notes: [],
        avatarUrl: '',
        orgAccess: 'approved', // Alice initial
      },
      {
        _id: PARTIAL_DASH_ID,
        name: 'Mock Bob',
        dob: '1950-01-02',
        dashboardType: 'partial',
        accessCode: '',
        notes: [],
        avatarUrl: '',
        orgAccess: 'pending', // Bob initial
      },
      {
        _id: CATHY_ID,
        name: 'Mock Cathy',
        dob: '1962-11-05',
        dashboardType: 'full',
        accessCode: '',
        notes: [],
        avatarUrl: '',
        orgAccess: 'revoked', // Cathy initial
      },
    ];
    return baseClients;
  }

  const res = await fetch('/api/v1/clients', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch clients (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Client[]) : [];
}

/** Fetch one client by ID (mock or backend) */
export async function getClientByIdFE(id: string): Promise<Client | null> {
  if (isMock) {
    const mockData: Client[] = [
      {
        _id: FULL_DASH_ID,
        name: 'Mock Alice',
        dob: '1943-09-19',
        dashboardType: 'full',
        accessCode: '',
        notes: [],
        avatarUrl: '',
        orgAccess: 'pending',
      },
      {
        _id: PARTIAL_DASH_ID,
        name: 'Mock Bob',
        dob: '1950-01-02',
        dashboardType: 'partial',
        accessCode: '',
        notes: [],
        avatarUrl: '',
        orgAccess: 'pending',
      },
      {
        _id: CATHY_ID,
        name: 'Mock Cathy',
        dob: '1962-11-05',
        dashboardType: 'full',
        accessCode: '',
        notes: [],
        avatarUrl: '',
        orgAccess: 'pending',
      },
    ];
    return mockData.find((c) => c._id === id) || null;
  }

  const res = await fetch(`/api/v1/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as Client;
}

/* ==========
 * Tasks API
 * ========== */

export type Task = {
  id: string;
  clientId: string; // which client this task belongs to
  title: string;
  category?: string; // optional: auto derived from catalog
  frequency: string;
  lastDone: string; // YYYY-MM-DD
  nextDue: string; // YYYY-MM-DD
  status: 'Pending' | 'Overdue' | 'Completed';
  comments: string[];
  files: string[];
};

const TASKS_LS_KEY = 'tasks';

/** Demo tasks pre-seeded */
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
    files: ['dental_referral.pdf'],
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
    files: ['toothbrush_receipt.png'],
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

/** Fetch all tasks (mock or backend) */
export async function getTasksFE(): Promise<Task[]> {
  if (isMock) {
    try {
      const raw = localStorage.getItem(TASKS_LS_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure clientId is present (migrate old data)
          const hydrated = parsed.map((t, idx): Task => {
            const partial = t as Partial<Task>;
            return {
              id: partial.id ?? `${idx + 1}`,
              clientId: partial.clientId ?? FULL_DASH_ID,
              title:
                typeof partial.title === 'string'
                  ? partial.title
                  : `Task ${idx + 1}`,
              category: partial.category ?? '',
              frequency: partial.frequency ?? '',
              lastDone: partial.lastDone ?? partial.nextDue ?? '',
              nextDue: partial.nextDue ?? '',
              status: partial.status ?? 'Pending',
              comments: partial.comments ?? [],
              files: partial.files ?? [],
            };
          });
          localStorage.setItem(TASKS_LS_KEY, JSON.stringify(hydrated));
          return hydrated;
        }
      }
    } catch {
      // ignore
    }
    // fallback: seed with demo tasks
    try {
      localStorage.setItem(TASKS_LS_KEY, JSON.stringify(DEMO_TASKS));
    } catch {}
    return DEMO_TASKS;
  }

  // real backend
  const res = await fetch('/api/v1/tasks', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch tasks (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Task[]) : [];
}

/** Save tasks (mock or backend) */
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

/* =================
 * Task Catalog (FE)
 * ================= */

export type TaskCatalogItem = { label: string; slug: string };
export type TaskCatalog = { category: string; tasks: TaskCatalogItem[] }[];

export function getTaskCatalogFE(): TaskCatalog {
  return [
    {
      category: 'Medical',
      tasks: [
        { label: 'Dental Appointment', slug: 'dental-appointment' },
        { label: 'GP Checkup', slug: 'gp-checkup' },
        { label: 'Eye Test', slug: 'eye-test' },
      ],
    },
    {
      category: 'Hygiene',
      tasks: [
        { label: 'Replace Toothbrush Head', slug: 'replace-toothbrush-head' },
        { label: 'Shower Assistance', slug: 'shower-assistance' },
        { label: 'Nail Trimming', slug: 'nail-trimming' },
      ],
    },
    {
      category: 'Clothing',
      tasks: [
        { label: 'Laundry Pickup', slug: 'laundry-pickup' },
        { label: 'Seasonal Wardrobe Update', slug: 'seasonal-wardrobe-update' },
        { label: 'Mend Clothing', slug: 'mend-clothing' },
      ],
    },
  ];
}

/* =================
 * Frequency Options
 * ================= */

export type Unit = 'day' | 'week' | 'month' | 'year';

export type FrequencyOption = {
  id: string;
  label: string;
  count: number;
  unit: Unit;
};

const DEFAULT_FREQUENCY_OPTIONS: FrequencyOption[] = [
  { id: '1w', label: 'Every week', count: 1, unit: 'week' },
  { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
  { id: '1m', label: 'Every month', count: 1, unit: 'month' },
  { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
  { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
  { id: '1y', label: 'Every year', count: 1, unit: 'year' },
];

const TASK_TEMPLATES: Record<string, { frequencyOptions: FrequencyOption[] }> =
  {
    'dental-appointment': {
      frequencyOptions: [
        { id: '1m', label: 'Every month', count: 1, unit: 'month' },
        { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
        { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
        { id: '1y', label: 'Every year', count: 1, unit: 'year' },
      ],
    },
    'gp-checkup': {
      frequencyOptions: [
        { id: '1m', label: 'Every month', count: 1, unit: 'month' },
        { id: '2m', label: 'Every 2 months', count: 2, unit: 'month' },
        { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
        { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
      ],
    },
    'eye-test': {
      frequencyOptions: [
        { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
        { id: '1y', label: 'Every year', count: 1, unit: 'year' },
        { id: '2y', label: 'Every 2 years', count: 2, unit: 'year' },
      ],
    },
    'replace-toothbrush-head': {
      frequencyOptions: [
        { id: '1m', label: 'Every month', count: 1, unit: 'month' },
        { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
        { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
      ],
    },
    'shower-assistance': {
      frequencyOptions: [
        { id: '1d', label: 'Every day', count: 1, unit: 'day' },
        { id: '2d', label: 'Every 2 days', count: 2, unit: 'day' },
        { id: '1w', label: 'Every week', count: 1, unit: 'week' },
      ],
    },
    'nail-trimming': {
      frequencyOptions: [
        { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
        { id: '1m', label: 'Every month', count: 1, unit: 'month' },
        { id: '6w', label: 'Every 6 weeks', count: 6, unit: 'week' },
      ],
    },
    'laundry-pickup': {
      frequencyOptions: [
        { id: '1w', label: 'Every week', count: 1, unit: 'week' },
        { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
        { id: '1m', label: 'Every month', count: 1, unit: 'month' },
      ],
    },
    'seasonal-wardrobe-update': {
      frequencyOptions: [
        { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
        { id: '6m', label: 'Every 6 months', count: 6, unit: 'month' },
        { id: '1y', label: 'Every year', count: 1, unit: 'year' },
      ],
    },
    'mend-clothing': {
      frequencyOptions: [
        { id: '2w', label: 'Every 2 weeks', count: 2, unit: 'week' },
        { id: '1m', label: 'Every month', count: 1, unit: 'month' },
        { id: '3m', label: 'Every 3 months', count: 3, unit: 'month' },
      ],
    },
  };

export function getFrequencyOptionsByTaskSlugFE(
  slug?: string
): FrequencyOption[] {
  if (!slug) return DEFAULT_FREQUENCY_OPTIONS;
  return TASK_TEMPLATES[slug]?.frequencyOptions ?? DEFAULT_FREQUENCY_OPTIONS;
}

/* =================
 * Budget API (FE)
 * ================= */

export type BudgetRow = {
  item: string;
  category: string;
  allocated: number;
  spent: number;
};

/** Per-client demo budget (IDs aligned with getClientsFE) */
const MOCK_BUDGET_BY_CLIENT: Record<string, BudgetRow[]> = {
  [FULL_DASH_ID]: [
    {
      item: 'Dental Appointments',
      category: 'Appointments',
      allocated: 600,
      spent: 636,
    },
    { item: 'Toothbrush Heads', category: 'Hygiene', allocated: 30, spent: 28 },
    { item: 'Socks', category: 'Clothing', allocated: 176, spent: 36 },
  ],
  [PARTIAL_DASH_ID]: [
    {
      item: 'GP Checkup',
      category: 'Appointments',
      allocated: 400,
      spent: 300,
    },
    { item: 'Shampoo', category: 'Hygiene', allocated: 50, spent: 45 },
    { item: 'Jacket', category: 'Clothing', allocated: 200, spent: 120 },
  ],
  [CATHY_ID]: [
    { item: 'Eye Test', category: 'Appointments', allocated: 500, spent: 100 },
    { item: 'Body Wash', category: 'Hygiene', allocated: 40, spent: 15 },
    { item: 'Shoes', category: 'Clothing', allocated: 300, spent: 280 },
  ],
};

export async function getBudgetRowsFE(clientId: string): Promise<BudgetRow[]> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 80));
    return MOCK_BUDGET_BY_CLIENT[clientId] ?? [];
  }

  const res = await fetch(`/api/v1/clients/${clientId}/budget`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch budget rows (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as BudgetRow[]) : [];
}

/* =================
 * Transactions API (FE)
 * ================= */

export type Transaction = {
  id: string;
  clientId: string;
  type: string;
  date: string;
  madeBy: string;
  items: string[];
  receipt: string;
};

const TRANSACTIONS_LS_KEY = 'transactions';

/** Per-client demo transactions (IDs aligned) */
const DEMO_TRANSACTIONS: Transaction[] = [
  // Mock Alice (mock1)
  {
    id: 't1',
    clientId: FULL_DASH_ID,
    type: 'Purchase',
    date: '2025-09-20',
    madeBy: 'Carer John',
    items: ['Dental Appointments'],
    receipt: 'receipt1.pdf',
  },
  {
    id: 't2',
    clientId: FULL_DASH_ID,
    type: 'Refund',
    date: '2025-09-21',
    madeBy: 'Family Alice',
    items: ['Toothbrush Heads'],
    receipt: 'receipt2.jpg',
  },
  {
    id: 't3',
    clientId: FULL_DASH_ID,
    type: 'Purchase',
    date: '2025-09-28',
    madeBy: 'Carer Mary',
    items: ['Mouthwash', 'Toothpaste'],
    receipt: 'receipt3.pdf',
  },

  // Mock Bob (mock2)
  {
    id: 't4',
    clientId: PARTIAL_DASH_ID,
    type: 'Purchase',
    date: '2025-09-22',
    madeBy: 'Family Bob',
    items: ['Socks'],
    receipt: 'receipt4.pdf',
  },
  {
    id: 't5',
    clientId: PARTIAL_DASH_ID,
    type: 'Purchase',
    date: '2025-09-24',
    madeBy: 'Carer David',
    items: ['Shampoo', 'Soap'],
    receipt: 'receipt5.jpg',
  },

  // Mock Cathy (mock-cathy) no data
];

export async function getTransactionsFE(
  clientId: string
): Promise<Transaction[]> {
  if (isMock) {
    try {
      const raw = localStorage.getItem(TRANSACTIONS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return DEMO_TRANSACTIONS.filter((tx) => tx.clientId === clientId);
        }
      }
    } catch {}

    try {
      localStorage.setItem(
        TRANSACTIONS_LS_KEY,
        JSON.stringify(DEMO_TRANSACTIONS)
      );
    } catch {}
    return DEMO_TRANSACTIONS.filter((tx) => tx.clientId === clientId);
  }

  const res = await fetch(`/api/v1/clients/${clientId}/transactions`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch transactions (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Transaction[]) : [];
}

export async function addTransactionFE(tx: Transaction): Promise<void> {
  if (isMock) {
    // read all
    let all: Transaction[] = [];
    try {
      const raw = localStorage.getItem(TRANSACTIONS_LS_KEY);
      all = raw ? (JSON.parse(raw) as Transaction[]) : [];
    } catch {
      all = [];
    }

    // append with generated id
    const withId = { ...tx, id: `t${Date.now()}` };
    const merged = [...all, withId];

    try {
      localStorage.setItem(TRANSACTIONS_LS_KEY, JSON.stringify(merged));
    } catch {}
    return;
  }

  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error(`Failed to save transaction (${res.status})`);
}

/* =================
 * Requests API (FE)
 * ================= */

export type RequestLog = {
  id: string;
  clientId: string
  task: string;
  change: string;
  requestedBy: string;
  dateRequested: string;
  status: 'Pending' | 'Approved';
  resolutionDate: string;
};

const REQUESTS_LS_KEY = 'requests';

const DEMO_REQUESTS: RequestLog[] = [
  {
    id: 'r1',
    clientId: FULL_DASH_ID, // 'mock1'
    task: 'Toothbrush Heads',
    change: 'Change supplier to Colgate',
    requestedBy: 'Carer John',
    dateRequested: '12 Sep 2025',
    status: 'Pending',
    resolutionDate: '-',
  },
  {
    id: 'r2',
    clientId: FULL_DASH_ID,
    task: 'Dental Appointments',
    change: 'Reschedule to 25th Sep',
    requestedBy: 'Family Alice',
    dateRequested: '10 Sep 2025',
    status: 'Approved',
    resolutionDate: '15 Sep 2025',
  },
  {
    id: 'r3',
    clientId: FULL_DASH_ID,
    task: 'Socks',
    change: 'Request larger size',
    requestedBy: 'Carer Mary',
    dateRequested: '08 Sep 2025',
    status: 'Pending',
    resolutionDate: '-',
  },
];

export async function getRequestsByClientFE(
  clientId: string
): Promise<RequestLog[]> {
  if (isMock) {
    try {
      const raw = localStorage.getItem(REQUESTS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((r: RequestLog) => r.clientId === clientId);
        }
      }
    } catch {}

    try {
      localStorage.setItem(REQUESTS_LS_KEY, JSON.stringify(DEMO_REQUESTS));
    } catch {}
    return DEMO_REQUESTS.filter((r) => r.clientId === clientId);
  }

  const res = await fetch(`/api/v1/clients/${clientId}/requests`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch requests (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as RequestLog[]) : [];
}

export async function saveRequestsFE(requests: RequestLog[]): Promise<void> {
  if (isMock) {
    try {
      localStorage.setItem(REQUESTS_LS_KEY, JSON.stringify(requests));
    } catch {}
    return;
  }
  const res = await fetch('/api/v1/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requests),
  });
  if (!res.ok) throw new Error(`Failed to save requests (${res.status})`);
}

/* =================
 * Users & Access (FE)
 * ================= */

export type AccessUser = {
  id: string;
  name: string;
  role: ViewerRole;      // reuse: 'family' | 'carer' | 'management'
};

/** Per-client mock users who can access this client's data */
const MOCK_USERS_BY_CLIENT: Record<string, AccessUser[]> = {
  [FULL_DASH_ID]: [
    {
      id: 'u-alice-family',
      name: 'Alice Nguyen',
      role: 'family',
    },
    {
      id: 'u-john-carer',
      name: 'John Turner',
      role: 'carer',
    },
    {
      id: 'u-mgr-1',
      name: 'Clinic Manager',
      role: 'management',
    },
  ],
  [PARTIAL_DASH_ID]: [
    {
      id: 'u-bobjr-family',
      name: 'Bob Smith Jr.',
      role: 'family',
    },
    {
      id: 'u-david-carer',
      name: 'David Lee',
      role: 'carer',
    },
  ],
  [CATHY_ID]: [
    {
      id: 'u-emma-family',
      name: 'Emma Clark',
      role: 'family',
    },
    {
      id: 'u-opslead-mgmt',
      name: 'Operations Lead',
      role: 'management',
    },
  ],
};

/** Fetch users who have access to a given client (mock or backend) */
export async function getUsersWithAccessFE(clientId: string): Promise<AccessUser[]> {
  if (isMock) {
    await new Promise((r) => setTimeout(r, 60));
    return MOCK_USERS_BY_CLIENT[clientId] ?? [];
  }

  // real backend (adjust endpoint to your API)
  const res = await fetch(`/api/v1/clients/${clientId}/access`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as AccessUser[]) : [];
}


