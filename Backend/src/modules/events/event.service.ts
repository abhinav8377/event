import mongoose from 'mongoose';
import Event from './event.model.js';
import User from '../users/user.model.js';
import Registration from '../registrations/registration.model.js';
import * as analyticsService from '../analytics/analytics.service.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

async function getRegistrationCounts(eventIds: mongoose.Types.ObjectId[]): Promise<Map<string, number>> {
  if (eventIds.length === 0) return new Map();
  const counts = await Registration.aggregate([
    { $match: { eventId: { $in: eventIds }, status: { $in: ['CONFIRMED', 'ALLOWED'] } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
}

interface ListParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateEventInput {
  title: string;
  description?: string;
  longDescription?: string;
  category?: string;
  mode?: string;
  venue?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  date: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  price?: number;
  bannerUrl?: string;
  tags?: string[];
  organizerId: string;
}

export const listEvents = async ({ category, search, page = 1, limit = 12 }: ListParams) => {
  const filter: Record<string, unknown> = { status: 'PUBLISHED' };
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('organizerId', 'name organization')
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Event.countDocuments(filter),
  ]);

  const countMap = await getRegistrationCounts(events.map((e) => e._id));
  const enriched = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap.get(String(e._id)) || 0,
  }));

  return { events: enriched, total, page: Number(page) };
};

export const searchEvents = async (q = '') => {
  const events = await Event.find({
    status: 'PUBLISHED',
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  }).limit(20);
  const countMap = await getRegistrationCounts(events.map((e) => e._id));
  const enriched = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap.get(String(e._id)) || 0,
  }));
  return { events: enriched };
};

export const getUpcomingEvents = async () => {
  const events = await Event.find({ status: 'PUBLISHED', date: { $gte: new Date() } })
    .sort({ date: 1 })
    .limit(10);
  const countMap = await getRegistrationCounts(events.map((e) => e._id));
  const enriched = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap.get(String(e._id)) || 0,
  }));
  return { events: enriched };
};

export const getPopularEvents = async () => {
  const events = await Event.find({ status: 'PUBLISHED' }).sort({ views: -1 }).limit(10);
  const countMap = await getRegistrationCounts(events.map((e) => e._id));
  const enriched = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap.get(String(e._id)) || 0,
  }));
  return { events: enriched };
};

export const getEventById = async (eventId: string, userId?: string | null) => {
  const event = await Event.findById(eventId).populate('organizerId', 'name organization');
  if (!event) throwErr('Event not found', 404);

  // Real, de-duplicated view counting: a logged-in user is counted at most once.
  if (userId && !event.viewedBy.some((id) => String(id) === String(userId))) {
    event.viewedBy.push(new mongoose.Types.ObjectId(userId));
    event.views = event.viewedBy.length + (event.guestViews || 0);
    await event.save();
  } else if (!userId) {
    event.views = event.viewedBy.length + (event.guestViews || 0);
  }

  const registeredCount = await Registration.countDocuments({
    eventId: event._id,
    status: { $in: ['CONFIRMED', 'ALLOWED'] },
  });

  return { event: { ...event.toObject(), registeredCount } };
};

export const recordGuestView = async (eventId: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  event.guestViews = (event.guestViews || 0) + 1;
  event.views = event.viewedBy.length + event.guestViews;
  await event.save();
  return { views: event.views };
};

export const getOrganizerPublic = async (organizerId: string): Promise<{ organizer: any; events: any[] }> => {
  const organizer = await User.findById(organizerId).select('name organization');
  if (!organizer) throwErr('Organizer not found', 404);

  const now = new Date();
  const events = await Event.find({ organizerId, status: 'PUBLISHED', date: { $gte: now } })
    .populate('organizerId', 'name organization')
    .sort({ date: 1 })
    .limit(10);
  const countMap = await getRegistrationCounts(events.map((e) => e._id));
  const enriched = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap.get(String(e._id)) || 0,
  }));

  return { organizer, events: enriched };
};

export const createEvent = async ({ title, description, longDescription, category, mode, venue, city, latitude, longitude, date, endDate, startTime, endTime, capacity, price, bannerUrl, tags, organizerId }: CreateEventInput) => {
  if (!title || !date) throwErr('Title and date are required', 400);
  const event = await Event.create({
    title,
    description,
    longDescription,
    category,
    mode,
    venue,
    city,
    latitude,
    longitude,
    date,
    endDate,
    startTime,
    endTime,
    capacity,
    price,
    bannerUrl,
    tags,
    organizerId,
  });
  return { event };
};

export const updateEvent = async (eventId: string, body: Record<string, any>, userId: string, role: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (role !== 'ADMIN' && String(event.organizerId) !== String(userId)) throwErr('Forbidden', 403);
  const allowed = ['title', 'description', 'longDescription', 'category', 'mode', 'venue', 'city', 'latitude', 'longitude', 'date', 'endDate', 'startTime', 'endTime', 'capacity', 'price', 'bannerUrl', 'tags'] as const;
  allowed.forEach((field) => {
    if (body[field] !== undefined) (event as any)[field] = body[field];
  });
  await event.save();
  return { event };
};

export const deleteEvent = async (eventId: string, userId: string, role: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (role !== 'ADMIN' && String(event.organizerId) !== String(userId)) throwErr('Forbidden', 403);
  await Event.deleteOne({ _id: event._id });
};

export const publishEvent = async (eventId: string, userId: string, role: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (role !== 'ADMIN' && String(event.organizerId) !== String(userId)) throwErr('Forbidden', 403);
  event.status = 'PUBLISHED';
  await event.save();
  return { event };
};

export const cancelEvent = async (eventId: string, userId: string, role: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (role !== 'ADMIN' && String(event.organizerId) !== String(userId)) throwErr('Forbidden', 403);
  event.status = 'CANCELLED';
  await event.save();
  return { event };
};
