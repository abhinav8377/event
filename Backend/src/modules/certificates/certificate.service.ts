import crypto from 'crypto';
import Certificate from './certificate.model.js';
import Attendance from '../attendance/attendance.model.js';
import Event from '../events/event.model.js';
import * as notificationService from '../notifications/notification.service.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const generateCertificates = async (eventId: string, userId: string, role: string) => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (role !== 'ADMIN' && String(event.organizerId) !== String(userId)) throwErr('Forbidden', 403);

  const attendances = await Attendance.find({
    eventId: event._id,
    status: { $in: ['PRESENT', 'LATE'] },
  });

  let created = 0;
  for (const attendance of attendances) {
    const exists = await Certificate.findOne({ attendanceId: attendance._id });
    if (exists) continue;
    const cert = await Certificate.create({
      attendanceId: attendance._id,
      userId: attendance.userId,
      eventId: event._id,
      certificateId: `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    });
    created += 1;
    notificationService
      .notify({
        userId: attendance.userId as unknown as string,
        title: 'Certificate Ready',
        message: `Your certificate for "${event.title}" is ready to download. ID: ${cert.certificateId}`,
        type: 'CERTIFICATE',
      })
      .catch(() => {});
  }

  return { generated: created, totalEligible: attendances.length };
};

export const autoGenerateCertificatesForEvent = async (eventId: string) => {
  const event = await Event.findById(eventId);
  if (!event) return { generated: 0, totalEligible: 0 };

  const attendances = await Attendance.find({
    eventId: event._id,
    status: { $in: ['PRESENT', 'LATE'] },
  });

  let created = 0;
  for (const attendance of attendances) {
    const exists = await Certificate.findOne({ attendanceId: attendance._id });
    if (exists) continue;
    const cert = await Certificate.create({
      attendanceId: attendance._id,
      userId: attendance.userId,
      eventId: event._id,
      certificateId: `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    });
    created += 1;
    notificationService
      .notify({
        userId: attendance.userId as unknown as string,
        title: 'Certificate Ready',
        message: `Your certificate for "${event.title}" is ready to download. ID: ${cert.certificateId}`,
        type: 'CERTIFICATE',
      })
      .catch(() => {});
  }

  return { generated: created, totalEligible: attendances.length };
};

export const getMyCertificates = async (userId: string) => {
  return Certificate.find({ userId })
    .populate('eventId', 'title date')
    .sort({ issuedAt: -1 });
};

export const getCertificateById = async (certId: string, userId: string, role: string) => {
  const cert = await Certificate.findById(certId)
    .populate('userId', 'name')
    .populate('eventId', 'title date organizerId');
  if (!cert) throwErr('Certificate not found', 404);

  const isOwner = String((cert.userId as any)._id) === String(userId);
  const isOrganizer = String((cert.eventId as any).organizerId) === String(userId);
  if (!isOwner && !isOrganizer && role !== 'ADMIN') throwErr('Forbidden', 403);

  return cert;
};
