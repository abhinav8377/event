import api from "./axios"
import type { ApiResponse, Certificate } from "@/constants/types"

function mapCertificate(c: any): Certificate {
  return {
    id: c._id || c.id,
    eventId: c.eventId?._id || c.eventId,
    eventTitle: c.eventId?.title || c.eventTitle || "",
    userId: c.userId?._id || c.userId,
    userName: c.userId?.name || c.userName || "",
    issuedAt: c.issuedAt || c.createdAt,
    certificateNumber: c.certificateId || c.certificateNumber,
  }
}

export async function getMyCertificates(userId: string) {
  const res = await api.get<ApiResponse<{ certificates?: any[] }>>("/api/certificates/my-certificates")
  const items: any[] = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.certificates || [])
  return {
    success: res.data.success,
    message: res.data.message,
    data: items.map(mapCertificate),
  }
}

export async function getAllCertificates() {
  const res = await api.get<ApiResponse<{ certificates?: any[] }>>("/api/certificates/my-certificates")
  const items: any[] = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.certificates || [])
  return {
    success: res.data.success,
    message: res.data.message,
    data: items.map(mapCertificate),
  }
}

export async function downloadCertificate(id: string) {
  const res = await api.get(`/api/certificates/download/${id}`, { responseType: "blob" })
  return res.data
}

export async function generateCertificates(eventId: string) {
  const res = await api.post<ApiResponse<{ generated: number; totalEligible: number }>>(`/api/certificates/generate/${eventId}`)
  return res.data
}
