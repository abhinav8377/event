import mongoose, { Schema } from 'mongoose';
import type { IFeedback } from '../../types/index.js';

const feedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '' },
  },
  { timestamps: true },
);

feedbackSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);
