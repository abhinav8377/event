import Feedback from './feedback.model.js';
import Registration from '../registrations/registration.model.js';
import * as analyticsService from '../analytics/analytics.service.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

interface CreateFeedbackInput {
  eventId: string;
  userId: string;
  rating: number;
  review?: string;
}

export const createFeedback = async ({ eventId, userId, rating, review }: CreateFeedbackInput) => {
  if (!rating || rating < 1 || rating > 5) throwErr('Rating must be between 1 and 5', 400);

  const registered = await Registration.findOne({ userId, eventId, status: 'CONFIRMED' });
  if (!registered) throwErr('You must be registered for this event to give feedback', 403);

  const exists = await Feedback.findOne({ userId, eventId });
  if (exists) throwErr('Feedback already submitted', 409);

  const feedback = await Feedback.create({ userId, eventId, rating, review });
  analyticsService.addRating(eventId, rating).catch(() => {});
  return { feedback };
};

export const getFeedbackForEvent = async (eventId: string) => {
  const feedback = await Feedback.find({ eventId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
  const avg = feedback.length
    ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
    : 0;
  return { feedback, averageRating: Number(avg.toFixed(2)) };
};

export const deleteFeedback = async (feedbackId: string, userId: string, role: string) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throwErr('Feedback not found', 404);
  if (String(feedback.userId) !== String(userId) && role !== 'ADMIN') throwErr('Forbidden', 403);
  await Feedback.deleteOne({ _id: feedback._id });
  analyticsService.removeRating(feedback.eventId, feedback.rating).catch(() => {});
};
