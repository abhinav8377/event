import type { ApiResponse } from "@/constants/types"

// ---------------------------------------------------------------------------
// Mock transport layer. When the Express backend is ready, replace `respond`
// with real Axios calls (see axios.ts) — all feature APIs keep the same
// signatures and consistent { success, message, data } response shape.
// ---------------------------------------------------------------------------

const LATENCY = 350

export function respond<T>(data: T, message = "OK"): Promise<ApiResponse<T>> {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, message, data }), LATENCY),
  )
}

export function fail(message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), LATENCY),
  )
}

export function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`
}
