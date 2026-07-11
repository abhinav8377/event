import User from '../users/user.model.js';
import Event from '../events/event.model.js';
import Registration from '../registrations/registration.model.js';
import Attendance from '../attendance/attendance.model.js';
import Feedback from '../feedback/feedback.model.js';
import Certificate from '../certificates/certificate.model.js';
import Role from '../users/role.model.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const getDashboard = async () => {
  const [totalUsers, organizerRole, totalEvents, totalRegistrations, publishedEvents, certificatesIssued] =
    await Promise.all([
      User.countDocuments(),
      Role.findOne({ name: 'ORGANIZER' }),
      Event.countDocuments(),
      Registration.countDocuments({ status: 'CONFIRMED' }),
      Event.countDocuments({ status: 'PUBLISHED' }),
      Certificate.countDocuments(),
    ]);
  const totalOrganizers = organizerRole
    ? await User.countDocuments({ roleId: organizerRole._id })
    : 0;
  return {
    totalUsers,
    totalOrganizers,
    totalEvents,
    publishedEvents,
    totalRegistrations,
    certificatesIssued,
  };
};

export const getAllUsers = async () => {
  const users = await User.find().populate('roleId', 'name').sort({ createdAt: -1 });
  return { users: users.map((u) => u.toSafeObject()) };
};

export const getAllEvents = async () => {
  const events = await Event.find()
    .populate('organizerId', 'name organization')
    .sort({ createdAt: -1 });
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

export const getAllOrganizers = async () => {
  const users = await User.find().populate('roleId', 'name');
  const organizers = users.filter((u) => u.roleId && (u.roleId as any).name === 'ORGANIZER');
  return { organizers: organizers.map((u) => u.toSafeObject('ORGANIZER')) };
};

export const verifyOrganizer = async (userId: string) => {
  const user = await User.findById(userId).populate('roleId');
  if (!user || !user.roleId || (user.roleId as any).name !== 'ORGANIZER') throwErr('Organizer not found', 404);
  user.organization = user.organization || {};
  user.organization.verified = true;
  await user.save();
  return { user: user.toSafeObject('ORGANIZER') };
};

export const toggleBlockUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throwErr('User not found', 404);
  user.isBlocked = !user.isBlocked;
  await user.save();
  return { isBlocked: user.isBlocked };
};

export const deleteEvent = async (eventId: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  await Event.deleteOne({ _id: event._id });
};
