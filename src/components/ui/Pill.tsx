'use client';

import Link from 'next/link';

type PillProps = {
  href: string;
  label: string;
  className?: string;
};

export default function Pill({ href, label, className = '' }: PillProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center h-9 px-4 rounded-full
        bg-[#4A0A0A] text-white text-sm font-semibold hover:opacity-95
        whitespace-nowrap tabular-nums ${className}`}
    >
      {label}
    </Link>
  );
}
