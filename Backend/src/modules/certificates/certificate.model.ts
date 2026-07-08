import mongoose, { Schema } from 'mongoose';
import type { ICertificate } from '../../types/index.js';

const certificateSchema = new Schema<ICertificate>(
  {
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      unique: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    certificateId: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<ICertificate>('Certificate', certificateSchema);
