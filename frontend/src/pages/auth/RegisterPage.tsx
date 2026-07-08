"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, User, Megaphone } from "lucide-react"
import clsx from "clsx"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { registerUser, clearError } from "@/features/auth/authSlice"
import { pushToast } from "@/features/toast/toastSlice"
import { Button, Input, Card } from "@/components/common/ui"

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    organization: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, loading, error } = useAppSelector((s) => s.auth)
  const [role, setRole] = useState<"USER" | "ORGANIZER">("USER")

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
      navigate(user.role === "ORGANIZER" ? "/organizer" : "/dashboard", { replace: true })
    }
  }, [user, navigate])

  const onSubmit = async (values: FormValues) => {
    const result = await dispatch(
      registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role,
        organization: role === "ORGANIZER" ? values.organization : undefined,
      }),
    )
    if (registerUser.fulfilled.match(result)) {
      dispatch(pushToast({ type: "success", message: "Account created successfully. Welcome to EventHub!" }))
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <CalendarDays className="size-8" aria-hidden="true" />
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              Event<span className="text-primary">Hub</span>
            </span>
          </Link>
          <p className="font-mono text-xs text-muted-foreground">create your account to get started</p>
        </div>

        <Card className="p-6 sm:p-8">
          <h1 className="display mb-6 text-2xl text-foreground">Join the hub.</h1>

          <div className="mb-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
            {(
              [
                { value: "USER", label: "Attendee", desc: "Discover and join events", icon: User },
                { value: "ORGANIZER", label: "Organizer", desc: "Host and manage events", icon: Megaphone },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={role === opt.value}
                onClick={() => setRole(opt.value)}
                className={clsx(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                  role === opt.value
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <opt.icon className={clsx("size-5", role === opt.value ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              id="name"
              label="Full name"
              placeholder="Jane Smith"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            {role === "ORGANIZER" && (
              <Input
                id="organization"
                label="Organization (optional)"
                placeholder="Acme Events Co."
                error={errors.organization?.message}
                {...register("organization")}
              />
            )}
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {"Already have an account? "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
