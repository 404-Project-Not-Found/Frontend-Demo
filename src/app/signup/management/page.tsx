'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagementSignupPage() {
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // create account with role=management
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'management',
        }),
      });

      if (!signupRes.ok) {
        const j = await signupRes.json().catch(() => ({}));
        throw new Error(j.error || 'Signup failed');
      }

      // auto-login to set cookie/session
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!loginRes.ok) {
        const j = await loginRes.json().catch(() => ({}));
        throw new Error(j.error || 'Login after signup failed');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err?.message || 'Something went wrong');
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F3E9D9] flex flex-col items-center justify-center px-4">
      {/* Top-left logo */}
      <div className="absolute left-8 top-8 z-10">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={210}
          height={64}
          priority
        />
      </div>

      {/* Title - make sure it's centered */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-12 text-center w-full">
        Management Sign Up
      </h1>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg space-y-8 text-black"
      >
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* User Name */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="userName"
            className="text-[20px] font-medium flex items-center gap-2"
          >
            <span>Enter Full Name</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
              i
            </span>
          </label>
          <input
            id="userName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
            required
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-[20px] font-medium flex items-center gap-2"
          >
            <span>Enter Email</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
              i
            </span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
            required
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2 relative">
          <label
            htmlFor="password"
            className="text-[20px] font-medium flex items-center gap-2"
          >
            <span>Create Password</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
              i
            </span>
          </label>
          <div className="relative w-full">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute top-1/2 -translate-y-1/2 right-[-8rem] text-[16px] underline underline-offset-4 text-[#4A0A0A] hover:opacity-80 whitespace-nowrap"
            >
              {showPw ? 'hide password' : 'show password'}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirm"
            className="text-[20px] font-medium flex items-center gap-2"
          >
            <span>Retype Password</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E37E72] text-white text-sm font-bold">
              i
            </span>
          </label>
          <input
            id="confirm"
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-[#6E1B1B] bg-white text-black px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/30"
            required
            minLength={6}
          />
        </div>

        {/* Sign Up button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[#4A0A0A] text-white text-xl font-semibold px-10 py-3 hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </div>

        {/* Back to role selection link */}
        <p className="text-center text-lg mt-4">
          Not your role? Back to{' '}
          <Link
            href="/signup"
            className="underline underline-offset-4 hover:opacity-80 font-bold"
          >
            Role Selection
          </Link>
        </p>
      </form>

      {/* Bottom-right help button */}
      {/* <Link
        href="/help"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#E37E72] text-white text-2xl font-bold shadow-md hover:shadow-lg"
      >
        ?
      </Link> */}
    </div>
  );
}
