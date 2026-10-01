import React from "react";
import VinylRecord from "@/components/powerhour/VinylRecord";

export default function RingStage({ track, showName, finished, finishedShots, spinning }) {
  if (finished) {
    return (
      <div className="text-center">
        <p className="font-display uppercase text-neon text-2xl lg:text-4xl tracking-widest">Complete</p>
        <p className="text-white/60 text-sm mt-2">{finishedShots} shots down</p>
      </div>
    );
  }
  const art = (track?.album?.images?.[0]?.url) || track?.artworkUrl;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <VinylRecord art={art} spinning={spinning} className="w-[88%] h-[88%]" />
      {showName && (
        <p className="absolute inset-x-0 bottom-[8%] mx-auto w-fit font-display uppercase text-[10px] text-white/90 max-w-[60%] truncate bg-black/50 rounded-full px-3 py-0.5 pointer-events-none">
          {track?.name || "Pick a playlist"}
        </p>
      )}
    </div>
  );
}