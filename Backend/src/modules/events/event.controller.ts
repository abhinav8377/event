import * as eventService from './event.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.listEvents(req.query as Record<string, string>);
    success(res, 'Events fetched', data);
  } catch (err) {
    next(err);
  }
};

export const search = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.searchEvents(req.query.q as string);
    success(res, 'Search results', data);
  } catch (err) {
    next(err);
  }
};

export const upcoming = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.getUpcomingEvents();
    success(res, 'Upcoming events', data);
  } catch (err) {
    next(err);
  }
};

export const popular = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.getPopularEvents();
    success(res, 'Popular events', data);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.getEventById(String(req.params.id));
    success(res, 'Event fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.createEvent({ ...req.body, organizerId: String(req.user!._id) });
    success(res, 'Event created (draft)', data, 201);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.updateEvent(String(req.params.id), req.body, String(req.user!._id), req.role!);
    success(res, 'Event updated', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await eventService.deleteEvent(String(req.params.id), String(req.user!._id), req.role!);
    success(res, 'Event deleted');
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const publish = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.publishEvent(String(req.params.id), String(req.user!._id), req.role!);
    success(res, 'Event published', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const cancel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.cancelEvent(String(req.params.id), String(req.user!._id), req.role!);
    success(res, 'Event cancelled', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
