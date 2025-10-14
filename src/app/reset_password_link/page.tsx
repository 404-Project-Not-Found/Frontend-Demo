/**
 * File path: /reset_password_link/page.tsx
 * Authors: Devni Wijesinghe & Denise Alexander
 * Date Created: 17/09/2025
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ResetPasswordEmailPage() {
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch('/api/v1/request_reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log(data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
    /* Replace with API call to request reset link
    console.log("Requesting reset link for:", email);
    setSubmitted(true);*/
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fff4e6] relative">
      {/* Logo top-left */}
      <div className="absolute top-6 left-6">
        <Image src="/logo-name.png" alt="Logo" width={220} height={80} />
      </div>

      <div className="flex flex-col items-center p-8 rounded-xl">
        <h1 className="text-2xl font-bold mb-8 text-black">Reset Password</h1>

        {submitted ? (
          <p className="text-700 bg-[#DFC9A9] text-center">
            If an account with <b>{email}</b> exists, a reset link has been
            sent.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center space-y-6"
          >
            {/* Label + input on same line */}
            <label className="flex items-center space-x-4 text-black">
              <span>Enter Email:</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-[#3d0000] rounded px-3 py-1 text-black focus:outline-none"
                required
              />
            </label>

            <button
              type="submit"
              className="bg-[#3d0000] text-white px-6 py-2 rounded-full hover:opacity-90"
            >
              Request reset link
            </button>
          </form>
        )}

        <button
          onClick={() => router.push('/')}
          className="mt-6 text-black underline"
        >
          Back to Login
        </button>
      </div>

      {/* Help circle pinned to bottom-right */}
      <div className="fixed bottom-6 right-6 group">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold cursor-pointer shadow-md"
          style={{ backgroundColor: '#ed5f4f' }}
        >
          ?
        </button>
        {/* White tooltip above with black text */}
        <div className="absolute bottom-12 right-0 opacity-0 group-hover:opacity-100 transition bg-white text-black text-xs px-3 py-2 rounded shadow-md whitespace-nowrap z-10">
          Enter your account email and click &quot;Request reset link&quot;.
          <br />
          Check your inbox for the reset instructions.
        </div>
      </div>
    </div>
  );
}
