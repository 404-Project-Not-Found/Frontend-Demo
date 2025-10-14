/**
 * File path: /components/accesscode/AddAccessCodePanel.tsx
 * Author: Qingyue Zhao
 * Date Created: 28/09/2025
 *
 * Description:
 * Right-side sliding panel for generating and copying an access code.
 * - Supports generation of random 8-character access codes.
 * - Provides a Copy button to copy code to clipboard with success/failure feedback.
 * - Blocks background scrolling when open, closes on ESC key or overlay click.
 * - Designed to be embedded in Client Profile and other related pages.
 */

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

export default function AddAccessCodePanel({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated?: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState<null | 'ok' | 'err'>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function generateCode() {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++)
      out += CHARS[Math.floor(Math.random() * CHARS.length)];
    setCode(out);
    setCopied(null);
    onGenerated?.(out);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied('ok');
    } catch {
      setCopied('err');
    } finally {
      setTimeout(() => setCopied(null), 1500);
    }
  }

  return (
    <>
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
        aria-label="Create access code panel"
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
        <div
          className="w-full flex items-center justify-center px-6 py-4 relative"
          style={{ backgroundColor: palette.header, color: '#fff' }}
        >
          <h2 className="text-2xl font-bold">Create New Access Code</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-lg hover:opacity-90 focus:outline-none"
          >
            ✕
          </button>
        </div>

        <div
          className="w-full px-6 md:px-8 py-5 md:py-6"
          style={{ backgroundColor: palette.notice }}
        >
          <p
            className="text-sm sm:text-base md:text-lg leading-relaxed"
            style={{ color: '#000' }}
          >
            <span className="font-bold">IMPORTANT:</span> Generate an access
            code, copy it and use it when you fill out{' '}
            <span className="font-bold underline">Add New Client</span>. Then,
            email the access code to the care organisation management team to
            register the client.
          </p>
        </div>

        <section className="flex-1 flex flex-col items-center justify-start">
          <div className="mt-16 flex items-center justify-center gap-4 sm:gap-5 flex-wrap">
            <button
              onClick={generateCode}
              className="rounded-full px-6 sm:px-7 py-3 text-white text-lg font-semibold shadow-sm active:translate-y-[1px]"
              style={{ backgroundColor: palette.btn }}
            >
              Generate Access Code
            </button>

            <input
              value={code}
              readOnly
              className="h-10 w-44 text-lg text-center rounded border outline-none"
              style={{
                borderColor: palette.inputBorder,
                color: palette.text,
                background: 'white',
              }}
            />
            <button
              onClick={copyCode}
              className="underline text-lg disabled:opacity-50"
              style={{ color: palette.header }}
              disabled={!code}
            >
              Copy
            </button>
            {copied && (
              <span
                className={`text-sm ${copied === 'ok' ? 'text-green-700' : 'text-red-600'}`}
              >
                {copied === 'ok' ? 'Copied!' : 'Copy failed'}
              </span>
            )}
          </div>
        </section>
      </aside>
    </>
  );
}
