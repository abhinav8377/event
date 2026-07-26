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

const builders = [
  { name: "Adit Singh", initials: "AS" },
  { name: "Arnav Mehta", initials: "AM" },
  { name: "Abhinav Tiwari", initials: "AT" },
]

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.16] blur-3xl"
          aria-hidden="true"
        />
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 md:px-6 md:pb-20 md:pt-28">
        <Eyebrow>about EventHub</Eyebrow>
        <h1
          className="display !normal-case mt-6 max-w-3xl text-4xl text-foreground md:text-6xl"
          style={{ letterSpacing: "-0.04em", lineHeight: 0.95 }}
        >
          Events deserve better than <span className="text-primary">forms</span> and spreadsheets.
        </h1>
        <div className="mt-8 flex flex-col gap-7 border-t border-border pt-7 max-w-2xl">
          <p className="text-base leading-relaxed text-[color:var(--landing-secondary-foreground)] text-pretty">
            EventHub started with a simple frustration: discovering campus and community events meant digging through
            group chats, registering meant yet another Google Form, attendance meant a paper register, and certificates
            arrived weeks late — if at all. We built one platform that handles the entire event lifecycle, from the
            moment you discover an event to the moment your certificate lands in your account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg">
                Explore events
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline">Become an organizer</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <p className="display !normal-case text-3xl text-primary">{s.value}</p>
              <p className="mt-1.5 font-mono text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* What we believe */}
      <section className="border-t border-border bg-card/40">
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <Eyebrow>what we believe</Eyebrow>
          <h2
            className="display !normal-case mt-5 max-w-xl text-3xl text-foreground md:text-5xl"
            style={{ letterSpacing: "-0.03em", lineHeight: 0.95 }}
          >
            The full lifecycle, <span className="text-primary">handled.</span>
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title} className="p-7 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <v.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold tracking-tight text-foreground">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">{v.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Builder */}
      <section className="border-t border-border">
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <Card className="p-8 md:p-10">
            <div className="grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-start">
              <div>
                <Eyebrow>the builders</Eyebrow>
                <h2
                  className="display !normal-case mt-5 max-w-md text-3xl text-foreground"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  Built by a small team that ships.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
                  EventHub is designed and developed by a three-person team focused on removing friction from
                  everyday community experiences — from the first search to the final certificate.
                </p>
                <ul className="mt-7 flex flex-wrap gap-2.5">
                  {builders.map((b) => (
                    <li
                      key={b.name}
                      className="flex items-center gap-2.5 rounded-full border border-border bg-background py-1.5 pl-1.5 pr-4"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-accent-foreground">
                        {b.initials}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{b.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-6">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">get in touch</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                    Have feedback, found a bug, or want to collaborate? Reach out anytime — we read everything.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                  <a
                    href="https://github.com/arnavvmehtaa718"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <GithubIcon className="size-4" aria-hidden="true" />
                    github
                  </a>
                  <a
                    href="https://www.linkedin.com/in/arnav-mehta-137583329/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <LinkedinIcon className="size-4" aria-hidden="true" />
                    linkedin
                  </a>
                  <a
                    href="mailto:arnavm.396@gmail.com"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    email
                  </a>
                </div>
                <Link to="/contact">
                  <Button size="lg" className="w-full">
                    Get in touch
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
