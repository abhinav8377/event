import * as certificateService from './certificate.service.js';
import { streamCertificate } from '../../common/utils/certificate.util.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const generate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await certificateService.generateCertificates(String(req.params.eventId), String(req.user!._id), req.role!);
    success(res, `Certificates generated: ${data.generated}`, data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const myCertificates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const certificates = await certificateService.getMyCertificates(String(req.user!._id));
    success(res, 'My certificates', { certificates });
  } catch (err) {
    next(err);
  }
};

export const download = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cert = await certificateService.getCertificateById(String(req.params.id), String(req.user!._id), req.role!);
    streamCertificate(res, {
      userName: (cert as any).userId.name,
      eventTitle: (cert as any).eventId.title,
      eventDate: (cert as any).eventId.date,
      certificateId: cert.certificateId,
    });
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
