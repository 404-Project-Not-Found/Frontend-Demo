/**
 * File path: /user/profile/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface IUser {
  _id: string;
  email: string;
  role: string;
  fullName: string;
}

/**
 * Gets the logged in user's details
 * @returns user's details
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean<IUser>();

  if (!user) {
    return NextResponse.json({ error: 'User does not exist' }, { status: 404 });
  }

  // Returns the user's email, role, and full name as JSON
  return NextResponse.json({
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });
}
