import api from "./axios"
import type { ApiResponse, Registration } from "@/constants/types"

function mapRegistration(r: any): Registration {
  return {
    id: r._id || r.id,
    eventId: r.eventId?._id || r.eventId,
    userId: r.userId?._id || r.userId,
    ticketNumber: r.ticketNumber,
    qrValue: r.qrCode || r.qrValue || "",
    status: r.status || "CONFIRMED",
    attendance: r.attendance || "NOT_MARKED",
    registeredAt: r.createdAt || r.registeredAt || r.createdAt,
  }
}

export async function registerForEvent(eventId: string, userId: string) {
  const res = await api.post<ApiResponse<{ registration: any }>>(`/api/registrations/${eventId}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapRegistration(res.data.data.registration),
  }
}

export async function cancelRegistration(eventId: string, userId: string) {
  const res = await api.delete<ApiResponse<{}>>(`/api/registrations/${eventId}`)
  return { success: res.data.success, message: res.data.message, data: null }
}

export async function getMyRegistrations(userId: string) {
  const res = await api.get<ApiResponse<{ registrations: any[] }>>("/api/registrations/my-events")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.registrations || []).map(mapRegistration),
  }
}

export async function getEventRegistrations(eventId: string) {
  const res = await api.get<ApiResponse<{ registrations: any[] }>>(`/api/organizer/registrations/${eventId}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.registrations || []).map(mapRegistration),
  }
}

export async function getTicket(registrationId: string) {
  const res = await api.get<ApiResponse<{ registration: any }>>(`/api/registrations/ticket/${registrationId}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapRegistration(res.data.data.registration),
  }
}
