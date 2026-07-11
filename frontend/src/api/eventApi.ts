import api from "./axios"
import type { ApiResponse, EventItem, EventStatus } from "@/constants/types"

export async function uploadBannerImage(file: File) {
  const form = new FormData()
  form.append("banner", file)
  const res = await api.post<ApiResponse<{ url: string }>>("/api/events/upload-banner", form)
  return {
    success: res.data.success,
    message: res.data.message,
    url: res.data.data.url,
  }
}

export interface EventFilters {
  search?: string
  category?: string
  mode?: string
  city?: string
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

const CATEGORY_REVERSE: Record<string, string> = {
  Technology: "TECH",
  Business: "BUSINESS",
  Education: "EDUCATION",
  Arts: "CULTURE",
  Sports: "SPORTS",
  Community: "COMMUNITY",
}

function mapEvent(e: any): EventItem {
  if (!e) return {} as EventItem
  const cat = CATEGORY_MAP[e.category] || e.category || "Community"
  return {
    id: e._id || e.id,
    title: e.title,
    description: e.description || "",
    longDescription: e.longDescription || "",
    category: cat as EventItem["category"],
    mode: (e.mode || "IN_PERSON") as EventItem["mode"],
    status: (e.status || "DRAFT") as EventStatus,
    banner: e.bannerUrl || e.banner || "/placeholder.svg",
    venue: e.venue || "",
    city: e.city || "",
    latitude: e.latitude ?? null,
    longitude: e.longitude ?? null,
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

export async function getEvents(filters: EventFilters = {}) {
  const params: Record<string, string> = {}
  if (filters.search) params.search = filters.search
  if (filters.category && filters.category !== "All") params.category = CATEGORY_REVERSE[filters.category] || filters.category
  const res = await api.get<ApiResponse<{ events: any[]; total: number }>>("/api/events", { params })
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.events || []).map(mapEvent),
  }
}

export async function getEventById(id: string) {
  const res = await api.get<ApiResponse<{ event: any }>>(`/api/events/${id}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapEvent(res.data.data.event),
  }
}

export async function getUpcomingEvents() {
  const res = await api.get<ApiResponse<{ events: any[] }>>("/api/events/upcoming")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.events || []).map(mapEvent),
  }
}

export async function getPopularEvents() {
  const res = await api.get<ApiResponse<{ events: any[] }>>("/api/events/popular")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.events || []).map(mapEvent).slice(0, 3),
  }
}

export async function getOrganizerEvents(organizerId: string) {
  const res = await api.get<ApiResponse<{ events: any[] }>>("/api/organizer/events")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.events || []).map(mapEvent),
  }
}

export async function createEvent(organizerId: string, organizerName: string, input: Partial<EventItem>) {
  const body: Record<string, any> = {
    title: input.title,
    description: input.description,
    longDescription: input.longDescription,
    category: CATEGORY_REVERSE[input.category || ""] || "OTHER",
    mode: input.mode || "IN_PERSON",
    venue: input.venue,
    city: input.city,
    latitude: input.latitude,
    longitude: input.longitude,
    date: input.startDate,
    endDate: input.endDate,
    startTime: input.startDate ? new Date(input.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) : undefined,
    endTime: input.endDate ? new Date(input.endDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) : undefined,
    capacity: input.capacity,
    price: input.price,
    bannerUrl: input.banner,
    tags: input.tags,
  }
  const res = await api.post<ApiResponse<{ event: any }>>("/api/events", body)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapEvent(res.data.data.event),
  }
}

export async function updateEvent(id: string, input: Partial<EventItem>) {
  const body: Record<string, any> = {}
  if (input.title !== undefined) body.title = input.title
  if (input.description !== undefined) body.description = input.description
  if (input.longDescription !== undefined) body.longDescription = input.longDescription
  if (input.category !== undefined) body.category = CATEGORY_REVERSE[input.category] || input.category
  if (input.mode !== undefined) body.mode = input.mode
  if (input.venue !== undefined) body.venue = input.venue
  if (input.city !== undefined) body.city = input.city
  if (input.latitude !== undefined) body.latitude = input.latitude
  if (input.longitude !== undefined) body.longitude = input.longitude
  if (input.startDate !== undefined) body.date = input.startDate
  if (input.endDate !== undefined) body.endDate = input.endDate
  if (input.capacity !== undefined) body.capacity = input.capacity
  if (input.price !== undefined) body.price = input.price
  if (input.banner !== undefined) body.bannerUrl = input.banner
  if (input.tags !== undefined) body.tags = input.tags
  const res = await api.patch<ApiResponse<{ event: any }>>(`/api/events/${id}`, body)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapEvent(res.data.data.event),
  }
}

export async function setEventStatus(id: string, status: EventStatus) {
  const endpoint = status === "PUBLISHED" ? "publish" : "cancel"
  const res = await api.patch<ApiResponse<{ event: any }>>(`/api/events/${id}/${endpoint}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapEvent(res.data.data.event),
  }
}

export async function deleteEvent(id: string) {
  const res = await api.delete<ApiResponse<{}>>(`/api/events/${id}`)
  return { success: res.data.success, message: res.data.message, data: id }
}
