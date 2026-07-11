import { Document, Types } from 'mongoose';
import { Request } from 'express';

// Role types
export type RoleName = 'USER' | 'ORGANIZER' | 'ADMIN';

export interface IRole extends Document {
  name: RoleName;
}

// Organization sub-document
export interface IOrganization {
  name?: string;
  verified?: boolean;
}

// Event status
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

// Event category
export type EventCategory =
  | 'TECH'
  | 'BUSINESS'
  | 'EDUCATION'
  | 'CULTURE'
  | 'SPORTS'
  | 'COMMUNITY'
  | 'OTHER';

// Registration status
export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED';

// Attendance status
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

// Notification type
export type NotificationType =
  | 'REGISTRATION'
  | 'REMINDER'
  | 'EVENT_UPDATE'
  | 'CERTIFICATE'
  | 'GENERAL';

// User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  roleId: Types.ObjectId | IRole;
  organization?: IOrganization;
  isBlocked: boolean;
  lastLogoutAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(roleName?: string): SafeUser;
}

export interface SafeUser {
  id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  organization?: IOrganization;
  isBlocked: boolean;
  createdAt: Date;
}

// Event document
export interface IEvent extends Document {
  title: string;
  description?: string;
  category: EventCategory;
  venue: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  capacity: number;
  bannerUrl?: string;
  status: EventStatus;
  organizerId: Types.ObjectId;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Registration document
export interface IRegistration extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  ticketNumber: string;
  qrCode?: string;
  status: RegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance document
export interface IAttendance extends Document {
  registrationId: Types.ObjectId;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  status: AttendanceStatus;
  checkedInAt: Date;
  checkedInBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Certificate document
export interface ICertificate extends Document {
  attendanceId: Types.ObjectId;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  certificateId: string;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Feedback document
export interface IFeedback extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification document
export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  sentBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics document
export interface IAnalytics extends Document {
  eventId: Types.ObjectId;
  views: number;
  registrations: number;
  attendance: number;
  ratingSum: number;
  ratingCount: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Express request with auth
export interface AuthRequest extends Request {
  user?: any;
  role?: RoleName;
}

// Service error
export interface ServiceError extends Error {
  status?: number;
  errors?: string[];
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

// Analytics summary
export interface AnalyticsSummary {
  totalEvents: number;
  views: number;
  registrations: number;
  attendance: number;
  averageRating: number;
}

// Request log document
export interface IRequestLog extends Document {
  method: string;
  url: string;
  statusCode: number;
  ip: string;
  userAgent: string;
  userId?: Types.ObjectId;
  userName?: string;
  userRole?: string;
  duration: number;
  contentLength?: number;
  isAdminRoute?: boolean;
  createdAt: Date;
}
