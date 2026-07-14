import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react"
import { Loader } from "@/components/common/ui"

export default function SSOCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/sso-complete"
        signUpFallbackRedirectUrl="/sso-complete"
      />
      <Loader label="Verifying your Google account..." />
    </main>
  )
}
