import { spotifyFetch } from "@/lib/spotifyApi";

// Skip song intros: every track starts this far in.
export const TRACK_START_MS = 30000;

export function isMissingSpotifyDevice(error) {
  return error?.code === "device_not_found" || error?.reason === "DEVICE_NOT_FOUND" || /device.*not found|no active device|device_not_found/i.test(error?.message || "");
}

export default async function playOnSpotifyDevice({ getAccessToken, deviceId, uri, isCurrent }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!isCurrent()) throw new Error("Spotify player went offline. Retry player setup.");
    const token = await getAccessToken();
    if (!token) throw new Error("Connect Spotify again to renew playback access.");
    if (!isCurrent()) throw new Error("Spotify player went offline. Retry player setup.");
    try {
      // Start has already activated the SDK audio element. Use its live device ID
      // directly; the device-list endpoint is not a prerequisite for playback.
      await spotifyFetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
        method: "PUT", retries: 0,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [uri], position_ms: TRACK_START_MS }),
      });
      if (!isCurrent()) throw new Error("Spotify player went offline. Retry player setup.");
      return;
    } catch (error) {
      if (!isMissingSpotifyDevice(error) || attempt === 2) throw error;
      if (!isCurrent()) throw new Error("Spotify player went offline. Retry player setup.");
      // Recover only from a real playback rejection, never an empty device list.
      if (attempt === 0) {
        await spotifyFetch("https://api.spotify.com/v1/me/player", {
          method: "PUT", retries: 0,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ device_ids: [deviceId], play: false }),
        });
      }
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 500));
    }
  }
}