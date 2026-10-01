import React from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import ShuffleToggle from "@/components/powerhour/ShuffleToggle";

export default function ControlBar({ phase, disabled, onStart, onPause, onResume, onSkip, onEnd, shuffle, onToggleShuffle }) {
  const running = phase === "running";
  return (
    <div className="flex items-center justify-center gap-5">
      {running || phase === "paused" ? (
        <>
          <ShuffleToggle enabled={shuffle} onToggle={onToggleShuffle} className="w-16 h-16" />
          <button
            onClick={() => (running ? onPause() : onResume())}
            title={running ? "Pause" : "Resume"}
            aria-label={running ? "Pause" : "Resume"}
            className="w-20 h-20 rounded-full bg-neon text-black flex items-center justify-center shadow-glow-neon hover:scale-105 active:scale-95 transition-transform"
          >
            {running ? <Pause className="w-9 h-9" strokeWidth={2.5} /> : <Play className="w-9 h-9 ml-1" strokeWidth={2.5} />}
          </button>
          <button
            onClick={onSkip}
            title="Skip track (take the shot, move on)"
            aria-label="Skip track"
            className="w-16 h-16 rounded-full border border-white/20 bg-gradient-to-b from-white/15 to-white/5 text-white shadow-chrome-inset flex items-center justify-center hover:border-neon/60 hover:text-neon transition-colors"
          >
            <SkipForward className="w-7 h-7" />
          </button>
          <button
            onClick={onEnd}
            className="px-5 h-16 rounded-full border border-white/20 bg-gradient-to-b from-white/10 to-white/0 text-white/70 font-body text-xs uppercase tracking-wider shadow-chrome-inset hover:border-neon/50 hover:text-neon transition-colors"
          >
            End
          </button>
        </>
      ) : (
        <>
          <ShuffleToggle enabled={shuffle} onToggle={onToggleShuffle} className="w-16 h-16" />
          <button
            onClick={onStart}
            disabled={disabled}
            className={cn(
              "px-12 h-20 rounded-full font-display uppercase font-bold text-base tracking-widest transition-all",
              disabled
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-neon text-black shadow-glow-neon hover:scale-105 active:scale-95"
            )}
          >
            {phase === "finished" ? "Play Again" : "Start Power Hour"}
          </button>
        </>
      )}
    </div>
  );
}