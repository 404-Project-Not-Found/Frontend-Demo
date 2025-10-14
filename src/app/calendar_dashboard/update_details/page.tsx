/**
 * File path: calendar_dashboard/update_details/page.tsx
 * Authors: Devni Wijesinghe & Denise Alexander
 * Date Created: 22/09/2025
 *
 * Last Updated by Denise Alexander - 7/10/2025: back-end integration
 * added.
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';

const colors = {
  pageBg: '#ffd9b3',
  cardBg: '#F7ECD9',
  header: '#3A0000',
  text: '#2b2b2b',
  orange: '#F4A261',
};

type Role = 'carer' | 'family' | 'management';
const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

export default function UpdateDetailsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string>('');

  // -------------------------------
  // Load user email (mock or real)
  // -------------------------------
  useEffect(() => {
    async function fetchUser() {
      if (isMock) {
        // Mock mode: load mockEmail from sessionStorage
        const mockEmail = sessionStorage.getItem('mockEmail') || '';
        setEmail(mockEmail);
        return;
      }

      // Real mode: fetch from backend
      try {
        const res = await fetch('/api/v1/user/profile', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        if (data?.email) setEmail(data.email);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUser();
  }, []);

  // -------------------------------
  // Cancel button handler
  // -------------------------------
  const handleCancel = async () => {
    let role: Role | null = null;

    if (isMock) {
      // Mock: role is stored in sessionStorage
      role = (sessionStorage.getItem('mockRole') as Role | null) ?? null;
    } else {
      // Real: role comes from NextAuth session
      try {
        const session = await getSession();
        role = (session?.user?.role as Role | undefined) ?? null;
      } catch {
        role = null;
      }
    }
    router.back();
  };

  // -------------------------------
  // Save button handler
  // -------------------------------
  const handleSave = async () => {
    setError('');
    setSuccess(false);

    // Validate email format
    if (email && (!email.includes('@') || !email.includes('.'))) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const body: { email?: string; password?: string } = {};
    if (email) body.email = email;
    if (pwd) body.password = pwd;

    if (!body.email && !body.password) {
      setFormError('Please enter an email or password to update.');
      return;
    }
    setFormError('');

    // Mock mode: update sessionStorage only
    if (isMock) {
      if (body.email) sessionStorage.setItem('mockEmail', body.email);
      setSuccess(true);
      setPwd('');
      setShow(false);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    // Real backend call
    try {
      const res = await fetch('/api/v1/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setPwd('');
        setShow(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data?.error || 'Update failed. Try again later.');
      }
    } catch {
      setError('Update failed. Try again later.');
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 left-6">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={220}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Card container */}
      <div
        className="w-full max-w-xl md:max-w-2xl rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        {/* Header */}
        <div
          className="w-full flex items-center justify-center px-6 py-5"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Update your details
          </h1>
        </div>

        {/* Success message */}
        {success && (
          <div className="text-green-700 bg-green-100 px-4 py-2 rounded m-4">
            Your details have been successfully updated!
          </div>
        )}

        <div className="px-8 md:px-10 py-8 md:py-10 text-black">
          {/* Validation error */}
          {formError && (
            <div className="mb-4 p-2 rounded-md bg-red-100 border border-red-400 text-red-700">
              {formError}
            </div>
          )}

          {/* Email input */}
          <label className="block text-lg mb-2" style={{ color: colors.text }}>
            Change email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            className="w-full bg-white border-2 rounded-md px-4 py-3 mb-8 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
            placeholder={
              isMock ? 'Enter new email (mock mode)' : 'Enter new email'
            }
          />

          {/* Backend error */}
          {error && (
            <div className="text-red-700 bg-red-100 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {/* Password input */}
          <label className="block text-lg mb-2" style={{ color: colors.text }}>
            Change password:
          </label>
          <input
            type={show ? 'text' : 'password'}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full bg-white border-2 rounded-md px-4 py-3 focus:outline-none focus:ring-2"
            style={{ borderColor: `${colors.header}55` }}
            placeholder={
              isMock ? 'Enter new password (mock mode)' : 'Enter new password'
            }
          />

          {/* Show password toggle */}
          <label
            className="mt-4 flex items-center gap-2 text-lg"
            style={{ color: colors.text }}
          >
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
              className="h-4 w-4"
            />
            Show password
          </label>

          {/* Action buttons */}
          <div className="mt-10 flex items-center justify-end gap-6">
            <button
              type="button"
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-7 py-2.5 rounded-full font-semibold border"
              style={{
                backgroundColor: colors.orange,
                borderColor: '#f08a00',
                color: colors.header,
              }}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </main>
  );
}
