import mongoose, { Schema } from 'mongoose';
import type { ICommunityMessage, ICommunityPollOption } from '../../types/index.js';

const pollOptionSchema = new Schema<ICommunityPollOption>(
  {
    text: { type: String, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false }
);

const communityMessageSchema = new Schema<ICommunityMessage>(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'poll', 'system'], default: 'text' },
    replyToId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityMessage' },
    replyToMessage: { type: String },
    replyToSender: { type: String },
    pollQuestion: { type: String },
    pollOptions: [pollOptionSchema],
  },
  { timestamps: true }
);

communityMessageSchema.index({ communityId: 1, createdAt: 1 });

export default (mongoose.models.CommunityMessage as mongoose.Model<ICommunityMessage>) ||
  mongoose.model<ICommunityMessage>('CommunityMessage', communityMessageSchema);
