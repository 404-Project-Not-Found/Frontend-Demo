/**
 * File path: /clients/check/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

/**
 * Checks whether a client with the inputted access code exists
 * @param req
 * @returns existence flag and client details
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accessCode = url.searchParams.get('accessCode');

    if (!accessCode) {
      return NextResponse.json(
        { error: 'Missing access code' },
        { status: 400 }
      );
    }

    await connectDB();

    // Query MongoDB for a client with the given access code
    const existingClient = await Client.findOne({ accessCode });

    return NextResponse.json({
      exists: existingClient,
      client: existingClient
        ? {
            name: existingClient.name,
            dob: existingClient.dob,
            notes: existingClient.notes,
            avatarUrl: existingClient.avatarUrl,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
