/**
 * File path: /login/route.ts
 * Author: Denise Alexander
 * Date Created: 16/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    // Parse email and password from request JSON
    const { email, password } = await req.json();
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    // User does not exist
    if (!user) {
      return NextResponse.json({ error: 'Incorrect email' }, { status: 404 });
    }

    // Compare provided password with hashed password in database
    const passwordMatch = await bcrypt.compare(password, user.password);
    // Incorrect password
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Login was successful
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
