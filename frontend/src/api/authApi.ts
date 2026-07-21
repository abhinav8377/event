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

export async function login(email: string, password: string) {
  const res = await api.post<ApiResponse<{ token: string; user: any }>>("/api/auth/login", { email, password })
  return {
    success: res.data.success,
    message: res.data.message,
    data: { user: mapUser(res.data.data.user), token: res.data.data.token },
  }
}

export async function register(input: {
  name: string
  email: string
  password: string
  role: "USER" | "ORGANIZER"
  organization?: string
}) {
  const res = await api.post<ApiResponse<{ token: string; user: any }>>("/api/auth/register", {
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
    organizationName: input.organization,
  })
  return {
    success: res.data.success,
    message: res.data.message,
    data: { user: mapUser(res.data.data.user), token: res.data.data.token },
  }
}

export async function clerkAuth(clerkToken: string) {
  const res = await api.post<ApiResponse<{ token: string; user: any }>>("/api/auth/clerk", { clerkToken })
  return {
    success: res.data.success,
    message: res.data.message,
    data: { user: mapUser(res.data.data.user), token: res.data.data.token },
  }
}

export async function logout() {
  const res = await api.post<ApiResponse<{}>>("/api/auth/logout")
  return res.data
}

export async function forgotPassword(email: string) {
  const res = await api.post<ApiResponse<{}>>("/api/auth/forgot-password", { email })
  return res.data
}

export async function resetPassword(token: string, password: string) {
  const res = await api.post<ApiResponse<{}>>("/api/auth/reset-password", { token, password })
  return res.data
}

export async function me(token: string) {
  const res = await api.get<ApiResponse<{ user: any }>>("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapUser(res.data.data.user),
  }
}
