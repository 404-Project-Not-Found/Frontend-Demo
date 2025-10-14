/**
 * File path: /management/register_client/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

interface OrgHistoryItem {
  organisation: mongoose.Types.ObjectId;
  status: 'active' | 'pending' | 'revoked';
  addedBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Links a client to the logged-in user's organisation via the client access code.
 * Only authenticated users can perform this action.
 * @param req
 * @returns success upon client registration
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Ensures the user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
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

  // Gets access code from request
  const { accessCode } = await req.json();
  if (!accessCode) {
    return NextResponse.json(
      { error: 'Access code is required.' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    // Finds client by access code
    const client = await Client.findOne({ accessCode: accessCode.trim() });
    if (!client) {
      return NextResponse.json(
        { error: 'No client found with that access code.' },
        { status: 404 }
      );
    }

    // Initialises organisation history if array not present
    if (!client.organisationHistory) {
      client.organisationHistory = [];
    }

    const orgHistory = client.organisationHistory as OrgHistoryItem[];

    // Checks if the client is already linked or revoked
    const existingEntry = orgHistory.find(
      (h) => h.organisation.toString() === orgId
    );
    if (existingEntry) {
      if (existingEntry.status === 'revoked') {
        return NextResponse.json(
          {
            error:
              'Access for this client has been revoked by family or power of attorney.',
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: 'Client is already linked to this organisation',
        },
        { status: 400 }
      );
    }

    // Adds new pending entry to client's organisation history
    client.organisationHistory.push({
      organisation: new mongoose.Types.ObjectId(orgId),
      status: 'pending',
      addedBy: session.user.id,
      createdAt: new Date(),
    });

    await client.save(); // persist changes

    // Return success response with client info
    return NextResponse.json({
      message: `Client ${client.name}'s registration is complete and pending family approval.`,
      client: {
        _id: client._id,
        name: client.name,
        accessCode: client.accessCode,
        organisationHistory: client.organisationHistory,
      },
    });
  } catch (err) {
    // Catch and log errors
    console.error('Error registering client:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
