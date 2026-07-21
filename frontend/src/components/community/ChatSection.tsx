"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { Users, MessageCircle, Send, LogOut, ArrowLeft } from "lucide-react"
import dayjs from "dayjs"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { getCommunityChat, leaveCommunity } from "@/api/communityApi"
import { getSocket } from "@/api/socket"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button } from "@/components/common/ui"
import type { CommunityChatData, CommunityMessage } from "@/constants/types"

export default function ChatSection({
  communityId,
  onBack,
  onLeft,
  canLeave = true,
}: {
  communityId: string
  onBack: () => void
  onLeft?: () => void
  canLeave?: boolean
}) {
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()

  const [chat, setChat] = useState<CommunityChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useLayoutEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    let active = true
    const socket = getSocket()
    socketRef.current = socket

    ;(async () => {
      try {
        const res = await getCommunityChat(communityId)
        if (!active) return
        setChat(res.data)
        setMessages(res.data.messages)
      } catch (e) {
        if (active) {
          dispatch(pushToast({ type: "error", message: (e as Error).message || "Cannot open chat" }))
          onBack()
        }
      } finally {
        if (active) setLoading(false)
      }
    })()

    const joinRoom = () => socket.emit("community:join", communityId, (r: any) => {})
    if (socket.connected) joinRoom()
    else socket.once("connect", joinRoom)

    const onMessage = (msg: CommunityMessage) => {
      setMessages((prev) => [...prev, msg])
    }
    socket.on("community:message", onMessage)

    return () => {
      active = false
      socket.off("community:message", onMessage)
      socket.emit("community:leave", communityId)
    }
  }, [communityId, dispatch, onBack])

  const handleSend = () => {
    const text = draft.trim()
    if (!text || !socketRef.current) return
    setSending(true)
    socketRef.current.emit("community:message", { communityId, message: text }, (r: any) => {
      setSending(false)
      if (r?.ok) setDraft("")
      else dispatch(pushToast({ type: "error", message: r?.error || "Failed to send" }))
    })
  }

  const handleLeave = async () => {
    try {
      await leaveCommunity(communityId)
      dispatch(pushToast({ type: "success", message: "You left the community" }))
    } catch {
      // ignore
    }
    if (onLeft) onLeft()
    else onBack()
  }

  const handleClose = () => {
    onBack()
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Community Chat" />
        <p className="py-16 text-center text-sm text-muted-foreground">Loading chat...</p>
      </div>
    )
  }

  if (!chat) return null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={chat.community.name}
        description="Community chat"
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Left panel */}
        <Card className="flex h-full min-h-0 flex-col p-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground">{chat.community.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Created {dayjs(chat.community.createdAt).format("MMM D, YYYY")}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3.5" />{chat.community.memberCount} total members
            </p>
          </div>
          <p className="py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">Members</p>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {chat.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {m.name.charAt(0)}
                </span>
                <span className="truncate text-sm text-foreground">
                  {m.name}
                  {m.id === user.id && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                  {m.isOrganizer && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                      organizer
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={handleClose}>
              <ArrowLeft className="size-4" />Close Chat
            </Button>
            {canLeave && (
              <Button variant="destructive" size="sm" onClick={handleLeave}>
                <LogOut className="size-4" />Leave Community
              </Button>
            )}
          </div>
        </Card>

        {/* Right panel (chat) */}
        <Card className="flex h-full min-h-0 flex-col p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <MessageCircle className="size-8" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const mine = msg.senderId === user.id
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {!mine && (
                        <p className="mb-0.5 flex items-center gap-1 text-xs font-semibold opacity-80">
                          {msg.senderName}
                          {msg.isOrganizer && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                              organizer
                            </span>
                          )}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap wrap-break-word text-sm">{msg.message}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {dayjs(msg.createdAt).format("h:mm A")}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
              placeholder="Type a message..."
              className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
            />
            <Button onClick={handleSend} loading={sending} disabled={!draft.trim()}>
              <Send className="size-4" />Send
            </Button>
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
