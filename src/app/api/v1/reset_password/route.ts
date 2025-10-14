/**
 * File path: /reset_password/route.ts
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';

export async function POST(req: Request) {
  await connectDB();
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password required' },
        { status: 400 }
      );
    }

    const resetRecord = await PasswordResetToken.findOne({ token });
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(resetRecord.userId, { password: hashed });

    await PasswordResetToken.deleteOne({ token });

    return NextResponse.json({ message: 'Password is reset successfully!' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
