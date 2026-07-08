import Notification from './notification.model.js';
import User from '../users/user.model.js';
import { sendEmail } from '../../common/utils/email.util.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

interface NotifyInput {
  userId: string;
  title: string;
  message: string;
  type?: 'REGISTRATION' | 'REMINDER' | 'EVENT_UPDATE' | 'CERTIFICATE' | 'GENERAL';
}

export const notify = async ({ userId, title, message, type = 'GENERAL' }: NotifyInput) => {
  const notification = await Notification.create({ userId, title, message, type });
  const user = await User.findById(userId);
  if (user) {
    await sendEmail({
      to: user.email,
      subject: title,
      html: `<p>Hi ${user.name},</p><p>${message}</p>`,
    });
  }
  return notification;
};

export const getUserNotifications = async (userId: string) => {
  const [notifications, unread] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ userId, read: false }),
  ]);
  return { notifications, unread };
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true },
  );
  if (!notification) throwErr('Notification not found', 404);
  return { notification };
};

export const markAllNotificationsAsRead = async (userId: string) => {
  await Notification.updateMany({ userId, read: false }, { read: true });
};
