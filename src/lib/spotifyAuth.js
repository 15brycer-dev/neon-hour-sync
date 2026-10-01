const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

// Minimum scopes for the features built: Web Playback SDK (streaming),
// starting playback (user-modify-playback-state), profile/premium check
// (user-read-private), reading the user's playlists (playlist-read-*).
/** Return the deployed app path for Spotify OAuth callbacks. */
export function getSpotifyRedirectUri() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

const TOKENS_KEY = "ph_spotify_tokens";
const VERIFIER_KEY = "ph_pkce_verifier";

function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function buildAuthUrl(clientId, redirectUri) {
  const verifier = randomString(64);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(digest);
  localStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SPOTIFY_SCOPES,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForTokens(clientId, code, redirectUri) {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing login session. Please connect again.");
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Spotify login failed.");
  localStorage.removeItem(VERIFIER_KEY);
  return data;
}

export async function refreshAccessToken(clientId, refreshToken) {
  if (!refreshToken) {
    const error = new Error("Connect Spotify again to renew playback access.");
    error.code = "invalid_grant";
    throw error;
  }
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error === "invalid_grant"
      ? "Spotify authorization needs to be renewed. Connect Spotify again."
      : data.error_description || `Spotify couldn't renew playback access (${res.status}). Please retry.`);
    error.code = data.error;
    error.status = res.status;
    throw error;
  }
  return data;
}

export function saveTokens(tokens) {
  const payload = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
  };
  localStorage.setItem(TOKENS_KEY, JSON.stringify(payload));
}

export function getStoredTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY));
  } catch {
    return null;
  }
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKENS_KEY);
}