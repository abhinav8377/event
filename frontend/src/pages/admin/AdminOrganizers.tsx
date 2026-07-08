"use client"

import useSWR from "swr"
import dayjs from "dayjs"
import { BadgeCheck, ShieldBan, ShieldCheck } from "lucide-react"
import { useAppDispatch } from "@/app/store"
import * as adminApi from "@/api/adminApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Badge, Button, Loader, EmptyState } from "@/components/common/ui"

export default function AdminOrganizers() {
  const dispatch = useAppDispatch()

  const { data: allUsers, mutate } = useSWR("all-users", () => adminApi.getAllUsers().then((r) => r.data))
  const { data: allEvents } = useSWR("admin-events", () => adminApi.getAllEvents().then((r) => r.data))

  if (!allUsers || !allEvents) return <Loader />

  const organizers = allUsers.filter((u) => u.role === "ORGANIZER")
  const eventCountByOrganizer = allEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.organizerId] = (acc[e.organizerId] ?? 0) + 1
    return acc
  }, {})

  const verify = async (id: string) => {
    try {
      const res = await adminApi.verifyOrganizer(id)
      dispatch(pushToast({ type: "success", message: res.message }))
      mutate()
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    }
  }

  const toggleBlock = async (id: string) => {
    try {
      const res = await adminApi.toggleBlockUser(id)
      dispatch(pushToast({ type: "success", message: res.message }))
      mutate()
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message }))
    }
  }

  return (
    <div>
      <PageHeader title="Organizers" description="Verify and manage event organizers." />

      {organizers.length === 0 ? (
        <EmptyState title="No organizers" description="Organizer accounts will appear here." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Organizer</th>
                <th className="px-5 py-3 font-semibold">Organization</th>
                <th className="px-5 py-3 font-semibold">Events</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organizers.map((o) => (
                <tr key={o.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                        {o.name.charAt(0)}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{o.organization ?? "—"}</td>
                  <td className="px-5 py-3 text-foreground">{eventCountByOrganizer[o.id] ?? 0}</td>
                  <td className="px-5 py-3 text-muted-foreground">{dayjs(o.joinedAt).format("MMM D, YYYY")}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={o.verified ? "success" : "warning"}>
                        {o.verified ? "Verified" : "Pending"}
                      </Badge>
                      {o.blocked && <Badge variant="destructive">Blocked</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {!o.verified && (
                        <Button size="sm" variant="success" onClick={() => verify(o.id)}>
                          <BadgeCheck className="size-4" aria-hidden="true" />
                          Verify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={o.blocked ? "success" : "destructive"}
                        onClick={() => toggleBlock(o.id)}
                      >
                        {o.blocked ? (
                          <ShieldCheck className="size-4" aria-hidden="true" />
                        ) : (
                          <ShieldBan className="size-4" aria-hidden="true" />
                        )}
                        {o.blocked ? "Unblock" : "Block"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
