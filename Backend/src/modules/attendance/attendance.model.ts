import mongoose, { Schema } from 'mongoose';
import type { IAttendance } from '../../types/index.js';

const attendanceSchema = new Schema<IAttendance>(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      unique: true,
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], default: 'PRESENT' },
    checkedInAt: { type: Date, default: Date.now },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);
