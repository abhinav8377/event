"use client"

import { useState } from "react"
import useSWR from "swr"
import dayjs from "dayjs"
import { Search, ShieldBan, ShieldCheck } from "lucide-react"
import { useAppDispatch } from "@/app/store"
import * as adminApi from "@/api/adminApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Badge, Button, Input, Loader, EmptyState } from "@/components/common/ui"

export default function AdminUsers() {
  const dispatch = useAppDispatch()
  const [query, setQuery] = useState("")

  const { data: allUsers, mutate } = useSWR("all-users", () => adminApi.getAllUsers().then((r) => r.data))

  if (!allUsers) return <Loader />

  const users = allUsers
    .filter((u) => u.role === "USER")
    .filter(
      (u) =>
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()),
    )

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
      <PageHeader title="Users" description="Manage attendee accounts on the platform." />

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="user-search"
            placeholder="Search by name or email..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search term." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                        {u.name.charAt(0)}
                      </span>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3 text-muted-foreground">{dayjs(u.joinedAt).format("MMM D, YYYY")}</td>
                  <td className="px-5 py-3">
                    <Badge variant={u.blocked ? "destructive" : "success"}>{u.blocked ? "Blocked" : "Active"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      size="sm"
                      variant={u.blocked ? "success" : "destructive"}
                      onClick={() => toggleBlock(u.id)}
                    >
                      {u.blocked ? (
                        <ShieldCheck className="size-4" aria-hidden="true" />
                      ) : (
                        <ShieldBan className="size-4" aria-hidden="true" />
                      )}
                      {u.blocked ? "Unblock" : "Block"}
                    </Button>
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
