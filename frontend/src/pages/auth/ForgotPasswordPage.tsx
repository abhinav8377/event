"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { forgotPassword } from "@/api/authApi"
import { Button, Input, Card } from "@/components/common/ui"
import { BrandMark } from "@/components/common/BrandMark"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || (err as Error).message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="theme-landing relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.16] blur-3xl"
          aria-hidden="true"
        />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/" className="flex items-center">
            <BrandMark iconClassName="size-9" textClassName="text-2xl" />
          </Link>
          <p className="font-mono text-xs text-muted-foreground">reset your password</p>
        </div>

        <Card className="p-6 shadow-[0_0_60px_-25px_var(--primary)] sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="size-12 text-success" />
              <h1 className="text-xl font-bold text-foreground">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-semibold text-foreground">{email}</span>,
                we&apos;ve sent a password reset link.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => { setSent(false); setError("") }}
                  className="font-semibold text-primary hover:underline"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </Link>
              <h1
                className="display !normal-case mb-1 text-2xl text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                Forgot password?
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Button type="submit" loading={loading} className="mt-2 w-full">
                  <Mail className="size-4" />
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
