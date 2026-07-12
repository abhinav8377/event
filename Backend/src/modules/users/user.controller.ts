import * as userService from './user.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = userService.getProfile(req.user!);
    success(res, 'Profile fetched', data);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await userService.updateProfile(req.user!, req.body);
    success(res, 'Profile updated', data);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.changePassword(req.user!._id.toString(), req.body);
    success(res, 'Password changed successfully');
  } catch (err) {
    if ((err as { status?: number }).status) error(res, (err as Error).message, (err as { status: number }).status);
    else next(err);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.deleteUserAccount(req.user!._id.toString());
    success(res, 'Account deleted');
  } catch (err) {
    next(err);
  }
};

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await userService.getDashboard(req.user!._id.toString());
    success(res, 'Dashboard data fetched', data);
  } catch (err) {
    next(err);
  }
};
