'use client';

import React, { useEffect, useState } from 'react';

const palette = {
  canvas: '#FAEBDC',
  header: '#3A0000',
  text: '#2b2b2b',
  accent: '#ff9999',
  btn: '#3A0000',
  inputBorder: '#602222',
  notice: '#F9C9B1',
};

export default function GenerateCode({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [role, setRole] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedCode(null);

    if (!role) {
      setError('Please select a role.');
      return;
    }

    setLoading(true);
    try {
      const fakeCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      await new Promise((r) => setTimeout(r, 1000));
      setGeneratedCode(fakeCode);
    } catch {
      setError('Failed to generate code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* overlay */}
      <button
        aria-label="Close overlay"
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        aria-label="Generate staff invite code panel"
        role="dialog"
        aria-modal="true"
        className={`
          fixed top-0 right-0 z-[100] h-screen w-1/2
          transform transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
          shadow-2xl flex flex-col
        `}
        style={{ backgroundColor: palette.canvas }}
      >
        {/* header */}
        <div
          className="w-full flex items-center justify-center px-6 py-4 relative"
          style={{ backgroundColor: palette.header, color: '#fff' }}
        >
          <h2 className="text-2xl font-bold">Generate staff invite code</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* notice */}
        <div
          className="w-full px-6 md:px-8 py-5 md:py-6"
          style={{ backgroundColor: palette.notice }}
        >
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-black">
            Please generate a staff invite code based on the role of the new
            staff member. Copy the code and send it to the new staff member so
            that they can sign up to your organisation.
          </p>
        </div>

        {/* message states */}
        {error && (
          <div
            className="w-full text-center rounded-md border px-4 py-2 text-sm font-medium"
            style={{
              borderColor: '#ff4d4d',
              color: '#b30000',
              backgroundColor: '#ffe6e6',
            }}
          >
            {error}
          </div>
        )}

        {generatedCode && (
          <div
            className="w-full text-center rounded-md border px-4 py-2 text-sm font-medium"
            style={{
              borderColor: '#3bb273',
              color: '#155724',
              backgroundColor: '#e6f4ea',
            }}
          >
            Invite code generated: <b>{generatedCode}</b>
          </div>
        )}

        {/* body */}
        <section className="flex-1 flex flex-col items-center justify-start">
          <form
            onSubmit={handleGenerate}
            className="mt-16 flex flex-col items-center justify-center gap-5 w-full max-w-md"
          >
            <label className="w-full text-left text-[#3A0000] font-semibold">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-12 w-full rounded border text-center text-lg"
              style={{
                borderColor: palette.inputBorder,
                color: palette.text,
                background: 'white',
              }}
            >
              <option value="">Select Role</option>
              <option value="carer">Carer</option>
              <option value="management">Management</option>
            </select>

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full text-[#3A0000] font-semibold"
                style={{ backgroundColor: '#EAD4C0' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full px-6 sm:px-7 py-3 text-white text-lg font-semibold shadow-sm active:translate-y-[1px]"
                style={{ backgroundColor: palette.btn }}
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </form>
        </section>
      </aside>
    </>
  );
}
