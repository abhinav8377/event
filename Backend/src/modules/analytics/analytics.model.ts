import mongoose, { Schema } from 'mongoose';
import type { IAnalytics } from '../../types/index.js';

const analyticsSchema = new Schema<IAnalytics>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },
    views: { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },
    attendance: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analyticsSchema.virtual('averageRating').get(function () {
  return this.ratingCount ? Number((this.ratingSum / this.ratingCount).toFixed(2)) : 0;
});

analyticsSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IAnalytics>('Analytics', analyticsSchema);
