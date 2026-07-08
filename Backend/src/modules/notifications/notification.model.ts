import mongoose, { Schema } from 'mongoose';
import type { INotification } from '../../types/index.js';

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['REGISTRATION', 'REMINDER', 'EVENT_UPDATE', 'CERTIFICATE', 'GENERAL'],
      default: 'GENERAL',
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', notificationSchema);
