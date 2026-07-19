import mongoose, { Schema } from 'mongoose';
import type { ICommunityMember } from '../../types/index.js';

const communityMemberSchema = new Schema<ICommunityMember>(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DENIED'], default: 'PENDING' },
    joinedAt: { type: Date },
  },
  { timestamps: true }
);

communityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ICommunityMember>('CommunityMember', communityMemberSchema);
