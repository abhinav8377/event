import * as attendanceService from './attendance.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const verify = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await attendanceService.checkInAttendee({
      registrationId: req.body.registrationId,
      checkedByUserId: String(req.user!._id),
      checkedByRole: req.role!,
      status: 'PRESENT',
    });
    success(res, 'Attendance recorded', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const manualCheckin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = ['PRESENT', 'LATE', 'ABSENT'].includes(req.body.status)
      ? req.body.status
      : 'PRESENT';
    const data = await attendanceService.checkInAttendee({
      registrationId: req.body.registrationId,
      checkedByUserId: String(req.user!._id),
      checkedByRole: req.role!,
      status,
    });
    success(res, 'Attendance recorded', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const eventAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const attendance = await attendanceService.getEventAttendance(String(req.params.eventId));
    success(res, 'Event attendance', { attendance });
  } catch (err) {
    next(err);
  }
};
