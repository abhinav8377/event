"use client"

import { useState } from "react"
import useSWR from "swr"
import { Link } from "react-router-dom"
import dayjs from "dayjs"
import { Search, Ban, Trash2 } from "lucide-react"
import { useAppDispatch } from "@/app/store"
import * as adminApi from "@/api/adminApi"
import * as eventApi from "@/api/eventApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Modal } from "@/components/common/Modal"
import { Card, Badge, Button, Input, Loader, EmptyState } from "@/components/common/ui"
import type { EventItem, EventStatus } from "@/constants/types"

const statusVariant: Record<EventStatus, "default" | "success" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PUBLISHED: "success",
  CANCELLED: "destructive",
  COMPLETED: "default",
}

export default function AdminEvents() {
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState<EventItem | null>(null)

  const { data: allEvents, mutate } = useSWR("admin-events", () => adminApi.getAllEvents().then((r) => r.data))

  if (!allEvents) return <Loader />

  const events = allEvents.filter(
    (e) =>
      !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.organizerName.toLowerCase().includes(query.toLowerCase()),
  )

  const cancelEvent = async (id: string) => {
    try {
      const res = await eventApi.setEventStatus(id, "CANCELLED")
      dispatch(pushToast({ type: "success", message: res.message }))
      mutate()
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      const res = await adminApi.adminDeleteEvent(deleting.id)
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
      <PageHeader title="All Events" description="Moderate every event on the platform." />

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="event-search"
            placeholder="Search by title or organizer..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search events"
          />
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events found" description="Try a different search term." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Organizer</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Registrations</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <Link to={`/events/${e.id}`} className="font-medium text-foreground hover:text-primary">
                      {e.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{e.category}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{e.organizerName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{dayjs(e.startDate).format("MMM D, YYYY")}</td>
                  <td className="px-5 py-3 text-foreground">
                    {e.registeredCount} / {e.capacity}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant[e.status]}>{e.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {e.status === "PUBLISHED" && (
                        <Button size="sm" variant="destructive" onClick={() => cancelEvent(e.id)}>
                          <Ban className="size-4" aria-hidden="true" />
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(e)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete event">
        <p className="text-sm text-muted-foreground text-pretty">
          {`Are you sure you want to delete "${deleting?.title ?? ""}"? This action cannot be undone.`}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete event
          </Button>
        </div>
      </Modal>
    </div>
  )
}
