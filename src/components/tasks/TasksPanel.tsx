'use client';

import type { Task } from '@/lib/mock/mockApi';

type TasksPanelProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;

  /** Optional: exact day scope. If provided, it wins over year/month. */
  selectedDate?: string; // 'YYYY-MM-DD'
  /** Optional: month scope. Use together with `year`. 1..12 */
  month?: number;
  /** Optional: year scope. Example: 2025 */
  year?: number;
};

// Map status → pill colors (kept exactly like your original visuals)
const getStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'due':
      return 'bg-red-500 text-white';
    case 'pending':
      return 'bg-orange-400 text-white';
    case 'completed':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-300 text-black';
  }
};

// Helpers
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Filters tasks by scope:
 * - If `selectedDate` is given -> same-day only.
 * - Else if `year` + `month` are given -> same month.
 * - Else -> no extra filtering (use the `tasks` as-is).
 */
function filterByScope(
  tasks: Task[],
  selectedDate?: string,
  year?: number,
  month?: number
): Task[] {
  if (selectedDate) {
    return tasks.filter((t) => (t.nextDue || '') === selectedDate);
  }
  if (year && month) {
    const prefix = `${year}-${pad2(month)}-`; // e.g. "2025-10-"
    return tasks.filter((t) => (t.nextDue || '').startsWith(prefix));
  }
  return tasks;
}

export default function TasksPanel({
  tasks = [],
  onTaskClick,
  selectedDate,
  year,
  month,
}: TasksPanelProps) {
  // Apply the new (optional) scope filtering, then sort by date ascending.
  const scoped = filterByScope(tasks, selectedDate, year, month);
  const sorted = [...scoped].sort(
    (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      {/* Optional empty state – keeps layout intact */}
      {sorted.length === 0 && (
        <div className="text-sm text-gray-600 italic pb-2">
          No care items for the selected month and year.
        </div>
      )}

      <ul className="space-y-3">
        {sorted.map((t) => (
          <li
            key={t.id}
            className="w-full bg-white text-black border rounded px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
            onClick={() => onTaskClick(t)}
          >
            <div>
              <div className="font-bold">{t.title}</div>
              <p className="text-sm text-gray-700">
                Scheduled due: {t.nextDue}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                t.status || 'Pending'
              )}`}
            >
              {t.status || 'Pending'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
