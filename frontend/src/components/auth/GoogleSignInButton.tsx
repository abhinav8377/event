import { useState } from "react"
import { useSignIn } from "@clerk/clerk-react"
import { Loader2 } from "lucide-react"
import { useAppDispatch } from "@/app/store"
import { pushToast } from "@/features/toast/toastSlice"

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

export default function GoogleSignInButton() {
  const { signIn, isLoaded } = useSignIn()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    if (!isLoaded || !signIn) return
    setLoading(true)
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/sso-complete`,
      })
    } catch (e: any) {
      setLoading(false)
      const msg =
        e?.errors?.[0]?.longMessage ||
        e?.errors?.[0]?.message ||
        "Could not start Google sign-in. Please try again."
      dispatch(pushToast({ type: "error", message: msg }))
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={!isLoaded || loading}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold tracking-tight text-foreground transition-all hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
      Continue with Google
    </button>
  )
}
