import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const INTERVALS = [15, 30, 45, 60, 90, 120];

export default function ModePresets({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [shots, setShots] = useState(60);
  const [interval, setIntervalSec] = useState(60);

  const pill = (active) =>
    cn(
      "h-9 px-4 rounded-full border text-xs uppercase tracking-wider transition-all whitespace-nowrap",
      active
        ? "border-neon text-neon shadow-glow-neon bg-neon/10"
        : "border-white/10 text-white/60 hover:text-white hover:border-white/30",
      disabled && "opacity-50 cursor-not-allowed"
    );

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={disabled}
        className={pill(value.id === "standard")}
        onClick={() => onChange({ id: "standard", label: "Standard 60", totalShots: 60, intervalSeconds: 60 })}
      >
        Standard 60
      </button>
      <button
        disabled={disabled}
        className={pill(value.id === "century")}
        onClick={() => onChange({ id: "century", label: "Century 100", totalShots: 100, intervalSeconds: 60 })}
      >
        Century 100
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button disabled={disabled} className={pill(value.id === "custom")}>
            {value.id === "custom" ? value.label : "Custom"}
          </button>
        </DialogTrigger>
        <DialogContent className="bg-surface border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display uppercase text-white">Custom Power Hour</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="shots">Number of shots (5–150)</Label>
              <Input
                id="shots"
                type="number"
                min={5}
                max={150}
                value={shots}
                onChange={(e) => setShots(Math.max(5, Math.min(150, Number(e.target.value) || 5)))}
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Seconds per track</Label>
              <Select value={String(interval)} onValueChange={(v) => setIntervalSec(Number(v))}>
                <SelectTrigger className="w-full bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface border-white/10">
                  {INTERVALS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-neon text-black hover:bg-neon/90 font-display uppercase text-xs tracking-wider"
              onClick={() => {
                onChange({
                  id: "custom",
                  label: `Custom ${shots} × ${interval}s`,
                  totalShots: shots,
                  intervalSeconds: interval,
                });
                setOpen(false);
              }}
            >
              Save Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}