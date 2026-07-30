"use client"

import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2 } from "lucide-react"
import { BrandMark } from "@/components/common/BrandMark"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { login, clearError } from "@/features/auth/authSlice"
import { pushToast } from "@/features/toast/toastSlice"
import {
  Button,
  Input,
  PasswordInput,
  Card,
  Eyebrow,
} from "@/components/common/ui"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"
import { HeroMapBackdrop } from "@/components/landing/HeroMapBackdrop"

const perks = [
  "Real-time QR check-in at every event",
  "Certificates the moment you're marked present",
  "One dashboard for tickets, chats & follow-ups",
]

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
      dispatch(
        pushToast({
          type: "success",
          message: `Welcome back, ${result.payload.user.name}!`,
        }),
      )
    }
  }

  return (
    <main className="theme-landing grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <div className="relative hidden overflow-hidden border-r border-border bg-card/40 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          className="bg-grid pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        />
        <HeroMapBackdrop />

        <Link to="/" className="relative z-10 flex items-center">
          <BrandMark iconClassName="size-9" textClassName="text-xl" />
        </Link>

        <div className="relative z-10">
          <Eyebrow>events · tickets · certificates</Eyebrow>
          <h2
            className="display mt-6 max-w-md text-4xl !normal-case text-foreground xl:text-5xl"
            style={{ letterSpacing: "-0.03em", lineHeight: 0.95 }}
          >
            Real events, <span className="text-primary">real community.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            Sign in to pick up where you left off — saved events, tickets, and
            the communities you're part of.
          </p>
          <div className="mt-8 flex flex-col gap-2.5">
            {perks.map((perk) => (
              <p
                key={perk}
                className="flex items-center gap-2.5 text-sm text-foreground"
              >
                <CheckCircle2
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {perk}
              </p>
            ))}
          </div>
        </div>

        <p className="relative z-10 font-mono text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} EventHub
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-12 lg:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden">
          <div
            className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.16] blur-3xl"
            aria-hidden="true"
          />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <Link to="/" className="flex items-center">
              <BrandMark iconClassName="size-9" textClassName="text-2xl" />
            </Link>
            <p className="font-mono text-xs text-muted-foreground">
              sign in to continue
            </p>
          </div>

          <Card className="p-6 shadow-[0_0_60px_-25px_var(--primary)] sm:p-8 lg:border-none lg:shadow-none">
            <h1
              className="display !normal-case mb-6 text-2xl text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              Welcome back.
            </h1>

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

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
              noValidate
            >
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <PasswordInput
                id="password"
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
                <div
                  className="my-6 flex items-center gap-3"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    or
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <GoogleSignInButton />
              </>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </main>
  )
}
