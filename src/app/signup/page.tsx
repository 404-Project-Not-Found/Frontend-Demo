/**
 * File path: /signup/page.tsx
 * Authors: Qingyue Zhao & Denise Alexander
 * Date Created: 05/09/2025
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

type OrgAction = 'create' | 'join' | null;

type PwCheck = {
  score: 0 | 1 | 2 | 3 | 4; // password strength score (0=very weak, 4=very strong)
  label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong'; // human-readable label
  color: string; // bar color depending on score
  messages: string[]; // suggestions for improvement
  checks: {
    // detailed boolean checks for visual checklist
    len12: boolean;
    lower: boolean;
    upper: boolean;
    digit: boolean;
    symbol: boolean;
    noNameOrEmail: boolean;
    noCommonSeq: boolean;
  };
};

// Local password strength evaluation (basic rules, no external libs)
function evaluatePassword(
  pw: string,
  email: string,
  fullName: string
): PwCheck {
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  const symbol = /[^A-Za-z0-9]/.test(pw);
  const len12 = pw.length >= 12;

  // Avoid including name or email inside password
  const nameParts = fullName.toLowerCase().split(/\s+/).filter(Boolean);
  const emailLocal = (email.split('@')[0] || '').toLowerCase();
  const pwLower = pw.toLowerCase();
  const containsName = nameParts.some(
    (p) => p.length >= 3 && pwLower.includes(p)
  );
  const containsEmailLocal =
    emailLocal.length >= 3 && pwLower.includes(emailLocal);
  const noNameOrEmail = !(containsName || containsEmailLocal);

  // Avoid common weak sequences
  const commonSeqs = [
    '12345',
    '123456',
    'qwerty',
    'password',
    'abc123',
    '1111',
    '0000',
    'letmein',
  ];
  const noCommonSeq = !commonSeqs.some((s) => pwLower.includes(s));

  // Scoring system
  let score = 0;
  if (len12) score++;
  if (lower && upper) score++;
  if (digit) score++;
  if (symbol) score++;
  if (noNameOrEmail && noCommonSeq) score++;
  if (score > 4) score = 4;

  const labels: PwCheck['label'][] = [
    'Very weak',
    'Weak',
    'Fair',
    'Strong',
    'Very strong',
  ];
  const colors = ['#B91C1C', '#DC2626', '#D97706', '#15803D', '#166534'];

  // Improvement suggestions
  const messages: string[] = [];
  if (!len12) messages.push('Use at least 12 characters.');
  if (!(lower && upper)) messages.push('Mix UPPER and lower case letters.');
  if (!digit) messages.push('Add at least one number.');
  if (!symbol) messages.push('Add at least one symbol (e.g., !@#$%).');
  if (!noNameOrEmail)
    messages.push('Avoid using your name or email in the password.');
  if (!noCommonSeq)
    messages.push('Avoid common sequences like "123456" or "password".');

  return {
    score: score as PwCheck['score'],
    label: labels[score],
    color: colors[score],
    messages,
    checks: { len12, lower, upper, digit, symbol, noNameOrEmail, noCommonSeq },
  };
}

export default function SignupPage() {
  const [role, setRole] = useState('User');
  const [orgAction, setOrgAction] = useState<OrgAction>(null);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userExists, setUserExists] = useState(false);
  const [success, setSuccess] = useState(false);

  // Controlled input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Track whether user has started typing
  const [pwTouched, setPwTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  // Password strength check
  const [pwCheck, setPwCheck] = useState<PwCheck>(() =>
    evaluatePassword('', '', '')
  );

  // Load role & org action from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const roleParam = searchParams.get('role') || 'User';
    const orgParam = searchParams.get('org');
    setRole(roleParam);
    setOrgAction(
      orgParam === 'create' ? 'create' : orgParam === 'join' ? 'join' : null
    );
  }, []);

  // Update password strength dynamically
  useEffect(() => {
    setPwCheck(evaluatePassword(password, email, fullName));
  }, [password, email, fullName]);

  // Display role in header
  const roleDisplayMap: Record<string, string> = {
    family: 'Family/POA',
    carer: 'Carer',
    management: 'Management',
  };
  const displayRole = roleDisplayMap[role.toLowerCase()] || 'User';

  // Helper component: green check or red cross
  const Check = ({ ok }: { ok: boolean }) => (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold ${
        ok ? 'bg-[#15803D]' : 'bg-[#DC2626]'
      }`}
    >
      {ok ? '✓' : '✕'}
    </span>
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setUserExists(false);

    const orgName =
      orgAction === 'create'
        ? (e.currentTarget.orgName as HTMLInputElement | undefined)?.value
        : undefined;
    const inviteCode =
      orgAction === 'join'
        ? (e.currentTarget.invite as HTMLInputElement | undefined)?.value
        : undefined;

    // Extra validation
    if (orgAction === 'create' && !orgName) {
      setError('Organisation name is required');
      return;
    }
    if (orgAction === 'join' && !inviteCode) {
      setError('Invite code is required');
      return;
    }
    if (pwCheck.score < 3) {
      setError(
        'Password is not strong enough. Please improve it before continuing.'
      );
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Call API to sign up
      const res = await fetch('/api/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirm,
          role: role.toLowerCase(),
          orgName,
          inviteCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setUserExists(true);
          return;
        }
        throw new Error(data.error || 'Sign up failed');
      }

      // Silent sign in to create session
      await signIn('credentials', { redirect: false, email, password });

      setSuccess(true);
      setTimeout(() => {
        const params = new URLSearchParams({ email, password });
        window.location.href = `/?${params.toString()}`;
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('exists')) {
          setUserExists(true);
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error has occurred');
      }
    }
  };

  // Derived states
  const mismatch = confirm.length > 0 && password !== confirm;
  const mismatchVisible = confirmTouched && mismatch;
  const canSubmit = pwCheck.score >= 3 && !mismatch;

  return (
    <div className="min-h-screen w-full bg-[#F3E9D9] flex flex-col items-center justify-center px-4">
      {/* Logo in top-left */}
      <div className="absolute left-8 top-8">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={210}
          height={64}
          priority
        />
      </div>

      {/* Page title */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-12 text-center w-full">
        {displayRole} Sign Up
      </h1>

      {/* Success banner after signup */}
      {success && (
        <div
          role="alert"
          className="fixed top-0 left-0 w-full bg-[#DCF4D9] text-[#1B4B1B] px-6 py-4 text-center font-semibold shadow-md z-50"
        >
          Sign up was successful! Redirecting to login...
        </div>
      )}

      {/* Signup form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-8 text-black"
      >
        {/* Organisation field for carer/management */}
        {(role === 'management' || role === 'carer') && orgAction && (
          <div className="flex flex-col gap-2">
            {orgAction === 'create' && role === 'management' && (
              <>
                <label htmlFor="orgName" className="text-[20px] font-medium">
                  Enter Organisation Name
                </label>
                <input
                  id="orgName"
                  name="orgName"
                  type="text"
                  required
                  className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
                />
              </>
            )}
            {orgAction === 'join' &&
              (role === 'carer' || role === 'management') && (
                <>
                  <label htmlFor="invite" className="text-[20px] font-medium">
                    Enter Organisation Invite Code
                  </label>
                  <input
                    id="invite"
                    name="invite"
                    type="text"
                    required
                    className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
                  />
                </>
              )}
          </div>
        )}

        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="userName" className="text-[20px] font-medium">
            Enter Full Name
          </label>
          <input
            id="userName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
            required
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[20px] font-medium">
            Enter Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
            required
          />
        </div>

        {/* Password with strength meter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[20px] font-medium">
            Create Password
          </label>
          <div className="relative w-full">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                if (!pwTouched) setPwTouched(true);
                setPassword(e.target.value);
              }}
              onFocus={() => setPwTouched(true)}
              className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="underline absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[#4A0A0A]"
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Show strength only after typing */}
          {pwTouched && password.length > 0 && (
            <>
              {/* Strength bar */}
              <div className="mt-2">
                <div className="w-full h-2 rounded bg-[#EADBC6] overflow-hidden">
                  <div
                    className="h-2 rounded transition-all"
                    style={{
                      width: `${(pwCheck.score / 4) * 100}%`,
                      backgroundColor: pwCheck.color,
                    }}
                  />
                </div>
                <div className="mt-1 text-sm" style={{ color: pwCheck.color }}>
                  Strength:{' '}
                  <span className="font-semibold">{pwCheck.label}</span>
                </div>
              </div>

              {/* Checklist */}
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check ok={pwCheck.checks.len12} /> At least 12 characters
                </li>
                <li className="flex items-center gap-2">
                  <Check ok={pwCheck.checks.lower && pwCheck.checks.upper} />{' '}
                  Upper & lower case
                </li>
                <li className="flex items-center gap-2">
                  <Check ok={pwCheck.checks.digit} /> At least one number
                </li>
                <li className="flex items-center gap-2">
                  <Check ok={pwCheck.checks.symbol} /> At least one symbol
                </li>
                <li className="flex items-center gap-2">
                  <Check ok={pwCheck.checks.noNameOrEmail} /> No name/email
                </li>
                <li className="flex items-center gap-2">
                  <Check ok={pwCheck.checks.noCommonSeq} /> No common sequences
                </li>
              </ul>

              {/* Suggestions */}
              {pwCheck.messages.length > 0 && (
                <div className="mt-2 bg-[#FFF3CD] text-[#5C3C00] px-3 py-2 rounded text-sm">
                  <div className="font-semibold mb-1">
                    Tips to improve your password:
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {pwCheck.messages.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="confirm" className="text-[20px] font-medium">
            Retype Password
          </label>
          <input
            id="confirm"
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => {
              if (!confirmTouched) setConfirmTouched(true);
              setConfirm(e.target.value);
            }}
            onFocus={() => setConfirmTouched(true)}
            className="w-full rounded-md border border-[#6E1B1B] bg-white px-4 py-2.5 text-lg"
            required
          />
          {mismatchVisible && (
            <div className="text-red-700 bg-red-100 px-3 py-2 rounded text-sm">
              Passwords do not match.
            </div>
          )}
        </div>

        {/* Error messages */}
        {error && (
          <div className="text-red-700 bg-red-100 px-4 py-2 rounded">
            {error}
          </div>
        )}
        {userExists && (
          <div className="bg-[#DFC9A9] px-4 py-2 rounded">
            Account already exists. Try a new email or{' '}
            <Link
              href={`/?email=${encodeURIComponent(email)}`}
              className="underline font-bold text-[#4A0A0A]"
            >
              login
            </Link>
          </div>
        )}

        {/* Submit button */}
        <div className="flex flex-col items-center pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`rounded-full text-white text-xl font-semibold px-10 py-3 transition ${
              canSubmit
                ? 'bg-[#4A0A0A] hover:opacity-95'
                : 'bg-[#a78b7a] cursor-not-allowed'
            }`}
          >
            Sign Up
          </button>
          {!canSubmit && pwTouched && (
            <div className="mt-2 text-sm text-[#4A0A0A]">
              {mismatchVisible
                ? 'Please make sure both passwords match.'
                : 'Password must be at least Strong to continue.'}
            </div>
          )}
        </div>

        {/* Back link */}
        <p className="text-center text-lg mt-4">
          Not your role? Back to{' '}
          <Link href="/role" className="underline font-bold">
            Role Selection
          </Link>
        </p>
      </form>

      {/* Help floating button */}
      <Link
        href="/help"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#E37E72] text-white text-2xl font-bold shadow-md hover:shadow-lg"
      >
        ?
      </Link>
    </div>
  );
}
