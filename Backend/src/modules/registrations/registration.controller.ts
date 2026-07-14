import * as registrationService from './registration.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const b = req.body || {};
    const hasDetails = b.registrantName || b.registrantEmail || b.registrantPhone;
    const data = await registrationService.registerForEvent(
      String(req.params.eventId),
      String(req.user!._id),
      hasDetails
        ? {
            name: b.registrantName,
            email: b.registrantEmail,
            phone: b.registrantPhone,
            age: b.registrantAge,
            gender: b.registrantGender,
            altPhone: b.registrantAltPhone,
            organization: b.registrantOrganization,
            country: b.registrantCountry,
            state: b.registrantState,
            city: b.registrantCity,
            pincode: b.registrantPincode,
            socialLinks: b.registrantSocialLinks,
            profession: b.registrantProfession,
            reason: b.registrantReason,
            specialRequest: b.registrantSpecialRequest,
          }
        : undefined,
    );
    const message = data.isPaid
      ? 'Registration initiated — proceed to payment'
      : 'Registration submitted successfully. Pending organizer verification.';
    success(res, message, data, 201);
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

export const handlePaymentSuccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await registrationService.handlePaymentSuccess(String(req.params.eventId), String(req.user!._id));
    success(res, 'Payment processed and registration pending verification', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const allow = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await registrationService.allowRegistration(
      String(req.params.registrationId),
      String(req.user!._id),
      req.role!,
    );
    success(res, 'Registration confirmed — user has been notified via email', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const deny = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await registrationService.denyRegistration(
      String(req.params.registrationId),
      String(req.user!._id),
      req.role!,
    );
    success(res, 'Registration denied and removed', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
