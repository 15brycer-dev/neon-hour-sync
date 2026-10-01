import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { Music2 } from "lucide-react";

export default function TrackDisplay({ track, active, className, fallback = "Waiting for Spotify…", compact }) {
  const artists = (track?.artists || []).map((a) => a.name).join(", ");
  const art = (track?.album?.images?.[0]?.url) || track?.artworkUrl;
  return (
    <div className={cn(compact ? "flex items-center gap-3" : "flex flex-col items-center gap-4", className)}>
      <div
        className={cn(
          "rounded-2xl overflow-hidden border border-white/10 bg-surface transition-shadow duration-500 shrink-0",
          compact ? "w-14 h-14" : "w-44 h-44",
          active && "shadow-glow-neon"
        )}
      >
        {art ? (
          <Image src={art} alt={track?.name || "Album art"} className="w-full h-full" fittingType="fill" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <Music2 className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className={cn("max-w-xl", compact ? "text-left" : "text-center px-4")}>
        <h2 className={cn(
          "font-display uppercase text-white leading-tight tracking-wide truncate max-w-xl",
          compact ? "text-sm max-w-[280px]" : "text-xl md:text-2xl"
        )}>
          {track?.name || fallback}
        </h2>
        <p className={cn("text-white/60", compact ? "text-xs mt-0.5" : "text-sm mt-1")}>{artists || "—"}</p>
      </div>
    </div>
  );
}