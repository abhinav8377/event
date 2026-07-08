import api from "./axios"
import type { ApiResponse, User } from "@/constants/types"

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

export async function updateProfile(input: { name?: string; organization?: string }) {
  const res = await api.patch<ApiResponse<{ user: any }>>("/api/users/profile", input)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapUser(res.data.data.user),
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await api.patch<ApiResponse<{}>>("/api/users/change-password", { currentPassword, newPassword })
  return res.data
}
