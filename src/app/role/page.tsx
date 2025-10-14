/**
 * File path: /role/page.tsx
 * Last Updated by Denise Alexander - 7/10/2025: role hirerachy updated to client's preference (management, family/POA, carer)
 */

import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  return (
    <div className="h-screen w-full bg-[#F3E9D9] text-zinc-900 flex items-center justify-center relative">
      {/* Top-left logo */}
      <div className="absolute left-8 top-8">
        <Image
          src="/logo-name.png" // public/logo-name.png
          alt="Scheduling of Care"
          width={210}
          height={64}
          priority
        />
      </div>

      <div className="w-full max-w-lg bg-[#F7ECD9] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-12">
        <h2 className="text-5xl font-extrabold tracking-tight mb-8 text-center">
          Sign Up
        </h2>
        <p className="text-2xl mb-10 text-center">Select your role</p>

        <div className="space-y-6">
          <Link
            href="/signup?role=family"
            className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
          >
            Family/Power of Attorney
          </Link>
          <Link
            href="/organisation"
            className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
          >
            Management
          </Link>
          <Link
            href="/signup?role=carer&org=join"
            className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
          >
            Carer
          </Link>
        </div>

        <p className="mt-12 text-xl text-center">
          Already have an account?{' '}
          <Link
            href="/"
            className="underline underline-offset-4 font-semibold hover:opacity-80"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
