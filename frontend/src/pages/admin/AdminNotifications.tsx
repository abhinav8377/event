"use client"

import { useState } from "react"
import useSWR from "swr"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Send, Users, Megaphone, Ticket, Clock, Award, Bell, ChevronDown, ChevronUp } from "lucide-react"
import { useAppDispatch } from "@/app/store"
import * as adminApi from "@/api/adminApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Badge, Button, Input, Textarea, Select, Loader, EmptyState } from "@/components/common/ui"
import type { NotificationType, SentNotification } from "@/constants/types"
import clsx from "clsx"

dayjs.extend(relativeTime)

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "UPDATE", label: "Event Update" },
  { value: "REMINDER", label: "Reminder" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "CERTIFICATE", label: "Certificate" },
]

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  GENERAL: Megaphone,
  UPDATE: Megaphone,
  REMINDER: Clock,
  REGISTRATION: Ticket,
  CERTIFICATE: Award,
}

export default function AdminNotifications() {
  const dispatch = useAppDispatch()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [targetRole, setTargetRole] = useState<"USER" | "ORGANIZER">("USER")
  const [type, setType] = useState<NotificationType>("GENERAL")
  const [sending, setSending] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const { data: sentNotifications, mutate } = useSWR("admin-sent-notifications", () =>
    adminApi.getSentNotifications().then((r) => r.data),
  )

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      dispatch(pushToast({ type: "error", message: "Title and message are required" }))
      return
    }
    setSending(true)
    try {
      const res = await adminApi.sendAdminNotification({
        title: title.trim(),
        message: message.trim(),
        targetRole,
        type,
      })
      dispatch(pushToast({ type: "success", message: res.message }))
      setTitle("")
      setMessage("")
      setType("GENERAL")
      setTargetRole("USER")
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
        description="Create and send custom notifications to users or organizers."
      />

      <Card className="mb-8 p-6">
        <form onSubmit={handleSend} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="notif-title"
              label="Title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notif-role" className="text-sm font-medium text-foreground">
                Send to
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTargetRole("USER")}
                  className={clsx(
                    "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                    targetRole === "USER"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Users className="size-4" aria-hidden="true" />
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole("ORGANIZER")}
                  className={clsx(
                    "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                    targetRole === "ORGANIZER"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Megaphone className="size-4" aria-hidden="true" />
                  Organizers
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
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
                      Message
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{n.message}</p>
                    {n.recipients.length > 0 && (
                      <>
                        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Recipients
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
