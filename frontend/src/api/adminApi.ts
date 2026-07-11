import api from "./axios"
import type { ApiResponse, User, EventItem, NotificationType, RequestLog, LogStats, LogPagination } from "@/constants/types"

function mapUser(u: any): User {
  return {
    id: u.id || u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    organization: u.organization?.name || u.organization || undefined,
    verified: u.organization?.verified ?? u.verified ?? undefined,
    blocked: u.isBlocked ?? u.blocked ?? false,
    joinedAt: u.createdAt || u.joinedAt,
  }
}

const CATEGORY_MAP: Record<string, string> = {
  TECH: "Technology",
  BUSINESS: "Business",
  EDUCATION: "Education",
  CULTURE: "Arts",
  SPORTS: "Sports",
  COMMUNITY: "Community",
  OTHER: "Community",
}

function mapEvent(e: any): EventItem {
  const cat = CATEGORY_MAP[e.category] || e.category || "Community"
  return {
    id: e._id || e.id,
    title: e.title,
    description: e.description || "",
    longDescription: e.longDescription || e.description || "",
    category: cat as EventItem["category"],
    mode: (e.mode || "IN_PERSON") as EventItem["mode"],
    status: e.status || "DRAFT",
    banner: e.bannerUrl || e.banner || "/placeholder.svg",
    venue: e.venue || "",
    city: e.city || "",
    startDate: e.date || e.startDate,
    endDate: e.endDate || e.date || e.startDate,
    capacity: e.capacity || 100,
    registeredCount: e.registeredCount || 0,
    attendanceCount: e.attendanceCount || 0,
    views: e.views || 0,
    price: e.price ?? 0,
    rating: e.rating || 0,
    ratingCount: e.ratingCount || 0,
    organizerId: e.organizerId?._id || e.organizerId || "",
    organizerName: e.organizerId?.name || e.organizerName || "",
    organizerVerified: e.organizerId?.organization?.verified ?? e.organizerVerified ?? false,
    tags: e.tags || [],
  }
}

export async function getAllUsers() {
  const res = await api.get<ApiResponse<{ users: any[] }>>("/api/admin/users")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.users || []).map(mapUser),
  }
}

export async function verifyOrganizer(id: string) {
  const res = await api.patch<ApiResponse<{ user: any }>>(`/api/admin/verify-organizer/${id}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapUser(res.data.data.user),
  }
}

export async function toggleBlockUser(id: string) {
  const res = await api.patch<ApiResponse<{ isBlocked: boolean }>>(`/api/admin/block-user/${id}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}

export async function getAdminStats() {
  const res = await api.get<ApiResponse<any>>("/api/admin/dashboard")
  return {
    success: res.data.success,
    message: res.data.message,
    data: {
      totalUsers: res.data.data.totalUsers || 0,
      totalOrganizers: res.data.data.totalOrganizers || 0,
      totalEvents: res.data.data.totalEvents || 0,
      publishedEvents: res.data.data.publishedEvents || 0,
      totalRegistrations: res.data.data.totalRegistrations || 0,
      certificatesIssued: res.data.data.certificatesIssued || 0,
    },
  }
}

export async function getAllEvents() {
  const res = await api.get<ApiResponse<{ events: any[] }>>("/api/admin/events")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.events || []).map(mapEvent),
  }
}

export async function adminDeleteEvent(id: string) {
  const res = await api.delete<ApiResponse<{}>>(`/api/admin/event/${id}`)
  return { success: res.data.success, message: res.data.message, data: id }
}

export async function getAllOrganizers() {
  const res = await api.get<ApiResponse<{ organizers: any[] }>>("/api/admin/organizers")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.organizers || []).map(mapUser),
  }
}

export async function sendAdminNotification(payload: {
  title: string
  message: string
  targetRole: "USER" | "ORGANIZER"
  type?: NotificationType
}) {
  const res = await api.post<ApiResponse<{ sent: number; targetRole: string }>>(
    "/api/admin/notifications",
    payload,
  )
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}

export async function getSentNotifications() {
  const res = await api.get<ApiResponse<{ notifications: any[] }>>("/api/admin/notifications/sent")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.notifications || []).map((n: any) => ({
      title: n.title,
      message: n.message,
      type: (n.type === "EVENT_UPDATE" ? "UPDATE" : n.type) as NotificationType,
      createdAt: n.createdAt,
      recipientCount: n.recipientCount,
      recipients: n.recipients || [],
    })),
  }
}

export async function getRequestLogs(params: {
  page?: number
  limit?: number
  method?: string
  statusCode?: number
  statusGroup?: string
  url?: string
  ip?: string
  startDate?: string
  endDate?: string
} = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.method) qs.set("method", params.method)
  if (params.statusCode) qs.set("statusCode", String(params.statusCode))
  if (params.statusGroup) qs.set("statusGroup", params.statusGroup)
  if (params.url) qs.set("url", params.url)
  if (params.ip) qs.set("ip", params.ip)
  if (params.startDate) qs.set("startDate", params.startDate)
  if (params.endDate) qs.set("endDate", params.endDate)

  const res = await api.get<ApiResponse<{ logs: any[]; pagination: LogPagination }>>(
    `/api/admin/logs?${qs.toString()}`,
  )
  return {
    success: res.data.success,
    message: res.data.message,
    data: {
      logs: (res.data.data.logs || []).map((l: any) => ({
        _id: l._id,
        method: l.method,
        url: l.url,
        statusCode: l.statusCode,
        ip: l.ip,
        userAgent: l.userAgent,
        userId: l.userId,
        userName: l.userName,
        userRole: l.userRole,
        duration: l.duration,
        contentLength: l.contentLength || 0,
        createdAt: l.createdAt,
      })),
      pagination: res.data.data.pagination,
    },
  }
}

export async function getLogStats() {
  const res = await api.get<ApiResponse<LogStats>>("/api/admin/logs/stats")
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}
