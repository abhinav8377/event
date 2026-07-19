"use client"

import { useState, useCallback, useEffect } from "react"
import { Users, CheckCircle, XCircle, Trash2, Search, Plus, MessageCircle, Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { getOrganizerCommunities, createCommunity, getCommunityMembers, approveMember, denyMember, removeMember } from "@/api/communityApi"
import { getOrganizerEvents } from "@/api/eventApi"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Modal } from "@/components/common/Modal"
import { Card, Badge, Button, EmptyState, Loader, Select } from "@/components/common/ui"
import ChatSection from "@/components/community/ChatSection"
import type { Community, CommunityMember } from "@/constants/types"

type View =
  | { mode: "list" }
  | { mode: "chat"; communityId: string }

export default function OrganizerCommunities() {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()

  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<{ id: string; title: string; status?: string }[]>([])
  const [view, setView] = useState<View>({ mode: "list" })

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState("")
  const [communityName, setCommunityName] = useState("")
  const [communityDesc, setCommunityDesc] = useState("")
  const [creating, setCreating] = useState(false)

  // Manage members modal state
  const [manageCommunity, setManageCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [membersLoading, setMembersLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadCommunities = useCallback(async () => {
    setLoading(true)
    try {
      const [comRes, evRes] = await Promise.all([getOrganizerCommunities(), getOrganizerEvents(user.id)])
      setCommunities(comRes.data)
      // Only allow creating a community for events that don't already have one.
      const takenEventIds = new Set(comRes.data.map((c: Community) => (typeof c.eventId === "object" ? c.eventId._id : c.eventId)))
      const available = evRes.data
        .filter((ev: any) => !takenEventIds.has(ev.id))
        .map((ev: any) => ({ id: ev.id, title: ev.title, status: ev.status }))
      setEvents(available)
    } catch (e) {
      dispatch(pushToast({ type: "error", message: "Failed to load communities" }))
    } finally {
      setLoading(false)
    }
  }, [dispatch, user.id])

  useEffect(() => {
    loadCommunities()
  }, [loadCommunities])

  const openCreate = () => {
    setSelectedEventId("")
    setCommunityName("")
    setCommunityDesc("")
    setCreateOpen(true)
  }

  if (view.mode === "chat") {
    return (
      <ChatSection
        communityId={view.communityId}
        onBack={() => setView({ mode: "list" })}
        canLeave={false}
      />
    )
  }

  const handleCreate = async () => {
    if (!selectedEventId) {
      dispatch(pushToast({ type: "error", message: "Please select an event" }))
      return
    }
    setCreating(true)
    try {
      const res = await createCommunity(selectedEventId, communityName, communityDesc)
      dispatch(pushToast({ type: "success", message: res.message }))
      setCreateOpen(false)
      loadCommunities()
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message || "Failed to create community" }))
    } finally {
      setCreating(false)
    }
  }

  const openManage = async (community: Community) => {
    setManageCommunity(community)
    setMemberSearch("")
    setMembersLoading(true)
    try {
      const res = await getCommunityMembers(community.id)
      setMembers(res.data)
    } catch (e) {
      dispatch(pushToast({ type: "error", message: "Failed to load members" }))
    } finally {
      setMembersLoading(false)
    }
  }

  const handleMemberAction = async (userId: string, action: "approve" | "deny" | "remove") => {
    if (!manageCommunity) return
    setActionLoading(userId + action)
    try {
      if (action === "approve") await approveMember(manageCommunity.id, userId)
      if (action === "deny") await denyMember(manageCommunity.id, userId)
      if (action === "remove") await removeMember(manageCommunity.id, userId)
      dispatch(pushToast({ type: "success", message: "Updated" }))
      const res = await getCommunityMembers(manageCommunity.id, memberSearch)
      setMembers(res.data)
      // Refresh pending counts in list
      setCommunities((prev) => prev.map((c) => (c.id === manageCommunity.id ? { ...c, pendingCount: res.data.filter((m) => m.status === "PENDING").length } : c)))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message || "Action failed" }))
    } finally {
      setActionLoading(null)
    }
  }

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  const pendingTotal = communities.reduce((sum, c) => sum + (c.pendingCount || 0), 0)

  return (
    <div>
      <PageHeader
        title="Community"
        description="Create event communities and manage member approvals."
        action={<Button onClick={openCreate}><Plus className="size-4" />Create Community</Button>}
      />

      {pendingTotal > 0 && (
        <Card className="mb-4 flex items-center gap-3 border-warning/40 bg-warning/5 p-4">
          <MessageCircle className="size-5 text-warning" />
          <p className="text-sm text-foreground">
            You have <span className="font-bold">{pendingTotal}</span> pending join request{pendingTotal !== 1 ? "s" : ""} across your communities.
          </p>
        </Card>
      )}

      {loading ? (
        <Loader label="Loading communities..." />
      ) : communities.length === 0 ? (
        <EmptyState
          icon={<Users className="size-10" />}
          title="No communities yet"
          description="Create a community for any of your events to let registered attendees connect."
          action={<Button onClick={openCreate}><Plus className="size-4" />Create Community</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => {
            const eventTitle = typeof c.eventId === "object" ? c.eventId.title : "Event"
            return (
              <Card key={c.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Users className="size-5" />
                  </span>
                  {c.pendingCount ? (
                    <Badge variant="warning">{c.pendingCount} pending</Badge>
                  ) : (
                    <Badge variant="outline">No pending</Badge>
                  )}
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">{c.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{eventTitle}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span>{c.memberCount} member{c.memberCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => openManage(c)}>
                    <Users className="size-4" />
                    Manage Members
                  </Button>
                  <Button size="sm" onClick={() => setView({ mode: "chat", communityId: c.id })}>
                    <MessageCircle className="size-4" />
                    Chat
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Community Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Community">
        <div className="space-y-4">
          <Select
            label="Event"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Select an event...</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}{ev.status ? ` (${ev.status})` : ""}
              </option>
            ))}
          </Select>
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground">
              All of your events already have a community, or you have no events yet.
            </p>
          )}
          <input
            type="text"
            placeholder="Community name (optional)"
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
          />
          <textarea
            placeholder="Description (optional)"
            value={communityDesc}
            onChange={(e) => setCommunityDesc(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
          />
          <p className="text-xs text-muted-foreground">
            Only attendees who registered for the chosen event can request to join this community.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={creating} onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Manage Members Modal */}
      <Modal open={!!manageCommunity} onClose={() => setManageCommunity(null)} title={`Manage: ${manageCommunity?.name || ""}`} panelClassName="max-w-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value)
                if (manageCommunity) getCommunityMembers(manageCommunity.id, e.target.value).then((r) => setMembers(r.data))
              }}
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring sm:w-72"
            />
          </div>
        </div>

        {membersLoading ? (
          <Loader label="Loading members..." />
        ) : filteredMembers.length === 0 ? (
          <EmptyState icon={<Users className="size-8" />} title="No members found" description="Try a different search term." />
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {filteredMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                    {m.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge
                    variant={m.status === "APPROVED" ? "success" : m.status === "PENDING" ? "warning" : "destructive"}
                  >
                    {m.status}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.status === "PENDING" && (
                    <>
                      <Button size="sm" variant="success" loading={actionLoading === m.userId + "approve"} onClick={() => handleMemberAction(m.userId, "approve")}>
                        <CheckCircle className="size-4" />Approve
                      </Button>
                      <Button size="sm" variant="destructive" loading={actionLoading === m.userId + "deny"} onClick={() => handleMemberAction(m.userId, "deny")}>
                        <XCircle className="size-4" />Deny
                      </Button>
                    </>
                  )}
                  {m.status === "APPROVED" && (
                    <Button size="sm" variant="outline" loading={actionLoading === m.userId + "remove"} onClick={() => handleMemberAction(m.userId, "remove")}>
                      <Trash2 className="size-4" />Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
