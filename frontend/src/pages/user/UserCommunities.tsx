"use client"

import { useState, useCallback, useEffect } from "react"
import { Users, MessageCircle, CheckCircle } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { getUserCommunities, requestJoinCommunity } from "@/api/communityApi"
import { pushToast } from "@/features/toast/toastSlice"
import { Card, Badge, Button, EmptyState, Loader } from "@/components/common/ui"
import { PageHeader } from "@/components/common/PageHeader"
import ChatSection from "@/components/community/ChatSection"
import type { Community } from "@/constants/types"

type View =
  | { mode: "list" }
  | { mode: "chat"; communityId: string }

export default function UserCommunities() {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()

  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>({ mode: "list" })

  // Join approval modal
  const [approval, setApproval] = useState<Community | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const loadCommunities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUserCommunities()
      setCommunities(res.data)
    } catch (e) {
      dispatch(pushToast({ type: "error", message: "Failed to load communities" }))
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    if (view.mode === "list") loadCommunities()
  }, [view, loadCommunities])

  const openApproval = (c: Community) => {
    setApproval(c)
    setRequestSent(false)
  }

  const handleRequestJoin = async () => {
    if (!approval) return
    setRequesting(true)
    try {
      const res = await requestJoinCommunity(approval.id)
      setRequestSent(true)
      dispatch(pushToast({ type: "success", message: res.message }))
      // Optimistically update status to pending
      setCommunities((prev) => prev.map((c) => (c.id === approval.id ? { ...c, myStatus: "PENDING" } : c)))
    } catch (e) {
      dispatch(pushToast({ type: "error", message: (e as Error).message || "Request failed" }))
    } finally {
      setRequesting(false)
    }
  }

  const handleOpenChat = (c: Community) => {
    setView({ mode: "chat", communityId: c.id })
  }

  if (view.mode === "chat") {
    return <ChatSection communityId={view.communityId} onBack={() => setView({ mode: "list" })} onLeft={() => setView({ mode: "list" })} />
  }

  return (
    <div>
      <PageHeader
        title="Communities"
        description="Join communities for the events you've registered for and chat with other attendees."
      />

      {loading ? (
        <Loader label="Loading communities..." />
      ) : communities.length === 0 ? (
        <EmptyState
          icon={<Users className="size-10" />}
          title="No communities available"
          description="Communities are available only for events you have successfully registered for. Register for an event to unlock its community."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => {
            const eventTitle = typeof c.eventId === "object" ? c.eventId.title : "Event"
            const isApproved = c.myStatus === "APPROVED"
            const isPending = c.myStatus === "PENDING"
            return (
              <Card key={c.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Users className="size-5" />
                  </span>
                  <Badge variant={isApproved ? "success" : isPending ? "warning" : "outline"}>
                    {isApproved ? "Joined" : isPending ? "Pending" : "Not joined"}
                  </Badge>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">{c.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{eventTitle}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span>{c.memberCount} member{c.memberCount !== 1 ? "s" : ""}</span>
                </div>

                <div className="mt-4">
                  {isApproved ? (
                    <Button className="w-full" onClick={() => handleOpenChat(c)}>
                      <MessageCircle className="size-4" />Chat Now
                    </Button>
                  ) : isPending ? (
                    <Button className="w-full" variant="outline" disabled>
                      <CheckCircle className="size-4" />Request Pending
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => openApproval(c)}>
                      <Users className="size-4" />Join Community
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Join approval modal */}
      <ApprovalModal
        community={approval}
        requestSent={requestSent}
        requesting={requesting}
        onClose={() => setApproval(null)}
        onRequest={handleRequestJoin}
        onOpenChat={() => {
          const c = approval!
          setApproval(null)
          handleOpenChat(c)
        }}
      />
    </div>
  )
}

function ApprovalModal({
  community,
  requestSent,
  requesting,
  onClose,
  onRequest,
  onOpenChat,
}: {
  community: Community | null
  requestSent: boolean
  requesting: boolean
  onClose: () => void
  onRequest: () => void
  onOpenChat: () => void
}) {
  if (!community) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-xl">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Users className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-foreground">{community.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {typeof community.eventId === "object" ? community.eventId.title : "Event"} · {community.memberCount} members
        </p>

        {requestSent ? (
          <div className="mt-5 rounded-lg bg-success/10 p-4 text-sm text-success">
            <CheckCircle className="mx-auto mb-2 size-6" />
            Your request has been sent, wait for approval to join.
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Send an approval request to join this community. The organizer will review your request.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {requestSent ? (
            <>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </>
          ) : (
            <>
              <Button loading={requesting} onClick={onRequest}>
                Send Approval to Join
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
