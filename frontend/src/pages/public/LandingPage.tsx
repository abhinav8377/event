"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  QrCode,
  Award,
  BellRing,
  BarChart3,
  Search,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import { getUpcomingEvents, getPopularEvents } from "@/api/eventApi";
import type { EventItem } from "@/constants/types";
import { EventCard } from "@/components/cards/EventCard";
import { Button, Skeleton, Eyebrow } from "@/components/common/ui";

const features = [
  {
    icon: Search,
    title: "Discovery",
    tag: "search + filters",
    description:
      "Search and filter events by category, city, and mode. Everything in one place instead of scattered group chats.",
    rows: [
      "Filter by category, city & mode",
      "Online, offline & hybrid events",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Registration",
    tag: "one tap",
    description:
      "Register in seconds and instantly receive a ticket with a unique QR code. No more Google Forms.",
    rows: ["One-tap registration", "Ticket + QR issued instantly"],
  },
  {
    icon: QrCode,
    title: "QR check-in",
    tag: "at the door",
    description:
      "Organizers scan your QR at the door. Attendance is tracked automatically and accurately.",
    rows: ["Scan tickets at the door", "Attendance marked automatically"],
  },
  {
    icon: Award,
    title: "Certificates",
    tag: "auto-issued",
    description:
      "Attend an event and your certificate is generated automatically. Download it anytime.",
    rows: ["Issued on attendance", "Download anytime"],
  },
  {
    icon: BellRing,
    title: "Notifications",
    tag: "smart inbox",
    description:
      "Registration confirmations, reminders, venue changes, and certificate alerts in one inbox.",
    rows: ["Confirmations & reminders", "Venue change alerts"],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    tag: "live",
    description:
      "Organizers get live dashboards for registrations, attendance, ratings, and views.",
    rows: ["Registrations over time", "Attendance & ratings"],
  },
];

const steps = [
  {
    step: "01",
    title: "Create an account",
    text: "Sign up free as an attendee or a verified organization.",
  },
  {
    step: "02",
    title: "Discover & register",
    text: "Find events you love and register with one tap.",
  },
  {
    step: "03",
    title: "Check in with QR",
    text: "Show your QR ticket at the venue for instant check-in.",
  },
  {
    step: "04",
    title: "Get your certificate",
    text: "Certificates are issued automatically after attendance.",
  },
];

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 1 }, // Changed from 0 to 1 to prevent double fade
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardStagger: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Slightly faster for cards
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function LandingPage() {
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Check if sections are in view with proper configuration
  const heroInView = useInView(heroRef, {
    once: true,
    amount: 0.3,
    margin: "0px",
  });
  const eventsInView = useInView(eventsRef, {
    once: true,
    amount: 0.2,
    margin: "0px",
  });
  const featuresInView = useInView(featuresRef, {
    once: true,
    amount: 0.2,
    margin: "0px",
  });
  const stepsInView = useInView(stepsRef, {
    once: true,
    amount: 0.2,
    margin: "0px",
  });
  const ctaInView = useInView(ctaRef, {
    once: true,
    amount: 0.3,
    margin: "0px",
  });

  useEffect(() => {
    Promise.all([getUpcomingEvents(), getPopularEvents()])
      .then(([up]) => setUpcoming(up.data.slice(0, 3)))
      .catch((error) => {
        console.error("Failed to fetch events:", error);
        setUpcoming([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
        />
        <div
          ref={heroRef}
          className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-6 md:pb-28 md:pt-24"
        >
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Eyebrow>events · tickets · certificates</Eyebrow>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="display mt-6 text-5xl text-foreground md:text-7xl"
            >
              Real events to <span className="text-primary">discover</span>,
              join, and <span className="italic">explore</span>.
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground text-pretty"
            >
              EventHub is a hub for the full event lifecycle — discovery,
              registration, QR check-in, and automatic certificates — so
              communities stop juggling forms and spreadsheets.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link to="/events">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore events
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Host an event
                </Button>
              </Link>
            </motion.div>
            <motion.dl
              variants={fadeInUp}
              className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-6"
            >
              {[
                ["4,200+", "events hosted"],
                ["58k+", "registrations"],
                ["31k+", "certificates"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="display text-2xl text-foreground md:text-3xl">
                    {value}
                  </dd>
                  <dd className="mt-1 font-mono text-xs text-muted-foreground">
                    {label}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* Attendee journey card */}
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={scaleIn}
            className="relative hidden md:block"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">
                  your event journey
                </span>
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-destructive/60" />
                  <span className="size-2.5 rounded-full bg-warning/60" />
                  <span className="size-2.5 rounded-full bg-success/60" />
                </span>
              </div>
              <div className="mt-5 flex flex-col gap-2.5">
                {[
                  {
                    icon: Search,
                    label: "Discover events",
                    note: "browse",
                    active: false,
                  },
                  {
                    icon: CalendarCheck,
                    label: "Register in one tap",
                    note: "ticket + QR",
                    active: true,
                  },
                  {
                    icon: QrCode,
                    label: "Check in at the door",
                    note: "scanned",
                    active: false,
                  },
                  {
                    icon: Award,
                    label: "Receive certificate",
                    note: "auto-issued",
                    active: false,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={
                      row.active
                        ? "flex items-center justify-between rounded-xl border border-primary/40 bg-accent px-4 py-3"
                        : "flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
                    }
                  >
                    <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                      <row.icon
                        className={
                          row.active
                            ? "size-4 text-primary"
                            : "size-4 text-muted-foreground"
                        }
                        aria-hidden="true"
                      />
                      {row.label}
                    </span>
                    <span
                      className={
                        row.active
                          ? "font-mono text-xs text-accent-foreground"
                          : "font-mono text-xs text-muted-foreground"
                      }
                    >
                      {row.note}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-secondary p-4">
                <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                  <span className="text-success">✓</span> ticket scanned at the
                  door
                  <br />
                  <span className="text-success">✓</span> attendance marked
                  present
                  <br />
                  <span className="text-primary">→</span> certificate issued
                  automatically
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="border-t border-border">
        <div ref={eventsRef} className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <motion.div
            initial="hidden"
            animate={eventsInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Eyebrow>happening soon</Eyebrow>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="mt-5 mb-10 flex flex-wrap items-end justify-between gap-4"
            >
              <h2 className="display text-3xl text-foreground md:text-5xl">
                Filling <span className="text-primary">fast.</span> Grab a seat.
              </h2>
              <Link
                to="/events"
                className="hidden items-center gap-1 font-mono text-sm text-primary hover:underline sm:flex"
              >
                view all events
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </motion.div>
            {loading ? (
              <motion.div
                variants={fadeIn}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={cardStagger}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {upcoming.map((e) => (
                  <motion.div key={e.id} variants={fadeInUp}>
                    <EventCard event={e} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/40">
        <div ref={featuresRef} className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Eyebrow>everything you need</Eyebrow>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="display mt-5 text-3xl text-foreground md:text-5xl"
            >
              Six lanes. <span className="text-primary">One platform.</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground"
            >
              Each piece mirrors how real events actually run — so the whole
              lifecycle lives in one place, from the first search to the final
              certificate.
            </motion.p>
            <motion.div
              variants={cardStagger}
              className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeInUp}
                  className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
                      <f.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                  <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4">
                    {f.rows.map((row) => (
                      <p
                        key={row}
                        className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
                      >
                        <ChevronRight
                          className="size-3 text-primary"
                          aria-hidden="true"
                        />
                        {row}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border">
        <div ref={stepsRef} className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <motion.div
            initial="hidden"
            animate={stepsInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Eyebrow>how it works</Eyebrow>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="display mt-5 max-w-2xl text-3xl text-foreground md:text-5xl"
            >
              From <span className="text-primary">sign-up</span> to certificate
              — four steps.
            </motion.h2>
            <motion.ol
              variants={cardStagger}
              className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {steps.map((s) => (
                <motion.li
                  key={s.step}
                  variants={fadeInUp}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <span className="font-mono text-sm text-primary">
                    {s.step}
                  </span>
                  <h3 className="mt-3 font-extrabold tracking-tight text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                </motion.li>
              ))}
            </motion.ol>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div
          ref={ctaRef}
          className="relative mx-auto max-w-6xl overflow-hidden px-4 py-24 md:px-6"
        >
          <div
            className="bg-grid pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
          />
          <motion.div
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="relative flex flex-col items-center gap-6 text-center"
          >
            <motion.div variants={fadeInUp}>
              <Eyebrow>no forms · no spreadsheets · just events</Eyebrow>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="display max-w-3xl text-4xl text-foreground md:text-6xl text-balance"
            >
              Ready to bring your community{" "}
              <span className="text-primary">together?</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty"
            >
              Create your organization account, publish your first event, and
              start scanning attendees in minutes.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link to="/register">
                <Button size="lg">
                  Get started free
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
