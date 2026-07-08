import * as registrationService from './registration.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await registrationService.registerForEvent(String(req.params.eventId), String(req.user!._id));
    success(res, 'Registration successful', data, 201);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const cancel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await registrationService.cancelRegistration(String(req.params.eventId), String(req.user!._id));
    success(res, 'Registration cancelled');
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const myEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await registrationService.getMyRegistrations(String(req.user!._id));
    success(res, 'My registrations', data);
  } catch (err) {
    next(err);
  }
};

export const getTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await registrationService.getTicketById(String(req.params.registrationId), String(req.user!._id), req.role!);
    success(res, 'Ticket fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
