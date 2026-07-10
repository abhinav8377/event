"use client"

import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  CalendarDays,
  MapPin,
  Users,
  Star,
  BadgeCheck,
  Eye,
  Ticket,
  ArrowLeft,
  QrCode,
} from "lucide-react"
import dayjs from "dayjs"
import { QRCodeSVG } from "qrcode.react"
import { getEventById } from "@/api/eventApi"
import { registerForEvent, getMyRegistrations } from "@/api/registrationApi"
import { getEventFeedback, submitFeedback } from "@/api/feedbackApi"
import type { EventItem, Feedback, Registration } from "@/constants/types"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { pushToast } from "@/features/toast/toastSlice"
import { Badge, Button, Card, Loader, Textarea, EmptyState } from "@/components/common/ui"
import { Modal } from "@/components/common/Modal"

const modeLabel = { IN_PERSON: "In person", ONLINE: "Online", HYBRID: "Hybrid" }

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [event, setEvent] = useState<EventItem | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [myReg, setMyReg] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const eventRes = await getEventById(id)
      setEvent(eventRes.data)
    } catch {
      setEvent(null)
      setLoading(false)
      return
    }
    try {
      const feedbackRes = await getEventFeedback(id)
      setFeedback(feedbackRes.data)
    } catch {
      // feedback is optional — ignore errors
    }
    if (user) {
      try {
        const regs = await getMyRegistrations(user.id)
        setMyReg(
          regs.data.find((r) => r.eventId === id && r.status === "CONFIRMED") ?? null,
        )
      } catch {
        // registrations lookup is optional
      }
    }
    setLoading(false)
  }, [id, user])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader label="Loading event..." />
  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Event not found"
          description="This event may have been removed or unpublished."
          action={
            <Link to="/events">
              <Button variant="outline">Browse events</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isPast = new Date(event.endDate).getTime() < Date.now()
  const isFull = event.registeredCount >= event.capacity
  const attended = myReg?.attendance === "PRESENT" || myReg?.attendance === "LATE"
  const alreadyReviewed = user ? feedback.some((f) => f.userId === user.id) : false

  const handleRegister = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/events/${event.id}` } })
      return
    }
    setRegistering(true)
    try {
      const res = await registerForEvent(event.id, user.id)
      setMyReg(res.data)
      setEvent({ ...event, registeredCount: event.registeredCount + 1 })
      dispatch(pushToast({ type: "success", message: res.message }))
      setConfirmOpen(false)
      setTicketOpen(true)
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    } finally {
      setRegistering(false)
    }
  }

  const handleFeedback = async () => {
    if (!user || !review.trim()) return
    setSubmittingFeedback(true)
    try {
      const res = await submitFeedback({
        eventId: event.id,
        userId: user.id,
        userName: user.name,
        rating,
        review: review.trim(),
      })
      setFeedback([res.data, ...feedback])
      setReview("")
      dispatch(pushToast({ type: "success", message: res.message }))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to events
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl">
            <img src={event.banner || "/placeholder.svg"} alt={event.title} className="aspect-video w-full object-cover" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{event.category}</Badge>
            <Badge>{modeLabel[event.mode]}</Badge>
            {isPast && <Badge variant="outline">Ended</Badge>}
            {event.rating > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
                {event.rating}
                <span className="font-normal text-muted-foreground">({event.ratingCount} reviews)</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="size-4" aria-hidden="true" />
              {event.views.toLocaleString()} views
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground text-balance">
            {event.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            Hosted by <span className="font-semibold text-foreground">{event.organizerName}</span>
            {event.organizerVerified && (
              <BadgeCheck className="size-4 text-primary" aria-label="Verified organizer" />
            )}
          </p>

          <div className="prose-sm mt-6 max-w-none">
            <h2 className="text-lg font-bold text-foreground">About this event</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground text-pretty">
              {event.longDescription}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <Badge key={t} variant="outline">#{t}</Badge>
            ))}
          </div>

          {/* Feedback section */}
          <section className="mt-10 border-t border-border pt-8" aria-label="Reviews">
            <h2 className="text-lg font-bold text-foreground">
              Reviews {feedback.length > 0 && `(${feedback.length})`}
            </h2>

            {user && attended && !alreadyReviewed && (
              <Card className="mt-4 p-5">
                <p className="mb-3 text-sm font-semibold text-foreground">Leave your feedback</p>
                <div className="mb-3 flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={rating === r}
                      aria-label={`${r} star${r > 1 ? "s" : ""}`}
                      onClick={() => setRating(r)}
                    >
                      <Star
                        className={
                          r <= rating
                            ? "size-6 fill-warning text-warning"
                            : "size-6 text-border"
                        }
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="How was the event?"
                  aria-label="Review"
                />
                <Button
                  className="mt-3"
                  size="sm"
                  loading={submittingFeedback}
                  disabled={!review.trim()}
                  onClick={handleFeedback}
                >
                  Submit review
                </Button>
              </Card>
            )}

            {feedback.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {feedback.map((f) => (
                  <li key={f.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                          {f.userName.charAt(0)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{f.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {dayjs(f.createdAt).format("MMM D, YYYY")}
                          </p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
                        {f.rating}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.review}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <p className="text-2xl font-extrabold text-foreground">
              {event.price === 0 ? "Free" : `₹${event.price}`}
            </p>
            <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 text-sm">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">
                    {dayjs(event.startDate).format("dddd, MMMM D, YYYY")}
                  </p>
                  <p className="text-muted-foreground">
                    {dayjs(event.startDate).format("h:mm A")} – {dayjs(event.endDate).format("h:mm A")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">{event.venue}</p>
                  <p className="text-muted-foreground">{event.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">
                    {event.registeredCount.toLocaleString()} / {event.capacity.toLocaleString()} registered
                  </p>
                  <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {myReg ? (
                <Button className="w-full" variant="success" onClick={() => setTicketOpen(true)}>
                  <QrCode className="size-4" aria-hidden="true" />
                  View my ticket
                </Button>
              ) : isPast ? (
                <Button className="w-full" disabled>
                  Event has ended
                </Button>
              ) : isFull ? (
                <Button className="w-full" disabled>
                  Event is full
                </Button>
              ) : (
                <Button className="w-full" onClick={() => (user ? setConfirmOpen(true) : navigate("/login", { state: { from: `/events/${event.id}` } }))}>
                  <Ticket className="size-4" aria-hidden="true" />
                  Register now
                </Button>
              )}
              {!user && !isPast && !isFull && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  You&apos;ll be asked to log in first.
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>

      {/* Confirm registration modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm registration">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Register for <span className="font-semibold text-foreground">{event.title}</span> on{" "}
          {dayjs(event.startDate).format("MMM D, YYYY")}? Your QR ticket will be generated instantly.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button loading={registering} onClick={handleRegister}>
            Confirm registration
          </Button>
        </div>
      </Modal>

      {/* Ticket modal */}
      <Modal open={ticketOpen} onClose={() => setTicketOpen(false)} title="Your ticket">
        {myReg && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-xl border border-border bg-white p-4">
              <QRCodeSVG value={myReg.qrValue} size={180} aria-label="Ticket QR code" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-foreground">{myReg.ticketNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Show this QR code at the venue for check-in.
              </p>
            </div>
            <Link to="/user/registrations" className="w-full">
              <Button variant="outline" className="w-full">
                View all my registrations
              </Button>
            </Link>
          </div>
        )}
      </Modal>
    </div>
  )
}
