/**
 * Calendar Dashboard (Schedule) — Month-only view with cross-role file sync
 * Authors: Vanessa Teo, Devni Wijesinghe, Qingyue Zhao
 *
 * What’s new here :
 * - Carer multi-file upload (images, PDFs, Word, Excel, CSV, TXT); files are saved as Data URLs.
 * - Files are persisted in localStorage('taskFiles') so other roles see them immediately.
 * - Comments persist via saveTasks(); files persist via taskFiles map (no backend changes).
 * - Cross-tab/role live sync via `storage` + `visibilitychange`.
 * - Management-only “Mark as completed”: instant UI update (non-persistent overlay; resets on refresh).
 */

'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import DashboardChrome from '@/components/top_menu/client_schedule';
import CalendarPanel from '@/components/dashboard/CalendarPanel';
import TasksPanel from '@/components/tasks/TasksPanel';

import type { Task } from '@/lib/mock/mockApi';

import {
  getViewerRole,
  getTasks,
  saveTasks,
  getClients,
  getActiveClient,
  setActiveClient,
  type Client as ApiClient,
} from '@/lib/data';

/* ------------------------------ Palette ----------------------------- */
const palette = {
  header: '#3A0000',
  banner: 'rgba(249, 201, 177, 0.7)',
  text: '#2b2b2b',
  pageBg: '#FAEBDC',
};

/* ------------------------------ Types ------------------------------- */
type Role = 'carer' | 'family' | 'management';

type ClientLite = {
  id: string;
  name: string;
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type ApiClientWithAccess = ApiClient & {
  orgAccess?: 'approved' | 'pending' | 'revoked';
};

type UploadedFile = {
  name: string;
  dataUrl: string;
  mimeType: string;
};

type FilesMap = Record<string, UploadedFile[]>; // taskId -> files[]

type ClientTask = Task & {
  clientId?: string;
  comments?: string[];
  // Only rendered on UI; comes from FilesMap
  uploadedFiles?: UploadedFile[];
};

/* -------------------------- Local storage keys ---------------------- */
const TASKS_KEY = 'tasks';       // owned by your data layer
const TASK_FILES_KEY = 'taskFiles'; // added here, only this page manages

/* --------------------------- File helpers --------------------------- */
function readFilesMap(): FilesMap {
  try {
    const raw = localStorage.getItem(TASK_FILES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as FilesMap;
  } catch {}
  return {};
}

function writeFilesMap(map: FilesMap) {
  try {
    localStorage.setItem(TASK_FILES_KEY, JSON.stringify(map));
  } catch {}
}

function appendFilesToMap(taskId: string, files: UploadedFile[]) {
  const m = readFilesMap();
  m[taskId] = [...(m[taskId] ?? []), ...files];
  writeFilesMap(m);
}

/* ------------------------------ Page -------------------------------- */
export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <ClientSchedule />
    </Suspense>
  );
}

function ClientSchedule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyAddedFile = searchParams.get('addedFile'); // kept for compatibility

  /* ------------------------------ Role ------------------------------ */
  const [role, setRole] = useState<Role>('carer');

  useEffect(() => {
    (async () => {
      try {
        const r = await getViewerRole();
        setRole(r);
      } catch {
        setRole('carer');
      }
    })();
  }, []);

  /* ---------------------------- Clients ----------------------------- */
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list: ApiClient[] = await getClients();
        setClients(
          (list as ApiClientWithAccess[]).map((c) => ({
            id: c._id,
            name: c.name,
            orgAccess: c.orgAccess,
          }))
        );
        const active = await getActiveClient();
        setActiveClientId(active.id);
      } catch {
        setClients([]);
        setActiveClientId(null);
      }
    })();
  }, []);

  const onClientChange = async (id: string) => {
    const c = clients.find((x) => x.id === id);
    await setActiveClient(id || null, c?.name);
    setActiveClientId(id || null);
  };

  /* ------------------------------ Tasks ----------------------------- */
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  // UI overlay for management "Completed" state (non-persistent)
  const [uiStatus, setUiStatus] = useState<Record<string, 'Completed' | undefined>>({});
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);

  const mergeTasksWithFiles = async () => {
    const base: Task[] = await getTasks();
    const filesMap = readFilesMap();
    const merged: ClientTask[] = (Array.isArray(base) ? base : []).map((t) => ({
      ...t,
      files: [], // hide legacy demo filenames
      uploadedFiles: filesMap[t.id] ?? [],
    }));
    setTasks(merged);
  };

  useEffect(() => {
    mergeTasksWithFiles().then(() => setUiStatus({}));
  }, []);

  // Live sync across tabs / roles
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TASKS_KEY || e.key === TASK_FILES_KEY) mergeTasksWithFiles();
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') mergeTasksWithFiles();
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Legacy query param no-op
  const once = useRef(false);
  useEffect(() => {
    if (role !== 'carer') return;
    if (legacyAddedFile && selectedTask && !once.current) {
      once.current = true;
    }
  }, [legacyAddedFile, selectedTask, role]);

  /* ------------------------------ Month title ----------------------- */
  const [visibleYear, setVisibleYear] = useState<number | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<number | null>(null);

  const MONTH_NAMES = useMemo(
    () => ['January','February','March','April','May','June','July','August','September','October','November','December'],
    []
  );

  const titleParts = useMemo(() => {
    if (visibleYear && visibleMonth) {
      return { main: 'All care items', sub: `in ${MONTH_NAMES[visibleMonth - 1]} ${visibleYear}` };
    }
    return { main: 'All care items', sub: '' };
  }, [visibleYear, visibleMonth, MONTH_NAMES]);

  /* -------------------- Client filter + search ---------------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const tasksByClient: ClientTask[] = activeClientId
    ? tasks.filter((t) => !t.clientId || t.clientId === activeClientId)
    : [];

  const withEffectiveStatus = (t: ClientTask): ClientTask => ({
    ...t,
    status: uiStatus[t.id] ?? t.status,
  });

  const tasksForRightPane = tasksByClient
    .map(withEffectiveStatus)
    .filter((t) => t.title.toLowerCase().includes(searchTerm.trim().toLowerCase()));

  /* ----------------------------- Actions ---------------------------- */
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  const persistTasks = async (next: ClientTask[]) => {
    try {
      await saveTasks(next as unknown as Task[]);
      // data layer writes to localStorage('tasks') in mock; other tabs get `storage` event
    } catch (err) {
      console.error('Failed to save tasks', err);
    }
  };

  const addComment = (taskId: string, comment: string) => {
    const text = comment.trim();
    if (!text) return;
    const next = tasks.map((t) =>
      t.id === taskId ? { ...t, comments: [...(t.comments || []), text] } : t
    );
    setTasks(next);
    setSelectedTask((prev) => (prev ? { ...prev, comments: [...(prev.comments || []), text] } : prev));
    setNewComment('');
    setIsAddingComment(false);
    persistTasks(next);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });

  const addFilesToTask = async (taskId: string, list: FileList | null) => {
    if (!list || list.length === 0) return;
    const uploaded: UploadedFile[] = [];
    for (const f of Array.from(list)) {
      try {
        const dataUrl = await readFileAsDataUrl(f);
        uploaded.push({ name: f.name, dataUrl, mimeType: f.type });
      } catch (e) {
        console.error(e);
      }
    }
    if (!uploaded.length) return;

    // 1) persist to our files map (shared for all roles)
    appendFilesToMap(taskId, uploaded);
    // 2) update current tab UI immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, uploadedFiles: [...(t.uploadedFiles || []), ...uploaded] } : t
      )
    );
    setSelectedTask((prev) =>
      prev ? { ...prev, uploadedFiles: [...(prev.uploadedFiles || []), ...uploaded] } : prev
    );
    // 3) manual storage event for same-tab listeners (optional)
    try {
      const now = Date.now();
      localStorage.setItem('__files_touch__', String(now));
      localStorage.removeItem('__files_touch__');
    } catch {}
  };

  const getStatusBadgeClasses = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'due':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-orange-400 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-300 text-black';
    }
  };

  const onLogoClick = () => router.push('/icon_dashboard');

  /* ------------------------------ Render ---------------------------- */
  return (
    <DashboardChrome
      page="client-schedule"
      clients={clients}
      onClientChange={onClientChange}
      colors={{ header: palette.header, banner: palette.banner, text: palette.text }}
      onLogoClick={onLogoClick}
    >
      <div className="flex flex-1 h-[680px]">
        {/* LEFT: Calendar */}
        <section className="flex-1 bg-white overflow-auto p-4">
          <CalendarPanel
            tasks={tasksByClient.map(withEffectiveStatus)}
            onDateClick={() => {}}
            onMonthYearChange={(y: number, m: number) => {
              setVisibleYear(y);
              setVisibleMonth(m);
            }}
          />
        </section>

        {/* RIGHT: Tasks */}
        <section className="flex-1 overflow-auto" style={{ backgroundColor: palette.pageBg }}>
          {!selectedTask ? (
            <>
              <div className="px-6 py-10 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="leading-tight">
                    <span className="block text-3xl md:text-4xl font-extrabold">{titleParts.main}</span>
                    {titleParts.sub && (
                      <span className="block text-lg font-semibold text-black/70">{titleParts.sub}</span>
                    )}
                  </h2>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search care items"
                    className="h-11 w-full max-w-[320px] rounded-lg border px-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#F9C9B1]"
                  />
                </div>
                {!activeClientId && <p className="text-lg opacity-80">Select a client to view tasks.</p>}
              </div>

              <div className="px-6 pb-8">
                <TasksPanel
                  tasks={tasksForRightPane}
                  onTaskClick={(task) => {
                    const base = tasks.find((t) => t.id === task.id) || task;
                    setSelectedTask(withEffectiveStatus(base));
                  }}
                  year={visibleYear ?? undefined}
                  month={visibleMonth ?? undefined}
                />
              </div>
            </>
          ) : (
            <TaskDetail
              role={role}
              task={selectedTask}
              setSelectedTask={setSelectedTask}
              addComment={addComment}
              addFilesToTask={addFilesToTask}
              getStatusBadgeClasses={getStatusBadgeClasses}
              newComment={newComment}
              setNewComment={setNewComment}
              isAddingComment={isAddingComment}
              setIsAddingComment={setIsAddingComment}
              uiStatus={uiStatus}
              setUiStatus={setUiStatus}
            />
          )}
        </section>
      </div>
    </DashboardChrome>
  );
}

/* ---------------------- Right column: Task details ------------------- */
function TaskDetail({
  role,
  task,
  setSelectedTask,
  addComment,
  addFilesToTask,
  getStatusBadgeClasses,
  newComment,
  setNewComment,
  isAddingComment,
  setIsAddingComment,
  uiStatus,
  setUiStatus,
}: {
  role: 'carer' | 'family' | 'management';
  task: ClientTask;
  setSelectedTask: React.Dispatch<React.SetStateAction<ClientTask | null>>;
  addComment: (taskId: string, comment: string) => void;
  addFilesToTask: (taskId: string, files: FileList | null) => Promise<void>;
  getStatusBadgeClasses: (status: string | undefined) => string;
  newComment: string;
  setNewComment: (v: string) => void;
  isAddingComment: boolean;
  setIsAddingComment: (v: boolean) => void;
  uiStatus: Record<string, 'Completed' | undefined>;
  setUiStatus: React.Dispatch<React.SetStateAction<Record<string, 'Completed' | undefined>>>;
}) {
  const isCarer = role === 'carer';
  const isManagement = role === 'management';
  const effectiveStatus = uiStatus[task.id] ?? task.status;

  const handleMarkCompleted = () => {
    setUiStatus((prev) => ({ ...prev, [task.id]: 'Completed' }));
    setSelectedTask((prev) => (prev ? { ...prev, status: 'Completed' } : prev));
  };

  return (
    <div className="flex flex-col h-full" style={{ color: palette.text }}>
      {/* Header */}
      <div className="px-6 py-6 flex items-center border-b border-black/10" style={{ backgroundColor: palette.pageBg }}>
        <button
          onClick={() => setSelectedTask(null)}
          className="mr-6 text-2xl font-extrabold"
          aria-label="Back to tasks"
          title="Back"
        >
          {'<'}
        </button>
        <h2 className="text-3xl md:text-4xl font-extrabold">{task.title}</h2>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-4 text-xl">
        <p><span className="font-extrabold">Frequency:</span> {task.frequency}</p>
        <p><span className="font-extrabold">Last Done:</span> {task.lastDone}</p>
        <p><span className="font-extrabold">Scheduled Due:</span> {task.nextDue}</p>
        <p>
          <span className="font-extrabold">Status:</span>{' '}
          <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${getStatusBadgeClasses(effectiveStatus)}`}>
            {effectiveStatus}
          </span>
        </p>

        {/* Comments */}
        <div className="mt-2">
          <h3 className="font-extrabold text-2xl mb-2">Comments</h3>
          {task.comments?.length ? (
            <ul className="list-disc pl-6 space-y-1">{task.comments.map((c, i) => <li key={i}>{c}</li>)}</ul>
          ) : (
            <p className="italic">No comments yet.</p>
          )}
        </div>

        {/* Files */}
        <div className="mt-2">
          <h3 className="font-extrabold text-2xl mb-2">Files</h3>
          {task.uploadedFiles && task.uploadedFiles.length > 0 ? (
            <ul className="space-y-3">
              {task.uploadedFiles.map((f, idx) => <FileItem key={idx} file={f} />)}
            </ul>
          ) : (
            <p className="italic">No files uploaded yet.</p>
          )}
        </div>

        {/* Carer: add comment box */}
        {isCarer && isAddingComment && (
          <div className="mt-3 p-4 border rounded bg-white">
            <textarea
              className="w-full border rounded p-3 text-lg"
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-3">
              <button
                className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200 transition"
                onClick={() => {
                  setIsAddingComment(false);
                  setNewComment('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border rounded text-white transition hover:opacity-90 focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: palette.header }}
                onClick={() => addComment(task.id, newComment)}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-4 py-10 mt-auto flex-wrap">
          {/* Carer-only */}
          {isCarer && (
            <>
              <button
                className="px-5 py-2 border rounded bg-white hover:bg-black/5 transition"
                onClick={() => setIsAddingComment(true)}
              >
                Add comment
              </button>

              {/* Upload files (multiple) */}
              <label className="px-5 py-2 border rounded bg-white cursor-pointer hover:bg-black/5 transition">
                Upload files
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
                  className="hidden"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const input = e.currentTarget;
                    const files = input.files;
                    (async () => {
                      await addFilesToTask(task.id, files);
                      input.value = ''; // allow uploading the same file again
                    })();
                  }}
                />
              </label>
            </>
          )}

          {/* Management-only */}
          {isManagement && effectiveStatus !== 'Completed' && (
            <button
              className="px-5 py-2 rounded border text-white font-semibold transition
                         hover:scale-[1.02] hover:shadow-sm focus:ring-2 focus:ring-offset-2
                         active:scale-[0.99]"
              style={{ backgroundColor: palette.header }}
              onClick={handleMarkCompleted}
              title="Mark this task as completed"
            >
              Mark as completed
            </button>
          )}
          {isManagement && effectiveStatus === 'Completed' && (
            <button
              className="px-5 py-2 rounded border font-semibold bg-green-600 text-white cursor-default opacity-80"
              disabled
              title="Already completed (UI-only)"
            >
              Completed ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------- File item renderer ------------------------- */
function FileItem({ file }: { file: UploadedFile }) {
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  return (
    <li className="flex items-center gap-3">
      {isImage && (
        <a href={file.dataUrl} target="_blank" rel="noreferrer noopener" title={file.name} className="shrink-0">
          <img src={file.dataUrl} alt={file.name} className="w-12 h-12 object-cover rounded border" />
        </a>
      )}
      <a
        href={file.dataUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="underline hover:opacity-80"
        download={file.name}
        title={file.name}
      >
        {file.name}
        {isPdf ? ' (PDF)' : ''}
      </a>
    </li>
  );
}
