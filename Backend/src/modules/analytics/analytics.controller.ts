import * as analyticsService from './analytics.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const dashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await analyticsService.getDashboard(String(req.user!._id), req.role!);
    success(res, 'Analytics dashboard', data);
  } catch (err) {
    next(err);
  }
};

export const eventAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await analyticsService.getEventAnalytics(String(req.params.eventId), String(req.user!._id), req.role!);
    success(res, 'Event analytics', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
