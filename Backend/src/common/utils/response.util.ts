import { Response } from 'express';

export const success = (res: Response, message: string, data: unknown = {}, status = 200): void => {
  res.status(status).json({ success: true, message, data });
};

export const error = (res: Response, message: string, status = 400, errors: string[] = []): void => {
  res.status(status).json({ success: false, message, errors });
};
