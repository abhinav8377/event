import * as paymentService from './payment.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const saveIntegration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpayKeyId, razorpayKeySecret } = req.body;
    if (!razorpayKeyId || !razorpayKeySecret) {
      error(res, 'Razorpay Key ID and Key Secret are required', 400);
      return;
    }
    const data = await paymentService.saveIntegration(String(req.user!._id), razorpayKeyId, razorpayKeySecret);
    success(res, 'Payment integration saved successfully', data);
  } catch (err) {
    next(err);
  }
};

export const getIntegration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await paymentService.getIntegration(String(req.user!._id));
    success(res, 'Payment integration fetched', data);
  } catch (err) {
    next(err);
  }
};

export const deleteIntegration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await paymentService.deleteIntegration(String(req.user!._id));
    success(res, 'Payment integration removed', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const data = await paymentService.createOrder(eventId, String(req.user!._id));
    success(res, 'Order created', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationId) {
      error(res, 'Missing payment verification parameters', 400);
      return;
    }
    const data = await paymentService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationId,
    });
    success(res, 'Payment verified successfully', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
