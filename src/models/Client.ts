/**
 * File path: /models/Client.ts
 * Author: Denise Alexander
 * Date Created: 23/09/2025
 * Last Updated by Denise Alexander - 7/10/2025: added OrgHistSchema to keep track of the client's
 * organisation status histories.
 */

import { Schema, model, models } from 'mongoose';
import '@/models/Organisation';

const OrgHistSchema = new Schema(
  {
    organisation: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'revoked'],
      required: true,
    },
  },
  { timestamps: true }
);

const ClientSchema = new Schema(
  {
    name: { type: String, required: true },
    dob: { type: String, required: true },
    accessCode: { type: String, required: true },
    avatarUrl: { type: String },
    notes: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organisationHistory: {
      type: [OrgHistSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default models.Client || model('Client', ClientSchema);
