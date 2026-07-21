import User from './user.model.js';
import Registration from '../registrations/registration.model.js';
import Attendance from '../attendance/attendance.model.js';
import Certificate from '../certificates/certificate.model.js';
import Feedback from '../feedback/feedback.model.js';
import Event from '../events/event.model.js';
import Notification from '../notifications/notification.model.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const getProfile = (user: any) => {
  return { user: user.toSafeObject() };
};

export const getDashboard = async (userId: string) => {
  const [
    allRegistrations,
    attendedRecords,
    certificates,
    feedbackGiven,
    unreadNotifications,
    upcomingEvents,
  ] = await Promise.all([
    Registration.find({ userId }).populate('eventId').sort({ createdAt: -1 }),
    Attendance.find({ userId }),
    Certificate.find({ userId }),
    Feedback.find({ userId }),
    Notification.countDocuments({ userId, read: false }),
    Event.find({ status: 'PUBLISHED', date: { $gte: new Date() } }).sort({ date: 1 }).limit(10),
  ]);

  const confirmed = allRegistrations.filter((r) => r.status === 'CONFIRMED');
  const cancelled = allRegistrations.filter((r) => r.status === 'CANCELLED');
  const attendedIds = new Set(attendedRecords.map((a) => String(a.registrationId)));
  const attended = confirmed.filter((r) => attendedIds.has(String(r._id)));
  const pending = confirmed.filter((r) => !attendedIds.has(String(r._id)));

  const registeredEventIds = new Set(confirmed.map((r) => String(r.eventId?._id || r.eventId)));
  const upcomingRegistered = upcomingEvents.filter((e) => registeredEventIds.has(String(e._id)));
  const suggestions = upcomingEvents.filter((e) => !registeredEventIds.has(String(e._id))).slice(0, 4);

  const categoryBreakdown: Record<string, number> = {};
  for (const reg of confirmed) {
    const ev = reg.eventId as any;
    if (ev?.category) {
      const cat = ev.category;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }
  }
  const categoryData = Object.entries(categoryBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthlyActivity: Record<string, { registered: number; attended: number }> = {};
  for (const reg of allRegistrations) {
    const month = new Date(reg.createdAt).toISOString().slice(0, 7);
    if (!monthlyActivity[month]) monthlyActivity[month] = { registered: 0, attended: 0 };
    monthlyActivity[month].registered++;
  }
  for (const att of attendedRecords) {
    const month = new Date(att.checkedInAt || att.createdAt).toISOString().slice(0, 7);
    if (!monthlyActivity[month]) monthlyActivity[month] = { registered: 0, attended: 0 };
    monthlyActivity[month].attended++;
  }
  const monthlyData = Object.entries(monthlyActivity)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({ month, ...data }));

  const avgRatingGiven = feedbackGiven.length
    ? Number((feedbackGiven.reduce((sum, f) => sum + f.rating, 0) / feedbackGiven.length).toFixed(1))
    : 0;

  const recentActivity = allRegistrations.slice(0, 8).map((r) => {
    const ev = r.eventId as any;
    const att = attendedRecords.find((a) => String(a.registrationId) === String(r._id));
    return {
      id: r._id,
      eventTitle: ev?.title || 'Unknown Event',
      eventCategory: ev?.category || '',
      ticketNumber: r.ticketNumber,
      status: r.status,
      attendance: att ? att.status : 'NOT_MARKED',
      registeredAt: r.createdAt,
    };
  });

  return {
    stats: {
      totalRegistered: confirmed.length,
      eventsAttended: attended.length,
      eventsPending: pending.length,
      certificatesEarned: certificates.length,
      feedbackGiven: feedbackGiven.length,
      avgRatingGiven,
      unreadNotifications,
      cancelledRegistrations: cancelled.length,
      totalRegistrations: allRegistrations.length,
    },
    recentActivity,
    categoryData,
    monthlyData,
    upcomingRegistered: upcomingRegistered.map((e) => ({
      id: e._id,
      title: e.title,
      category: e.category,
      mode: e.mode,
      date: e.date,
      venue: e.venue,
      city: e.city,
      bannerUrl: e.bannerUrl,
    })),
    suggestions: suggestions.map((e) => ({
      id: e._id,
      title: e.title,
      description: e.description,
      category: e.category,
      mode: e.mode,
      date: e.date,
      venue: e.venue,
      city: e.city,
      bannerUrl: e.bannerUrl,
      capacity: e.capacity,
      price: e.price,
    })),
  };
};

export const updateProfile = async (user: any, { name, organizationName }: { name?: string; organizationName?: string }) => {
  if (name) user.name = name;
  if (organizationName && user.roleId && user.roleId.name === 'ORGANIZER') {
    user.organization = user.organization || {};
    user.organization.name = organizationName;
  }
  await user.save();
  return { user: user.toSafeObject() };
};

export const changePassword = async (userId: string, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
  if (!currentPassword || !newPassword) throwErr('Current and new password are required', 400);
  if (newPassword.length < 6) throwErr('Password must be at least 6 characters', 400);

  const user = await User.findById(userId).select('+password');
  if (!user) throwErr('User not found', 404);
  if (!(await user.comparePassword(currentPassword))) throwErr('Current password is incorrect', 401);
  user.password = newPassword;
  await user.save();
};

