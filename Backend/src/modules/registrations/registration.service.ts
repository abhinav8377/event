import crypto from 'crypto';
import Registration from './registration.model.js';
import Event from '../events/event.model.js';
import User from '../users/user.model.js';
import { generateQR } from '../../common/utils/qrcode.util.js';
import { sendEmail } from '../../common/utils/email.util.js';
import * as analyticsService from '../analytics/analytics.service.js';
import * as notificationService from '../notifications/notification.service.js';
import { isEventStarted } from '../events/event.lifecycle.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const registerForEvent = async (
  eventId: string,
  userId: string,
  registrantDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    age?: number;
    gender?: string;
    altPhone?: string;
    organization?: string;
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
    socialLinks?: string;
    profession?: string;
    reason?: string;
    specialRequest?: string;
  },
) => {
  const event = await Event.findById(eventId);
  if (!event || event.status !== 'PUBLISHED') throwErr('Event not found or not open for registration', 404);

  if (isEventStarted(event)) throwErr('Registration is closed — the event has already started', 400);

  const confirmedCount = await Registration.countDocuments({
    eventId: event._id,
    status: { $in: ['CONFIRMED', 'ALLOWED'] },
  });
  if (confirmedCount >= event.capacity) throwErr('Event is full', 409);

  let registration = await Registration.findOne({ userId, eventId: event._id });
  if (registration && (registration.status === 'CONFIRMED' || registration.status === 'ALLOWED' || registration.status === 'PENDING'))
    throwErr('Already registered for this event', 409);

  const isPaid = event.price && event.price > 0;

  if (registration) {
    registration.status = isPaid ? 'PAYMENT_PENDING' : 'PENDING';
    if (registrantDetails) {
      registration.registrantName = registrantDetails.name;
      registration.registrantEmail = registrantDetails.email;
      registration.registrantPhone = registrantDetails.phone;
      registration.registrantAge = registrantDetails.age;
      registration.registrantGender = registrantDetails.gender;
      registration.registrantAltPhone = registrantDetails.altPhone;
      registration.registrantOrganization = registrantDetails.organization;
      registration.registrantCountry = registrantDetails.country;
      registration.registrantState = registrantDetails.state;
      registration.registrantCity = registrantDetails.city;
      registration.registrantPincode = registrantDetails.pincode;
      registration.registrantSocialLinks = registrantDetails.socialLinks;
      registration.registrantProfession = registrantDetails.profession;
      registration.registrantReason = registrantDetails.reason;
      registration.registrantSpecialRequest = registrantDetails.specialRequest;
    }
    await registration.save();
  } else {
    const ticketNumber = `TKT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    registration = await Registration.create({
      userId,
      eventId: event._id,
      ticketNumber,
      status: isPaid ? 'PAYMENT_PENDING' : 'PENDING',
      paymentAmount: isPaid ? event.price : 0,
      registrantName: registrantDetails?.name,
      registrantEmail: registrantDetails?.email,
      registrantPhone: registrantDetails?.phone,
      registrantAge: registrantDetails?.age,
      registrantGender: registrantDetails?.gender,
      registrantAltPhone: registrantDetails?.altPhone,
      registrantOrganization: registrantDetails?.organization,
      registrantCountry: registrantDetails?.country,
      registrantState: registrantDetails?.state,
      registrantCity: registrantDetails?.city,
      registrantPincode: registrantDetails?.pincode,
      registrantSocialLinks: registrantDetails?.socialLinks,
      registrantProfession: registrantDetails?.profession,
      registrantReason: registrantDetails?.reason,
      registrantSpecialRequest: registrantDetails?.specialRequest,
    });
  }

  if (!isPaid) {
    registration.qrCode = await generateQR(String(registration._id));
    await registration.save();

    notificationService
      .notify({
        userId,
        title: 'Registration Submitted',
        message: `Your registration for "${event.title}" has been submitted and is pending organizer verification.`,
        type: 'REGISTRATION',
      })
      .catch(() => {});
  }

  return { registration, isPaid, eventTitle: event.title, eventPrice: event.price };
};

export const handlePaymentSuccess = async (eventId: string, userId: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);

  let registration = await Registration.findOne({ userId, eventId: event._id });
  if (!registration) throwErr('Registration not found', 404);

  registration.status = 'PENDING';
  registration.qrCode = await generateQR(String(registration._id));
  await registration.save();

  analyticsService.increment(event._id, 'registrations').catch(() => {});

  notificationService
    .notify({
      userId,
      title: 'Payment Received',
      message: `Payment for "${event.title}" received. Your registration is pending organizer verification. Your QR will be in your inbox within 24 hours after verification.`,
      type: 'REGISTRATION',
    })
    .catch(() => {});

  return { registration };
};

export const cancelRegistration = async (eventId: string, userId: string) => {
  const registration = await Registration.findOne({
    userId,
    eventId,
    status: { $in: ['CONFIRMED', 'ALLOWED', 'PENDING'] },
  });
  if (!registration) throwErr('Registration not found', 404);
  registration.status = 'CANCELLED';
  await registration.save();
  analyticsService.increment(eventId, 'registrations', -1).catch(() => {});
};

export const getMyRegistrations = async (userId: string) => {
  const registrations = await Registration.find({ userId })
    .populate('eventId')
    .sort({ createdAt: -1 });
  return { registrations };
};

export const getTicketById = async (registrationId: string, userId: string, role: string) => {
  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) throwErr('Ticket not found', 404);
  if (String(registration.userId) !== String(userId) && role !== 'ADMIN') throwErr('Forbidden', 403);
  return { registration };
};

export const allowRegistration = async (registrationId: string, organizerId: string, role: string) => {
  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) throwErr('Registration not found', 404);

  const event = registration.eventId as any;
  if (role !== 'ADMIN' && String(event.organizerId) !== String(organizerId)) throwErr('Forbidden', 403);

  if (registration.status === 'CONFIRMED') throwErr('Registration already confirmed', 400);
  if (registration.status === 'DENIED') throwErr('Registration was denied', 400);
  if (registration.status === 'CANCELLED') throwErr('Registration was cancelled', 400);

  registration.status = 'CONFIRMED';
  await registration.save();

  const user = await User.findById(registration.userId);
  if (user) {
    const cid = `qrcode-${registration._id}`;
    const base64Data = registration.qrCode?.replace(/^data:image\/\w+;base64,/, '');
    const qrBuffer = base64Data ? Buffer.from(base64Data, 'base64') : undefined;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f9fafb;border-radius:12px;">
        <div style="text-align:center;padding:20px 0;">
          <h1 style="color:#16a34a;margin:0;font-size:24px;">Registration Confirmed!</h1>
        </div>
        <div style="background-color:white;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
          <p style="color:#374151;font-size:15px;line-height:1.6;">Hi <strong>${user.name}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Great news! Your registration for <strong>${event.title}</strong> has been confirmed by the organizer.</p>
          <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
            <p style="color:#166534;font-size:13px;margin:0 0 8px 0;">Your Ticket Number</p>
            <p style="color:#166534;font-size:18px;font-weight:bold;margin:0;font-family:monospace;">${registration.ticketNumber}</p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <p style="color:#374151;font-size:13px;margin:0 0 8px 0;">Your QR Code</p>
            <img src="cid:${cid}" alt="QR Code" style="border-radius:8px;border:1px solid #e5e7eb;" />
            <div style="margin-top:12px;">
              <a href="data:image/png;base64,${base64Data}" download="qrcode-${registration._id}.png" style="display:inline-block;background-color:#16a34a;color:white;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:bold;">Download QR Code</a>
            </div>
          </div>
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:16px;">
            <p style="color:#6b7280;font-size:13px;margin:0;"><strong>Event:</strong> ${event.title}</p>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="color:#6b7280;font-size:13px;margin:4px 0 0 0;"><strong>Venue:</strong> ${event.venue}, ${event.city || ''}</p>
          </div>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">Please show this QR code at the venue for check-in.</p>
      </div>
    `;

    sendEmail({
      to: user.email,
      subject: `Registration Confirmed for ${event.title}`,
      html: emailHtml,
      attachments: qrBuffer
        ? [{ filename: `qrcode-${registration._id}.png`, content: qrBuffer, cid }]
        : undefined,
    }).catch((err) => console.error("Failed to send confirmation email:", (err as Error).message));

    notificationService
      .notify({
        userId: String(user._id),
        title: 'Registration Confirmed',
        message: `Your registration for "${event.title}" has been confirmed! Ticket: ${registration.ticketNumber}`,
        type: 'REGISTRATION',
      })
      .catch(() => {});
  }

  return { registration };
};

export const denyRegistration = async (registrationId: string, organizerId: string, role: string) => {
  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) throwErr('Registration not found', 404);

  const event = registration.eventId as any;
  if (role !== 'ADMIN' && String(event.organizerId) !== String(organizerId)) throwErr('Forbidden', 403);

  if (registration.status === 'CONFIRMED') throwErr('Cannot deny a confirmed registration. User has already been notified.', 400);
  if (registration.status === 'DENIED') throwErr('Registration already denied', 400);

  await Registration.findByIdAndDelete(registrationId);

  return { deleted: true };
};
