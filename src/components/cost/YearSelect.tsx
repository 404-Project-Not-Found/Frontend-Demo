'use client';

type Props = {
  year: string;
  setYear: (v: string) => void;
};

export default function YearSelect({ year, setYear }: Props) {
  return (
    <div className="mb-4 flex gap-2 items-center">
      <span className="font-medium text-[#000]">Select year:</span>
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="rounded-md bg-white text-black text-sm px-3 py-1 border"
      >
        <option value="2025">2025</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
      </select>
      <button
        type="button"
        aria-label="Help"
        className="h-6 w-6 rounded-full bg-[#E37E72] text-white text-xs"
      >
        ?
      </button>
    </div>
  );
}
