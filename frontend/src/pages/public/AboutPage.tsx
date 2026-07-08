import { Link } from "react-router-dom"
import { Search, CalendarCheck, QrCode, Award, BarChart3, ShieldCheck, ArrowRight, Mail } from "lucide-react"
import { Card, Button, Eyebrow } from "@/components/common/ui"
import { GithubIcon, LinkedinIcon } from "@/components/common/SocialIcons"

const values = [
  {
    icon: Search,
    title: "Discovery first",
    description:
      "Events shouldn't live in scattered group chats and posters. EventHub puts every event — tech, cultural, sports, business — in one searchable place.",
  },
  {
    icon: CalendarCheck,
    title: "Frictionless registration",
    description:
      "No Google Forms, no spreadsheets. One tap to register, and your ticket with a unique QR code is issued instantly.",
  },
  {
    icon: QrCode,
    title: "Honest attendance",
    description:
      "QR check-in at the door means attendance is tracked accurately and automatically — no manual registers, no proxies.",
  },
  {
    icon: Award,
    title: "Certificates that just happen",
    description:
      "Attend an event and your certificate is generated automatically. No chasing organizers weeks later.",
  },
  {
    icon: BarChart3,
    title: "Insight for organizers",
    description:
      "Live dashboards for registrations, attendance, ratings, and views — so organizers can run better events every time.",
  },
  {
    icon: ShieldCheck,
    title: "Trust built in",
    description:
      "Verified organizers, role-based access, and admin moderation keep the platform safe for everyone.",
  },
]

const stats = [
  { value: "3", label: "roles — attendee, organizer, admin" },
  { value: "6+", label: "event categories" },
  { value: "1 tap", label: "from discovery to ticket" },
  { value: "0", label: "spreadsheets needed" },
]

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:px-6 md:pt-24">
        <Eyebrow>about EventHub</Eyebrow>
        <h1 className="display mt-5 max-w-3xl text-4xl text-foreground md:text-6xl">
          Events deserve better than <span className="text-primary">forms</span> and spreadsheets.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
          EventHub started with a simple frustration: discovering campus and community events meant digging through
          group chats, registering meant yet another Google Form, attendance meant a paper register, and certificates
          arrived weeks late — if at all. We built one platform that handles the entire event lifecycle, from the
          moment you discover an event to the moment your certificate lands in your account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/events">
            <Button>
              Explore events
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">Become an organizer</Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <p className="display text-3xl text-primary">{s.value}</p>
              <p className="mt-1.5 font-mono text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* What we believe */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <Eyebrow>what we believe</Eyebrow>
        <h2 className="display mt-4 max-w-xl text-3xl text-foreground md:text-4xl">
          The full lifecycle, <span className="text-primary">handled.</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title} className="p-6 transition-colors hover:border-primary/40">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <v.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-extrabold tracking-tight text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{v.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Builder */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 md:px-6">
        <Card className="p-8 md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <Eyebrow>the builder</Eyebrow>
              <h2 className="display mt-4 text-3xl text-foreground">
                Built by <span className="text-primary">Arnav Mehta.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                EventHub is designed and developed by Arnav Mehta — a developer focused on building products that
                remove friction from everyday community experiences. Have feedback, found a bug, or want to
                collaborate? Reach out anytime.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="https://github.com/arnavvmehtaa718"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <GithubIcon className="size-4" aria-hidden="true" />
                  github
                </a>
                <a
                  href="https://www.linkedin.com/in/arnav-mehta-137583329/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <LinkedinIcon className="size-4" aria-hidden="true" />
                  linkedin
                </a>
                <a
                  href="mailto:arnavm.396@gmail.com"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  email
                </a>
              </div>
            </div>
            <div className="shrink-0">
              <Link to="/contact">
                <Button size="lg">
                  Get in touch
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
