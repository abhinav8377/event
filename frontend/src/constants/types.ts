export type Role = "USER" | "ORGANIZER" | "ADMIN"

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED"
export type EventCategory =
  | "Technology"
  | "Business"
  | "Education"
  | "Health"
  | "Arts"
  | "Sports"
  | "Community"
export type EventMode = "IN_PERSON" | "ONLINE" | "HYBRID"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  organization?: string
  verified?: boolean
  blocked?: boolean
  joinedAt: string
}

export interface EventItem {
  id: string
  title: string
  description: string
  longDescription: string
  category: EventCategory
  mode: EventMode
  status: EventStatus
  banner: string
  venue: string
  city: string
  startDate: string
  endDate: string
  capacity: number
  registeredCount: number
  attendanceCount: number
  views: number
  price: number
  rating: number
  ratingCount: number
  organizerId: string
  organizerName: string
  organizerVerified: boolean
  tags: string[]
}

export type RegistrationStatus = "CONFIRMED" | "CANCELLED" | "WAITLISTED"
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "NOT_MARKED"

export interface Registration {
  id: string
  eventId: string
  userId: string
  ticketNumber: string
  qrValue: string
  status: RegistrationStatus
  attendance: AttendanceStatus
  registeredAt: string
}

export interface Certificate {
  id: string
  eventId: string
  eventTitle: string
  userId: string
  userName: string
  issuedAt: string
  certificateNumber: string
}

export type NotificationType =
  | "REGISTRATION"
  | "REMINDER"
  | "UPDATE"
  | "CERTIFICATE"

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface Feedback {
  id: string
  eventId: string
  userId: string
  userName: string
  rating: number
  review: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
