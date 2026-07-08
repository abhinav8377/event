import api from "./axios"
import type { ApiResponse } from "@/constants/types"

export async function verifyAttendance(qrOrTicket: string) {
  const res = await api.post<ApiResponse<{ attendance: string }>>("/api/attendance/verify", { registrationId: qrOrTicket })
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}

export async function manualCheckin(registrationId: string, status: "PRESENT" | "LATE" | "ABSENT") {
  const res = await api.post<ApiResponse<{ attendance: string }>>("/api/attendance/manual-checkin", { registrationId, status })
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}

export async function getEventAttendance(eventId: string) {
  const res = await api.get<ApiResponse<{ attendance?: any[] }>>(`/api/attendance/event/${eventId}`)
  const items: any[] = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.attendance || [])
  return {
    success: res.data.success,
    message: res.data.message,
    data: items.map((a: any) => ({
      id: a._id || a.id,
      registrationId: a.registrationId,
      eventId: a.eventId?._id || a.eventId,
      userId: a.userId?._id || a.userId,
      userName: a.userId?.name || "",
      userEmail: a.userId?.email || "",
      status: a.status,
      checkedInAt: a.checkedInAt || a.createdAt,
      checkedInBy: a.checkedInBy,
    })) as any[],
  }
}
