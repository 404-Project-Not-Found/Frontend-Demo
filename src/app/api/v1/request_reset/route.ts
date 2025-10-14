/**
 * File path: /request_reset/route.ts
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 */

import { NextResponse } from 'next/server';
/*import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { sendResetEmail } from '@/lib/email';*/

// Temporarily disable route
export async function POST() {
  return NextResponse.json({ error: 'Temporarily disabled' }, { status: 503 });
}

/* export async function POST(req: Request) {
  await connectDB();
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        message: 'If the account exists, a reset link has been sent.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({
      userID: user._id,
      token,
      expiresAt: expiry,
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URI}/reset-password?token=${token}`;
    await sendResetEmail(user.email, resetLink);

    return NextResponse.json({
      message: 'If the account exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
*/
