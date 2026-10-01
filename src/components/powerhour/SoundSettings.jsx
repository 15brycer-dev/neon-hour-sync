import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import CustomSoundControl from "@/components/powerhour/CustomSoundControl";

export default function SoundSettings({ chimeEnabled, onChimeChange, volume, onVolumeChange, customSound, onCustomSoundChange }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label htmlFor="chime-toggle" className="text-sm text-white/80">Sound on track switch</Label>
        <Switch id="chime-toggle" checked={chimeEnabled} onCheckedChange={onChimeChange} />
      </div>
      <CustomSoundControl customSound={customSound} onChange={onCustomSoundChange} />
      <div className="space-y-3">
        <Label className="text-sm text-white/80">Soundboard volume</Label>
        <Slider
          value={[Math.round(volume * 100)]}
          onValueChange={([v]) => onVolumeChange(v / 100)}
          min={0}
          max={100}
          step={5}
        />
      </div>
    </div>
  );
}