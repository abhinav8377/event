import Attendance from './attendance.model.js';
import Registration from '../registrations/registration.model.js';
import * as analyticsService from '../analytics/analytics.service.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

interface CheckInInput {
  registrationId: string;
  checkedByUserId: string;
  checkedByRole: string;
  status: string;
}

export const checkInAttendee = async ({ registrationId, checkedByUserId, checkedByRole, status }: CheckInInput) => {
  if (!registrationId) throwErr('registrationId is required', 400);

  const isObjectId = /^[a-f0-9]{24}$/i.test(registrationId);
  let registration = isObjectId
    ? await Registration.findById(registrationId).populate('eventId')
    : null;
  if (!registration) {
    registration = await Registration.findOne({ ticketNumber: registrationId }).populate('eventId');
  }
  if (!registration || registration.status !== 'CONFIRMED') throwErr('Valid registration not found', 404);

  const event = registration.eventId as any;
  if (checkedByRole !== 'ADMIN' && String(event.organizerId) !== String(checkedByUserId)) throwErr('Only the event organizer can verify attendance', 403);

  const existing = await Attendance.findOne({ registrationId: registration._id });
  if (existing) throwErr('Already checked in', 409);

  const attendance = await Attendance.create({
    registrationId: registration._id,
    eventId: event._id,
    userId: registration.userId,
    status,
    checkedInBy: checkedByUserId,
  });

  if (status !== 'ABSENT') {
    analyticsService.increment(event._id, 'attendance').catch(() => {});
  }

  return { attendance: attendance.status };
};

export const getEventAttendance = async (eventId: string) => {
  return Attendance.find({ eventId })
    .populate('userId', 'name email')
    .sort({ checkedInAt: -1 });
};
