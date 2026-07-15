import * as eventService from './event.service.js';
import { success, error } from '../../common/utils/response.util.js';
import { uploadBanner as uploadMiddleware } from '../../common/middleware/upload.middleware.js';
import cloudinary from '../../common/config/cloudinary.js';
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
    const data = await eventService.getEventById(String(req.params.id), req.user?._id || null);
    success(res, 'Event fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const recordView = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.recordGuestView(String(req.params.id));
    success(res, 'View recorded', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const byOrganizer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await eventService.getOrganizerPublic(String(req.params.organizerId));
    success(res, 'Organizer fetched', data);
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

export const uploadBanner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req, res, (err) => (err ? reject(err) : resolve()));
    });

    if (!req.file) {
      error(res, 'No file provided', 400);
      return;
    }

    const b64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'eventhub/banners',
      transformation: [{ width: 1200, height: 630, crop: 'fill' }],
    });

    success(res, 'Banner uploaded', { url: result.secure_url });
  } catch (err: any) {
    if (err.message?.includes('Only ')) {
      error(res, err.message, 400);
    } else {
      next(err);
    }
  }
};
