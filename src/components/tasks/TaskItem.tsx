'use client';

type TaskItemProps = {
  title: string;
  nextDue: string;
};

export default function TaskItem({ title, nextDue }: TaskItemProps) {
  return (
    <li className="w-full bg-white text-black border rounded px-3 py-2">
      <div>{title}</div>
      <p className="text-sm text-gray-600">Scheduled due: {nextDue}</p>
    </li>
  );
}
