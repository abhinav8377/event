import api from "./axios"
import type { ApiResponse, Feedback } from "@/constants/types"

function mapFeedback(f: any): Feedback {
  return {
    id: f._id || f.id,
    eventId: f.eventId?._id || f.eventId,
    userId: f.userId?._id || f.userId,
    userName: f.userId?.name || f.userName || "Anonymous",
    rating: f.rating,
    review: f.review || "",
    createdAt: f.createdAt,
  }
}

export async function getEventFeedback(eventId: string) {
  const res = await api.get<ApiResponse<{ feedback: any[] }>>(`/api/feedback/${eventId}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.feedback || []).map(mapFeedback),
  }
}

export async function submitFeedback(input: {
  eventId: string
  userId: string
  userName: string
  rating: number
  review: string
}) {
  const res = await api.post<ApiResponse<{ feedback: any }>>(`/api/feedback/${input.eventId}`, {
    rating: input.rating,
    review: input.review,
  })
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapFeedback(res.data.data.feedback),
  }
}

export async function deleteFeedback(feedbackId: string) {
  const res = await api.delete<ApiResponse<{}>>(`/api/feedback/${feedbackId}`)
  return res.data
}
