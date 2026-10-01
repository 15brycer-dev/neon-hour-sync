import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// A spinning record: grooved black disc with the album cover as the center label.
// The light sheen sits above the disc so it stays fixed while the record turns.
export default function VinylRecord({ art, spinning, className }) {
  return (
    <div className={cn("relative rounded-full shrink-0", className)}>
      <div className={cn("absolute inset-0 rounded-full overflow-hidden vinyl-disc", spinning && "animate-vinyl-spin")}>
        <div className="absolute inset-0 m-auto w-[38%] h-[38%] rounded-full overflow-hidden border border-black/60">
          {art ? (
            <Image src={art} alt="" fittingType="fill" className="w-full h-full" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-white/40 text-xs">♪</div>
          )}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-black" />
        </div>
      </div>
      <div className="absolute inset-0 rounded-full vinyl-sheen pointer-events-none" />
    </div>
  );
}