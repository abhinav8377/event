import mongoose, { Schema } from 'mongoose';
import type { ICommunityMessage } from '../../types/index.js';

const communityMessageSchema = new Schema<ICommunityMessage>(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

communityMessageSchema.index({ communityId: 1, createdAt: 1 });

export default mongoose.model<ICommunityMessage>('CommunityMessage', communityMessageSchema);
