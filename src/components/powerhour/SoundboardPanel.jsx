import React from "react";
import { Megaphone, Beer, Zap } from "lucide-react";
import { playAirhorn, playCanCrack, playCustomSound, playCue } from "@/lib/soundboard";
import { cn } from "@/lib/utils";

export default function SoundboardPanel({ compact, customSound }) {
  const cues = [
    { id: "airhorn", label: "Airhorn", icon: Megaphone, play: playAirhorn },
    { id: "cancrack", label: customSound ? "Your Sound" : "Can Crack", icon: Beer, play: customSound ? () => playCustomSound(customSound).catch(() => {}) : playCanCrack },
    { id: "cue", label: "Custom Cue", icon: Zap, play: playCue },
  ];
  return (
    <div className={compact ? "flex gap-3" : "grid grid-cols-3 gap-3"}>
      {cues.map(({ id, label, icon: Icon, play }) => (
        <button
          key={id}
          onClick={play}
          className={cn(
            "rounded-xl border border-white/10 bg-surface text-white/80 hover:text-neon hover:border-neon/50 hover:shadow-glow-neon transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider",
            compact ? "flex-1 h-12" : "h-12"
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}