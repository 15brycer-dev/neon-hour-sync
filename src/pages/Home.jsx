import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronUp, Megaphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useIsMobile } from "@/hooks/use-mobile";
import useSpotifyAuth from "@/hooks/useSpotifyAuth";
import useSpotifyPlayer from "@/hooks/useSpotifyPlayer";
import usePowerHour from "@/hooks/usePowerHour";
import { MODES } from "@/lib/modes";
import { spotifyFetch } from "@/lib/spotifyApi";
import getAlbumPalette from "@/lib/albumColors";
import { setMasterVolume, DEFAULT_CUSTOM_SOUND } from "@/lib/soundboard";
import CountdownRing from "@/components/powerhour/CountdownRing";
import RingStage from "@/components/powerhour/RingStage";
import TrackDisplay from "@/components/powerhour/TrackDisplay";
import ShotIndicator from "@/components/powerhour/ShotIndicator";
import DrinkBanner from "@/components/powerhour/DrinkBanner";
import ControlBar from "@/components/powerhour/ControlBar";
import MobileBar from "@/components/powerhour/MobileBar";
import ModePresets from "@/components/powerhour/ModePresets";
import PlaylistGrid from "@/components/powerhour/PlaylistGrid";
import UpcomingRail from "@/components/powerhour/UpcomingRail";
import SoundSettings from "@/components/powerhour/SoundSettings";
import SoundboardPanel from "@/components/powerhour/SoundboardPanel";
import SoundPopover from "@/components/powerhour/SoundPopover";
import SpotifyStatus from "@/components/powerhour/SpotifyStatus";
import SpotifyPlayerSetup from "@/components/powerhour/SpotifyPlayerSetup";
import NeonSign from "@/components/powerhour/NeonSign";
import ConnectOverlay from "@/components/powerhour/ConnectOverlay";
import MusicVisualizer from "@/components/powerhour/MusicVisualizer";
import AlbumBackdrop from "@/components/powerhour/AlbumBackdrop";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export default function Home() {
  const isMobile = useIsMobile();
  const auth = useSpotifyAuth();
  const player = useSpotifyPlayer({ auth });

  const [playlists, setPlaylists] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState(null);
  const [mode, setMode] = useState(MODES[0]);
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [customSound, setCustomSound] = useState(
    () => localStorage.getItem("neonhour_custom_sound") || DEFAULT_CUSTOM_SOUND
  );

  const handleCustomSoundChange = useCallback((url) => {
    setCustomSound(url);
    if (url) localStorage.setItem("neonhour_custom_sound", url);
    else localStorage.removeItem("neonhour_custom_sound");
  }, []);
  const [albumPalette, setAlbumPalette] = useState(null);

  useEffect(() => { setMasterVolume(volume); }, [volume]);

  // Tint the visualizer with the dominant colors of the current album cover
  useEffect(() => {
    const images = player.currentTrack?.album?.images;
    const url = images?.[1]?.url || images?.[images.length - 1]?.url;
    if (!url) {
      setAlbumPalette(null);
      return undefined;
    }
    let cancelled = false;
    getAlbumPalette(url).then((p) => { if (!cancelled) setAlbumPalette(p); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.currentTrack?.album?.uri, player.currentTrack?.album?.images?.[0]?.url]);

  // Load the user's Spotify playlists once connected
  useEffect(() => {
    if (auth.status !== "connected") {
      setPlaylists(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.getAccessToken();
        if (!token || cancelled) return;
        // Spotify returns playlists in pages of 50 — keep fetching until we have them all.
        const all = [];
        let url = "https://api.spotify.com/v1/me/playlists?limit=50";
        while (url) {
          const data = await spotifyFetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (cancelled) return;
          all.push(...((data && data.items) || []));
          url = data && data.next;
        }
        setPlaylists(all);
      } catch {
        if (!cancelled) setPlaylists([]);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, auth.connectionVersion]);

  const handleSelectPlaylist = useCallback((playlist) => {
    setSelectedPlaylist(playlist);
    setTracks([]);
    setPlaylistError(null);
    setTracksLoading(true);
    auth.getAccessToken()
      .then((token) => {
        if (!token) throw new Error("Spotify session unavailable — try reconnecting from the top right.");
        return spotifyFetch(`https://api.spotify.com/v1/playlists/${playlist.id}/items?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((data) => setTracks(
        ((data && data.items) || [])
          .map((i) => i.track || i.item)
          .filter((t) => t && t.uri && !t.is_local)
      ))
      .catch((e) => {
        setTracks([]);
        setPlaylistError(e.message || "Couldn't load that playlist's tracks.");
      })
      .finally(() => setTracksLoading(false));
  }, [auth]);

  // Random play order that still cycles through every track before repeating
  const shuffleOrder = useMemo(() => {
    if (!shuffle || tracks.length < 2) return null;
    const indices = tracks.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [shuffle, tracks]);

  const getTrackUri = useCallback(
    (shotIndex) => {
      if (!tracks.length) return null;
      if (shuffleOrder) return tracks[shuffleOrder[shotIndex % shuffleOrder.length]].uri;
      return tracks[shotIndex % tracks.length].uri;
    },
    [tracks, shuffleOrder]
  );

  const handleSessionEnd = useCallback(async (summary) => {
    try {
      await base44.entities.PowerHourSession.create({
        mode: mode.id,
        playlist_id: selectedPlaylist?.id || "",
        playlist_name: selectedPlaylist?.name || "Unknown playlist",
        shots_completed: summary.shotsCompleted,
        total_shots: summary.totalShots,
        interval_seconds: summary.intervalSeconds,
        completed: summary.completed,
      });
    } catch (e) { /* history save failure shouldn't break the game */ }
  }, [mode, selectedPlaylist]);

  const engine = usePowerHour({
    player,
    mode,
    getTrackUri,
    chimeEnabled,
    customSound,
    onSessionEnd: handleSessionEnd,
  });

  const gameActive = engine.phase === "running" || engine.phase === "paused";
  const orderedTracks = shuffleOrder ? shuffleOrder.map((i) => tracks[i]) : tracks;
  const displayTrack = player.currentTrack || (orderedTracks.length ? orderedTracks[engine.shotIndex % orderedTracks.length] : null);
  const canStart = auth.status === "connected" && player.ready && !!selectedPlaylist && tracks.length > 0;
  const bannerError = player.error || auth.error || playlistError;
  const trackFallback = tracksLoading
    ? "Loading tracks…"
    : selectedPlaylist
      ? "No playable tracks in this playlist"
      : "Choose a playlist to start";

  if (auth.status !== "connected") {
    return (
      <ConnectOverlay
        configured={auth.configured}
        status={auth.status}
        error={auth.error}
        onConnect={auth.connect}
      />
    );
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-stage text-white flex flex-col">
      {/* Top glass rail */}
      <header className="sticky top-0 z-40 border-b border-amber/20 bg-stage/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-14">
          <NeonSign className="text-xs md:text-sm" />
          <div className="hidden md:flex items-center gap-2">
            <ModePresets value={mode} onChange={setMode} disabled={gameActive} />
          </div>
          <SpotifyStatus
            status={auth.status}
            profile={auth.profile}
            onConnect={auth.connect}
            onDisconnect={auth.disconnect}
          />
        </div>
      </header>

      {bannerError && (
        <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {bannerError}
        </div>
      )}
      {auth.status === "connected" && !player.ready && (
        <SpotifyPlayerSetup error={player.error} onRetry={player.retry} />
      )}

      <div className="flex-1 min-h-0 md:grid md:grid-cols-[200px_1fr_240px] lg:grid-cols-[240px_1fr_320px]">
        {/* Round lineup */}
        <UpcomingRail tracks={orderedTracks} currentShot={engine.shotIndex} />
        {/* Stage */}
        <main className="relative isolate flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-4 pt-4 pb-44 md:pb-4">
          {/* Warm hanging-lamp glow over the stage */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_top,rgba(255,59,78,0.13),transparent_65%)]" />
          <AlbumBackdrop art={displayTrack?.album?.images?.[0]?.url || displayTrack?.artworkUrl} />
          <MusicVisualizer
            phase={engine.phase}
            remainingMs={engine.remainingMs}
            intervalMs={mode.intervalSeconds * 1000}
            trackId={displayTrack?.uri || displayTrack?.id}
            palette={albumPalette}
            roundFlash={engine.drinkFlash}
          />
          <DrinkBanner show={engine.drinkFlash} />

          {/* Mobile game status row */}
          <div className="md:hidden flex items-center justify-between gap-3 w-full max-w-md">
            <ShotIndicator
              current={engine.shotIndex + 1}
              total={mode.totalShots}
              flash={engine.drinkFlash}
              compact
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSoundboardOpen(true)}
                aria-label="Soundboard"
                className="w-10 h-10 rounded-full border border-white/10 bg-surface flex items-center justify-center text-white/70"
              >
                <Megaphone className="w-4 h-4" />
              </button>
              {gameActive && (
                <button
                  onClick={() => engine.reset()}
                  className="h-10 px-3 rounded-full border border-white/10 bg-surface text-xs uppercase tracking-wider text-white/60"
                >
                  End
                </button>
              )}
            </div>
          </div>

          <CountdownRing
            progress={engine.phase === "idle" ? 0 : engine.progress}
            className="w-[280px] h-[280px] lg:w-[320px] lg:h-[320px] xl:w-[360px] xl:h-[360px]"
          >
            <RingStage
              track={displayTrack}
              showName={Boolean(isMobile)}
              finished={engine.phase === "finished"}
              finishedShots={engine.shotsCompleted}
              spinning={engine.phase === "running"}
            />
          </CountdownRing>

          <div className="hidden md:block">
            <ShotIndicator current={engine.shotIndex + 1} total={mode.totalShots} flash={engine.drinkFlash} compact />
          </div>
          <TrackDisplay
            track={displayTrack}
            active={engine.phase === "running"}
            className="hidden md:flex"
            fallback={trackFallback}
            compact
          />

          <div className="hidden md:flex items-center justify-center gap-4 w-full">
            <ControlBar
              phase={engine.phase}
              disabled={!canStart}
              onStart={engine.start}
              onPause={engine.pause}
              onResume={engine.resume}
              onSkip={engine.skip}
              onEnd={() => engine.reset()}
              shuffle={shuffle}
              onToggleShuffle={() => setShuffle((v) => !v)}
            />
            <SoundPopover
              chimeEnabled={chimeEnabled}
              onChimeChange={setChimeEnabled}
              volume={volume}
              onVolumeChange={setVolume}
              customSound={customSound}
              onCustomSoundChange={handleCustomSoundChange}
            />
          </div>

          {/* Mobile playlist bottom sheet */}
          <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
            <DrawerTrigger asChild>
              <button className="md:hidden fixed bottom-28 inset-x-0 mx-auto w-fit z-40 flex items-center gap-2 rounded-full border border-white/15 bg-surface/90 backdrop-blur px-5 h-10 text-xs uppercase tracking-widest text-white/80 max-w-[70vw]">
                <ChevronUp className="w-4 h-4 shrink-0" />
                <span className="truncate">{selectedPlaylist ? selectedPlaylist.name : "Choose playlist"}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="bg-surface border-t border-white/10">
              <div className="max-h-[70vh] overflow-y-auto px-4 pb-8">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="font-display uppercase text-white text-sm tracking-widest neon-header">
                    Playlists
                  </DrawerTitle>
                </DrawerHeader>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <ModePresets value={mode} onChange={setMode} disabled={gameActive} />
                </div>
                <PlaylistGrid
                  playlists={playlists}
                  selectedId={selectedPlaylist?.id}
                  loading={!playlists}
                  onSelect={(pl) => { handleSelectPlaylist(pl); setSheetOpen(false); }}
                />
                <p className="text-xs text-white/30 mt-4 text-center">Music playback powered by Spotify.</p>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Mobile soundboard bottom sheet */}
          <Drawer open={soundboardOpen} onOpenChange={setSoundboardOpen}>
            <DrawerContent className="bg-surface border-t border-white/10">
              <div className="px-4 pb-8">
                <DrawerHeader className="px-0">
                  <DrawerTitle className="font-display uppercase text-white text-sm tracking-widest neon-header">
                    Soundboard
                  </DrawerTitle>
                </DrawerHeader>
                <SoundboardPanel compact customSound={customSound} />
                <div className="mt-6">
                  <SoundSettings
                    chimeEnabled={chimeEnabled}
                    onChimeChange={setChimeEnabled}
                    volume={volume}
                    onVolumeChange={setVolume}
                    customSound={customSound}
                    onCustomSoundChange={handleCustomSoundChange}
                  />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </main>

        {/* Right rail */}
        <aside className="hidden md:flex flex-col gap-6 border-l border-amber/15 bg-black/20 p-5 overflow-y-auto min-h-0">
          <section>
            <h3 className="font-display uppercase text-xs tracking-widest text-white/50 mb-3 neon-header">Spotify playlists</h3>
            <PlaylistGrid
              playlists={playlists}
              selectedId={selectedPlaylist?.id}
              loading={!playlists}
              onSelect={handleSelectPlaylist}
            />
          </section>
          <p className="mt-auto pt-4 text-xs text-white/30">Music playback powered by Spotify.</p>
        </aside>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden">
        <MobileBar
          phase={engine.phase}
          disabled={!canStart}
          onStart={engine.start}
          onPause={engine.pause}
          onResume={engine.resume}
          onSkip={engine.skip}
          onSoundboard={() => setSoundboardOpen(true)}
          shuffle={shuffle}
          onToggleShuffle={() => setShuffle((v) => !v)}
        />
      </div>
    </div>
  );
}