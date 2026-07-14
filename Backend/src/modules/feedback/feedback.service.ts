import Feedback from './feedback.model.js';
import Registration from '../registrations/registration.model.js';
import Event from '../events/event.model.js';
import { sendEmail } from '../../common/utils/email.util.js';
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

  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);

  const end = event.endDate || event.date;
  if (end && new Date(end).getTime() > Date.now()) {
    throwErr('Feedback can only be submitted after the event has ended', 400);
  }

  const registered = await Registration.findOne({ userId, eventId, status: 'CONFIRMED' });
  if (!registered) throwErr('You must be registered for this event to give feedback', 403);

  const exists = await Feedback.findOne({ userId, eventId });
  if (exists) throwErr('Feedback already submitted', 409);

  const feedback = await Feedback.create({ userId, eventId, rating, review });
  analyticsService.addRating(eventId, rating).catch(() => {});
  return { feedback };
};

const feedbackRequestEmailHtml = (name: string, eventTitle: string, url: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
    <h2 style="color:#4f46e5;margin-bottom:8px;">How was "${eventTitle}"?</h2>
    <p style="font-size:15px;line-height:1.6;">Hi ${name},</p>
    <p style="font-size:15px;line-height:1.6;">
      Thank you for attending <strong>${eventTitle}</strong>. Your opinion helps us and the organizer
      improve future events. Please take a moment to share your rating and review.
    </p>
    <p style="margin:24px 0;">
      <a href="${url}" style="background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Rate this event
      </a>
    </p>
    <p style="font-size:13px;color:#6b7280;">
      You can also go to <strong>My Registrations &rarr; Past</strong> and choose "Leave feedback".
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="font-size:12px;color:#9ca3af;">This is an automated message from EventHub. You are receiving this because you registered for the event.</p>
  </div>
`;

export const sendFeedbackRequests = async (eventId: string, eventTitle: string) => {
  const registrations = await Registration.find({ eventId, status: 'CONFIRMED' }).populate(
    'userId',
    'name email',
  );
  if (!registrations.length) return;

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const feedbackUrl = `${clientUrl}/events/${eventId}`;

  const emailPromises = registrations.map((reg) => {
    const user = reg.userId as any;
    if (!user?.email) return Promise.resolve();
    return sendEmail({
      to: user.email,
      subject: `How was "${eventTitle}"? Share your feedback`,
      html: feedbackRequestEmailHtml(user.name || 'Attendee', eventTitle, feedbackUrl),
    }).catch(() => {});
  });

  await Promise.allSettled(emailPromises);
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
