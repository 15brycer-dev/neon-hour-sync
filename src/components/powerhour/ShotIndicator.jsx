import React from "react";
import { cn } from "@/lib/utils";

// Neon tube meter: red segments light up as shots go down, like a wall of
// bar-sign tubes filling toward the end of the hour.
const TUBE_COUNT = 12;

export default function ShotIndicator({ current, total, flash, compact }) {
  const shown = Math.min(current, total);
  const lit = Math.round((shown / total) * TUBE_COUNT);
  return (
    <div className={cn("flex flex-col items-center", compact ? "gap-1.5" : "gap-2")}>
      <div
        className={cn(
          "font-display uppercase tracking-widest text-center transition-colors duration-300",
          compact ? "text-xs" : "text-2xl md:text-3xl",
          flash ? "text-amber" : "text-neon neon-header"
        )}
      >
        SHOT {shown} / {total}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border border-white/15 bg-black/50 p-1 shadow-chrome-inset",
          compact ? "h-3" : "h-5"
        )}
      >
        {Array.from({ length: TUBE_COUNT }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-full rounded-full transition-all duration-300",
              compact ? "w-1.5" : "w-3",
              i < lit ? "bg-neon shadow-glow-neon" : "bg-white/10"
            )}
          />
        ))}
      </div>
    </div>
  );
}