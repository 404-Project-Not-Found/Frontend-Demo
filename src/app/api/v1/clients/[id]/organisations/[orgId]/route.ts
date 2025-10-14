/**
 * File path: /clients/[id]/organisations/[orgId]/route.ts
 * Author: Denise Alexander
 * Date Created: 27/09/2025
 * Last Updated by Denise Alexander - 7/10/2025: included new action cases.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import mongoose, { Types } from 'mongoose';
import { Organisation } from '@/models/Organisation';

// --------- Type Definitions ---------
interface OrgHistoryItem {
  organisation: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'revoked';
  addedBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface Client {
  _id: mongoose.Types.ObjectId;
  organisationHistory?: OrgHistoryItem[];
}

/**
 * Fetches an organisation's status history for a specific client
 * @param req
 * @param context
 * @returns organisation status history of a client
 */
export async function GET(
  req: Request,
  context: { params: { id: string; orgId: string } }
) {
  const params = await context.params;
  const { id, orgId } = params;
  await connectDB();

  // Find client by ID
  const client = await Client.findById(id).lean<Client>();
  if (!client) {
    return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
  }

  // Gets full organisation history for this client
  const orgHist = client.organisationHistory ?? [];

  // Filters for the specific orgnisation requested
  const histForOrg = orgHist.filter((h) => h.organisation.toString() === orgId);

  return NextResponse.json(histForOrg);
}

/**
 * Updates organisation-client relationship (status)
 * @param req
 * @param context
 * @returns action success message
 */
export async function POST(
  req: Request,
  context: { params: { id: string; orgId: string } }
) {
  const { id, orgId } = await context.params;
  // Extract 'action' (request, approve, reject, revoke)
  const { action } = await req.json();

  await connectDB();

  // Finds client
  const client = await Client.findById(id);
  if (!client) {
    return NextResponse.json({ error: 'Client not Found.' }, { status: 404 });
  }

  // Finds organisation
  const org = await Organisation.findById(orgId);
  if (!org) {
    return NextResponse.json(
      { error: 'Organisation not found.' },
      { status: 404 }
    );
  }

  // Initialises organisation history array
  const orgHistory = client.organisationHistory as OrgHistoryItem[];

  // Checks if this organisation already exists in the client's history
  let orgEntry = orgHistory.find((h) => h.organisation.toString() === orgId);

  // ---------- Handles each action type ----------
  switch (action) {
    // 1. Organisation requests link to client
    case 'request':
      if (!orgEntry) {
        // If an entry doesn't already exist, create a new pending request
        orgHistory.push({
          organisation: new Types.ObjectId(orgId),
          status: 'pending',
          addedBy: 'management',
          createdAt: new Date(),
        });
      } else {
        // If entry exists, just update status and timestamp
        orgEntry.status = 'pending';
        orgEntry.updatedAt = new Date();
      }
      break;
    // 2. Approve orgnisation-client link
    case 'approve': {
      if (!orgEntry) {
        // Create new entry
        orgEntry = {
          organisation: new Types.ObjectId(orgId),
          status: 'approved',
          addedBy: 'family',
          createdAt: new Date(),
        } as OrgHistoryItem;
        orgHistory.push(orgEntry);
      } else {
        // or Update existing one
        orgEntry.status = 'approved';
        orgEntry.updatedAt = new Date();
      }

      // Add client to organisation's member list if not already included
      const members = org.members ?? [];
      const already = members.some(
        (m) => m.toString() === client._id.toString()
      );

      if (!already) {
        org.members = [...members, client._id] as mongoose.Types.ObjectId[];
        await org.save();
      }

      break;
    }
    // 3. Reject/Revoke organisation-client link
    case 'reject':
    case 'revoke': {
      if (!orgEntry) {
        // Can't revoke a relationship that does not exist
        return NextResponse.json(
          { error: 'Organisation not linked to client.' },
          { status: 400 }
        );
      }
      // Mark status as revoked and update timestamp
      orgEntry.status = 'revoked';
      orgEntry.updatedAt = new Date();

      // Removes the client from the organisation's member list
      org.members = (org.members ?? []).filter(
        (memberId: mongoose.Types.ObjectId) =>
          memberId.toString() !== client._id.toString()
      );
      await org.save();
      break;
    }
    // Invalid action
    default:
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  // Persist client updates
  client.markModified('organisationHistory');
  await client.save();
  // Return confirmation message
  return NextResponse.json({
    message: `Organisation ${action} action successful.`,
  });
}
