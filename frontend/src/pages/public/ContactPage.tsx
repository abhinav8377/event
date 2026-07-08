"use client"

import { useState } from "react"
import { Mail, Send, MessageSquare, CheckCircle2 } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "@/components/common/SocialIcons"
import { useAppDispatch } from "@/app/store"
import { pushToast } from "@/features/toast/toastSlice"
import { Card, Button, Input, Textarea, Select, Eyebrow } from "@/components/common/ui"

const channels = [
  {
    icon: Mail,
    label: "email",
    value: "arnavm.396@gmail.com",
    href: "mailto:arnavm.396@gmail.com",
    note: "best for detailed queries",
  },
  {
    icon: GithubIcon,
    label: "github",
    value: "github.com/arnavvmehtaa718",
    href: "https://github.com/arnavvmehtaa718",
    note: "issues, code & contributions",
  },
  {
    icon: LinkedinIcon,
    label: "linkedin",
    value: "Arnav Mehta",
    href: "https://www.linkedin.com/in/arnav-mehta-137583329/",
    note: "professional & collaboration",
  },
]

export default function ContactPage() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [topic, setTopic] = useState("general")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      dispatch(pushToast({ type: "error", message: "Please fill in your name, email, and message." }))
      return
    }
    const subject = encodeURIComponent(`[EventHub · ${topic}] Message from ${name}`)
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`)
    window.location.href = `mailto:arnavm.396@gmail.com?subject=${subject}&body=${body}`
    setSent(true)
    dispatch(pushToast({ type: "success", message: "Opening your email client to send the message." }))
  }

  return (
    <div className="relative overflow-hidden">
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 md:px-6 md:pt-24">
        <Eyebrow>contact</Eyebrow>
        <h1 className="display mt-5 max-w-2xl text-4xl text-foreground md:text-6xl">
          Let&apos;s <span className="text-primary">talk.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
          Questions about the platform, feedback on an event, a bug report, or a collaboration idea — pick whichever
          channel suits you. Messages usually get a reply within a day or two.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Channels */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group"
              >
                <Card className="flex items-center gap-4 p-5 transition-colors group-hover:border-primary/40">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <c.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-xs text-muted-foreground">{c.label}</span>
                    <span className="block truncate font-bold tracking-tight text-foreground">{c.value}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{c.note}</span>
                  </span>
                </Card>
              </a>
            ))}
            <Card className="p-5">
              <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <MessageSquare className="size-4 text-primary" aria-hidden="true" />
                prefer the form? it opens your email client with everything pre-filled.
              </p>
            </Card>
          </div>

          {/* Form */}
          <Card className="p-6 md:p-8 lg:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
                <h2 className="display text-2xl text-foreground">Message on its way.</h2>
                <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                  Your email client should have opened with the message pre-filled. Didn&apos;t work? Email directly at{" "}
                  <a href="mailto:arnavm.396@gmail.com" className="font-semibold text-primary hover:underline">
                    arnavm.396@gmail.com
                  </a>
                  .
                </p>
                <Button variant="outline" className="mt-2" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <h2 className="display text-2xl text-foreground">Send a message.</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="contact-name"
                    label="Your name"
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    id="contact-email"
                    type="email"
                    label="Your email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Select id="contact-topic" label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="general">General question</option>
                  <option value="feedback">Feedback</option>
                  <option value="bug">Bug report</option>
                  <option value="organizer">Organizer support</option>
                  <option value="collaboration">Collaboration</option>
                </Select>
                <Textarea
                  id="contact-message"
                  label="Message"
                  placeholder="Tell us what's on your mind..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-36"
                  required
                />
                <Button type="submit" size="lg" className="self-start">
                  <Send className="size-4" aria-hidden="true" />
                  Send message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>
    </div>
  )
}
