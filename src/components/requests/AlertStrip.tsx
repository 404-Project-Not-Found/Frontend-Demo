'use client';

type Props = { message?: string };

export default function AlertStrip({ message }: Props) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#fde7e4] text-[#9b2c2c] px-4 py-2">
      <span className="text-lg leading-none">🔔</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}
