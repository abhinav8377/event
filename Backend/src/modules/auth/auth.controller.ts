import * as authService from './auth.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await authService.registerUser(req.body);
    success(res, 'Registration successful', data, 201);
  } catch (err) {
    if ((err as { status?: number }).status) error(res, (err as Error).message, (err as { status: number }).status);
    else next(err);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await authService.loginUser(req.body);
    success(res, 'Login successful', data);
  } catch (err) {
    if ((err as { status?: number }).status) error(res, (err as Error).message, (err as { status: number }).status);
    else next(err);
  }
};

export const clerkAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clerkToken } = req.body;
    const data = await authService.clerkLogin(clerkToken);
    success(res, 'Login successful', data);
  } catch (err) {
    if ((err as { status?: number }).status) error(res, (err as Error).message, (err as { status: number }).status);
    else next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logoutUser(req.user!);
    success(res, 'Logged out successfully. Token has been invalidated.');
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.forgotPassword(req.body);
    success(res, 'If the email exists, a reset token has been sent');
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.resetPassword(req.body);
    success(res, 'Password reset successful');
  } catch (err) {
    if ((err as { status?: number }).status) error(res, (err as Error).message, (err as { status: number }).status);
    else next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = authService.getMe(req.user!);
    success(res, 'Current user', { user });
  } catch (err) {
    next(err);
  }
};
