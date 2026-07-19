import mongoose, { Schema } from 'mongoose';
import type { ICommunity } from '../../types/index.js';

const communitySchema = new Schema<ICommunity>(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default (mongoose.models.Community as mongoose.Model<ICommunity>) ||
  mongoose.model<ICommunity>('Community', communitySchema);
