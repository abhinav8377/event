import * as notificationService from './notification.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.getUserNotifications(String(req.user!._id));
    success(res, 'Notifications fetched', data);
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.markNotificationAsRead(String(req.params.id), String(req.user!._id));
    success(res, 'Notification marked as read', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.markAllNotificationsAsRead(String(req.user!._id));
    success(res, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
