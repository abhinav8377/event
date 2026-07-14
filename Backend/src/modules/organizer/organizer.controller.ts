import * as organizerService from './organizer.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const dashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await organizerService.getDashboard(String(req.user!._id));
    success(res, 'Organizer dashboard', data);
  } catch (err) {
    next(err);
  }
};

export const myEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await organizerService.getMyEvents(String(req.user!._id));
    success(res, 'Organizer events', data);
  } catch (err) {
    next(err);
  }
};

export const eventRegistrations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await organizerService.getEventRegistrations(String(req.params.eventId), String(req.user!._id), req.role!);
    success(res, 'Event registrations', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const allRegistrations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.query.eventId as string | undefined;
    const data = await organizerService.getAllRegistrationsForOrganizer(
      String(req.user!._id),
      req.role!,
      eventId,
    );
    success(res, 'Registrations fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const sendNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, title, message, type } = req.body;
    if (!eventId || !title || !message) {
      error(res, 'Event ID, title, and message are required', 400);
      return;
    }
    const data = await organizerService.sendEventNotification(
      String(req.user!._id),
      eventId,
      title,
      message,
      type || 'EVENT_UPDATE',
    );
    success(res, `Notification sent to ${data.sent} participant${data.sent !== 1 ? 's' : ''} of "${data.eventTitle}"`, data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const organizerEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await organizerService.getOrganizerEvents(String(req.user!._id));
    success(res, 'Organizer events', data);
  } catch (err) {
    next(err);
  }
};

export const sentNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await organizerService.getSentOrganizerNotifications(String(req.user!._id));
    success(res, 'Sent notifications fetched', data);
  } catch (err) {
    next(err);
  }
};
