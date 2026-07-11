import Event from './event.model.js';
import * as analyticsService from '../analytics/analytics.service.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
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

  return { events, total, page: Number(page) };
};

export const searchEvents = async (q = '') => {
  const events = await Event.find({
    status: 'PUBLISHED',
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  }).limit(20);
  return { events };
};

export const getUpcomingEvents = async () => {
  const events = await Event.find({ status: 'PUBLISHED', date: { $gte: new Date() } })
    .sort({ date: 1 })
    .limit(10);
  return { events };
};

export const getPopularEvents = async () => {
  const events = await Event.find({ status: 'PUBLISHED' }).sort({ views: -1 }).limit(10);
  return { events };
};

export const getEventById = async (eventId: string) => {
  const event = await Event.findById(eventId).populate('organizerId', 'name organization');
  if (!event) throwErr('Event not found', 404);
  event.views += 1;
  await event.save();
  analyticsService.increment(event._id, 'views').catch(() => {});
  return { event };
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
