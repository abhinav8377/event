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
  Clock,
  CheckCircle,
  Building2,
  CalendarClock,
} from "lucide-react"
import dayjs from "dayjs"
import { QRCodeSVG } from "qrcode.react"
import { getEventById, getOrganizerPublic, recordEventView } from "@/api/eventApi"
import { registerForEvent, getMyRegistrations } from "@/api/registrationApi"
import { createRazorpayOrder, verifyRazorpayPayment, confirmPaymentSuccess } from "@/api/paymentApi"
import { getEventFeedback, submitFeedback } from "@/api/feedbackApi"
import type { EventItem, Feedback, Registration } from "@/constants/types"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { pushToast } from "@/features/toast/toastSlice"
import { Badge, Button, Card, Loader, Textarea, EmptyState, Input } from "@/components/common/ui"
import { Modal } from "@/components/common/Modal"
import { sanitizeHtml } from "@/utils/sanitize"
import VenueMap from "@/components/common/VenueMap"

const modeLabel = { IN_PERSON: "In person", ONLINE: "Online", HYBRID: "Hybrid" }

declare global {
  interface Window {
    Razorpay: any
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const backLink = user?.role === "USER" ? "/user/browse" : "/"
  const loginTarget = user?.role === "USER" ? "/user/browse" : "/login"

  const [event, setEvent] = useState<EventItem | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [myReg, setMyReg] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)
  const [orgOpen, setOrgOpen] = useState(false)
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgData, setOrgData] = useState<{ organizer: any; events: EventItem[] } | null>(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formAge, setFormAge] = useState("")
  const [formGender, setFormGender] = useState("")
  const [formAltPhone, setFormAltPhone] = useState("")
  const [formOrganization, setFormOrganization] = useState("")
  const [formCountry, setFormCountry] = useState("")
  const [formState, setFormStateVal] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formPincode, setFormPincode] = useState("")
  const [formSocialLinks, setFormSocialLinks] = useState("")
  const [formProfession, setFormProfession] = useState("")
  const [formReason, setFormReason] = useState("")
  const [formSpecialRequest, setFormSpecialRequest] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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
      // feedback is optional
    }
    if (user) {
      try {
        const regs = await getMyRegistrations(user.id)
        setMyReg(
          regs.data.find(
            (r) =>
              r.eventId === id &&
              (r.status === "CONFIRMED" || r.status === "PENDING" || r.status === "ALLOWED"),
          ) ?? null,
        )
      } catch {
        // registrations lookup is optional
      }
    }
    setLoading(false)

    // Real, de-duplicated guest views: count once per browser.
    if (!user) {
      const viewKey = `eh_viewed_${id}`
      if (!localStorage.getItem(viewKey)) {
        localStorage.setItem(viewKey, "1")
        recordEventView(id)
          .then((res) => {
            if (res.success) {
              setEvent((ev) => (ev ? { ...ev, views: res.data } : ev))
            }
          })
          .catch(() => {})
      }
    }
  }, [id, user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (formOpen && user) {
      setFormName(user.name || "")
      setFormEmail(user.email || "")
      setFormPhone("")
      setFormAge("")
      setFormGender("")
      setFormAltPhone("")
      setFormOrganization("")
      setFormCountry("")
      setFormStateVal("")
      setFormCity("")
      setFormPincode("")
      setFormSocialLinks("")
      setFormProfession("")
      setFormReason("")
      setFormSpecialRequest("")
      setFormErrors({})
    }
  }, [formOpen, user])

  if (loading) return <Loader label="Loading event..." />
  if (!event) {
  return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Event not found"
          description="This event may have been removed or unpublished."
          action={
            <Link to={backLink}>
              <Button variant="outline">Browse events</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const openOrganizerPanel = async () => {
    if (!event.organizerId) return
    setOrgOpen(true)
    if (orgData) return
    setOrgLoading(true)
    try {
      const res = await getOrganizerPublic(event.organizerId)
      setOrgData(res.data)
    } catch {
      setOrgData(null)
    } finally {
      setOrgLoading(false)
    }
  }

  const startMs = event.startDate ? new Date(event.startDate).getTime() : NaN
  const endMs = event.endDate ? new Date(event.endDate).getTime() : NaN
  const isPast = !isNaN(endMs) && endMs < Date.now()
  const isStarted = !isNaN(startMs) && startMs <= Date.now()
  const isFull = event.registeredCount >= event.capacity
  const attended = myReg?.attendance === "PRESENT" || myReg?.attendance === "LATE"
  const alreadyReviewed = user ? feedback.some((f) => f.userId === user.id) : false
  const isPaid = event.price > 0

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formName.trim()) errors.name = "Name is required"
    if (!formEmail.trim()) errors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) errors.email = "Invalid email address"
    if (!formPhone.trim()) errors.phone = "Phone number is required"
    else if (!/^[0-9]{10,}$/.test(formPhone.replace(/[\s\-+]/g, ""))) errors.phone = "Enter a valid phone number"
    if (!formProfession.trim()) errors.profession = "Working profession is required"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openRegistrationForm = () => {
    if (!user) {
      navigate(loginTarget, { state: { from: `/events/${event.id}` } })
      return
    }
    if (!localStorage.getItem("eventhub_token")) {
      dispatch(pushToast({ type: "error", message: "Your session has expired. Please log in again." }))
      navigate(loginTarget, { state: { from: `/events/${event.id}` } })
      return
    }
    setFormOpen(true)
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    if (!localStorage.getItem("eventhub_token")) {
      dispatch(pushToast({ type: "error", message: "Your session has expired. Please log in again." }))
      navigate(loginTarget, { state: { from: `/events/${event.id}` } })
      return
    }

    setRegistering(true)
    try {
      const res = await registerForEvent(event.id, user!.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        age: formAge ? Number(formAge) : undefined,
        gender: formGender || undefined,
        altPhone: formAltPhone.trim() || undefined,
        organization: formOrganization.trim() || undefined,
        country: formCountry.trim() || undefined,
        state: formState.trim() || undefined,
        city: formCity.trim() || undefined,
        pincode: formPincode.trim() || undefined,
        socialLinks: formSocialLinks.trim() || undefined,
        profession: formProfession.trim(),
        reason: formReason.trim() || undefined,
        specialRequest: formSpecialRequest.trim() || undefined,
      })

      if (res.data.isPaid) {
        setFormOpen(false)
        await handleRazorpayPayment(event, res.data.id)
      } else {
        setMyReg(res.data)
        setEvent({ ...event, registeredCount: event.registeredCount + 1 })
        setFormOpen(false)
        setPendingOpen(true)
      }
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401) {
        dispatch(pushToast({ type: "error", message: "Authentication failed. Please log in again." }))
        navigate(loginTarget, { state: { from: `/events/${event.id}` } })
      } else {
        const msg = e?.response?.data?.message || (e as Error).message
        dispatch(pushToast({ type: "error", message: msg }))
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleRazorpayPayment = async (eventData: EventItem, registrationId: string) => {
    try {
      const orderRes = await createRazorpayOrder(eventData.id)
      const order = orderRes.data

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        dispatch(pushToast({ type: "error", message: "Failed to load payment gateway. Please try again." }))
        return
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "EventHub",
        description: `Payment for ${order.eventName}`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              registrationId,
            })

            await confirmPaymentSuccess(eventData.id)

            navigate(
              `/payment-success?eventTitle=${encodeURIComponent(eventData.title)}&eventId=${eventData.id}`,
            )
          } catch (e: any) {
            const msg = e?.response?.data?.message || "Payment verification failed. Please contact support."
            dispatch(pushToast({ type: "error", message: msg }))
          }
        },
        prefill: {
          name: formName.trim(),
          email: formEmail.trim(),
          contact: formPhone.trim(),
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            dispatch(pushToast({ type: "info", message: "Payment cancelled" }))
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401) {
        dispatch(pushToast({ type: "error", message: "Authentication failed. Please log in again." }))
        navigate(loginTarget, { state: { from: `/events/${event.id}` } })
      } else {
        const msg = e?.response?.data?.message || (e as Error).message || "Failed to initiate payment"
        dispatch(pushToast({ type: "error", message: msg }))
      }
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
        to={backLink}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to events
      </Link>

      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={event.banner || "/placeholder.svg"}
              alt={event.title}
              className="aspect-video w-full object-cover"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{event.category}</Badge>
            <Badge>{modeLabel[event.mode]}</Badge>
            {isPast && <Badge variant="outline">Ended</Badge>}
            {event.rating > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
                {event.rating}
                <span className="font-normal text-muted-foreground">
                  ({event.ratingCount} reviews)
                </span>
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
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            Hosted by{" "}
            <button
              type="button"
              onClick={openOrganizerPanel}
              className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline"
            >
              {event.organizerOrganization}
              {event.organizerVerified && (
                <BadgeCheck className="size-4 text-primary" aria-label="Verified organizer" />
              )}
            </button>
          </p>

          <div className="mt-6">
            <h2 className="text-lg font-bold text-foreground">About this event</h2>
            <div
              className="event-prose mt-3 overflow-x-hidden break-words"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(event.longDescription || event.description),
              }}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <Badge key={t} variant="outline">
                #{t}
              </Badge>
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
                            {dayjs(f.createdAt).format("MMM D, YYYY · h:mm A")}
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
                    {dayjs(event.startDate).format("h:mm A")} –{" "}
                    {dayjs(event.endDate).format("h:mm A")}
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
                    {event.registeredCount.toLocaleString()} /{" "}
                    {event.capacity.toLocaleString()} registered
                  </p>
                  <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {myReg ? (
                myReg.status === "PENDING" || myReg.status === "PAYMENT_PENDING" ? (
                  <div className="w-full rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
                    <Clock className="mx-auto size-5 text-warning" />
                    <p className="mt-1 text-sm font-medium text-warning">Registration Pending</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Awaiting organizer verification
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant="success"
                    onClick={() => setTicketOpen(true)}
                  >
                    <CheckCircle className="size-4" aria-hidden="true" />
                    Registration Successful
                  </Button>
                )
              ) : isPast ? (
                <Button className="w-full" disabled>
                  Event has ended
                </Button>
              ) : isStarted ? (
                <Button className="w-full" disabled>
                  Registration closed
                </Button>
              ) : isFull ? (
                <Button className="w-full" disabled>
                  Event is full
                </Button>
              ) : (
                <Button className="w-full" onClick={openRegistrationForm}>
                  <Ticket className="size-4" aria-hidden="true" />
                  Register now
                </Button>
              )}
              {!user && !isPast && !isStarted && !isFull && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  You&apos;ll be asked to log in first.
                </p>
              )}
            </div>
          </Card>

          {event.latitude != null && event.longitude != null && (
            <Card className="mt-4 p-6">
              <VenueMap
                latitude={event.latitude}
                longitude={event.longitude}
                venue={event.venue}
                city={event.city}
              />
            </Card>
          )}
        </aside>
      </div>

      {/* Registration Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={`Register for ${event.title}`}
        panelClassName="!max-w-4xl !overflow-visible"
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Fill in your details to register.
            {isPaid && (
              <span className="ml-1 font-medium text-foreground">
                Payment of ₹{event.price} via Razorpay after submitting.
              </span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Row 1: Name + Email */}
            <Input
              id="reg-name"
              label="Full Name *"
              placeholder="Full name"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
                if (formErrors.name) setFormErrors((p) => ({ ...p, name: "" }))
              }}
              error={formErrors.name}
            />
            <Input
              id="reg-email"
              label="Email *"
              type="email"
              placeholder="you@example.com"
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value)
                if (formErrors.email) setFormErrors((p) => ({ ...p, email: "" }))
              }}
              error={formErrors.email}
            />

            {/* Row 2: Phone + Alt Phone */}
            <Input
              id="reg-phone"
              label="Phone *"
              type="tel"
              placeholder="10-digit number"
              value={formPhone}
              onChange={(e) => {
                setFormPhone(e.target.value)
                if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: "" }))
              }}
              error={formErrors.phone}
            />
            <Input
              id="reg-alt-phone"
              label="Alternate Phone"
              type="tel"
              placeholder="Optional"
              value={formAltPhone}
              onChange={(e) => setFormAltPhone(e.target.value)}
            />

            {/* Row 3: Age + Gender */}
            <Input
              id="reg-age"
              label="Age"
              type="number"
              placeholder="Age"
              value={formAge}
              onChange={(e) => setFormAge(e.target.value)}
            />
            <div>
              <label htmlFor="reg-gender" className="mb-1.5 block text-sm font-medium text-foreground">
                Gender
              </label>
              <select
                id="reg-gender"
                value={formGender}
                onChange={(e) => setFormGender(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Row 4: Profession + Organization */}
            <Input
              id="reg-profession"
              label="Working Profession *"
              placeholder="e.g. Software Engineer"
              value={formProfession}
              onChange={(e) => {
                setFormProfession(e.target.value)
                if (formErrors.profession) setFormErrors((p) => ({ ...p, profession: "" }))
              }}
              error={formErrors.profession}
            />
            <Input
              id="reg-organization"
              label="Organization / University"
              placeholder="College or company"
              value={formOrganization}
              onChange={(e) => setFormOrganization(e.target.value)}
            />

            {/* Row 5: Country + State */}
            <Input
              id="reg-country"
              label="Country"
              placeholder="Country"
              value={formCountry}
              onChange={(e) => setFormCountry(e.target.value)}
            />
            <Input
              id="reg-state"
              label="State"
              placeholder="State"
              value={formState}
              onChange={(e) => setFormStateVal(e.target.value)}
            />

            {/* Row 6: City + Pincode */}
            <Input
              id="reg-city"
              label="City"
              placeholder="City"
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
            />
            <Input
              id="reg-pincode"
              label="Pincode"
              placeholder="Pincode"
              value={formPincode}
              onChange={(e) => setFormPincode(e.target.value)}
            />
          </div>

          {/* Full-width fields */}
          <Input
            id="reg-social"
            label="Social Account Links"
            placeholder="LinkedIn, Instagram, Twitter (comma-separated)"
            value={formSocialLinks}
            onChange={(e) => setFormSocialLinks(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-reason" className="mb-1.5 block text-sm font-medium text-foreground">
                Reason of Participation
              </label>
              <textarea
                id="reg-reason"
                rows={2}
                placeholder="Why attend?"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="reg-special" className="mb-1.5 block text-sm font-medium text-foreground">
                Special Request
              </label>
              <textarea
                id="reg-special"
                rows={2}
                placeholder="Accessibility, dietary needs..."
                value={formSpecialRequest}
                onChange={(e) => setFormSpecialRequest(e.target.value)}
                className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={registering} onClick={handleRegister}>
              {isPaid ? `Pay ₹${event.price} & Register` : "Submit Registration"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket modal */}
      <Modal open={ticketOpen} onClose={() => setTicketOpen(false)} title="Your ticket">
        {myReg && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-white">
              <QRCodeSVG value={myReg.qrValue} size={180} aria-label="Ticket QR code" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-foreground">
                {myReg.ticketNumber}
              </p>
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

      {/* Pending registration modal (free events) */}
      <Modal
        open={pendingOpen}
        onClose={() => setPendingOpen(false)}
        title="Registration Submitted"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
            <Clock className="size-8 text-warning" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">Registration Submitted!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your registration for{" "}
              <span className="font-semibold text-foreground">{event.title}</span> has been
              submitted successfully.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your registration is now pending organizer verification. You will receive an email
              with your QR code and ticket number once the organizer confirms your registration.
            </p>
          </div>
          <Link to="/user/registrations" className="w-full">
            <Button variant="outline" className="w-full">
              View my registrations
            </Button>
          </Link>
        </div>
      </Modal>

      {/* Organizer details panel */}
      <Modal open={orgOpen} onClose={() => setOrgOpen(false)} title="About the organizer" panelClassName="!max-w-lg">
        {orgLoading ? (
          <Loader label="Loading organizer..." />
        ) : (
          orgData && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Building2 className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-foreground">{orgData.organizer?.organization?.name || event?.organizerOrganization}</p>
                    {event?.organizerVerified && <BadgeCheck className="size-4 text-primary" aria-label="Verified organizer" />}
                  </div>
                  <p className="text-sm text-muted-foreground">by {orgData.organizer?.name}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">About organization</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {orgData.organizer?.organization?.bio ||
                    `${orgData.organizer?.organization?.name || event?.organizerOrganization} is a verified event organizer on EventHub, hosting experiences for the community.`}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Upcoming events</h3>
                {orgData.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming public events right now.</p>
                ) : (
                  <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
                    {orgData.events.map((ev) => (
                      <li key={ev.id} className="relative">
                        <span className="absolute -left-[1.6rem] top-1.5 size-3 rounded-full border-2 border-card bg-primary" aria-hidden="true" />
                        <Link
                          to={`/events/${ev.id}`}
                          onClick={() => setOrgOpen(false)}
                          className="block rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                        >
                          <p className="font-semibold text-foreground">{ev.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="size-3.5" aria-hidden="true" />
                              {dayjs(ev.startDate).format("MMM D, YYYY · h:mm A")}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" aria-hidden="true" />
                              {ev.mode === "ONLINE" ? "Online" : `${ev.venue}, ${ev.city}`}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  )
}
