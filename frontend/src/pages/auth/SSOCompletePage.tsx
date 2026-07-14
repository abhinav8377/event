import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import { useAppDispatch } from "@/app/store"
import { loginWithClerk } from "@/features/auth/authSlice"
import { pushToast } from "@/features/toast/toastSlice"
import { Loader } from "@/components/common/ui"

function dashboardPathFor(role: string) {
  if (role === "ADMIN") return "/admin"
  if (role === "ORGANIZER") return "/organizer"
  return "/user"
}

export default function SSOCompletePage() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const handled = useRef(false)

  useEffect(() => {
    if (!isLoaded || handled.current) return
    handled.current = true

    ;(async () => {
      if (!isSignedIn) {
        navigate("/login", { replace: true })
        return
      }
      try {
        const clerkToken = await getToken()
        if (!clerkToken) throw new Error("No session token")

        const result = await dispatch(loginWithClerk(clerkToken))
        if (loginWithClerk.fulfilled.match(result)) {
          dispatch(pushToast({ type: "success", message: `Welcome, ${result.payload.user.name}!` }))
          navigate(dashboardPathFor(result.payload.user.role), { replace: true })
        } else {
          const msg = (result.payload as string) || "Google sign-in failed. Please try again."
          dispatch(pushToast({ type: "error", message: msg }))
          await signOut()
          navigate("/login", { replace: true })
        }
      } catch {
        dispatch(pushToast({ type: "error", message: "Google sign-in failed. Please try again." }))
        await signOut().catch(() => {})
        navigate("/login", { replace: true })
      }
    })()
  }, [isLoaded, isSignedIn, getToken, signOut, dispatch, navigate])

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Loader label="Completing sign-in..." />
    </main>
  )
}
