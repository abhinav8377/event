import mongoose, { Schema } from 'mongoose';
import type { IPaymentIntegration } from '../../types/index.js';

const paymentIntegrationSchema = new Schema<IPaymentIntegration>(
  {
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    razorpayKeyId: { type: String, required: true },
    razorpayKeySecret: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

paymentIntegrationSchema.index({ organizerId: 1 }, { unique: true });

export default mongoose.model<IPaymentIntegration>('PaymentIntegration', paymentIntegrationSchema);
