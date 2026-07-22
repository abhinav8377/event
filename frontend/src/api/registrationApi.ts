import api from "./axios"
import type { ApiResponse, Registration, RegistrationWithDetails } from "@/constants/types"

function mapRegistration(r: any): Registration {
  return {
    id: r._id || r.id,
    eventId: r.eventId?._id || r.eventId,
    userId: r.userId?._id || r.userId,
    ticketNumber: r.ticketNumber,
    qrValue: r.qrCode || r.qrValue || "",
    status: r.status || "CONFIRMED",
    attendance: r.attendance || "NOT_MARKED",
    registrantName: r.registrantName,
    registrantEmail: r.registrantEmail,
    registrantPhone: r.registrantPhone,
    registrantAge: r.registrantAge,
    registrantGender: r.registrantGender,
    registrantAltPhone: r.registrantAltPhone,
    registrantOrganization: r.registrantOrganization,
    registrantCountry: r.registrantCountry,
    registrantState: r.registrantState,
    registrantCity: r.registrantCity,
    registrantPincode: r.registrantPincode,
    registrantSocialLinks: r.registrantSocialLinks,
    registrantProfession: r.registrantProfession,
    registrantReason: r.registrantReason,
    registrantSpecialRequest: r.registrantSpecialRequest,
    registeredAt: r.createdAt || r.registeredAt || r.createdAt,
    eventTitle: r.eventId?.title,
    eventStartDate: r.eventId?.date || r.eventId?.startDate,
    eventEndDate: r.eventId?.endDate,
    eventBanner: r.eventId?.bannerUrl || r.eventId?.banner,
    eventVenue: r.eventId?.venue,
    eventCity: r.eventId?.city,
    eventMode: r.eventId?.mode,
  }
}

function mapRegistrationWithDetails(r: any): RegistrationWithDetails {
  return {
    id: r._id || r.id,
    eventId: r.eventId,
    userId: r.userId,
    ticketNumber: r.ticketNumber,
    qrValue: r.qrCode || r.qrValue || "",
    status: r.status || "CONFIRMED",
    attendance: r.attendance || "NOT_MARKED",
    registrantName: r.registrantName,
    registrantEmail: r.registrantEmail,
    registrantPhone: r.registrantPhone,
    registrantAge: r.registrantAge,
    registrantGender: r.registrantGender,
    registrantAltPhone: r.registrantAltPhone,
    registrantOrganization: r.registrantOrganization,
    registrantCountry: r.registrantCountry,
    registrantState: r.registrantState,
    registrantCity: r.registrantCity,
    registrantPincode: r.registrantPincode,
    registrantSocialLinks: r.registrantSocialLinks,
    registrantProfession: r.registrantProfession,
    registrantReason: r.registrantReason,
    registrantSpecialRequest: r.registrantSpecialRequest,
    paymentId: r.paymentId,
    paymentAmount: r.paymentAmount,
    paymentStatus: r.paymentStatus,
    registeredAt: r.createdAt || r.registeredAt,
  }
}

export async function registerForEvent(
  eventId: string,
  userId: string,
  registrantDetails?: {
    name?: string
    email?: string
    phone?: string
    age?: number
    gender?: string
    altPhone?: string
    organization?: string
    country?: string
    state?: string
    city?: string
    pincode?: string
    socialLinks?: string
    profession?: string
    reason?: string
    specialRequest?: string
  },
) {
  const res = await api.post<ApiResponse<{ registration: any; isPaid: boolean; eventTitle: string; eventPrice: number }>>(
    `/api/registrations/${eventId}`,
    registrantDetails || {},
  )
  return {
    success: res.data.success,
    message: res.data.message,
    data: {
      ...mapRegistration(res.data.data.registration),
      isPaid: res.data.data.isPaid,
      eventTitle: res.data.data.eventTitle,
      eventPrice: res.data.data.eventPrice,
    },
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

export async function getAllRegistrations(eventId?: string) {
  const params = eventId ? `?eventId=${eventId}` : ""
  const res = await api.get<ApiResponse<{ registrations: any[] }>>(`/api/organizer/all-registrations${params}`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: (res.data.data.registrations || []).map(mapRegistrationWithDetails),
  }
}

export async function allowRegistration(registrationId: string) {
  const res = await api.patch<ApiResponse<{ registration: any }>>(`/api/registrations/${registrationId}/allow`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: mapRegistration(res.data.data.registration),
  }
}

export async function denyRegistration(registrationId: string) {
  const res = await api.patch<ApiResponse<{ deleted: boolean }>>(`/api/registrations/${registrationId}/deny`)
  return {
    success: res.data.success,
    message: res.data.message,
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
