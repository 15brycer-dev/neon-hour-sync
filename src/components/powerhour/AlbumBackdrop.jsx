import React, { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Blurred album-art wash behind the stage, cross-fading between tracks.
export default function AlbumBackdrop({ art }) {
  const [layers, setLayers] = useState(() => (art ? [{ id: 0, src: art }] : []));

  useEffect(() => {
    if (!art) return;
    setLayers((prev) => {
      if (prev.length && prev[prev.length - 1].src === art) return prev;
      return [...prev, { id: (prev[prev.length - 1]?.id ?? -1) + 1, src: art }].slice(-2);
    });
  }, [art]);

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none" aria-hidden="true">
      {layers.map((layer, i) => (
        <div
          key={layer.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === layers.length - 1 ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="absolute inset-0 scale-125 blur-3xl opacity-70">
            <Image src={layer.src} alt="" fittingType="fill" className="w-full h-full" />
          </div>
          <div className="absolute inset-0 bg-stage/75" />
        </div>
      ))}
    </div>
  );
}