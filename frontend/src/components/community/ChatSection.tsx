"use client"

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react"
import { Users, MessageCircle, Send, LogOut, ArrowLeft, Reply, X, BarChart3, CheckCircle } from "lucide-react"
import dayjs from "dayjs"
import { useAppDispatch, useAppSelector } from "@/app/store"
import { getCommunityChat, leaveCommunity } from "@/api/communityApi"
import { getSocket } from "@/api/socket"
import { pushToast } from "@/features/toast/toastSlice"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, Button, Input } from "@/components/common/ui"
import { Modal } from "@/components/common/Modal"
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({})

  // Reply state
  const [replyTo, setReplyTo] = useState<{ id: string; senderName: string; preview: string } | null>(null)

  // Poll creation modal
  const [showPollModal, setShowPollModal] = useState(false)
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState(["", ""])
  const [creatingPoll, setCreatingPoll] = useState(false)

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

    const onTyping = (data: { userId: string; communityId: string }) => {
      if (data.userId === user.id) return
      setTypingUsers((prev) => ({ ...prev, [data.userId]: "" }))
    }
    socket.on("community:typing", onTyping)

    const onStopTyping = (data: { userId: string; communityId: string }) => {
      setTypingUsers((prev) => {
        const next = { ...prev }
        delete next[data.userId]
        return next
      })
    }
    socket.on("community:stopTyping", onStopTyping)

    const onPollUpdate = (msg: CommunityMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
    }
    socket.on("community:poll:update", onPollUpdate)

    return () => {
      active = false
      socket.off("community:message", onMessage)
      socket.off("community:typing", onTyping)
      socket.off("community:stopTyping", onStopTyping)
      socket.off("community:poll:update", onPollUpdate)
      socket.emit("community:leave", communityId)
    }
  }, [communityId, dispatch, onBack, user.id])

  // Emit typing indicator (throttled)
  const emitTyping = useCallback((typing: boolean) => {
    if (!socketRef.current || !communityId) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    socketRef.current.emit("community:typing", { communityId, isTyping: typing })
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("community:typing", { communityId, isTyping: false })
      }, 2000)
    }
  }, [communityId])

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value)
    if (e.target.value.trim()) {
      emitTyping(true)
    } else {
      emitTyping(false)
    }
  }

  const handleSend = () => {
    const text = draft.trim()
    if (!text || !socketRef.current) return
    setSending(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    emitTyping(false)

    const payload: any = { communityId, message: text }
    if (replyTo) payload.replyToId = replyTo.id

    socketRef.current.emit("community:message", payload, (r: any) => {
      setSending(false)
      if (r?.ok) {
        setDraft("")
        setReplyTo(null)
      } else {
        dispatch(pushToast({ type: "error", message: r?.error || "Failed to send" }))
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "Escape") {
      setReplyTo(null)
    }
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

  const handleReply = (msg: CommunityMessage) => {
    setReplyTo({
      id: msg.id,
      senderName: msg.senderName,
      preview: msg.message?.slice(0, 100),
    })
  }

  const handleVote = (messageId: string, optionIndex: number) => {
    if (!socketRef.current) return
    socketRef.current.emit("community:poll:vote", { communityId, messageId, optionIndex }, (r: any) => {
      if (!r?.ok) {
        dispatch(pushToast({ type: "error", message: r?.error || "Vote failed" }))
      }
    })
  }

  const handleCreatePoll = () => {
    const q = pollQuestion.trim()
    const opts = pollOptions.map((o) => o.trim()).filter(Boolean)
    if (!q || opts.length < 2 || !socketRef.current) return
    setCreatingPoll(true)
    socketRef.current.emit("community:poll:create", { communityId, question: q, options: opts }, (r: any) => {
      setCreatingPoll(false)
      if (r?.ok) {
        setShowPollModal(false)
        setPollQuestion("")
        setPollOptions(["", ""])
      } else {
        dispatch(pushToast({ type: "error", message: r?.error || "Failed to create poll" }))
      }
    })
  }

  const typingNames = Object.keys(typingUsers)
    .map((uid) => {
      const m = chat?.members.find((mem) => mem.id === uid)
      return m?.name
    })
    .filter(Boolean) as string[]

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
          <div className="scrollbar-hide min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {chat.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {m.name.charAt(0)}
                </span>
                <span className="truncate text-sm text-foreground">
                  {m.name}
                  {m.id === user.id && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                  {typingUsers[m.id] !== undefined && (
                    <span className="ml-1.5 text-[10px] italic text-primary">typing...</span>
                  )}
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
          <div className="scrollbar-hide flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <MessageCircle className="size-8" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const mine = msg.senderId === user.id
                const isSystem = msg.type === "system"
                const isPoll = msg.type === "poll"

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-1.5">
                        <Users className="size-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{msg.message}</p>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={msg.id} className="group flex flex-col items-stretch gap-1">
                    {isPoll ? (
                      <div className={`self-center w-full max-w-md ${mine ? "self-end" : "self-start"}`}>
                        <div className="rounded-2xl border border-border bg-card p-4">
                          <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <BarChart3 className="size-3.5" />
                            <span>{msg.senderName} created a poll</span>
                          </div>
                          <p className="mb-3 text-sm font-bold text-foreground">{msg.pollQuestion}</p>
                          <div className="flex flex-col gap-2">
                            {msg.pollOptions?.map((opt, idx) => {
                              const totalVotes = msg.pollOptions!.reduce((s, o) => s + o.votes.length, 0)
                              const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0
                              const voted = opt.votes.includes(user.id)
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleVote(msg.id, idx)}
                                  className={`relative flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                    voted
                                      ? "border-primary bg-primary/5 text-foreground"
                                      : "border-border hover:border-primary/50 hover:bg-muted"
                                  }`}
                                >
                                  <span className="relative z-10 flex items-center gap-1.5">
                                    {voted && <CheckCircle className="size-4 text-primary" />}
                                    <span>{opt.text}</span>
                                  </span>
                                  <span className="relative z-10 ml-auto text-xs tabular-nums text-muted-foreground">
                                    {opt.votes.length} vote{opt.votes.length !== 1 ? "s" : ""} ({pct}%)
                                  </span>
                                  <span
                                    className="absolute inset-0 bg-primary/10"
                                    style={{ width: `${pct}%`, transition: "width 0.3s ease" }}
                                  />
                                </button>
                              )
                            })}
                          </div>
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            {dayjs(msg.createdAt).format("h:mm A")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`relative max-w-[75%] rounded-2xl px-3.5 py-2 ${
                            mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          {/* Reply reference */}
                          {msg.replyToId && (
                            <div
                              className={`mb-1.5 cursor-pointer rounded-lg border-l-4 px-2 py-1 text-xs ${
                                mine
                                  ? "border-primary-foreground/40 bg-primary-foreground/10"
                                  : "border-muted-foreground/30 bg-foreground/5"
                              }`}
                              onClick={() => {
                                const el = document.getElementById(`msg-${msg.replyToId}`)
                                el?.scrollIntoView({ behavior: "smooth", block: "center" })
                              }}
                            >
                              <p className="font-semibold opacity-70">{msg.replyToSender}</p>
                              <p className="truncate opacity-60">{msg.replyToMessage}</p>
                            </div>
                          )}
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
                          <p className="whitespace-pre-wrap wrap-break-word text-sm" id={`msg-${msg.id}`}>
                            {msg.message}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className={`text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {dayjs(msg.createdAt).format("h:mm A")}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleReply(msg)}
                              className={`flex items-center gap-0.5 text-[10px] opacity-0 transition-opacity group-hover:opacity-100 hover:underline ${
                                mine ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                              title="Reply"
                            >
                              <Reply className="size-3" />
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {/* Typing indicator */}
            {typingNames.length > 0 && (
              <div className="flex items-center gap-1.5 pl-1 text-xs italic text-muted-foreground">
                <span className="flex gap-0.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </span>
                <span>
                  {typingNames.length === 1
                    ? `${typingNames[0]} is typing...`
                    : `${typingNames.join(", ")} are typing...`}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply bar */}
          {replyTo && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm">
              <Reply className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-foreground">Replying to {replyTo.senderName}: </span>
                <span className="text-muted-foreground">{replyTo.preview}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
            <textarea
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message..."
              className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
            />
            <Button variant="ghost" size="sm" onClick={() => setShowPollModal(true)} title="Create Poll">
              <BarChart3 className="size-4" />
            </Button>
            <Button onClick={handleSend} loading={sending} disabled={!draft.trim()}>
              <Send className="size-4" />Send
            </Button>
          </div>
        </Card>
      </div>
      </div>

      {/* Poll creation modal */}
      <Modal open={showPollModal} onClose={() => setShowPollModal(false)} title="Create a Poll">
        <div className="flex flex-col gap-3 p-1">
          <Input
            id="poll-question"
            label="Question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="What time suits everyone?"
          />
          <p className="text-xs font-medium text-muted-foreground">Options (at least 2)</p>
          {pollOptions.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                id={`poll-option-${idx}`}
                value={opt}
                onChange={(e) => {
                  const next = [...pollOptions]
                  next[idx] = e.target.value
                  setPollOptions(next)
                }}
                placeholder={`Option ${idx + 1}`}
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPollOptions([...pollOptions, ""])}
          >
            + Add option
          </Button>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPollModal(false)}>Cancel</Button>
            <Button
              loading={creatingPoll}
              disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
              onClick={handleCreatePoll}
            >
              Create Poll
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
