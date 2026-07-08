import api from "./axios"
import type { ApiResponse, User, EventItem } from "@/constants/types"

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
