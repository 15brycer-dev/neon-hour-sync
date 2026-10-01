import React from "react";
import { Loader2 } from "lucide-react";

export default function SpotifyPlayerSetup({ error, onRetry }) {
  const embedded = window.self !== window.top;
  return (
    <div className="mx-4 mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground flex flex-wrap items-center gap-3" role="status">
      {!error && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      <span>{error ? "Spotify player setup failed." : "Setting up the Spotify player…"}</span>
      {error && (
        <button type="button" onClick={onRetry} className="rounded-full border border-primary/40 px-4 py-2 text-primary">
          Retry player setup
        </button>
      )}
      {embedded && (
        <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-primary/40 px-4 py-2 text-primary">
          Open app in separate tab
        </a>
      )}
    </div>
  );
}