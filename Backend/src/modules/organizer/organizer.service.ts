import Event from '../events/event.model.js';
import Registration from '../registrations/registration.model.js';
import Attendance from '../attendance/attendance.model.js';
import Feedback from '../feedback/feedback.model.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const getDashboard = async (organizerId: string) => {
  const events = await Event.find({ organizerId }).select('_id status');
  const eventIds = events.map((e) => e._id);
  const [totalRegistrations, totalAttendance] = await Promise.all([
    Registration.countDocuments({ eventId: { $in: eventIds }, status: 'CONFIRMED' }),
    Attendance.countDocuments({ eventId: { $in: eventIds }, status: { $in: ['PRESENT', 'LATE'] } }),
  ]);
  return {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => e.status === 'PUBLISHED').length,
    draftEvents: events.filter((e) => e.status === 'DRAFT').length,
    totalRegistrations,
    totalAttendance,
  };
};

export const getMyEvents = async (organizerId: string) => {
  const events = await Event.find({ organizerId }).sort({ createdAt: -1 });
  const eventIds = events.map((e) => e._id);

  const [regCounts, attCounts, fbAgg] = await Promise.all([
    Registration.aggregate([
      { $match: { eventId: { $in: eventIds }, status: 'CONFIRMED' } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: { eventId: { $in: eventIds }, status: { $in: ['PRESENT', 'LATE'] } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]),
    Feedback.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$eventId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);

  const regMap = new Map(regCounts.map((r) => [String(r._id), r.count]));
  const attMap = new Map(attCounts.map((a) => [String(a._id), a.count]));
  const fbMap = new Map(fbAgg.map((f) => [String(f._id), f]));

  const enriched = events.map((e) => {
    const id = String(e._id);
    const fb = fbMap.get(id);
    return {
      ...e.toObject(),
      registeredCount: regMap.get(id) || 0,
      attendanceCount: attMap.get(id) || 0,
      rating: fb ? Math.round(fb.avgRating * 10) / 10 : 0,
      ratingCount: fb ? fb.count : 0,
    };
  });

  return { events: enriched };
};

export const getEventRegistrations = async (eventId: string, userId: string, role: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (role !== 'ADMIN' && String(event.organizerId) !== String(userId)) throwErr('Forbidden', 403);
  const registrations = await Registration.find({ eventId: event._id, status: 'CONFIRMED' })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
  return { registrations };
};
