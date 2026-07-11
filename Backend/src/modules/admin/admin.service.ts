import User from '../users/user.model.js';
import Event from '../events/event.model.js';
import Registration from '../registrations/registration.model.js';
import Attendance from '../attendance/attendance.model.js';
import Feedback from '../feedback/feedback.model.js';
import Certificate from '../certificates/certificate.model.js';
import Notification from '../notifications/notification.model.js';
import RequestLog from './requestlog.model.js';
import Role from '../users/role.model.js';
import { sendEmail } from '../../common/utils/email.util.js';
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

export const sendNotification = async (
  adminId: string,
  title: string,
  message: string,
  targetRole: 'USER' | 'ORGANIZER',
  type: string = 'GENERAL',
) => {
  const role = await Role.findOne({ name: targetRole });
  if (!role) throwErr('Role not found', 404);

  const recipients = await User.find({ roleId: role._id, isBlocked: false });
  if (recipients.length === 0) throwErr('No active recipients found', 404);

  const docs = recipients.map((u) => ({
    userId: u._id,
    title,
    message,
    type,
    sentBy: adminId,
  }));

  await Notification.insertMany(docs);

  const emailPromises = recipients.map((u) =>
    sendEmail({
      to: u.email,
      subject: title,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#333;">${title}</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;">Hi ${u.name},</p>
        <p style="color:#555;font-size:15px;line-height:1.6;">${message}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="color:#999;font-size:12px;">This is a notification from EventHub Admin.</p>
      </div>`,
    }).catch(() => {}),
  );
  await Promise.allSettled(emailPromises);

  return { sent: recipients.length, targetRole };
};

export const getSentNotifications = async (adminId: string) => {
  const notifications = await Notification.find({ sentBy: adminId })
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

export interface LogQuery {
  page?: number;
  limit?: number;
  method?: string;
  statusCode?: number;
  statusGroup?: string;
  url?: string;
  ip?: string;
  startDate?: string;
  endDate?: string;
}

export const getRequestLogs = async (query: LogQuery) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 50));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (query.method) {
    filter.method = query.method.toUpperCase();
  }

  if (query.statusCode) {
    filter.statusCode = query.statusCode;
  }

  if (query.statusGroup) {
    const ranges: Record<string, any> = {
      informational: { $gte: 100, $lt: 200 },
      success: { $gte: 200, $lt: 300 },
      redirect: { $gte: 300, $lt: 400 },
      clientError: { $gte: 400, $lt: 500 },
      serverError: { $gte: 500, $lt: 600 },
    };
    if (ranges[query.statusGroup]) {
      filter.statusCode = ranges[query.statusGroup];
    }
  }

  if (query.url) {
    filter.url = { $regex: query.url, $options: 'i' };
  }

  if (query.ip) {
    filter.ip = { $regex: query.ip, $options: 'i' };
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const [logs, total] = await Promise.all([
    RequestLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    RequestLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getLogStats = async () => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last1h = new Date(now.getTime() - 60 * 60 * 1000);

  const [totalLogs, recentLogs, methodBreakdown, statusBreakdown, topEndpoints, activeUsers, recentHourCount] =
    await Promise.all([
      RequestLog.countDocuments(),
      RequestLog.countDocuments({ createdAt: { $gte: last24h } }),
      RequestLog.aggregate([
        { $match: { createdAt: { $gte: last24h } } },
        { $group: { _id: '$method', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      RequestLog.aggregate([
        { $match: { createdAt: { $gte: last24h } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$statusCode', 200] }, then: 'informational' },
                  { case: { $lt: ['$statusCode', 300] }, then: 'success' },
                  { case: { $lt: ['$statusCode', 400] }, then: 'redirect' },
                  { case: { $lt: ['$statusCode', 500] }, then: 'clientError' },
                ],
                default: 'serverError',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      RequestLog.aggregate([
        { $match: { createdAt: { $gte: last24h } } },
        { $group: { _id: '$url', count: { $sum: 1 }, avgDuration: { $avg: '$duration' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      RequestLog.aggregate([
        { $match: { createdAt: { $gte: last24h }, userId: { $ne: null } } },
        { $group: { _id: { userId: '$userId', userName: '$userName', userRole: '$userRole' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      RequestLog.countDocuments({ createdAt: { $gte: last1h } }),
    ]);

  return {
    totalLogs,
    last24h: recentLogs,
    last1h: recentHourCount,
    methodBreakdown: methodBreakdown.map((m) => ({ method: m._id, count: m.count })),
    statusBreakdown: statusBreakdown.map((s) => ({ group: s._id, count: s.count })),
    topEndpoints: topEndpoints.map((e) => ({
      url: e._id,
      count: e.count,
      avgDuration: Math.round(e.avgDuration),
    })),
    activeUsers: activeUsers.map((u) => ({
      userId: u._id.userId,
      userName: u._id.userName,
      userRole: u._id.userRole,
      requestCount: u.count,
    })),
  };
};
