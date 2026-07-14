import api from "./axios"
import type { ApiResponse, PaymentIntegration, RazorpayOrder, RegistrationWithDetails } from "@/constants/types"

export async function getPaymentIntegration() {
  const res = await api.get<ApiResponse<{ integration: PaymentIntegration | null }>>("/api/payments/integration")
  return {
    success: res.data.success,
    data: res.data.data.integration,
  }
}

export async function savePaymentIntegration(payload: { razorpayKeyId: string; razorpayKeySecret: string }) {
  const res = await api.post<ApiResponse<{ integration: PaymentIntegration }>>("/api/payments/integration", payload)
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data.integration,
  }
}

export async function deletePaymentIntegration() {
  const res = await api.delete<ApiResponse<{ deleted: boolean }>>("/api/payments/integration")
  return {
    success: res.data.success,
    message: res.data.message,
  }
}

export async function createRazorpayOrder(eventId: string) {
  const res = await api.post<ApiResponse<RazorpayOrder>>(`/api/payments/create-order/${eventId}`)
  return {
    success: res.data.success,
    data: res.data.data,
  }
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  registrationId: string
}) {
  const res = await api.post<ApiResponse<{ verified: boolean; registration: any }>>("/api/payments/verify", payload)
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}

export async function confirmPaymentSuccess(eventId: string) {
  const res = await api.post<ApiResponse<{ registration: any }>>(`/api/registrations/${eventId}/payment-success`)
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data,
  }
}
