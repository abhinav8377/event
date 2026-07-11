import api from "./axios"
import type { ApiResponse, NotificationType, SentNotification } from "@/constants/types"

export async function getOrganizerEvents() {
  const res = await api.get<ApiResponse<{ events: any[] }>>("/api/organizer/notifications/events")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.events || []).map((e: any) => ({
      id: e._id || e.id,
      title: e.title,
      date: e.date,
      startTime: e.startTime || "",
      venue: e.venue || "",
      city: e.city || "",
      status: e.status,
    })),
  }
}

export async function sendOrganizerNotification(payload: {
  eventId: string
  title: string
  message: string
  type?: NotificationType
}) {
  const res = await api.post<ApiResponse<{ sent: number; eventTitle: string }>>(
    "/api/organizer/notifications/send",
    {
      eventId: payload.eventId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "EVENT_UPDATE",
    },
  )
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}

export async function getSentOrganizerNotifications() {
  const res = await api.get<ApiResponse<{ notifications: any[] }>>("/api/organizer/notifications/sent")
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
