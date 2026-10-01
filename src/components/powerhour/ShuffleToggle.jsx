import React from "react";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShuffleToggle({ enabled, onToggle, className, iconClass = "w-7 h-7" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label="Shuffle play order"
      title="Shuffle play order"
      className={cn(
        "rounded-full border flex items-center justify-center transition-all",
        enabled
          ? "border-amber text-amber shadow-glow-amber bg-amber/10"
          : "border-white/20 bg-gradient-to-b from-white/15 to-white/5 text-white hover:border-neon/60 hover:text-neon",
        className
      )}
    >
      <Shuffle className={iconClass} />
    </button>
  );
}