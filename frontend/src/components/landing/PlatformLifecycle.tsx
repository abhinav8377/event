"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import {
  UserPlus,
  Search,
  Ticket,
  QrCode,
  Award,
  Bell,
  MessageSquare,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { Eyebrow } from "@/components/common/ui";

const DURATION = 9; // seconds for one full lifecycle loop
const VB_W = 1200;
const VB_H = 360;

interface Stage {
  icon: LucideIcon;
  title: string;
  y: number;
}

const STAGES: Stage[] = [
  { icon: UserPlus, title: "Create account", y: 250 },
  { icon: Search, title: "Browse events", y: 110 },
  { icon: Ticket, title: "Registration", y: 250 },
  { icon: QrCode, title: "QR check-in", y: 110 },
  { icon: Award, title: "Certificates", y: 250 },
  { icon: Bell, title: "Notifications", y: 110 },
  { icon: MessageSquare, title: "Feedback", y: 250 },
  { icon: BarChart3, title: "Analytics", y: 110 },
];

const MARGIN_X = 70;
const STEP_X = (VB_W - MARGIN_X * 2) / (STAGES.length - 1);
const POINTS = STAGES.map((s, i) => ({ x: MARGIN_X + i * STEP_X, y: s.y }));

function smoothPath(pts: { x: number; y: number }[]) {
  const d = [`M${pts[0].x},${pts[0].y}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`);
  }
  return d.join(" ");
}

const PATH_D = smoothPath(POINTS);

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export function PlatformLifecycle() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2, margin: "0px" });

  return (
    <section className="border-t border-border bg-card/40">
      <style>{`
        @keyframes lifecycleNodePulse {
          0%, 96%, 100% {
            background: var(--card);
            border-color: var(--border);
            box-shadow: none;
            transform: translate(-50%, -50%) scale(1);
          }
          2% {
            background: var(--primary);
            border-color: var(--primary);
            box-shadow: 0 0 26px 6px color-mix(in srgb, var(--primary) 55%, transparent);
            transform: translate(-50%, -50%) scale(1.22);
          }
          9% {
            background: var(--card);
            border-color: var(--primary);
            box-shadow: 0 0 14px 2px color-mix(in srgb, var(--primary) 35%, transparent);
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes lifecycleIconPulse {
          0%, 96%, 100% { color: var(--muted-foreground); }
          2%, 9% { color: var(--primary-foreground); }
        }
        @keyframes lifecycleLabelPulse {
          0%, 96%, 100% { color: var(--muted-foreground); }
          2%, 9% { color: var(--foreground); }
        }
        .lifecycle-node { animation: lifecycleNodePulse ${DURATION}s linear infinite; }
        .lifecycle-icon { animation: lifecycleIconPulse ${DURATION}s linear infinite; }
        .lifecycle-label { animation: lifecycleLabelPulse ${DURATION}s linear infinite; }
      `}</style>

      <div ref={ref} className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Eyebrow>the lifecycle</Eyebrow>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="display mt-5 max-w-2xl text-3xl !normal-case text-foreground md:text-5xl"
          >
            One flow, <span className="text-primary">start to end.</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Watch an attendee move through the platform, one stage lighting up after the next.
          </motion.p>

          <motion.div variants={fadeInUp} className="scrollbar-hide relative mt-14 w-full overflow-x-auto">
            <div className="relative mx-auto min-w-[720px]" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="lifecycleLitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "var(--primary)" }} />
                    <stop offset="100%" style={{ stopColor: "var(--success)" }} />
                  </linearGradient>
                  <radialGradient id="lifecycleCometGrad">
                    <stop offset="0%" style={{ stopColor: "var(--primary-foreground)" }} />
                    <stop offset="45%" style={{ stopColor: "var(--primary)" }} />
                    <stop offset="100%" style={{ stopColor: "var(--primary)" }} stopOpacity="0" />
                  </radialGradient>
                  <filter id="lifecycleCometGlow" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path d={PATH_D} fill="none" style={{ stroke: "var(--border)" }} strokeWidth="2.5" strokeLinecap="round" />
                <path
                  d={PATH_D}
                  fill="none"
                  stroke="url(#lifecycleLitGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.35"
                />

                <circle r="9" fill="url(#lifecycleCometGrad)" filter="url(#lifecycleCometGlow)">
                  <animateMotion dur={`${DURATION}s`} repeatCount="indefinite" path={PATH_D} rotate="auto" />
                </circle>
                <circle r="3.5" style={{ fill: "var(--primary-foreground)" }}>
                  <animateMotion dur={`${DURATION}s`} repeatCount="indefinite" path={PATH_D} rotate="auto" />
                </circle>
              </svg>

              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const pt = POINTS[i];
                const leftPct = (pt.x / VB_W) * 100;
                const topPct = (pt.y / VB_H) * 100;
                const labelBelow = stage.y > VB_H / 2;
                const delay = -((i / (STAGES.length - 1)) * DURATION);

                return (
                  <div
                    key={stage.title}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  >
                    <div
                      className="lifecycle-node flex h-11 w-11 items-center justify-center rounded-full border-2"
                      style={{ animationDelay: `${delay}s`, transform: "translate(-50%, -50%)" }}
                    >
                      <Icon
                        size={17}
                        strokeWidth={2}
                        className="lifecycle-icon"
                        style={{ animationDelay: `${delay}s` }}
                        aria-hidden="true"
                      />
                    </div>
                    <span
                      className="lifecycle-label absolute w-24 text-center font-mono text-[11px] font-medium leading-tight"
                      style={{
                        animationDelay: `${delay}s`,
                        top: labelBelow ? "26px" : "-40px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    >
                      {stage.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
