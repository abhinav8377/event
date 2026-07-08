"use client"

import { useState } from "react"
import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import { CalendarRange, Plus, Pencil, Trash2, Upload, Ban, Award } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import * as eventApi from "@/api/eventApi"
import * as certificateApi from "@/api/certificateApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Modal } from "@/components/common/Modal"
import { Card, Badge, Button, Loader, EmptyState } from "@/components/common/ui"
import type { EventItem, EventStatus } from "@/constants/types"
import clsx from "clsx"

const statusVariant: Record<EventStatus, "default" | "success" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PUBLISHED: "success",
  CANCELLED: "destructive",
  COMPLETED: "default",
}

const filters: ("All" | EventStatus)[] = ["All", "DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"]

export default function OrganizerEvents() {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()
  const [filter, setFilter] = useState<(typeof filters)[number]>("All")
  const [deleting, setDeleting] = useState<EventItem | null>(null)

  const { data: myEvents, mutate } = useSWR(["organizer-events", user.id], () =>
    eventApi.getOrganizerEvents(user.id).then((r) => r.data),
  )

  if (!myEvents) return <Loader />

  const filtered = filter === "All" ? myEvents : myEvents.filter((e) => e.status === filter)

  const generateCerts = async (event: EventItem) => {
    try {
      const res = await certificateApi.generateCertificates(event.id)
      dispatch(pushToast({ type: "success", message: `Generated ${res.data.generated} certificate(s) for ${event.title}` }))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    }
  }

  const setStatus = async (event: EventItem, status: EventStatus) => {
    try {
      const res = await eventApi.setEventStatus(event.id, status)
      dispatch(pushToast({ type: "success", message: res.message }))
      mutate()
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      const res = await eventApi.deleteEvent(deleting.id)
      dispatch(pushToast({ type: "success", message: res.message }))
      mutate()
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Events"
        description="Create, edit, publish, and manage your events."
        action={
          <Link to="/organizer/events/new">
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Create event
            </Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="size-10" aria-hidden="true" />}
          title="No events found"
          description={filter === "All" ? "Create your first event to get started." : `You have no ${filter.toLowerCase()} events.`}
          action={
            filter === "All" ? (
              <Link to="/organizer/events/new">
                <Button size="sm">Create event</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((event) => (
            <Card key={event.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
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
                  <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dayjs(event.startDate).format("MMM D, YYYY · h:mm A")} · {event.city || "Online"}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{event.registeredCount}</strong> / {event.capacity} registered
                  </span>
                  <span>
                    <strong className="text-foreground">{event.attendanceCount}</strong> checked in
                  </span>
                  <span>
                    <strong className="text-foreground">{event.views.toLocaleString()}</strong> views
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {event.status === "DRAFT" && (
                  <Button size="sm" variant="success" onClick={() => setStatus(event, "PUBLISHED")}>
                    <Upload className="size-4" aria-hidden="true" />
                    Publish
                  </Button>
                )}
                {(event.status === "PUBLISHED" || event.status === "COMPLETED") && (
                  <Button size="sm" variant="success" onClick={() => generateCerts(event)}>
                    <Award className="size-4" aria-hidden="true" />
                    Certificates
                  </Button>
                )}
                {event.status === "PUBLISHED" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(event, "CANCELLED")}>
                    <Ban className="size-4" aria-hidden="true" />
                    Cancel
                  </Button>
                )}
                <Link to={`/organizer/events/${event.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                </Link>
                <Button size="sm" variant="destructive" onClick={() => setDeleting(event)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete event">
        <p className="text-sm text-muted-foreground text-pretty">
          {`Are you sure you want to delete "${deleting?.title ?? ""}"? This will remove the event and cannot be undone.`}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Keep event
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete event
          </Button>
        </div>
      </Modal>
    </div>
  )
}
