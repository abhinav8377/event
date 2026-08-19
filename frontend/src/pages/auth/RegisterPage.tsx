"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Megaphone, CheckCircle2 } from "lucide-react"
import { BrandMark } from "@/components/common/BrandMark"
import clsx from "clsx"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { registerUser, clearError } from "@/features/auth/authSlice"
import { pushToast } from "@/features/toast/toastSlice"
import {
  Button,
  Input,
  PasswordInput,
  Card,
  Eyebrow,
} from "@/components/common/ui"
import { HeroMapBackdrop } from "@/components/landing/HeroMapBackdrop"

const perks = [
  "Free to join, free to explore",
  "Create and publish events in minutes",
  "QR check-in & certificates, built in",
]

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
      if (user.role === "ORGANIZER" && user.verified === false) {
        navigate("/verification-pending", { replace: true })
      } else {
        const path =
          user.role === "ORGANIZER"
            ? "/organizer"
            : user.role === "ADMIN"
              ? "/admin"
              : "/user"
        navigate(path, { replace: true })
      }
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
      if (role === "ORGANIZER") {
        localStorage.removeItem("eventhub_token")
        localStorage.removeItem("eventhub_user")
        dispatch({ type: "auth/logout" })
        navigate("/verification-pending", {
          state: { email: values.email, name: values.name },
          replace: true,
        })
      } else {
        dispatch(
          pushToast({
            type: "success",
            message: "Account created successfully. Welcome to EventHub!",
          }),
        )
      }
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
            Discover events,{" "}
            <span className="text-primary">or host your own.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            Join as an attendee to explore what's happening, or as an organizer
            to publish and run your own events.
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
              create your account to get started
            </p>
          </div>

          <Card className="p-6 shadow-[0_0_60px_-25px_var(--primary)] sm:p-8 lg:border-none lg:shadow-none">
            <h1
              className="display !normal-case mb-6 text-2xl text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              Join the hub.
            </h1>

            <div
              className="mb-6 grid grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Account type"
            >
              {(
                [
                  {
                    value: "USER",
                    label: "Attendee",
                    desc: "Discover and join events",
                    icon: User,
                  },
                  {
                    value: "ORGANIZER",
                    label: "Organizer",
                    desc: "Host and manage events",
                    icon: Megaphone,
                  },
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
                  <opt.icon
                    className={clsx(
                      "size-5",
                      role === opt.value
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
              noValidate
            >
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
              <PasswordInput
                id="password"
                label="Password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <PasswordInput
                id="confirmPassword"
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
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </main>
  )
}
