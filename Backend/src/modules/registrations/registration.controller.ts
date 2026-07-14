import * as registrationService from './registration.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const b = req.body || {};
    const hasDetails = b.registrantName || b.registrantEmail || b.registrantPhone || b.name || b.email || b.phone;
    const data = await registrationService.registerForEvent(
      String(req.params.eventId),
      String(req.user!._id),
      hasDetails
        ? {
            name: b.registrantName || b.name,
            email: b.registrantEmail || b.email,
            phone: b.registrantPhone || b.phone,
            age: b.registrantAge ?? b.age,
            gender: b.registrantGender || b.gender,
            altPhone: b.registrantAltPhone || b.altPhone,
            organization: b.registrantOrganization || b.organization,
            country: b.registrantCountry || b.country,
            state: b.registrantState || b.state,
            city: b.registrantCity || b.city,
            pincode: b.registrantPincode || b.pincode,
            socialLinks: b.registrantSocialLinks || b.socialLinks,
            profession: b.registrantProfession || b.profession,
            reason: b.registrantReason || b.reason,
            specialRequest: b.registrantSpecialRequest || b.specialRequest,
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
