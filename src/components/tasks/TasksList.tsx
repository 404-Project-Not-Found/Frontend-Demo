'use client';

import { Task } from '@/app/calendar_dashboard/types'; // import from types

type TasksListProps = {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
};

export default function TasksList({ tasks, onTaskClick }: TasksListProps) {
  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="w-full bg-white text-black border rounded px-3 py-2 cursor-pointer hover:bg-gray-100"
          onClick={() => onTaskClick(t)}
        >
          <div className="font-bold">{t.title}</div>
          <p className="text-sm text-gray-700">Scheduled due: {t.nextDue}</p>
          <p className="text-sm text-gray-700">
            Status: {t.status || 'Pending'}
          </p>
        </li>
      ))}
    </ul>
  );
}
