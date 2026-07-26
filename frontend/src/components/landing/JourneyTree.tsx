"use client";

import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { Search, QrCode, Award, ScanLine, CheckCircle2, type LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/common/ui";

const DURATION = 6; // seconds for one full comet pass down the spine
/** How close (in px) the comet must be to a node's measured position to light it up. */
const GLOW_WINDOW_PX = 26;

interface Stage {
  side: "left" | "right";
  step: string;
  eyebrow: string;
  title: string;
  desc: string;
  bullets: string[];
  Panel: ComponentType;
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9.5px] font-semibold text-success">{children}</span>
  );
}

function PanelHeader({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
      <StatusPill>{status}</StatusPill>
    </div>
  );
}

function DiscoveryPanel() {
  const events = [
    { tag: "Technology", title: "AI/ML Workshop 2026", loc: "Bangalore" },
    { tag: "Design", title: "Design Systems Summit", loc: "Mumbai" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <PanelHeader label="discovery feed" status="live feed" />
      <div className="mt-2.5 space-y-2">
        {events.map((e) => (
          <div key={e.title} className="rounded-lg border border-border p-2.5">
            <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
              {e.tag}
            </span>
            <p className="mt-1.5 text-[12.5px] font-bold text-foreground">{e.title}</p>
            <p className="font-mono text-[10.5px] text-muted-foreground">{e.loc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistrationPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <PanelHeader label="registration flow" status="one tap" />
      <div className="mt-2.5 rounded-lg border border-border p-2.5">
        <p className="text-[12.5px] font-bold text-foreground">AI/ML Workshop 2026</p>
        <p className="font-mono text-[10.5px] text-muted-foreground">Aug 15 · Bangalore · Hybrid</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary">
            <QrCode size={15} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-foreground">Ticket #EH-4829</p>
            <p className="text-[10px] text-muted-foreground">QR issued instantly</p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-2 text-[11px] text-success">
        <CheckCircle2 size={13} />
        Registration confirmed
      </div>
    </div>
  );
}

function CheckinPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <PanelHeader label="check-in portal" status="live" />
      <div className="mt-2.5 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-border p-2.5">
          <ScanLine size={16} className="text-primary" />
          <div>
            <p className="text-[11.5px] font-semibold text-foreground">Scan QR ticket</p>
            <p className="text-[10px] text-muted-foreground">Point camera at attendee QR</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-2.5 py-2">
          <Award size={16} className="text-success" />
          <div>
            <p className="text-[11.5px] font-semibold text-foreground">Certificate issued</p>
            <p className="text-[10px] text-success">Auto-generated</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGES: Stage[] = [
  {
    side: "right",
    step: "01",
    eyebrow: "discovery",
    title: "Find events that matter",
    desc: "Search understands what you're looking for — filter by category, city, or format.",
    bullets: ["Keyword & filter search", "Category, city & mode filters", "Online, offline & hybrid"],
    Panel: DiscoveryPanel,
  },
  {
    side: "left",
    step: "02",
    eyebrow: "registration",
    title: "Register in seconds",
    desc: "One tap and you're in — instant QR ticket, confirmation email, and calendar invite.",
    bullets: ["One-tap registration", "Instant QR ticket", "Email & calendar sync"],
    Panel: RegistrationPanel,
  },
  {
    side: "right",
    step: "03",
    eyebrow: "check-in",
    title: "Scan. Verify. Done.",
    desc: "Organizers scan your QR at the door. Attendance is tracked and certificates issue instantly.",
    bullets: ["QR scan at the door", "Instant attendance marking", "Auto-issued certificates"],
    Panel: CheckinPanel,
  },
];

const stageIcons: LucideIcon[] = [Search, QrCode, Award];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

function StageContent({ stage, mirrored = false }: { stage: Stage; mirrored?: boolean }) {
  const Icon = stageIcons[Number(stage.step) - 1];
  return (
    <div className={mirrored ? "text-right" : ""}>
      <span
        className={`inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground ${mirrored ? "flex-row-reverse" : ""}`}
      >
        <Icon className="size-3.5 text-primary" aria-hidden="true" />
        {stage.step} · {stage.eyebrow}
      </span>
      <h3 className="mt-2 text-xl font-extrabold tracking-tight text-foreground">{stage.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.desc}</p>
      <ul className={`mt-3 space-y-1.5 ${mirrored ? "flex flex-col items-end" : ""}`}>
        {stage.bullets.map((b) => (
          <li
            key={b}
            className={`flex items-center gap-1.5 text-[12.5px] text-foreground/80 ${mirrored ? "flex-row-reverse" : ""}`}
          >
            <span className="size-1 rounded-full bg-primary" aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <stage.Panel />
      </div>
    </div>
  );
}

export function JourneyTree() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15, margin: "0px" });

  const spineRef = useRef<HTMLDivElement>(null);
  const cometRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;
    let nodeYs: number[] = [];
    let spineHeight = 0;
    const litState = STAGES.map(() => false);

    const measure = () => {
      const spineEl = spineRef.current;
      if (!spineEl) return;
      const spineTop = spineEl.getBoundingClientRect().top;
      spineHeight = spineEl.getBoundingClientRect().height;
      nodeYs = nodeRefs.current.map((el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top - spineTop + r.height / 2;
      });
    };

    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const tick = (now: number) => {
      if (spineHeight > 0) {
        const progress = (now / 1000 / DURATION) % 1;
        const cometY = progress * spineHeight;

        if (cometRef.current) {
          cometRef.current.style.transform = `translate(-50%, ${cometY}px)`;
        }

        nodeYs.forEach((y, i) => {
          const isLit = Math.abs(cometY - y) < GLOW_WINDOW_PX;
          if (litState[i] !== isLit) {
            litState[i] = isLit;
            nodeRefs.current[i]?.classList.toggle("is-lit", isLit);
          }
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="border-t border-border bg-card/40">
      <style>{`
        .journey-node { background: var(--card); border-color: var(--border); transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
        .journey-node.is-lit { background: var(--primary); border-color: var(--primary); box-shadow: 0 0 22px 5px color-mix(in srgb, var(--primary) 55%, transparent); transform: translate(-50%, -50%) scale(1.3); }
      `}</style>

      <div ref={sectionRef} className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerContainer}>
          <motion.div variants={fadeInUp} className="text-center">
            <Eyebrow className="mx-auto">the journey</Eyebrow>
            <h2 className="display mt-5 text-3xl !normal-case text-foreground md:text-5xl">
              One flow, <span className="text-primary">three moments.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              From the first search to the door scan, it's one connected path — not three disconnected tools.
            </p>
          </motion.div>

          {/* Mobile: simple stacked list, no spine animation */}
          <motion.div variants={staggerContainer} className="mt-14 flex flex-col gap-10 md:hidden">
            {STAGES.map((stage) => (
              <motion.div key={stage.step} variants={fadeInUp}>
                <StageContent stage={stage} />
              </motion.div>
            ))}
          </motion.div>

          {/* Desktop: alternating tree with an animated spine */}
          <div ref={spineRef} className="relative mt-14 hidden grid-cols-[1fr_40px_1fr] gap-y-14 md:grid">
            <div className="absolute inset-y-0 left-1/2 w-px bg-border" aria-hidden="true" />
            <div
              ref={cometRef}
              className="pointer-events-none absolute left-1/2 top-0 size-3 rounded-full bg-primary shadow-[0_0_16px_4px_var(--primary)]"
              aria-hidden="true"
            />

            {STAGES.map((stage, i) => {
              const isRight = stage.side === "right";
              return (
                <motion.div key={stage.step} variants={fadeInUp} className="contents">
                  <div style={{ gridColumn: 1, gridRow: i + 1 }} className={isRight ? "invisible" : ""}>
                    {!isRight && <StageContent stage={stage} mirrored />}
                  </div>
                  <div className="relative flex items-center justify-center" style={{ gridColumn: 2, gridRow: i + 1 }}>
                    <div
                      ref={(el) => {
                        nodeRefs.current[i] = el;
                      }}
                      className="journey-node absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    />
                  </div>
                  <div style={{ gridColumn: 3, gridRow: i + 1 }} className={isRight ? "" : "invisible"}>
                    {isRight && <StageContent stage={stage} />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
