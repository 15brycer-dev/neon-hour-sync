import React from "react";
import { Image } from "@/components/ui/image";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlaylistGrid({ playlists, selectedId, loading, onSelect }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-11 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!playlists || !playlists.length) {
    return <p className="text-sm text-white/50">No playlists found on this Spotify account.</p>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {playlists.map((pl) => (
        <button
          key={pl.id}
          onClick={() => onSelect(pl)}
          className={cn(
            "group text-left rounded-xl border flex items-center gap-3 px-2.5 py-1.5 transition-all",
            selectedId === pl.id
              ? "border-neon/60 shadow-glow-neon bg-surface"
              : "border-white/10 bg-surface hover:border-white/25"
          )}
        >
          <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 bg-black/40">
            {pl.images && pl.images[0] && pl.images[0].url ? (
              <Image src={pl.images[0].url} alt={pl.name} className="w-full h-full" fittingType="fill" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <Music2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          <span className="text-[11px] text-white/85 truncate font-medium flex-1">{pl.name}</span>
          {pl.tracks && pl.tracks.total ? (
            <span className="text-[10px] text-white/40 shrink-0">{pl.tracks.total}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}