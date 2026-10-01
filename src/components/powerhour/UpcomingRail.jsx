import React from "react";
import { Image } from "@/components/ui/image";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

// The round-by-round look ahead: which tracks are coming up next, in play order.
export default function UpcomingRail({ tracks, currentShot, className }) {
  const upcoming = (tracks || []).slice(currentShot + 1, currentShot + 9);
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col gap-3 border-r border-amber/15 bg-black/20 p-4 overflow-y-auto min-h-0",
        className
      )}
    >
      <h3 className="font-display uppercase text-xs tracking-widest text-white/50 neon-header">Up next</h3>
      {upcoming.length === 0 ? (
        <p className="text-xs text-white/40">Pick a playlist to see the round-by-round lineup.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {upcoming.map((track, i) => (
            <li
              key={`${track.uri}-${i}`}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-2 py-1"
            >
              <span className="text-[10px] font-display text-white/40 shrink-0 w-6 text-center">
                {String(currentShot + 2 + i).padStart(2, "0")}
              </span>
              <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 bg-black/40">
                {track.album?.images?.[0]?.url ? (
                  <Image src={track.album.images[0].url} alt={track.name} className="w-full h-full" fittingType="fill" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <Music2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white/85 truncate font-medium leading-tight">{track.name}</p>
                <p className="text-[10px] text-white/40 truncate leading-tight">
                  {(track.artists || []).map((a) => a.name).join(", ")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-auto pt-3 text-[10px] text-white/30">Lineup follows your play order.</p>
    </aside>
  );
}