import * as adminService from './admin.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const dashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getDashboard();
    success(res, 'Admin dashboard', data);
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getAllUsers();
    success(res, 'Users fetched', data);
  } catch (err) {
    next(err);
  }
};

export const listEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getAllEvents();
    success(res, 'Events fetched', data);
  } catch (err) {
    next(err);
  }
};

export const listOrganizers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getAllOrganizers();
    success(res, 'Organizers fetched', data);
  } catch (err) {
    next(err);
  }
};

export const verifyOrganizer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.verifyOrganizer(String(req.params.id));
    success(res, 'Organizer verified', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const blockUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.toggleBlockUser(String(req.params.id));
    success(res, data.isBlocked ? 'User blocked' : 'User unblocked', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.deleteEvent(String(req.params.id));
    success(res, 'Event deleted by admin');
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const sendNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, targetRole, type } = req.body;
    if (!title || !message || !targetRole) {
      error(res, 'Title, message, and targetRole are required', 400);
      return;
    }
    if (!['USER', 'ORGANIZER'].includes(targetRole)) {
      error(res, 'targetRole must be USER or ORGANIZER', 400);
      return;
    }
    const data = await adminService.sendNotification(
      String(req.user!._id),
      title,
      message,
      targetRole,
      type || 'GENERAL',
    );
    success(res, `Notification sent to ${data.sent} ${targetRole.toLowerCase()}s`, data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const sentNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getSentNotifications(String(req.user!._id));
    success(res, 'Sent notifications fetched', data);
  } catch (err) {
    next(err);
  }
};

export const listLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getRequestLogs({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      method: req.query.method as string,
      statusCode: req.query.statusCode ? Number(req.query.statusCode) : undefined,
      statusGroup: req.query.statusGroup as string,
      url: req.query.url as string,
      ip: req.query.ip as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      adminRoute: req.query.adminRoute as string,
    });
    success(res, 'Logs fetched', data);
  } catch (err) {
    next(err);
  }
};

export const logStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getLogStats();
    success(res, 'Log stats fetched', data);
  } catch (err) {
    next(err);
  }
};
