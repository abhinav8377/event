import mongoose, { Schema } from 'mongoose';
import type { IRegistration } from '../../types/index.js';

const registrationSchema = new Schema<IRegistration>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketNumber: { type: String, required: true, unique: true },
    qrCode: { type: String },
    status: { type: String, enum: ['PENDING', 'ALLOWED', 'CONFIRMED', 'CANCELLED', 'DENIED', 'PAYMENT_PENDING'], default: 'PENDING' },
    registrantName: { type: String, trim: true },
    registrantEmail: { type: String, trim: true, lowercase: true },
    registrantPhone: { type: String, trim: true },
    registrantAge: { type: Number },
    registrantGender: { type: String, trim: true },
    registrantAltPhone: { type: String, trim: true },
    registrantOrganization: { type: String, trim: true },
    registrantCountry: { type: String, trim: true },
    registrantState: { type: String, trim: true },
    registrantCity: { type: String, trim: true },
    registrantPincode: { type: String, trim: true },
    registrantSocialLinks: { type: String, trim: true },
    registrantProfession: { type: String, trim: true },
    registrantReason: { type: String, trim: true },
    registrantSpecialRequest: { type: String, trim: true },
    paymentId: { type: String },
    paymentAmount: { type: Number },
    paymentStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] },
  },
  { timestamps: true }
);

registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model<IRegistration>('Registration', registrationSchema);
