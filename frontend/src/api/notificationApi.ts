import api from "./axios"
import type { ApiResponse, AppNotification } from "@/constants/types"

function mapNotification(n: any): AppNotification {
  return {
    id: n._id || n.id,
    userId: n.userId?._id || n.userId,
    type: (n.type === "EVENT_UPDATE" ? "UPDATE" : n.type) as AppNotification["type"],
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt,
  }
}

export async function getNotifications(userId: string) {
  const res = await api.get<ApiResponse<{ notifications: any[]; unread: number }>>("/api/notifications")
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.notifications || []).map(mapNotification),
  }
}

export async function markRead(id: string) {
  const res = await api.patch<ApiResponse<{ notification: any }>>(`/api/notifications/read/${id}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapNotification(res.data.data.notification || res.data.data),
  }
}

export async function markAllRead(userId: string) {
  const res = await api.patch<ApiResponse<{}>>("/api/notifications/read-all")
  return { success: res.data.success, message: res.data.message, data: true }
}
