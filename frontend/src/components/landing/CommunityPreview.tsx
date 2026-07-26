"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { Users, MessageCircle } from "lucide-react";
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

const PEOPLE = [
  { initials: "AK", name: "Aarav Khanna", tag: "Product · AI" },
  { initials: "SM", name: "Sara Menon", tag: "Design · Startups" },
  { initials: "RV", name: "Rohan Verma", tag: "Engineering · OSS" },
];

const MESSAGES = [
  { from: "Priya S.", text: "Great talk on distributed systems! Anyone have the slides?", time: "2:34 PM", mine: false },
  { from: "You", text: "Yes! I'll share the link here", time: "2:36 PM", mine: true },
  { from: "Dev M.", text: "Thanks! This community is awesome 🙌", time: "2:38 PM", mine: false },
];

export function CommunityPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2, margin: "0px" });

  return (
    <section className="border-t border-border">
      <div ref={ref} className="mx-auto grid max-w-6xl gap-14 px-4 py-20 md:grid-cols-[1fr_1.35fr] md:items-center md:px-6 md:py-28">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Eyebrow>community · preview</Eyebrow>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="display mt-5 text-3xl !normal-case text-foreground md:text-5xl">
            The event ends. <span className="text-primary">The connection</span> doesn't.
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
            Meet people with shared interests and continue meaningful
            conversations around the events you attend.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={scaleIn}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold tracking-tight text-foreground">People you may meet</h3>
              <Users className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {PEOPLE.map((p) => (
                <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {p.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{p.tag}</p>
                  </div>
                  <button className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
                    connect
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold tracking-tight text-foreground">Event chat</h3>
              <MessageCircle className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {MESSAGES.map((m, i) => (
                <div key={i} className={`max-w-[85%] rounded-xl p-3 ${m.mine ? "self-end bg-secondary" : "self-start bg-background border border-border"}`}>
                  {!m.mine && <p className="text-xs font-bold text-primary">{m.from}</p>}
                  {m.mine && <p className="text-xs font-bold text-foreground">{m.from}</p>}
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{m.text}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{m.time}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
