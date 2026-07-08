import mongoose, { Schema } from 'mongoose';
import type { IRegistration } from '../../types/index.js';

const registrationSchema = new Schema<IRegistration>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketNumber: { type: String, required: true, unique: true },
    qrCode: { type: String },
    status: { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
  },
  { timestamps: true }
);

registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model<IRegistration>('Registration', registrationSchema);
