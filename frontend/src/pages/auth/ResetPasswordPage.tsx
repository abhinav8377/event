"use client"

import { useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { CalendarRange, Lock, CheckCircle } from "lucide-react"
import { resetPassword } from "@/api/authApi"
import { Button, Input, Card } from "@/components/common/ui"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setError("")
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || (err as Error).message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative w-full max-w-md">
          <Card className="p-6 sm:p-8 text-center">
            <h1 className="text-xl font-bold text-foreground">Invalid reset link</h1>
            <p className="mt-2 text-sm text-muted-foreground">This link is missing or invalid.</p>
            <Link to="/forgot-password" className="mt-4 inline-block font-semibold text-primary hover:underline">
              Request a new reset link
            </Link>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <CalendarRange className="size-8" aria-hidden="true" />
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              Event<span className="text-primary">Hub</span>
            </span>
          </Link>
          <p className="font-mono text-xs text-muted-foreground">set a new password</p>
        </div>

        <Card className="p-6 sm:p-8">
          {done ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="size-12 text-success" />
              <h1 className="text-xl font-bold text-foreground">Password changed</h1>
              <p className="text-sm text-muted-foreground">
                Your password has been reset successfully.
              </p>
              <Button className="mt-2 w-full" onClick={() => navigate("/login")}>
                Sign in with new password
              </Button>
            </div>
          ) : (
            <>
              <h1 className="display mb-1 text-2xl text-foreground">Reset password</h1>
              <p className="mb-6 text-sm text-muted-foreground">Enter your new password below.</p>

              {error && (
                <div role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  id="new-password"
                  type="password"
                  label="New password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Input
                  id="confirm-password"
                  type="password"
                  label="Confirm new password"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <Button type="submit" loading={loading} className="mt-2 w-full">
                  <Lock className="size-4" />
                  Change password
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
