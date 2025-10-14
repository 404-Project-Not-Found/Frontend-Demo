/**
 * File path: /clients/[id]]/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

/**
 * Fetches a single client by their MongoDB ID.
 * @param req
 * @param context
 * @returns client document as JSON
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extracts client ID from dynamic route params
    const { id } = await context.params;

    await connectDB();

    // Find client by ID and return plain JS object
    const client = await Client.findById(id).lean();

    // Client does not exist
    if (!client) {
      return NextResponse.json(
        { error: 'Client does not exist' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (err) {
    // Handle unexpected errors
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

/**
 * Updates an existing client by ID.
 * @param req
 * @param context
 * @returns updated client document as JSON
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Extracts client ID from dynamic route params
  const { id } = await context.params;

  await connectDB();

  // Parse new client data
  const data = await req.json();
  //Update the client and return the updated document
  const updated = await Client.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  return NextResponse.json(updated);
}

/**
 * Delete a client by ID.
 * @param req
 * @param context
 * @returns success response
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Find client by ID and return plain JS object
  const { id } = await context.params;

  await connectDB();

  // Delete client document by ID
  await Client.findByIdAndDelete(id);
  //return success response
  return NextResponse.json({ success: true });
}
