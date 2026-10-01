import React from "react";
import { Megaphone } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SoundboardPanel from "@/components/powerhour/SoundboardPanel";
import SoundSettings from "@/components/powerhour/SoundSettings";

export default function SoundPopover({ chimeEnabled, onChimeChange, volume, onVolumeChange, customSound, onCustomSoundChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Soundboard and sound settings"
          className="w-12 h-12 rounded-full border border-white/10 bg-surface text-white/70 hover:text-neon hover:border-neon/50 transition-colors flex items-center justify-center shrink-0"
        >
          <Megaphone className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-surface border-white/10 p-4 max-h-[70vh] overflow-y-auto">
        <h3 className="font-display uppercase text-xs tracking-widest text-white/50 mb-3 neon-header">Soundboard</h3>
        <SoundboardPanel customSound={customSound} />
        <div className="mt-5 border-t border-white/10 pt-4">
          <SoundSettings
            chimeEnabled={chimeEnabled}
            onChimeChange={onChimeChange}
            volume={volume}
            onVolumeChange={onVolumeChange}
            customSound={customSound}
            onCustomSoundChange={onCustomSoundChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}