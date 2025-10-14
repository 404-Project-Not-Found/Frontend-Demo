/**
 * File path: /management/generate_invite/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Organisation } from '@/models/Organisation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

/**
 * Generates an invite code for a staff member (management or carer) within the user's organisation.
 * Only authenticated users with a valid session can perform this action.
 * @param req
 * @returns invite code
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Ensures the user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    await connectDB();

    const { role } = await req.json();

    // Validate role: must either be management or carer
    if (!role || !['management', 'carer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid or missing role.' },
        { status: 400 }
      );
    }

    // Validates organisation ID
    const orgId = session.user.organisation;
    if (!orgId || !mongoose.isValidObjectId(orgId)) {
      console.log('Invalid orgId:', orgId);
      return NextResponse.json(
        { error: 'Organisation not found or invalid.' },
        { status: 400 }
      );
    }

    // Fetch organisation doc from DB
    const org = await Organisation.findById(orgId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organisation not found.' },
        { status: 404 }
      );
    }

    // Generate a new invite code for the specified role
    const invite = org.generateInviteCode(role as 'management' | 'carer');
    await org.save();

    // Return success response with the generated invite code
    return NextResponse.json({
      message: 'Invite code generated successfully',
      invite,
    });
  } catch (err) {
    // Handle errors
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
