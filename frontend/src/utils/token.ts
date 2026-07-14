const TOKEN_KEY = "eventhub_token"
const BUFFER_MS = 60_000

interface JwtPayload {
  exp?: number
}

function decodePayload(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 - BUFFER_MS < Date.now()
}

export function getValidToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem("eventhub_user")
    return null
  }
  return token
}
