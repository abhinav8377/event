"use client"

import { useState } from "react"
import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import { QRCodeSVG } from "qrcode.react"
import { Ticket, MapPin, CalendarDays, Star, QrCode, Clock } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import * as registrationApi from "@/api/registrationApi"
import * as eventApi from "@/api/eventApi"
import * as feedbackApi from "@/api/feedbackApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Modal } from "@/components/common/Modal"
import { Card, Badge, Button, Loader, EmptyState, Textarea } from "@/components/common/ui"
import type { EventItem, Registration } from "@/constants/types"
import clsx from "clsx"

type Tab = "upcoming" | "past" | "cancelled" | "pending"

export default function MyRegistrations() {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<Tab>("upcoming")
  const [ticketReg, setTicketReg] = useState<{ reg: Registration; event: EventItem } | null>(null)
  const [feedbackFor, setFeedbackFor] = useState<{ reg: Registration; event: EventItem } | null>(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { data: regs, mutate } = useSWR(["my-registrations", user.id], () =>
    registrationApi.getMyRegistrations(user.id).then((r) => r.data),
  )
  const { data: allEvents } = useSWR("all-published-events", () =>
    eventApi.getEvents().then((r) => r.data),
  )

  if (!regs || !allEvents) return <Loader />

  const eventById = new Map(allEvents.map((e) => [e.id, e]))
  const rows = regs
    .map((reg) => ({ reg, event: eventById.get(reg.eventId) }))
    .filter((x): x is { reg: Registration; event: EventItem } => !!x.event)

  const now = Date.now()
  const filtered = rows.filter(({ reg, event }) => {
    if (tab === "cancelled") return reg.status === "CANCELLED" || reg.status === "DENIED"
    if (tab === "pending") return reg.status === "PENDING" || reg.status === "PAYMENT_PENDING"
    if (reg.status === "CANCELLED" || reg.status === "DENIED" || reg.status === "PENDING" || reg.status === "PAYMENT_PENDING") return false
    const isPast = new Date(event.endDate).getTime() < now
    return tab === "past" ? isPast : !isPast
  })

  const cancel = async (reg: Registration) => {
    try {
      const res = await registrationApi.cancelRegistration(reg.eventId, user.id)
      dispatch(pushToast({ type: "success", message: res.message }))
      mutate()
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    }
  }

  const submitReview = async () => {
    if (!feedbackFor) return
    setSubmitting(true)
    try {
      const res = await feedbackApi.submitFeedback({
        eventId: feedbackFor.event.id,
        userId: user.id,
        userName: user.name,
        rating,
        review,
      })
      dispatch(pushToast({ type: "success", message: res.message }))
      setFeedbackFor(null)
      setReview("")
      setRating(5)
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    } finally {
      setSubmitting(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "pending", label: "Pending" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ]

  return (
    <div>
      <PageHeader title="My Registrations" description="Manage your event tickets and registrations." />

      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Registration filters">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none",
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Ticket className="size-10" aria-hidden="true" />}
          title={`No ${tab} registrations`}
          description="When you register for events, your tickets will show up here."
          action={
            <Link to="/user/browse">
              <Button size="sm">Browse events</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(({ reg, event }) => (
            <Card key={reg.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <img
                src={event.banner || "/placeholder.svg"}
                alt=""
                className="h-24 w-full rounded-lg object-cover sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/events/${event.id}`} className="font-bold text-foreground hover:text-primary">
                    {event.title}
                  </Link>
                  <Badge
                    variant={
                      reg.status === "CANCELLED" || reg.status === "DENIED"
                        ? "destructive"
                        : reg.status === "PENDING" || reg.status === "PAYMENT_PENDING"
                          ? "warning"
                          : reg.attendance === "PRESENT"
                            ? "success"
                            : "default"
                    }
                  >
                    {reg.status === "CANCELLED"
                      ? "Cancelled"
                      : reg.status === "DENIED"
                        ? "Denied"
                        : reg.status === "PENDING"
                          ? "Pending"
                          : reg.status === "PAYMENT_PENDING"
                            ? "Payment Pending"
                            : reg.attendance === "PRESENT"
                              ? "Attended"
                              : "Confirmed"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    {dayjs(event.startDate).format("ddd, MMM D, YYYY · h:mm A")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {event.mode === "ONLINE" ? "Online" : `${event.venue}, ${event.city}`}
                  </span>
                </div>
                {reg.status !== "PENDING" && reg.status !== "PAYMENT_PENDING" && (
                  <p className="mt-1 text-xs font-mono text-muted-foreground">Ticket {reg.ticketNumber}</p>
                )}
                {reg.status === "PENDING" && (
                  <p className="mt-1 text-xs text-warning">
                    <Clock className="mr-1 inline size-3" aria-hidden="true" />
                    Awaiting organizer verification
                  </p>
                )}
                {reg.status === "PAYMENT_PENDING" && (
                  <p className="mt-1 text-xs text-warning">
                    <Clock className="mr-1 inline size-3" aria-hidden="true" />
                    Payment pending
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {(reg.status === "CONFIRMED" || reg.status === "ALLOWED") && tab === "upcoming" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setTicketReg({ reg, event })}>
                      <QrCode className="size-4" aria-hidden="true" />
                      View ticket
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => cancel(reg)}>
                      Cancel
                    </Button>
                  </>
                )}
                {(reg.status === "PENDING" || reg.status === "PAYMENT_PENDING") && tab === "pending" && (
                  <Button size="sm" variant="destructive" onClick={() => cancel(reg)}>
                    Cancel
                  </Button>
                )}
                {tab === "past" && reg.attendance === "PRESENT" && (
                  <Button size="sm" variant="outline" onClick={() => setFeedbackFor({ reg, event })}>
                    <Star className="size-4" aria-hidden="true" />
                    Leave feedback
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QR Ticket modal */}
      <Modal open={!!ticketReg} onClose={() => setTicketReg(null)} title="Your event ticket">
        {ticketReg && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-white">
              <QRCodeSVG value={ticketReg.reg.qrValue} size={180} aria-label="Ticket QR code" />
            </div>
            <div>
              <p className="font-bold text-foreground">{ticketReg.event.title}</p>
              <p className="text-sm text-muted-foreground">
                {dayjs(ticketReg.event.startDate).format("dddd, MMMM D, YYYY · h:mm A")}
              </p>
              <p className="mt-2 font-mono text-sm text-foreground">{ticketReg.reg.ticketNumber}</p>
            </div>
            <p className="text-xs text-muted-foreground text-pretty">
              Show this QR code at the venue entrance for check-in.
            </p>
          </div>
        )}
      </Modal>

      {/* Feedback modal */}
      <Modal open={!!feedbackFor} onClose={() => setFeedbackFor(null)} title="Rate this event">
        {feedbackFor && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{feedbackFor.event.title}</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star
                    className={clsx("size-7", n <= rating ? "fill-warning text-warning" : "text-border")}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <Textarea
              id="review"
              label="Your review"
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
            <Button onClick={submitReview} loading={submitting}>
              Submit feedback
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
