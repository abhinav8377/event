"use client";

import { Zap, QrCode, Award, Bell, BarChart3, MessageSquare, ShieldCheck, Users, type LucideIcon } from "lucide-react";

interface Capability {
  icon: LucideIcon;
  label: string;
}

const CAPABILITIES: Capability[] = [
  { icon: Zap, label: "Instant registration" },
  { icon: QrCode, label: "QR check-in" },
  { icon: Award, label: "Auto-issued certificates" },
  { icon: Bell, label: "Real-time notifications" },
  { icon: BarChart3, label: "Live analytics" },
  { icon: MessageSquare, label: "Built-in feedback" },
  { icon: ShieldCheck, label: "Secure by design" },
  { icon: Users, label: "Role-based access" },
];

export function CapabilitiesMarquee() {
  const loop = [...CAPABILITIES, ...CAPABILITIES];

  return (
    <div className="w-full border-t border-border bg-card/40 py-10">
      <style>{`
        @keyframes capMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-wrap:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      <p className="text-center font-mono text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
        WHAT'S BUILT INTO EVENTHUB
      </p>

      <div
        className="marquee-wrap relative mt-6 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          className="marquee-track flex w-max items-center gap-10"
          style={{ animation: "capMarquee 26s linear infinite" }}
        >
          {loop.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-sm text-muted-foreground">
                <Icon size={16} className="text-primary" strokeWidth={2} />
                {cap.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
