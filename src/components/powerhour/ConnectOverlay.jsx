import React from "react";
import { Loader2, Music2 } from "lucide-react";
import NeonSign from "./NeonSign";
import { getSpotifyRedirectUri } from "@/lib/spotifyAuth";

export default function ConnectOverlay({ configured, status, error, onConnect }) {
  return (
    <div className="fixed inset-0 z-50 bg-stage flex flex-col items-center justify-center px-6 text-center">
      <Music2 className="w-10 h-10 text-neon mb-6" />
      <h1 className="mb-4">
        <NeonSign className="text-4xl md:text-6xl" />
      </h1>
      <p className="text-white/60 max-w-md mb-8 text-sm md:text-base">
        Connect your Spotify Premium account, pick a playlist, and take a shot every time the track switches.
      </p>
      {configured === false ? (
        <div className="max-w-md rounded-2xl border border-amber/40 bg-amber/10 p-5 text-left">
          <p className="text-amber text-sm font-medium mb-2">Spotify isn't configured yet.</p>
          <p className="text-white/70 text-sm">
            Add your Spotify Client ID in this app's secrets (SPOTIFY_CLIENT_ID), and register this URL as a
            redirect URI in the Spotify Developer Dashboard:
          </p>
          <code className="block mt-3 text-xs bg-black/50 rounded-lg px-3 py-2 text-neon break-all">
            {getSpotifyRedirectUri()}
          </code>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={status === "connecting" || configured === null}
          className="px-10 h-16 rounded-full bg-neon text-black font-display uppercase font-bold tracking-widest text-sm shadow-glow-neon hover:scale-105 active:scale-95 transition-transform disabled:opacity-60 flex items-center gap-3"
        >
          {status === "connecting" || configured === null ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Music2 className="w-5 h-5" />
          )}
          {configured === null ? "Checking setup…" : status === "connecting" ? "Connecting…" : "Connect Spotify"}
        </button>
      )}
      {error && <p className="text-red-400 text-sm mt-5">{error}</p>}
      <p className="text-white/30 text-xs mt-10">Music playback powered by Spotify.</p>
    </div>
  );
}