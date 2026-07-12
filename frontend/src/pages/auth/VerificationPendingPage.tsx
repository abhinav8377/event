"use client"

import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  CalendarRange,
  Clock,
  Mail,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Info,
} from "lucide-react"
import { useAppSelector } from "@/app/store"
import { Button, Card } from "@/components/common/ui"

const steps = [
  {
    icon: CheckCircle2,
    title: "Account Created",
    description: "Your organizer account has been successfully registered.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Clock,
    title: "Under Review",
    description: "Our admin team is reviewing your application.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    description: "Once verified, you'll get full access to your dashboard.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
]

export default function VerificationPendingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppSelector((s) => s.auth)
  const state = location.state as { email?: string; name?: string } | null
  const displayEmail = user?.email || state?.email || "your email address"
  const displayName = user?.name || state?.name
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate("/", { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [navigate])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <CalendarRange className="size-8" aria-hidden="true" />
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              Event<span className="text-primary">Hub</span>
            </span>
          </Link>
        </div>

        <Card className="p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="mb-6 flex size-20 items-center justify-center rounded-full bg-amber-500/10"
            >
              <Clock className="size-10 text-amber-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="display mb-2 text-2xl text-foreground"
            >
              Verification Pending
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-2 text-muted-foreground"
            >
              Your account has been created successfully!
            </motion.p>

            {displayName && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mb-2 text-sm font-semibold text-foreground"
              >
                Welcome, {displayName}!
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400"
            >
              Please wait up to <strong>24 hours</strong> for admin verification.
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6 space-y-3"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.15 }}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${step.bg}`}>
                  <step.icon className={`size-5 ${step.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mb-6 rounded-lg border border-border bg-muted/20 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Check Your Email</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We've sent a detailed confirmation email to{" "}
              <strong className="text-foreground">{displayEmail}</strong> with
              your account details and next steps. Once your account is verified, you'll receive
              another email notification.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Info className="size-4 text-blue-500" />
              <span className="text-sm font-semibold text-foreground">What Can You Do Now?</span>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-500">•</span>
                Browse public events and discover what's happening
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-500">•</span>
                Learn more about EventHub features
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-500">•</span>
                Contact our support team if you have questions
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex flex-col gap-3"
          >
            <Link to="/">
              <Button className="w-full" variant="primary">
                Browse Events
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button className="w-full" variant="outline">
                Back to Login
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-4 text-center text-xs text-muted-foreground"
          >
            Redirecting to home in {countdown}s...
          </motion.p>
        </Card>
      </div>
    </main>
  )
}
