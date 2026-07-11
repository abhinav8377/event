"use client"

import { useState } from "react"
import useSWR from "swr"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import {
  Send,
  Megaphone,
  MapPin,
  Calendar,
  Clock,
  Bell,
  ChevronDown,
  ChevronUp,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react"
import { useAppDispatch } from "@/app/store"
import * as organizerApi from "@/api/organizerApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Badge, Button, Input, Textarea, Select, Loader, EmptyState } from "@/components/common/ui"
import type { NotificationType, SentNotification } from "@/constants/types"
import clsx from "clsx"

dayjs.extend(relativeTime)

interface OrganizerEvent {
  id: string
  title: string
  date: string
  startTime: string
  venue: string
  city: string
  status: string
}

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "UPDATE", label: "Event Update" },
  { value: "REMINDER", label: "Reminder" },
  { value: "GENERAL", label: "General" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "CERTIFICATE", label: "Certificate" },
]

const QUICK_TEMPLATES = [
  {
    label: "Venue Changed",
    icon: MapPin,
    type: "UPDATE" as NotificationType,
    titleFn: (e: OrganizerEvent) => `Venue Update: ${e.title}`,
    messageFn: (e: OrganizerEvent) =>
      `The venue for "${e.title}" has been changed. Please check the updated venue details on the event page. We apologize for any inconvenience.`,
  },
  {
    label: "Date Changed",
    icon: Calendar,
    type: "UPDATE" as NotificationType,
    titleFn: (e: OrganizerEvent) => `Date Update: ${e.title}`,
    messageFn: (e: OrganizerEvent) =>
      `The date for "${e.title}" has been changed. Please check the updated date on the event page and update your schedule accordingly. We apologize for any inconvenience.`,
  },
  {
    label: "Time Changed",
    icon: Clock,
    type: "UPDATE" as NotificationType,
    titleFn: (e: OrganizerEvent) => `Time Update: ${e.title}`,
    messageFn: (e: OrganizerEvent) =>
      `The time for "${e.title}" has been changed. Please check the updated time on the event page. We apologize for any inconvenience.`,
  },
]

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  GENERAL: Megaphone,
  UPDATE: Megaphone,
  REMINDER: Clock,
  REGISTRATION: Users,
  CERTIFICATE: Send,
}

export default function OrganizerNotifications() {
  const dispatch = useAppDispatch()
  const [selectedEventId, setSelectedEventId] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<NotificationType>("UPDATE")
  const [sending, setSending] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const { data: events, isLoading: eventsLoading } = useSWR("organizer-events-list", () =>
    organizerApi.getOrganizerEvents().then((r) => r.data),
  )

  const { data: sentNotifications, mutate } = useSWR("organizer-sent-notifications", () =>
    organizerApi.getSentOrganizerNotifications().then((r) => r.data),
  )

  const selectedEvent = events?.find((e) => e.id === selectedEventId)

  const applyTemplate = (template: (typeof QUICK_TEMPLATES)[number]) => {
    if (!selectedEvent) {
      dispatch(pushToast({ type: "error", message: "Please select an event first" }))
      return
    }
    setTitle(template.titleFn(selectedEvent))
    setMessage(template.messageFn(selectedEvent))
    setType(template.type)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId) {
      dispatch(pushToast({ type: "error", message: "Please select an event" }))
      return
    }
    if (!title.trim() || !message.trim()) {
      dispatch(pushToast({ type: "error", message: "Title and message are required" }))
      return
    }
    setSending(true)
    try {
      const res = await organizerApi.sendOrganizerNotification({
        eventId: selectedEventId,
        title: title.trim(),
        message: message.trim(),
        type,
      })
      dispatch(pushToast({ type: "success", message: res.message }))
      setTitle("")
      setMessage("")
      setType("UPDATE")
      setSelectedEventId("")
      mutate()
    } catch (err) {
      dispatch(pushToast({ type: "error", message: (err as Error).message }))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Send Notifications"
        description="Send notifications to registered participants of your events."
      />

      <Card className="mb-8 p-6">
        <form onSubmit={handleSend} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notif-event" className="text-sm font-medium text-foreground">
              Select Event
            </label>
            {eventsLoading ? (
              <Loader />
            ) : (
              <select
                id="notif-event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Choose an event...</option>
                {events?.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                    {event.venue ? ` - ${event.venue}` : ""}
                    {event.city ? `, ${event.city}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedEvent && (
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" aria-hidden="true" />
                {dayjs(selectedEvent.date).format("MMM D, YYYY")}
              </span>
              {selectedEvent.startTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {selectedEvent.startTime}
                </span>
              )}
              {selectedEvent.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {selectedEvent.venue}
                  {selectedEvent.city ? `, ${selectedEvent.city}` : ""}
                </span>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((template) => {
                const Icon = template.icon
                return (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors",
                      "hover:bg-muted/50 hover:border-primary/50",
                      "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {template.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="notif-title"
              label="Title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Select
              id="notif-type"
              label="Notification type"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            id="notif-message"
            label="Message"
            placeholder="Write the notification message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm text-primary">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            <span>This notification will be sent via email and displayed in the notifications tab for all confirmed participants.</span>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={sending}>
              <Send className="size-4" aria-hidden="true" />
              Send Notification
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="mb-4 text-lg font-semibold text-foreground">Sent Notifications</h2>

      {!sentNotifications ? (
        <Loader />
      ) : sentNotifications.length === 0 ? (
        <EmptyState
          icon={<Send className="size-10" aria-hidden="true" />}
          title="No notifications sent yet"
          description="Your sent notifications will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sentNotifications.map((n: SentNotification, idx: number) => {
            const Icon = TYPE_ICON[n.type] || Megaphone
            const isExpanded = expandedIdx === idx
            return (
              <Card key={idx} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <Badge variant="outline">{n.type}</Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.message}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{dayjs(n.createdAt).fromNow()}</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" aria-hidden="true" />
                        {n.recipientCount} recipient{n.recipientCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="mt-1 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </span>
                </button>
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 px-5 py-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Full Message
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{n.message}</p>
                    {n.recipients.length > 0 && (
                      <>
                        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Sample Recipients
                        </p>
                        <div className="flex flex-col gap-1">
                          {n.recipients.map((r, ri) => (
                            <div key={ri} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{r.name}</span>
                              <span>{r.email}</span>
                            </div>
                          ))}
                          {n.recipientCount > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ...and {n.recipientCount - 5} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
