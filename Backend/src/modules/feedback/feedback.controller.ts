import * as feedbackService from './feedback.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await feedbackService.createFeedback({
      eventId: String(req.params.eventId),
      userId: String(req.user!._id),
      ...req.body,
    });
    success(res, 'Feedback submitted', data, 201);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const listForEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await feedbackService.getFeedbackForEvent(String(req.params.eventId));
    success(res, 'Event feedback', data);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await feedbackService.deleteFeedback(String(req.params.feedbackId), String(req.user!._id), req.role!);
    success(res, 'Feedback deleted');
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
