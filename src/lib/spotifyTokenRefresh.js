import { getStoredTokens, refreshAccessToken, saveTokens } from "@/lib/spotifyAuth";

let refreshPromise = null;
const fresh = (tokens) => tokens?.access_token && tokens.expires_at > Date.now() + 60000;

export default function getValidSpotifyToken(clientId, { forceRefresh = false } = {}) {
  const original = getStoredTokens();
  if (!original || !clientId) return Promise.resolve(null);
  if (refreshPromise) return refreshPromise;
  if (!forceRefresh && fresh(original)) return Promise.resolve(original.access_token);

  const renew = async () => {
    // Re-read after acquiring the lock: another tab may have refreshed already.
    const tokens = getStoredTokens();
    if (!tokens) return null;
    if (fresh(tokens) && (!forceRefresh || tokens.access_token !== original.access_token)) {
      return tokens.access_token;
    }
    const refreshed = await refreshAccessToken(clientId, tokens.refresh_token);
    const current = getStoredTokens();
    // Don't restore a disconnected session or overwrite a newer login.
    if (!current) return null;
    if (current.access_token !== tokens.access_token) return current.access_token;
    saveTokens({ ...tokens, ...refreshed, refresh_token: refreshed.refresh_token || tokens.refresh_token });
    return refreshed.access_token;
  };

  // Share refreshes within this tab and serialize them across popup/preview tabs.
  refreshPromise = (navigator.locks?.request
    ? navigator.locks.request("ph_spotify_token_refresh", renew)
    : renew()).finally(() => { refreshPromise = null; });
  return refreshPromise;
}