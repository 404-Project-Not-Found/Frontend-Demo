/**
 * File path: /management/clients/route.ts
 * Author: Denise Alexander
 * Date Created: 26/09/2025
 * Last Updated by Denise Alexander - 7/10/2025: to fetch the most recent update to organisation-client link
 * status.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import '@/models/Organisation'; // to ensure the organisation model is registered
import Client from '@/models/Client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// ------------------ Type Definitions -------------------
type OrgAccess = 'approved' | 'pending' | 'revoked';

interface OrgHistoryItem {
  organisation: { _id: mongoose.Types.ObjectId; name: string };
  status: OrgAccess; // current status
  createdAt: Date; // when the link is created
  updatedAt?: Date; // when it was last modified
}

interface ClientWithOrg {
  _id: mongoose.Types.ObjectId;
  name: string;
  dashboardType?: 'full' | 'partial';
  organisationHistory?: OrgHistoryItem[];
}

/**
 * Fetches all clients associated with the logged-in user's organisation.
 * Only accessible by users with the `management` role.
 * @returns list of clients
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  // Check if the user is authenticated and has the 'management' role
  if (!session?.user?.id || session.user.role !== 'management') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  await connectDB();

  // Ensure the user has an organisation linked to their account
  if (!session.user.organisation) {
    return NextResponse.json(
      { error: 'No organisation linked to this account.' },
      { status: 400 }
    );
  }

  // Return all clients that have this organisation in their history
  const clients = await Client.find({
    'organisationHistory.organisation': session.user.organisation,
  })
    .populate({
      path: 'organisationHistory.organisation',
      select: 'name',
    })
    .lean<ClientWithOrg[]>();

  // Gets the latest organisation-client status
  const mapped = clients.map((c) => {
    const orgHist = c.organisationHistory ?? [];

    // Filter for entries that match the current user's organisation
    const latestOrg = orgHist
      .filter(
        (h) =>
          h.organisation?._id.toString() ===
          session.user.organisation?.toString()
      )
      // Sort to get the most recent record
      .sort((a, b) => {
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        return dateB - dateA;
      })[0];

    return {
      _id: c._id,
      name: c.name,
      dashboardType: c.dashboardType,
      orgAccess: latestOrg?.status ?? 'pending', // default pending
    };
  });

  // Return clients as JSON
  return NextResponse.json(mapped);
}
