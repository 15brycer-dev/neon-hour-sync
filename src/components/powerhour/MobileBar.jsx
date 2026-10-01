import React from "react";
import { Pause, Play, SkipForward, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import ShuffleToggle from "@/components/powerhour/ShuffleToggle";

export default function MobileBar({ phase, disabled, onStart, onPause, onResume, onSkip, onSoundboard, shuffle, onToggleShuffle }) {
  const running = phase === "running";
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-5 bg-gradient-to-t from-black via-black/80 to-transparent">
      {running || phase === "paused" ? (
        <div className="flex items-center gap-3">
          <ShuffleToggle enabled={shuffle} onToggle={onToggleShuffle} className="w-[72px] h-[72px] shrink-0" />
          <button
            onClick={() => (running ? onPause() : onResume())}
            aria-label={running ? "Pause" : "Resume"}
            className="flex-1 h-[72px] rounded-2xl bg-neon text-black flex items-center justify-center gap-2 font-display uppercase font-bold tracking-widest text-sm shadow-glow-neon active:scale-[0.98] transition-transform"
          >
            {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
            {running ? "Pause" : "Resume"}
          </button>
          <button
            onClick={onSkip}
            aria-label="Skip track"
            className="w-[72px] h-[72px] rounded-2xl border border-white/10 bg-surface text-white flex items-center justify-center active:scale-95 transition-transform"
          >
            <SkipForward className="w-7 h-7" />
          </button>
          <button
            onClick={onSoundboard}
            aria-label="Soundboard"
            className="w-[72px] h-[72px] rounded-2xl border border-white/10 bg-surface text-white flex items-center justify-center active:scale-95 transition-transform"
          >
            <Megaphone className="w-7 h-7" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <ShuffleToggle enabled={shuffle} onToggle={onToggleShuffle} className="w-[72px] h-[72px] shrink-0" />
          <button
            onClick={onStart}
            disabled={disabled}
            className={cn(
              "flex-1 h-[72px] rounded-2xl font-display uppercase font-bold tracking-widest text-sm transition-all",
              disabled ? "bg-white/10 text-white/40" : "bg-neon text-black shadow-glow-neon active:scale-[0.98]"
            )}
          >
            {phase === "finished" ? "Play Again" : "Start Power Hour"}
          </button>
        </div>
      )}
    </div>
  );
}