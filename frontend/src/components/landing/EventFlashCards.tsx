"use client";

import { useState, type CSSProperties } from "react";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";

const CARDS = [
  {
    tag: "CONFERENCE",
    title: "Design Systems Summit",
    date: "Aug 14",
    location: "Bengaluru",
    image: "/events/design-summit.png",
    top: "6%",
    left: "4%",
    width: "58%",
    rotate: -7,
    z: 1,
  },
  {
    tag: "WORKSHOP",
    title: "AI Builders Night",
    date: "Sep 03",
    location: "Mumbai",
    image: "/events/ai-workshop.png",
    top: "32%",
    left: "38%",
    width: "58%",
    rotate: 6,
    z: 2,
  },
  {
    tag: "SPORTS",
    title: "City Marathon",
    date: "Sep 19",
    location: "Pune",
    image: "/events/city-marathon.png",
    top: "60%",
    left: "6%",
    width: "58%",
    rotate: -5,
    z: 3,
  },
];

export function EventFlashCards() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative size-full">
      <style>{`
        @keyframes cardDrop {
          from { opacity: 0; transform: translateY(24px) rotate(var(--r)) scale(0.94); }
          to { opacity: 1; transform: translateY(0) rotate(var(--r)) scale(1); }
        }
      `}</style>

      {CARDS.map((card, i) => {
        const isActive = active === i;
        return (
          <div
            key={card.title}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`absolute aspect-[12/5] cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all duration-300 ${
              isActive ? "border-primary" : "border-border"
            }`}
            style={
              {
                top: card.top,
                left: card.left,
                width: card.width,
                zIndex: isActive ? 20 : card.z,
                backgroundImage: `url(${card.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: isActive
                  ? "0 24px 48px -20px color-mix(in srgb, var(--primary) 35%, transparent)"
                  : "0 16px 32px -18px rgba(0,0,0,0.55)",
                transform: isActive ? "rotate(0deg) scale(1.06)" : `rotate(${card.rotate}deg) scale(1)`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                animation: "cardDrop 0.6s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: `${i * 0.15}s`,
                "--r": `${card.rotate}deg`,
              } as CSSProperties
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

            <div className="relative flex h-full flex-col justify-between p-4">
              <div className="flex items-start justify-between">
                <span className="inline-block rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wide text-primary-foreground">
                  {card.tag}
                </span>
                <ArrowUpRight
                  size={16}
                  className={`transition-colors ${isActive ? "text-primary" : "text-white/50"}`}
                />
              </div>

              <div>
                <h3 className="text-base font-bold leading-tight text-white">{card.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-[11.5px] text-white/75">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} className="text-primary" />
                    {card.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary" />
                    {card.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
