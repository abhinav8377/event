import crypto from 'crypto';
import Registration from './registration.model.js';
import Event from '../events/event.model.js';
import { generateQR } from '../../common/utils/qrcode.util.js';
import * as analyticsService from '../analytics/analytics.service.js';
import * as notificationService from '../notifications/notification.service.js';
import { isEventStarted } from '../events/event.lifecycle.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const registerForEvent = async (eventId: string, userId: string) => {
  const event = await Event.findById(eventId);
  if (!event || event.status !== 'PUBLISHED') throwErr('Event not found or not open for registration', 404);

  if (isEventStarted(event)) throwErr('Registration is closed — the event has already started', 400);

  const confirmedCount = await Registration.countDocuments({ eventId: event._id, status: 'CONFIRMED' });
  if (confirmedCount >= event.capacity) throwErr('Event is full', 409);

  let registration = await Registration.findOne({ userId, eventId: event._id });
  if (registration && registration.status === 'CONFIRMED') throwErr('Already registered for this event', 409);

  if (registration) {
    registration.status = 'CONFIRMED';
    await registration.save();
  } else {
    const ticketNumber = `TKT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    registration = await Registration.create({
      userId,
      eventId: event._id,
      ticketNumber,
    });
    registration.qrCode = await generateQR(String(registration._id));
    await registration.save();
  }

  analyticsService.increment(event._id, 'registrations').catch(() => {});
  notificationService
    .notify({
      userId,
      title: 'Registration Confirmed',
      message: `You are registered for "${event.title}". Your ticket: ${registration.ticketNumber}`,
      type: 'REGISTRATION',
    })
    .catch(() => {});

  return { registration };
};

export const cancelRegistration = async (eventId: string, userId: string) => {
  const registration = await Registration.findOne({
    userId,
    eventId,
    status: 'CONFIRMED',
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
