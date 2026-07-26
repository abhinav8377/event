"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useInView, type PanInfo, type Variants } from "framer-motion";
import {
  Search,
  Ticket,
  CreditCard,
  Award,
  Star,
  MessagesSquare,
  Bell,
  LayoutDashboard,
  CalendarPlus,
  ScanLine,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Eyebrow } from "@/components/common/ui";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

interface Feature {
  tag: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { tag: "DISCOVERY", icon: Search, title: "Browse & search", desc: "Find events by category, city, or mode — in-person, online, or hybrid." },
  { tag: "REGISTRATION", icon: Ticket, title: "One-tap registration", desc: "Register instantly and get a digital QR ticket, no forms required." },
  { tag: "PAYMENTS", icon: CreditCard, title: "Free & paid events", desc: "Secure payments built in for paid events, free for the rest." },
  { tag: "CERTIFICATES", icon: Award, title: "Auto-issued certificates", desc: "Certificates generate the moment attendance is confirmed." },
  { tag: "REVIEWS", icon: Star, title: "Ratings & reviews", desc: "Attendees rate and review events to help others decide." },
  { tag: "COMMUNITY", icon: MessagesSquare, title: "Real-time chat", desc: "Community chat with live polls and typing indicators." },
  { tag: "ALERTS", icon: Bell, title: "In-app notifications", desc: "Broadcast updates and alerts land straight in the app." },
  { tag: "DASHBOARD", icon: LayoutDashboard, title: "Personal dashboard", desc: "Stats, upcoming events, and recommendations in one place." },
  { tag: "ORGANIZING", icon: CalendarPlus, title: "Create & manage events", desc: "Rich event details, banners, and tags for organizers." },
  { tag: "CHECK-IN", icon: ScanLine, title: "QR door check-in", desc: "Scan tickets at the door and track attendance live." },
  { tag: "ANALYTICS", icon: BarChart3, title: "Analytics dashboard", desc: "Views, registrations, attendance, and ratings at a glance." },
  { tag: "ADMIN", icon: ShieldCheck, title: "Full admin panel", desc: "Manage users, organizers, events, and logs from one console." },
];

const CYCLE_MS = 3600;
const ROTATE_DEG = 24;
const SWIPE_OFFSET_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 400;

/** Active card is ~40% of the viewport width, clamped to a sane range. */
function useCardWidth() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 480 : clampCardWidth(window.innerWidth)));

  useEffect(() => {
    const onResize = () => setWidth(clampCardWidth(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function clampCardWidth(viewportWidth: number) {
  return Math.min(640, Math.max(320, viewportWidth * 0.4));
}

function Coverflow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = FEATURES.length;
  const cardWidth = useCardWidth();
  const spacing = cardWidth * 0.62;
  const depth = cardWidth * 0.5;

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % n);
    }, CYCLE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, n]);

  const go = (dir: number) => setCurrent((c) => (c + dir + n) % n);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_OFFSET_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD) go(1);
    else if (info.offset.x > SWIPE_OFFSET_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD) go(-1);
  };

  return (
    <div
      className="relative flex size-full flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex shrink-0 items-center justify-between px-2">
        <span className="font-mono text-xs text-muted-foreground">platform features</span>
        <span className="font-mono text-xs text-muted-foreground">
          {String(current + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </span>
      </div>

      <motion.div
        className="relative mt-6 flex-1 cursor-grab touch-pan-y active:cursor-grabbing"
        style={{ perspective: "1600px" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
      >
        {FEATURES.map((feature, i) => {
          let diff = i - current;
          if (diff > n / 2) diff -= n;
          if (diff < -n / 2) diff += n;

          const abs = Math.abs(diff);
          const hidden = abs > 2;
          const isCurrent = diff === 0;
          const Icon = feature.icon;

          const style: CSSProperties = {
            width: `${cardWidth}px`,
            transform: `translate(-50%, -50%) translateX(${diff * spacing}px) translateZ(${-abs * depth}px) rotateY(${-diff * ROTATE_DEG}deg) scale(${1 - abs * 0.14})`,
            opacity: hidden ? 0 : 1 - abs * 0.32,
            zIndex: 10 - abs,
            pointerEvents: isCurrent ? "auto" : "none",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          };

          return (
            <div
              key={feature.title}
              className={`absolute left-1/2 top-1/2 rounded-3xl border bg-card p-8 shadow-2xl shadow-black/30 transition-all duration-[650ms] ease-out ${
                isCurrent ? "border-primary" : "border-border"
              }`}
              style={style}
            >
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-7" aria-hidden="true" />
                </span>
                <span className="inline-block rounded-full bg-primary px-4 py-1.5 text-sm font-semibold tracking-wide text-primary-foreground">
                  {feature.tag}
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-extrabold leading-tight tracking-tight text-foreground md:text-3xl">
                {feature.title}
              </h3>

              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{feature.desc}</p>
            </div>
          );
        })}
      </motion.div>

      <button
        aria-label="Previous feature"
        onClick={() => go(-1)}
        className="absolute left-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/80 transition-colors hover:border-primary"
      >
        <ChevronLeft size={18} className="text-muted-foreground" />
      </button>
      <button
        aria-label="Next feature"
        onClick={() => go(1)}
        className="absolute right-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/80 transition-colors hover:border-primary"
      >
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>

      <div className="mt-6 flex shrink-0 items-center justify-center gap-1.5">
        {FEATURES.map((_, i) => (
          <button
            key={i}
            aria-label={`Show feature ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-[18px] bg-primary" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function FeatureCoverflow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2, margin: "0px" });

  return (
    <section className="border-t border-border">
      <div ref={ref} className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerContainer} className="text-center">
          <motion.div variants={fadeInUp}>
            <Eyebrow className="mx-auto">features</Eyebrow>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="display mt-5 text-3xl !normal-case text-foreground md:text-5xl">
            Everything, <span className="text-primary">built in.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={scaleIn}
          className="relative mt-14 h-[460px] w-full"
        >
          <Coverflow />
        </motion.div>
      </div>
    </section>
  );
}
