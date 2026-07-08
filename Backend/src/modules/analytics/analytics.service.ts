import Analytics from './analytics.model.js';
import Event from '../events/event.model.js';
import type { AnalyticsSummary, ServiceError } from '../../types/index.js';
import type { Types } from 'mongoose';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

type AnalyticsField = 'views' | 'registrations' | 'attendance';

export const increment = (eventId: Types.ObjectId | string, field: AnalyticsField, amount = 1) =>
  Analytics.findOneAndUpdate(
    { eventId },
    { $inc: { [field]: amount } },
    { upsert: true, new: true },
  );

export const addRating = (eventId: Types.ObjectId | string, rating: number) =>
  Analytics.findOneAndUpdate(
    { eventId },
    { $inc: { ratingSum: rating, ratingCount: 1 } },
    { upsert: true, new: true },
  );

export const removeRating = (eventId: Types.ObjectId | string, rating: number) =>
  Analytics.findOneAndUpdate(
    { eventId },
    { $inc: { ratingSum: -rating, ratingCount: -1 } },
    { new: true },
  );

export const getDashboard = async (userId: string, role: string): Promise<AnalyticsSummary> => {
  const filter = role === 'ADMIN' ? {} : { organizerId: userId };
  const events = await Event.find(filter).select('_id');
  const eventIds = events.map((e) => e._id);
  const records = await Analytics.find({ eventId: { $in: eventIds } });

  const summary = records.reduce(
    (acc, r) => {
      acc.views += r.views;
      acc.registrations += r.registrations;
      acc.attendance += r.attendance;
      acc.ratingSum += r.ratingSum;
      acc.ratingCount += r.ratingCount;
      return acc;
    },
    { views: 0, registrations: 0, attendance: 0, ratingSum: 0, ratingCount: 0 },
  );

  return {
    totalEvents: eventIds.length,
    views: summary.views,
    registrations: summary.registrations,
    attendance: summary.attendance,
    averageRating: summary.ratingCount
      ? Number((summary.ratingSum / summary.ratingCount).toFixed(2))
      : 0,
  };
};

export const getEventAnalytics = async (eventId: string, userId: string, role: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (role !== 'ADMIN' && String(event.organizerId) !== String(userId)) throwErr('Forbidden', 403);
  const analytics =
    (await Analytics.findOne({ eventId: event._id })) || {
      views: 0,
      registrations: 0,
      attendance: 0,
      averageRating: 0,
    };
  return { analytics };
};
