/**
 * File path: /models/PasswordResetToken.ts
 * Author: Denise Alexander
 * Date Created: 17/09/2025
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userID: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  userID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

export default mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>(
    'PasswordResetToken',
    PasswordResetTokenSchema
  );
