import mongoose, { Schema } from 'mongoose';
import type { IEvent } from '../../types/index.js';

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    category: {
      type: String,
      enum: ['TECH', 'BUSINESS', 'EDUCATION', 'CULTURE', 'SPORTS', 'COMMUNITY', 'OTHER'],
      default: 'OTHER',
    },
    mode: { type: String, enum: ['IN_PERSON', 'ONLINE', 'HYBRID'], default: 'IN_PERSON' },
    venue: { type: String, default: 'Online' },
    city: { type: String, default: '' },
    date: { type: Date, required: true },
    endDate: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    capacity: { type: Number, default: 100, min: 1 },
    price: { type: Number, default: 0 },
    bannerUrl: { type: String },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'DRAFT',
    },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IEvent>('Event', eventSchema);
