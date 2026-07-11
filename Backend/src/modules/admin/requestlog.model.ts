import mongoose, { Schema } from 'mongoose';
import type { IRequestLog } from '../../types/index.js';

const requestLogSchema = new Schema<IRequestLog>(
  {
    method: { type: String, required: true, index: true },
    url: { type: String, required: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, default: '' },
    userRole: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    contentLength: { type: Number, default: 0 },
  },
  { timestamps: true }
);

requestLogSchema.index({ createdAt: -1 });
requestLogSchema.index({ method: 1, statusCode: 1 });

export default mongoose.model<IRequestLog>('RequestLog', requestLogSchema);
