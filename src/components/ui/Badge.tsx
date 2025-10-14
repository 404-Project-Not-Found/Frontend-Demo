'use client';

import { ReactNode } from 'react';

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

type BadgeProps = {
  children: ReactNode;
  tone: Tone;
};

export default function Badge({ children, tone }: BadgeProps) {
  const styles: Record<Tone, string> = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
