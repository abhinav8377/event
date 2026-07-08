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
