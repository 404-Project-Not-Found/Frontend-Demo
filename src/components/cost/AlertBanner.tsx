'use client';

type Props = {
  message?: string;
};

export default function AlertBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#fde7e4] text-[#9b2c2c] px-4 py-2">
      <span>⚠️</span>
      <p className="text-base">{message}</p>
    </div>
  );
}
