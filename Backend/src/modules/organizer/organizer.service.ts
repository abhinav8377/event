import Event from '../events/event.model.js';
import Registration from '../registrations/registration.model.js';
import Attendance from '../attendance/attendance.model.js';
import Feedback from '../feedback/feedback.model.js';
import Notification from '../notifications/notification.model.js';
import User from '../users/user.model.js';
import { sendEmail } from '../../common/utils/email.util.js';
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
    Registration.countDocuments({ eventId: { $in: eventIds }, status: { $in: ['CONFIRMED', 'ALLOWED'] } }),
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
      { $match: { eventId: { $in: eventIds }, status: { $in: ['CONFIRMED', 'ALLOWED'] } } },
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
  const registrations = await Registration.find({ eventId: event._id, status: { $in: ['CONFIRMED', 'ALLOWED'] } })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
  return { registrations };
};

export const getAllRegistrationsForOrganizer = async (organizerId: string, role: string, eventId?: string) => {
  let events;
  if (eventId) {
    const event = await Event.findById(eventId);
    if (!event) throwErr('Event not found', 404);
    if (role !== 'ADMIN' && String(event.organizerId) !== String(organizerId)) throwErr('Forbidden', 403);
    events = [event];
  } else {
    events = await Event.find({ organizerId }).select('_id title');
  }

  const eventIds = events.map((e) => e._id);

  const registrations = await Registration.find({
    eventId: { $in: eventIds },
    status: { $in: ['PENDING', 'ALLOWED', 'CONFIRMED'] },
  })
    .populate('userId', 'name email')
    .populate('eventId', 'title date venue city price')
    .sort({ createdAt: -1 });

  return { registrations };
};

export const sendEventNotification = async (
  organizerId: string,
  eventId: string,
  title: string,
  message: string,
  notificationType: string = 'EVENT_UPDATE',
) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (String(event.organizerId) !== organizerId) throwErr('Forbidden', 403);

  const registrations = await Registration.find({ eventId: event._id, status: { $in: ['CONFIRMED', 'ALLOWED'] } }).populate(
    'userId',
    'name email',
  );

  if (registrations.length === 0) throwErr('No registered participants found', 404);

  const VALID_TYPES = ['REGISTRATION', 'REMINDER', 'EVENT_UPDATE', 'CERTIFICATE', 'GENERAL'];
  const dbType = notificationType === 'UPDATE' ? 'EVENT_UPDATE' : notificationType;
  const safeType = VALID_TYPES.includes(dbType) ? dbType : 'GENERAL';

  const docs = registrations.map((reg) => ({
    userId: (reg.userId as any)._id,
    title,
    message,
    type: safeType,
    sentBy: organizerId,
  }));

  await Notification.insertMany(docs);

  const emailPromises = registrations.map((reg) => {
    const user = reg.userId as any;
    return sendEmail({
      to: user.email,
      subject: title,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#333;">${title}</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;">Hi ${user.name},</p>
        <p style="color:#555;font-size:15px;line-height:1.6;">${message}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="color:#555;font-size:14px;">Event: <strong>${event.title}</strong></p>
        <p style="color:#999;font-size:12px;">This is a notification from the event organizer.</p>
      </div>`,
    }).catch(() => {});
  });
  await Promise.allSettled(emailPromises);

  return { sent: registrations.length, eventTitle: event.title };
};

export const getOrganizerEvents = async (organizerId: string) => {
  const events = await Event.find({ organizerId })
    .populate('organizerId', 'name organization')
    .sort({ createdAt: -1 });

  const eventIds = events.map((e) => e._id);

  const regCounts = await Registration.aggregate([
    { $match: { eventId: { $in: eventIds }, status: { $in: ['CONFIRMED', 'ALLOWED'] } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  const regMap = new Map(regCounts.map((c) => [String(c._id), c.count]));

  const attCounts = await Attendance.aggregate([
    { $match: { eventId: { $in: eventIds }, status: { $in: ['PRESENT', 'LATE'] } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  const attMap = new Map(attCounts.map((c) => [String(c._id), c.count]));

  const enriched = events.map((e) => ({
    ...e.toObject(),
    // Synced, de-duplicated view count (matches public event detail).
    views: (e.viewedBy?.length || 0) + (e.guestViews || 0),
    registeredCount: regMap.get(String(e._id)) || 0,
    attendanceCount: attMap.get(String(e._id)) || 0,
  }));

  return { events: enriched };
};

export const getSentOrganizerNotifications = async (organizerId: string) => {
  const notifications = await Notification.find({ sentBy: organizerId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(200);

  const grouped = new Map<string, any>();

  for (const n of notifications) {
    const key = `${n.title}|||${n.message}|||${n.type}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt,
        recipientCount: 0,
        recipients: [] as { name: string; email: string }[],
      });
    }
    const entry = grouped.get(key);
    entry.recipientCount += 1;
    if (entry.recipients.length < 5) {
      const user = n.userId as any;
      entry.recipients.push({ name: user?.name ?? '', email: user?.email ?? '' });
    }
  }

  return { notifications: Array.from(grouped.values()) };
};
