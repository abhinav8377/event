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
  latitude: number | null
  longitude: number | null
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
  organizerOrganization?: string
  organizerVerified: boolean
  tags: string[]
}

export type RegistrationStatus = "CONFIRMED" | "CANCELLED" | "WAITLISTED" | "PENDING" | "ALLOWED" | "PAYMENT_PENDING" | "DENIED"
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "NOT_MARKED"

export interface Registration {
  id: string
  eventId: string
  userId: string
  ticketNumber: string
  qrValue: string
  status: RegistrationStatus
  attendance: AttendanceStatus
  registrantName?: string
  registrantEmail?: string
  registrantPhone?: string
  registrantAge?: number
  registrantGender?: string
  registrantAltPhone?: string
  registrantOrganization?: string
  registrantCountry?: string
  registrantState?: string
  registrantCity?: string
  registrantPincode?: string
  registrantSocialLinks?: string
  registrantProfession?: string
  registrantReason?: string
  registrantSpecialRequest?: string
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
  | "GENERAL"

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface SentNotification {
  title: string
  message: string
  type: NotificationType
  createdAt: string
  recipientCount: number
  recipients: { name: string; email: string }[]
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

export interface RequestLog {
  _id: string
  method: string
  url: string
  statusCode: number
  ip: string
  userAgent: string
  userId?: string
  userName?: string
  userRole?: string
  duration: number
  contentLength: number
  isAdminRoute: boolean
  createdAt: string
}

export interface LogStats {
  totalLogs: number
  last24h: number
  last1h: number
  methodBreakdown: { method: string; count: number }[]
  statusBreakdown: { group: string; count: number }[]
  topEndpoints: { url: string; count: number; avgDuration: number }[]
  activeUsers: { userId: string; userName: string; userRole: string; requestCount: number }[]
}

export interface LogPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaymentIntegration {
  id: string
  organizerId: string
  razorpayKeyId: string
  razorpayKeySecret: string
  isActive: boolean
  createdAt: string
}

export interface RazorpayOrder {
  orderId: string
  amount: number
  currency: string
  keyId: string
  eventName: string
  eventPrice: number
}

export type CommunityMemberStatus = "PENDING" | "APPROVED" | "DENIED"

export interface Community {
  id: string
  eventId: string | { _id: string; title: string; date: string; bannerUrl?: string }
  organizerId: string
  name: string
  description: string
  createdAt: string
  memberCount: number
  pendingCount?: number
  myStatus?: CommunityMemberStatus | null
}

export interface CommunityMember {
  id: string
  userId: string
  name: string
  email: string
  status: CommunityMemberStatus
  joinedAt?: string
  createdAt: string
  isOrganizer?: boolean
}

export interface CommunityMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  createdAt: string
  isOrganizer?: boolean
}

export interface CommunityChatData {
  community: Community
  members: { id: string; name: string; email: string }[]
  messages: CommunityMessage[]
}

export interface RegistrationWithDetails {
  id: string
  userId: string | { _id: string; name: string; email: string }
  eventId: string | { _id: string; title: string; date: string; venue: string; city: string; price: number }
  ticketNumber: string
  qrValue: string
  status: RegistrationStatus
  attendance: AttendanceStatus
  registrantName?: string
  registrantEmail?: string
  registrantPhone?: string
  registrantAge?: number
  registrantGender?: string
  registrantAltPhone?: string
  registrantOrganization?: string
  registrantCountry?: string
  registrantState?: string
  registrantCity?: string
  registrantPincode?: string
  registrantSocialLinks?: string
  registrantProfession?: string
  registrantReason?: string
  registrantSpecialRequest?: string
  paymentId?: string
  paymentAmount?: number
  paymentStatus?: string
  registeredAt: string
}
