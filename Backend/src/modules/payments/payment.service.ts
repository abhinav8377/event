import crypto from 'crypto';
import Razorpay from 'razorpay';
import PaymentIntegration from './paymentIntegration.model.js';
import Registration from '../registrations/registration.model.js';
import Event from '../events/event.model.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const saveIntegration = async (organizerId: string, razorpayKeyId: string, razorpayKeySecret: string) => {
  const integration = await PaymentIntegration.findOneAndUpdate(
    { organizerId },
    { razorpayKeyId, razorpayKeySecret, isActive: true },
    { upsert: true, new: true },
  );
  return { integration };
};

export const getIntegration = async (organizerId: string) => {
  const integration = await PaymentIntegration.findOne({ organizerId });
  return { integration };
};

export const deleteIntegration = async (organizerId: string) => {
  const integration = await PaymentIntegration.findOneAndDelete({ organizerId });
  if (!integration) throwErr('Payment integration not found', 404);
  return { deleted: true };
};

export const getOrganizerRazorpayInstance = async (organizerId: string) => {
  const integration = await PaymentIntegration.findOne({ organizerId, isActive: true });
  if (!integration) throwErr('Razorpay not configured. Please set up payment integration first.', 400);

  const instance = new Razorpay({
    key_id: integration.razorpayKeyId,
    key_secret: integration.razorpayKeySecret,
  });

  return { instance, keyId: integration.razorpayKeyId };
};

export const createOrder = async (eventId: string, userId: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (!event.price || event.price <= 0) throwErr('This is a free event', 400);

  const integration = await PaymentIntegration.findOne({ organizerId: event.organizerId, isActive: true });
  if (!integration) throwErr('Event organizer has not configured payment integration', 400);

  let razorpay: InstanceType<typeof Razorpay>;
  try {
    razorpay = new Razorpay({
      key_id: integration.razorpayKeyId,
      key_secret: integration.razorpayKeySecret,
    });
  } catch {
    throwErr('Invalid Razorpay credentials. Please reconfigure payment integration.', 400);
  }

  const shortId = eventId.slice(-6) + userId.slice(-6);
  const receipt = `rcpt_${shortId}_${Date.now()}`.slice(0, 40);

  let order: any;
  try {
    order = await razorpay.orders.create({
      amount: Math.round(event.price * 100),
      currency: 'INR',
      receipt,
      notes: { eventId, userId },
    });
  } catch (e: any) {
    const msg = e?.error?.description || e?.message || 'Razorpay order creation failed';
    throwErr(msg, 400);
  }

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    keyId: integration.razorpayKeyId,
    eventName: event.title,
    eventPrice: event.price,
  };
};

export const verifyPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  registrationId: string;
}) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = payload;

  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) throwErr('Registration not found', 404);

  const event = registration.eventId as any;
  const integration = await PaymentIntegration.findOne({ organizerId: event.organizerId, isActive: true });
  if (!integration) throwErr('Payment integration not found', 404);

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', integration.razorpayKeySecret)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === razorpay_signature;

  if (isValid) {
    registration.paymentId = razorpay_payment_id;
    registration.paymentStatus = 'COMPLETED';
    registration.status = 'PENDING';
    await registration.save();
    return { verified: true, registration };
  } else {
    registration.paymentStatus = 'FAILED';
    await registration.save();
    throwErr('Payment verification failed', 400);
  }
};
