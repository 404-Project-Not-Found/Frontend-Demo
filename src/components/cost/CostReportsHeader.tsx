'use client';

import Link from 'next/link';

type Props = {
  q: string;
  setQ: (v: string) => void;
};

export default function CostReportsHeader({ q, setQ }: Props) {
  return (
    <header className="bg-[#3d0000] text-white px-5 py-7 flex justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="inline-flex h-8 w-8 rounded-full bg-white/15 items-center justify-center"
          aria-label="Back to dashboard"
          title="Back"
        >
          ←
        </Link>
        <h1 className="text-xl font-semibold">Cost Report</h1>
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search cost report"
            className="h-9 rounded-full bg-white text-black px-4"
          />
        </div>
      </div>
    </header>
  );
}
