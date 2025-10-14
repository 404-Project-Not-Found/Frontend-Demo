/**
 * File path: /user/update/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // Retrieve the current session (user must be authenticated)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { email, password } = await req.json();

    await connectDB();

    // Object to update email and/or password
    const updateData: { email?: string; password?: string } = {};

    if (email) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      // The email is already in use by user from another account
      if (userExists && userExists._id.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'This email is already in use by another account.' },
          { status: 400 }
        );
      }
      updateData.email = email.toLowerCase();
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update the user in the DB using their session ID
    const updateUser = await User.findByIdAndUpdate(
      session.user.id, // Ensures they can only update their own account
      updateData,
      { new: true }
    );

    // User does not exist
    if (!updateUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Successfully updated
    return NextResponse.json({
      message: 'User details updated successfully',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
