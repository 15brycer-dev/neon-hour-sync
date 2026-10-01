import React from "react";
import { cn } from "@/lib/utils";

export default function SpotifyStatus({ status, profile, onConnect, onDisconnect }) {
  const connected = status === "connected";
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          connected ? "bg-neon animate-pulse" : status === "connecting" ? "bg-amber animate-pulse" : "bg-white/30"
        )}
      />
      <span className="text-xs text-white/70 hidden sm:inline">
        {connected
          ? profile?.name ? `Spotify · ${profile.name}` : "Spotify connected"
          : status === "connecting" ? "Connecting…" : "Spotify off"}
      </span>
      {connected ? (
        <button
          onClick={onDisconnect}
          className="text-xs text-white/40 hover:text-white/80 underline underline-offset-2"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="text-xs text-neon hover:underline underline-offset-2"
        >
          Connect
        </button>
      )}
    </div>
  );
}