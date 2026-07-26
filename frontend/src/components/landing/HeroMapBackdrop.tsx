"use client";

import { MapPin } from "lucide-react";

/** Loose scatter of "location pin" points connected by a single meandering route,
 * evoking a map of event locations behind the hero. Percentages of the backdrop box. */
const MAP_POINTS = [
  { x: 27.6, y: 15.4 },
  { x: 20.1, y: 28.8 },
  { x: 4.2, y: 49.7 },
  { x: 18.2, y: 72.2 },
  { x: 41, y: 84.1 },
  { x: 95.1, y: 58.5 },
  { x: 87.9, y: 78.3 },
];

function smoothPath(points: { x: number; y: number }[]) {
  const scale = 10; // percentages -> a 0-1000 viewBox
  const d = [`M${points[0].x * scale},${points[0].y * scale}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = (p1.x + (p2.x - p0.x) / 6) * scale;
    const c1y = (p1.y + (p2.y - p0.y) / 6) * scale;
    const c2x = (p2.x - (p3.x - p1.x) / 6) * scale;
    const c2y = (p2.y - (p3.y - p1.y) / 6) * scale;
    d.push(`C${c1x},${c1y} ${c2x},${c2y} ${p2.x * scale},${p2.y * scale}`);
  }
  return d.join(" ");
}

const ROUTE_PATH = smoothPath(MAP_POINTS);

export function HeroMapBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="bg-grid absolute inset-0 opacity-40" />

      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="var(--primary)"
          strokeOpacity={0.55}
          strokeWidth={2}
          strokeDasharray="7 9"
          strokeLinecap="round"
        />
      </svg>

      {MAP_POINTS.map((p, i) => (
        <MapPin
          key={i}
          className="absolute size-6 -translate-x-1/2 -translate-y-full text-primary opacity-[0.65]"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        />
      ))}
    </div>
  );
}
