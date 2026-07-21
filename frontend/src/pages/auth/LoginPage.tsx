"use client"

import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarRange } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { login, clearError } from "@/features/auth/authSlice"
import { pushToast } from "@/features/toast/toastSlice"
import { Button, Input, Card } from "@/components/common/ui"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"

const clerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormValues = z.infer<typeof schema>

function dashboardPathFor(role: string) {
  if (role === "ADMIN") return "/admin"
  if (role === "ORGANIZER") return "/organizer"
  return "/user"
}

const rolePrefix: Record<string, string> = {
  USER: "/user",
  ORGANIZER: "/organizer",
  ADMIN: "/admin",
}

function safeRedirect(from: string | undefined, role: string) {
  if (!from) return dashboardPathFor(role)
  const dashboardPrefixes = Object.values(rolePrefix)
  const isDashboardPath = dashboardPrefixes.some((p) => from.startsWith(p))
  if (isDashboardPath && !from.startsWith(rolePrefix[role] ?? "")) {
    return dashboardPathFor(role)
  }
  return from
}

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, error } = useAppSelector((s) => s.auth)
  const [unverifiedRedirect, setUnverifiedRedirect] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string } | null)?.from
      navigate(safeRedirect(from, user.role), { replace: true })
    }
  }, [user, navigate, location.state])

  useEffect(() => {
    if (error && error.toLowerCase().includes("not verified")) {
      setUnverifiedRedirect(true)
      const timer = setTimeout(() => {
        dispatch({ type: "auth/clearError" })
        navigate("/", { replace: true })
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [error, navigate, dispatch])

  const onSubmit = async (values: FormValues) => {
    const result = await dispatch(login(values))
    if (login.fulfilled.match(result)) {
      dispatch(pushToast({ type: "success", message: `Welcome back, ${result.payload.user.name}!` }))
    }
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
          <p className="font-mono text-xs text-muted-foreground">sign in to continue</p>
        </div>

        <Card className="p-6 sm:p-8">
          <h1 className="display mb-6 text-2xl text-foreground">Welcome back.</h1>

          {error && (
            <div
              role="alert"
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                error.toLowerCase().includes("not verified")
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <p className="font-semibold">{error}</p>
              {unverifiedRedirect && (
                <p className="mt-1 text-xs opacity-80">
                  Redirecting to home page in a few seconds...
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Sign in
            </Button>
          </form>

          {clerkEnabled && (
            <>
              <div className="my-6 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleSignInButton />
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
