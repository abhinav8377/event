"use client";

import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  FileText,
  MessageCircle,
  Sheet,
  Users,
  CheckCircle2,
  Cpu,
  Briefcase,
  GraduationCap,
  Palette,
  Trophy,
  UsersRound,
  Sparkles,
} from "lucide-react";
import { Button, Eyebrow } from "@/components/common/ui";
import { PlatformLifecycle } from "@/components/landing/PlatformLifecycle";
import { JourneyTree } from "@/components/landing/JourneyTree";
import { FeatureCoverflow } from "@/components/landing/FeatureCoverflow";
import { CommunityPreview } from "@/components/landing/CommunityPreview";
import { HeroMapBackdrop } from "@/components/landing/HeroMapBackdrop";
import { CapabilitiesMarquee } from "@/components/landing/CapabilitiesMarquee";
import { EventFlashCards } from "@/components/landing/EventFlashCards";

const oldWay = [
  { icon: FileText, label: "Google Forms", tag: "registrations" },
  { icon: MessageCircle, label: "WhatsApp groups", tag: "updates" },
  { icon: Sheet, label: "Spreadsheets", tag: "tracking" },
  { icon: Users, label: "Manual lists", tag: "check-in" },
];

const newWayChecklist = [
  "A single source of truth",
  "Real-time attendance records",
  "Automatic attendee notifications",
  "Certificates tied to verified attendance",
];

const categories = [
  { icon: Cpu, label: "Technology" },
  { icon: Briefcase, label: "Business" },
  { icon: GraduationCap, label: "Education" },
  { icon: Palette, label: "Arts" },
  { icon: Trophy, label: "Sports" },
  { icon: UsersRound, label: "Community" },
];

const faqs = [
  {
    q: "Is EventHub free to use?",
    a: "Yes. Discovering and registering for events is free for attendees. Organizers can publish events, manage check-ins, and issue certificates at no cost.",
  },
  {
    q: "Who can host an event?",
    a: "Any verified organization can create an account and start publishing events once approved. Every organizer is reviewed before their events go live.",
  },
  {
    q: "How does QR check-in work?",
    a: "Every registration generates a unique QR ticket. Organizers scan it at the door with any camera, and attendance is recorded instantly — no manual lists.",
  },
  {
    q: "When are certificates issued?",
    a: "Certificates are generated automatically the moment your attendance is marked at check-in, and stay available to download from your profile.",
  },
  {
    q: "Does EventHub support online and hybrid events?",
    a: "Yes. Events can be marked in-person, online, or hybrid, and discovery filters let attendees search by mode and city.",
  },
];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardStagger: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Shared mock-panel chrome (macOS-style dots) used by hero and spotlight sections. */
function PanelChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-destructive/60" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
      </span>
    </div>
  );
}

/** Flat bordered mock-UI panel, matching the design's "your event journey" / "registration flow" cards. */
function GlowPanel({
  children,
  rounded = "rounded-3xl",
  innerClassName = "bg-card p-6",
  glow = true,
}: {
  children: ReactNode;
  rounded?: string;
  innerClassName?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`${rounded} border border-border ${glow ? "shadow-[0_0_60px_-20px_var(--primary)]" : ""} ${innerClassName}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const organizerRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.3, margin: "0px" });
  const comparisonInView = useInView(comparisonRef, { once: true, amount: 0.2, margin: "0px" });
  const categoriesInView = useInView(categoriesRef, { once: true, amount: 0.2, margin: "0px" });
  const organizerInView = useInView(organizerRef, { once: true, amount: 0.3, margin: "0px" });
  const faqInView = useInView(faqRef, { once: true, amount: 0.2, margin: "0px" });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3, margin: "0px" });

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroMapBackdrop />
        <div
          ref={heroRef}
          className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-20 md:grid-cols-[1.15fr_0.85fr] md:items-center md:px-6 md:pb-28 md:pt-28"
        >
          <motion.div initial="hidden" animate={heroInView ? "visible" : "hidden"} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <Eyebrow>
                <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                events · tickets · certificates
              </Eyebrow>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="display mt-7 text-5xl !normal-case text-foreground md:text-7xl"
              style={{ letterSpacing: "-0.04em", lineHeight: 0.92 }}
            >
              Real events to <span className="text-primary">discover</span>,
              join &amp; <span className="italic">explore.</span>
            </motion.h1>
            <motion.div variants={fadeInUp} className="mt-10 flex flex-col gap-7 border-t border-border pt-8">
              <p className="max-w-md text-base leading-relaxed text-[color:var(--landing-secondary-foreground)] text-pretty">
                EventHub is a hub for the full event lifecycle — discovery,
                registration, QR check-in, and automatic certificates — so
                communities stop juggling forms and spreadsheets.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore events
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Host an event
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>

          {/* Featured events scatter */}
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={scaleIn}
            className="relative mx-auto hidden aspect-square w-full max-w-[480px] md:block"
          >
            <EventFlashCards />
          </motion.div>
        </div>
      </section>

      {/* Capabilities marquee */}
      <CapabilitiesMarquee />

      {/* Platform lifecycle */}
      <PlatformLifecycle />

      {/* Journey tree */}
      <JourneyTree />

      {/* Featured events coverflow */}
      <FeatureCoverflow />

      {/* Comparison */}
      <section className="border-t border-border">
        <div ref={comparisonRef} className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <motion.div initial="hidden" animate={comparisonInView ? "visible" : "hidden"} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <Eyebrow>why eventhub</Eyebrow>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="display mt-5 max-w-2xl text-3xl !normal-case text-foreground md:text-5xl">
              One connected workflow, <span className="text-primary">not four disconnected tools.</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Most communities stitch together forms, chats, and spreadsheets
              by hand. EventHub replaces all of it with a single system.
            </motion.p>

            <div className="mt-14 grid gap-6 md:grid-cols-2">
              <motion.div variants={fadeInUp} className="flex flex-col gap-3">
                <p className="font-mono text-xs text-muted-foreground">the traditional way</p>
                {oldWay.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                    <span className="flex items-center gap-3 text-sm font-semibold text-foreground">
                      <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      {item.label}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{item.tag}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeInUp}>
                <GlowPanel rounded="rounded-2xl" innerClassName="bg-accent p-7" glow={false}>
                  <p className="font-mono text-xs text-accent-foreground">the eventhub way</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <CalendarCheck className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-extrabold tracking-tight text-foreground">One connected platform</p>
                      <p className="font-mono text-xs text-muted-foreground">discover → register → check in → certify</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2.5 border-t border-primary/20 pt-5">
                    {newWayChecklist.map((row) => (
                      <p key={row} className="flex items-center gap-2.5 text-sm text-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        {row}
                      </p>
                    ))}
                  </div>
                </GlowPanel>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Browse by category */}
      <section className="border-t border-border bg-card/40">
        <div ref={categoriesRef} className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <motion.div initial="hidden" animate={categoriesInView ? "visible" : "hidden"} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>browse by category</Eyebrow>
                <h2 className="display mt-5 text-3xl !normal-case text-foreground md:text-5xl">
                  A track for every <span className="text-primary">community.</span>
                </h2>
              </div>
              <Link to="/login" className="group hidden items-center gap-1 font-mono text-sm text-primary hover:underline sm:flex">
                explore all
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </motion.div>
            <motion.div variants={cardStagger} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <motion.div key={c.label} variants={fadeInUp}>
                  <Link
                    to="/login"
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/5"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                      <c.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-extrabold tracking-tight text-foreground">{c.label}</span>
                    <ArrowRight
                      className="ml-auto size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Community preview */}
      <CommunityPreview />

      {/* For organizers */}
      <section className="border-t border-border">
        <div
          ref={organizerRef}
          className="mx-auto grid max-w-6xl gap-14 px-4 py-20 md:grid-cols-2 md:items-center md:px-6 md:py-28"
        >
          <motion.div initial="hidden" animate={organizerInView ? "visible" : "hidden"} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <Eyebrow>for organizers</Eyebrow>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="display mt-5 text-3xl !normal-case text-foreground md:text-5xl">
              Know what's happening, <span className="text-primary">as it happens.</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
              A focused command center for registrations, check-ins, and event
              performance — without turning organizers into analysts.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8">
              <Link to="/register">
                <Button size="lg">
                  Start organizing
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate={organizerInView ? "visible" : "hidden"} variants={scaleIn}>
            <GlowPanel>
              <PanelChrome label="organizer overview" />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["12", "Total events"],
                  ["2,480", "Registrations"],
                  ["1,916", "Check-ins"],
                  ["4.8/5", "Avg. rating"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-border bg-background p-3.5 text-center">
                    <p className="display text-xl text-foreground">{value}</p>
                    <p className="mt-1 font-mono text-[10px] leading-tight text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Registrations</p>
                  <p className="font-mono text-xs text-success">+18.4%</p>
                </div>
                <div className="mt-4 flex h-20 items-end gap-1.5">
                  {[35, 45, 40, 55, 50, 62, 70, 58, 75, 68].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t-sm bg-primary/70"
                      style={{ height: `${h}%` }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </GlowPanel>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/40">
        <div ref={faqRef} className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28">
          <motion.div initial="hidden" animate={faqInView ? "visible" : "hidden"} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center">
              <Eyebrow className="mx-auto">frequently asked</Eyebrow>
              <h2 className="display mt-5 text-3xl !normal-case text-foreground md:text-5xl">
                Questions, <span className="text-primary">answered.</span>
              </h2>
            </motion.div>
            <motion.div variants={cardStagger} className="mt-12 flex flex-col gap-3">
              {faqs.map((item, i) => {
                const open = openFaq === i;
                return (
                  <motion.div
                    key={item.q}
                    variants={fadeInUp}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted"
                    >
                      <span className="font-extrabold tracking-tight text-foreground">{item.q}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                    {open && (
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground text-pretty">
                        {item.a}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 pt-10 md:px-6">
        <div ref={ctaRef} className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="flex flex-col items-center gap-6 rounded-[28px] bg-primary px-6 py-18 text-center md:px-12 md:py-24"
          >
            <motion.span
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3.5 py-1.5 font-mono text-xs text-primary-foreground"
            >
              no forms · no spreadsheets · just events
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="display max-w-3xl text-4xl !normal-case text-primary-foreground md:text-6xl text-balance"
              style={{ letterSpacing: "-0.04em", lineHeight: 0.92 }}
            >
              Ready to bring your community together?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="max-w-md text-sm leading-relaxed text-primary-foreground/75 text-pretty"
            >
              Create your organization account, publish your first event, and
              start scanning attendees in minutes.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link to="/register">
                <Button
                  size="lg"
                  className="hover:opacity-90"
                  style={{ backgroundColor: "var(--primary-foreground)", color: "var(--primary)" }}
                >
                  Get started free
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
