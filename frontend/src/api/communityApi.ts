import api from "./axios"
import type { ApiResponse, Community, CommunityMember, CommunityChatData } from "@/constants/types"

export async function getOrganizerCommunities() {
  const res = await api.get<ApiResponse<{ communities: any[] }>>("/api/communities/organizer/list")
  return { success: res.data.success, message: res.data.message, data: (res.data.data.communities || []).map(mapCommunity) }
}

export async function createCommunity(eventId: string, name: string, description = "") {
  const res = await api.post<ApiResponse<{ community: any }>>("/api/communities", { eventId, name, description })
  return { success: res.data.success, message: res.data.message, data: mapCommunity(res.data.data.community) }
}

export async function getUserCommunities() {
  const res = await api.get<ApiResponse<{ communities: any[] }>>("/api/communities/my")
  return { success: res.data.success, message: res.data.message, data: (res.data.data.communities || []).map(mapCommunity) }
}

export async function requestJoinCommunity(communityId: string) {
  const res = await api.post<ApiResponse<{ message: string }>>(`/api/communities/${communityId}/join`)
  return { success: res.data.success, message: res.data.message, data: res.data.data }
}

export async function getCommunityMembers(communityId: string, search = "") {
  const res = await api.get<ApiResponse<{ members: any[] }>>(`/api/communities/${communityId}/members`, {
    params: search ? { search } : {},
  })
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.members || []).map((m: any) => ({
      id: m._id || m.id,
      userId: m.userId,
      name: m.name,
      email: m.email,
      status: m.status,
      joinedAt: m.joinedAt,
      createdAt: m.createdAt,
    })),
  }
}

export async function approveMember(communityId: string, userId: string) {
  const res = await api.patch<ApiResponse<{ member: any }>>(`/api/communities/${communityId}/members/${userId}/approve`)
  return { success: res.data.success, message: res.data.message, data: res.data.data }
}

export async function denyMember(communityId: string, userId: string) {
  const res = await api.patch<ApiResponse<{ member: any }>>(`/api/communities/${communityId}/members/${userId}/deny`)
  return { success: res.data.success, message: res.data.message, data: res.data.data }
}

export async function removeMember(communityId: string, userId: string) {
  const res = await api.delete<ApiResponse<{}>>(`/api/communities/${communityId}/members/${userId}`)
  return { success: res.data.success, message: res.data.message }
}

export async function leaveCommunity(communityId: string) {
  const res = await api.post<ApiResponse<{}>>(`/api/communities/${communityId}/leave`)
  return { success: res.data.success, message: res.data.message }
}

export async function getCommunityChat(communityId: string) {
  const res = await api.get<ApiResponse<CommunityChatData>>(`/api/communities/${communityId}/chat`)
  return { success: res.data.success, message: res.data.message, data: res.data.data }
}

function mapCommunity(c: any): Community {
  return {
    id: c._id || c.id,
    eventId: c.eventId,
    organizerId: c.organizerId,
    name: c.name,
    description: c.description || "",
    createdAt: c.createdAt,
    memberCount: c.memberCount || 0,
    pendingCount: c.pendingCount,
    myStatus: c.myStatus ?? null,
  }
}
