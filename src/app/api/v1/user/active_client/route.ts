/**
 * File path: api/v1/user/active_client/route.ts
 * Author: Denise Alexander
 * Date Created: 06/10/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Retrieves the currently active client ID for the logged-in user.
 * @returns activeClientId
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id)
    .select('activeClientId')
    .lean<{ activeClientId?: string | null }>();

  return NextResponse.json({ activeClientId: user?.activeClientId || null });
}

/**
 * Sets/Updates the active client ID for the logged-in user.
 * @param req
 * @returns success on success
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { clientId } = await req.json();
  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { activeClientId: clientId });
  return NextResponse.json({ success: true });
}

/**
 * Clears the active client ID for the logged-in user.
 * @returns success on success
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  await connectDB();
  await User.findByIdAndUpdate(session?.user.id, { activeClientId: null });
  return NextResponse.json({ success: true });
}
