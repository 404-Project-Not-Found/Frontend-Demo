/**
 * File path: /reset_password/page.client.tsx
 * Authors: Devni Wijesinghe & Denise Alexander
 * Date Created: 17/09/2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>(
    'success'
  );
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setNotification('Please fill in both fields.');
      setNotificationType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotification('Passwords do not match.');
      setNotificationType('error');
      return;
    }
    if (!token) {
      setNotification('Invalid reset link.');
      setNotificationType('error');
      return;
    }
    try {
      const res = await fetch('/api/v1/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification(data.message);
        setNotificationType('success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setNotification(data.error);
        setNotificationType('error');
      }
    } catch (err) {
      console.error(err);
      setNotification('Something went wrong.');
      setNotificationType('error');
    }
    /* setNotification("Password reset successfully!");
    setNotificationType("success");
    setNewPassword("");
    setConfirmPassword("");
    setShowNew(false);
    setShowConfirm(false); */
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fff4e6] relative">
      {/* Logo top-left */}
      <div className="absolute top-6 left-6">
        <Image src="/logo-name.png" alt="Logo" width={220} height={80} />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-black mb-8 text-center">
        Reset Password
      </h1>

      {/* Notification banner */}
      {notification && (
        <div
          className={`mb-4 w-full max-w-md text-center py-2 px-4 rounded ${
            notificationType === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {notification}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleReset}
        className="flex flex-col items-center space-y-6 p-8 rounded-xl bg-[#fff4e6]"
      >
        <div className="grid grid-cols-[150px_1fr_auto] gap-x-2 gap-y-4 w-full max-w-md items-center">
          {/* New Password */}
          <label className="text-black text-right whitespace-nowrap">
            New Password:
          </label>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-gray-400 rounded px-3 py-1 text-black focus:outline-none w-full"
            required
          />
          <span
            className="text-sm text-blue-700 underline cursor-pointer whitespace-nowrap"
            onClick={() => setShowNew(!showNew)}
          >
            Show Password
          </span>

          {/* Confirm Password */}
          <label className="text-black text-right whitespace-nowrap">
            Confirm Password:
          </label>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-400 rounded px-3 py-1 text-black focus:outline-none w-full"
            required
          />
          <span
            className="text-sm text-blue-700 underline cursor-pointer whitespace-nowrap"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            Show Password
          </span>
        </div>

        {/* Reset Button */}
        <button
          type="submit"
          className="bg-[#3d0000] text-white px-6 py-2 rounded-full hover:opacity-90 mt-4"
        >
          Reset
        </button>
      </form>

      {/* Back to login */}
      <button
        onClick={() => router.push('/login')}
        className="mt-6 text-black underline"
      >
        Back to Login
      </button>

      {/* Help button fixed bottom-right */}
      {/* <div className="fixed bottom-6 right-6 group">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow-md cursor-pointer"
          style={{ backgroundColor: '#ed5f4f' }}
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          ?
        </button>
        
        {showHelp && (
          <div className="absolute bottom-12 right-0 bg-white text-black text-xs px-3 py-2 rounded shadow-md whitespace-nowrap z-10">
            Enter your new password twice and click &quot;Reset&quot;. Both
            passwords must match. Click &quot;Show Password&quot; to view.
          </div>
        )}
      </div> */}
    </div>
  );
}
