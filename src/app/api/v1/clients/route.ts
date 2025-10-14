/**
 * File path: /clients/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Retrieves all clients that belong to the currently authenticated user.
 * @returns client list
 */
export async function GET() {
  // Ensures user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  // Fetch only the clients created by the logged in user
  const clients = await Client.find({ createdBy: session.user.id }).lean();
  // return client list
  return NextResponse.json(clients);
}

/**
 * Creates a new client record and associates it with the logged in user
 * @param req
 * @returns created client
 */
export async function POST(req: NextRequest) {
  // Ensures the user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const data = await req.json();
  try {
    // Create client, attaching `createdBy` to track ownership
    const newClient = await Client.create({
      ...data,
      createdBy: session.user.id,
    });
    // return created client
    return NextResponse.json(newClient, { status: 201 });
  } catch (err) {
    // DB errors
    return NextResponse.json({ error: err }, { status: 400 });
  }
}
