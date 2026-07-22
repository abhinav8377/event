"use client"

import { useEffect } from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Bell, Ticket, Clock, Megaphone, Award, CheckCheck } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/notifications/notificationSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button, EmptyState } from "@/components/common/ui"
import type { NotificationType } from "@/constants/types"
import clsx from "clsx"

dayjs.extend(relativeTime)

const typeIcon: Record<NotificationType, typeof Bell> = {
  REGISTRATION: Ticket,
  REMINDER: Clock,
  UPDATE: Megaphone,
  CERTIFICATE: Award,
  GENERAL: Bell,
}

export default function NotificationsPage() {
  const user = useAppSelector((s) => s.auth.user)!
  const notifications = useAppSelector((s) => s.notifications.items)
  const dispatch = useAppDispatch()
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    dispatch(fetchNotifications(user.id))
  }, [dispatch, user.id])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "You're all caught up."}
        action={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={() => dispatch(markAllNotificationsRead(user.id))}>
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-10" aria-hidden="true" />}
          title="No notifications"
          description="Event updates, reminders, and certificates will appear here."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="scrollbar-hide scroll-area max-h-[660px] divide-y divide-border">
            {notifications.map((n) => {
              const Icon = typeIcon[n.type]
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && dispatch(markNotificationRead(n.id))}
                  className={clsx(
                    "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted",
                    !n.read && "bg-accent/40",
                  )}
                >
                  <span
                    className={clsx(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                      n.read ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={clsx("text-sm text-foreground", !n.read && "font-bold")}>{n.title}</p>
                      {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{dayjs(n.createdAt).fromNow()}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
