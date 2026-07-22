"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { CheckCircle, XCircle, Filter, Search, Users, Eye } from "lucide-react"
import dayjs from "dayjs"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { getAllRegistrations, allowRegistration, denyRegistration } from "@/api/registrationApi"
import { getOrganizerEvents } from "@/api/organizerApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Modal } from "@/components/common/Modal"
import { Card, Badge, Button, EmptyState, Loader, Select } from "@/components/common/ui"
import type { RegistrationWithDetails } from "@/constants/types"

type RegStatus = RegistrationWithDetails["status"]

const statusVariant: Record<RegStatus, "default" | "success" | "warning" | "destructive" | "outline"> = {
  PENDING: "warning",
  ALLOWED: "success",
  CONFIRMED: "success",
  CANCELLED: "destructive",
  DENIED: "destructive",
  PAYMENT_PENDING: "warning",
  WAITLISTED: "outline",
}

const statusLabel: Record<RegStatus, string> = {
  PENDING: "Pending",
  ALLOWED: "Allowed",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  DENIED: "Denied",
  PAYMENT_PENDING: "Payment Pending",
  WAITLISTED: "Waitlisted",
}

export default function OrganizerRegistrations() {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()

  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<{ id: string; title: string }[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [denyModal, setDenyModal] = useState<RegistrationWithDetails | null>(null)
  const [detailsModal, setDetailsModal] = useState<RegistrationWithDetails | null>(null)
  const fetchIdRef = useRef(0)

  const loadData = useCallback(async () => {
    const thisFetch = ++fetchIdRef.current
    setLoading(true)
    try {
      const [evtsRes, regsRes] = await Promise.all([
        getOrganizerEvents(),
        getAllRegistrations(selectedEventId === "all" ? undefined : selectedEventId),
      ])
      if (thisFetch !== fetchIdRef.current) return
      setEvents(evtsRes.data)
      setRegistrations(regsRes.data)
    } catch (e) {
      if (thisFetch !== fetchIdRef.current) return
      dispatch(pushToast({ type: "error", message: "Failed to load registrations" }))
    } finally {
      if (thisFetch === fetchIdRef.current) setLoading(false)
    }
  }, [selectedEventId, dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAllow = async (reg: RegistrationWithDetails) => {
    setActionLoading(reg.id)
    try {
      const res = await allowRegistration(reg.id)
      dispatch(pushToast({ type: "success", message: res.message }))
      setRegistrations((prev) =>
        prev.map((r) => (r.id === reg.id ? { ...r, status: "CONFIRMED" as const } : r)),
      )
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message || "Failed to confirm registration" }))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeny = async (reg: RegistrationWithDetails) => {
    setActionLoading(reg.id)
    try {
      await denyRegistration(reg.id)
      dispatch(pushToast({ type: "success", message: "Registration denied and removed" }))
      setRegistrations((prev) => prev.filter((r) => r.id !== reg.id))
      setDenyModal(null)
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message || "Failed to deny registration" }))
    } finally {
      setActionLoading(null)
    }
  }

  const getRegistrantName = (r: RegistrationWithDetails) => {
    if (r.registrantName) return r.registrantName
    if (typeof r.userId === "object" && r.userId?.name) return r.userId.name
    return "Unknown"
  }

  const getRegistrantEmail = (r: RegistrationWithDetails) => {
    if (r.registrantEmail) return r.registrantEmail
    if (typeof r.userId === "object" && r.userId?.email) return r.userId.email
    return ""
  }

  const getRegistrantPhone = (r: RegistrationWithDetails) => {
    if (r.registrantPhone) return r.registrantPhone
    return ""
  }

  const getEventTitle = (r: RegistrationWithDetails) => {
    if (typeof r.eventId === "object" && r.eventId?.title) return r.eventId.title
    return "Unknown Event"
  }

  const getEventDate = (r: RegistrationWithDetails) => {
    if (typeof r.eventId === "object" && r.eventId?.date) return r.eventId.date
    return ""
  }

  const filtered = registrations.filter((r) => {
    const q = searchQuery.toLowerCase()
    const name = getRegistrantName(r).toLowerCase()
    const email = getRegistrantEmail(r).toLowerCase()
    const phone = getRegistrantPhone(r).toLowerCase()
    const ticket = r.ticketNumber.toLowerCase()
    const eventTitle = getEventTitle(r).toLowerCase()
    return name.includes(q) || email.includes(q) || phone.includes(q) || ticket.includes(q) || eventTitle.includes(q)
  })

  const pendingCount = registrations.filter((r) => r.status === "PENDING").length
  const allowedCount = registrations.filter((r) => r.status === "ALLOWED" || r.status === "CONFIRMED").length

  return (
    <div>
      <PageHeader
        title="Event Registrations"
        description="Review and manage user registrations for your events."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Registrations</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{registrations.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Review</p>
          <p className="mt-1 text-2xl font-extrabold text-warning">{pendingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Confirmed</p>
          <p className="mt-1 text-2xl font-extrabold text-success">{allowedCount}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring sm:w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
              >
                <option value="all">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            Refresh
          </Button>
        </div>
      </Card>

      {loading ? (
        <Loader label="Loading registrations..." />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Users className="size-10" aria-hidden="true" />}
            title="No registrations found"
            description={searchQuery || selectedEventId !== "all" ? "Try adjusting your filters." : "No registrations have been submitted yet."}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((reg) => {
            return (
            <Card key={reg.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                    {getRegistrantName(reg).charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{getRegistrantName(reg)}</p>
                    <p className="text-xs text-muted-foreground">{getRegistrantEmail(reg)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant[reg.status]}>{statusLabel[reg.status]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {getEventTitle(reg)}
                      </span>
                      {getEventDate(reg) && (
                        <span className="text-xs text-muted-foreground">
                          - {dayjs(getEventDate(reg)).format("MMM D, YYYY")}
                        </span>
                      )}
                    </div>

                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailsModal(reg)}
                    aria-label="View registrant details"
                  >
                    <Eye className="size-4" />
                    Details
                  </Button>
                  {reg.status === "PENDING" && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        loading={actionLoading === reg.id}
                        onClick={() => handleAllow(reg)}
                      >
                        <CheckCircle className="size-4" />
                        Allow
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        loading={actionLoading === reg.id}
                        onClick={() => setDenyModal(reg)}
                      >
                        <XCircle className="size-4" />
                        Deny
                      </Button>
                    </>
                  )}
                  {reg.status === "ALLOWED" && (
                    <Badge variant="success">Confirmed</Badge>
                  )}
                  {reg.status === "CONFIRMED" && (
                    <Badge variant="success">Confirmed</Badge>
                  )}
                </div>
              </div>
            </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!detailsModal}
        onClose={() => setDetailsModal(null)}
        title="Registrant Details"
        panelClassName="max-w-xl sm:max-w-2xl"
      >
        {detailsModal && (
          <div className="scrollbar-hide space-y-5 max-h-[65vh] overflow-y-auto">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-medium text-foreground">{getRegistrantName(detailsModal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground break-all">{getRegistrantEmail(detailsModal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantPhone || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alternate Phone</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantAltPhone || "\u2014"}</p>
                </div>
              </div>
            </div>
            <hr className="border-border" />
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantAge ?? "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantGender || "\u2014"}</p>
                </div>
              </div>
            </div>
            <hr className="border-border" />
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Professional Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Profession</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantProfession || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Organization / University</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantOrganization || "\u2014"}</p>
                </div>
              </div>
            </div>
            <hr className="border-border" />
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantCountry || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">State</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantState || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">City</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantCity || "\u2014"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pincode</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.registrantPincode || "\u2014"}</p>
                </div>
              </div>
            </div>
            {(detailsModal.registrantSocialLinks || detailsModal.registrantReason || detailsModal.registrantSpecialRequest) && (
              <>
                <hr className="border-border" />
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Information</h3>
                  <div className="space-y-3">
                    {detailsModal.registrantSocialLinks && (
                      <div>
                        <p className="text-xs text-muted-foreground">Social Account Links</p>
                        <p className="text-sm font-medium text-foreground">{detailsModal.registrantSocialLinks}</p>
                      </div>
                    )}
                    {detailsModal.registrantReason && (
                      <div>
                        <p className="text-xs text-muted-foreground">Reason for Participation</p>
                        <p className="text-sm font-medium text-foreground">{detailsModal.registrantReason}</p>
                      </div>
                    )}
                    {detailsModal.registrantSpecialRequest && (
                      <div>
                        <p className="text-xs text-muted-foreground">Special Request</p>
                        <p className="text-sm font-medium text-foreground">{detailsModal.registrantSpecialRequest}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            <hr className="border-border" />
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registration Info</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Ticket Number</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.ticketNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[detailsModal.status]}>{statusLabel[detailsModal.status]}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="text-sm font-medium text-foreground">{detailsModal.paymentAmount ? `\u20B9${detailsModal.paymentAmount}` : "Free"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registered At</p>
                  <p className="text-sm font-medium text-foreground">{dayjs(detailsModal.registeredAt).format("MMM D, YYYY h:mm A")}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!denyModal} onClose={() => setDenyModal(null)} title="Deny Registration">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Are you sure you want to deny the registration for{" "}
          <span className="font-semibold text-foreground">{denyModal ? getRegistrantName(denyModal) : ""}</span>?
          This action will permanently remove their registration details for privacy.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDenyModal(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={actionLoading === denyModal?.id}
            onClick={() => denyModal && handleDeny(denyModal)}
          >
            Yes, Deny & Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}
