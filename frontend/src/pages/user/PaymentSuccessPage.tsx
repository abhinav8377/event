"use client"

import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle, ArrowRight, Clock } from "lucide-react"
import { Card, Button } from "@/components/common/ui"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  const eventTitle = searchParams.get("eventTitle") || "your event"
  const eventId = searchParams.get("eventId") || ""

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="size-8 text-success" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-foreground">Payment Successful!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment for <span className="font-semibold text-foreground">{eventTitle}</span> has been processed successfully.
        </p>

        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-center gap-2">
            <Clock className="size-4 text-primary" />
            <p className="text-sm font-medium text-primary">
              Your event QR will be in your inbox within 24 hours after verification.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Your registration is now pending organizer verification. You will receive an email with your QR code and ticket number once the organizer confirms your registration.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {eventId ? (
            <Link to={`/user/events/${eventId}`}>
              <Button className="w-full">
                View Event Details
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/user/registrations">
              <Button className="w-full">
                View My Registrations
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
          <Link to="/user/browse">
            <Button variant="outline" className="w-full">
              Browse More Events
            </Button>
          </Link>
        </div>

        {countdown > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Redirecting in {countdown}s...
          </p>
        )}
      </Card>
    </div>
  )
}
