import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { spotifyFetch } from "@/lib/spotifyApi";
import getValidSpotifyToken from "@/lib/spotifyTokenRefresh";
import {
  SPOTIFY_SCOPES,
  buildAuthUrl,
  getSpotifyRedirectUri,
  exchangeCodeForTokens,
  saveTokens,
  getStoredTokens,
  clearStoredTokens,
} from "@/lib/spotifyAuth";

export default function useSpotifyAuth() {
  const [status, setStatus] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("code") || params.has("error")) return "connecting";
    return getStoredTokens() ? "connected" : "disconnected";
  });
  const [configured, setConfigured] = useState(null); // null = checking
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [connectionVersion, setConnectionVersion] = useState(0);
  const clientIdRef = useRef(null);
  const popupRef = useRef(null);

  const getAccessToken = useCallback(async (options = {}) => {
    try {
      const stored = getStoredTokens();
      const granted = new Set((stored?.scope || "").split(" "));
      if (stored && !SPOTIFY_SCOPES.split(" ").every((scope) => granted.has(scope))) {
        const error = new Error("Spotify needs permission to verify this browser's playback device. Connect Spotify again.");
        error.code = "insufficient_scope";
        throw error;
      }
      const token = await getValidSpotifyToken(clientIdRef.current, options);
      if (token && options.forceRefresh) setError(null);
      return token;
    } catch (e) {
      const message = e.name === "TypeError" ? "Could not reach Spotify. Check your connection and retry." : e.message;
      setError(message);
      // Temporary network/rate-limit errors must not erase a usable login.
      if (e.code === "invalid_grant" || e.code === "insufficient_scope") {
        clearStoredTokens();
        setStatus("disconnected");
        return null;
      }
      throw new Error(message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44.functions.invoke("getSpotifyConfig", {})
      .then((res) => {
        if (cancelled) return;
        if (res.data?.configured) {
          clientIdRef.current = res.data.clientId;
          setConfigured(true);
        } else {
          setConfigured(false);
        }
      })
      .catch(() => { if (!cancelled) setConfigured(false); });
    return () => { cancelled = true; };
  }, []);

  // Handle the OAuth redirect callback (?code=... or ?error=...)
  useEffect(() => {
    if (configured !== true) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const oauthError = params.get("error");
    if (!code && !oauthError) return;
    const clean = () => window.history.replaceState({}, document.title, window.location.pathname);
    if (oauthError) {
      setError("Spotify connection was cancelled.");
      setStatus("disconnected");
      clean();
      return;
    }
    setStatus("connecting");
    exchangeCodeForTokens(clientIdRef.current, code, getSpotifyRedirectUri())
      .then((tokens) => {
        saveTokens(tokens);
        clean();
        if (window.opener) {
          // Pass the completed login to the window that requested it. Storage
          // can be partitioned between an embedded preview and its login popup.
          window.opener.postMessage({ type: "spotify_connected", tokens }, window.location.origin);
          // The login popup must not create a second Spotify playback instance.
          window.close();
          return;
        }
        setConnectionVersion((version) => version + 1);
        setStatus("connected");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("disconnected");
        clean();
      });
  }, [configured]);

  // Adopt only the login returned by the popup this window opened.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== popupRef.current || e.data?.type !== "spotify_connected") return;
      const tokens = e.data.tokens;
      if (!tokens?.access_token || !tokens?.refresh_token || typeof tokens.scope !== "string") return;
      saveTokens(tokens);
      popupRef.current = null;
      setError(null);
      // A new login must rebuild the SDK even if the previous status was connected;
      // otherwise its device can belong to a different Spotify session/account.
      setConnectionVersion((version) => version + 1);
      setStatus("connected");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Load the Spotify profile once connected
  useEffect(() => {
    if (status !== "connected" || configured !== true) {
      setProfile(null);
      return undefined;
    }
    let cancelled = false;
    getAccessToken()
      .then((token) => token && spotifyFetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      }))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.product && data.product !== "premium") {
          setError("Spotify Premium is required for in-app playback.");
        }
        setProfile({ name: data.display_name, product: data.product });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status, configured, getAccessToken, connectionVersion]);

  const connect = useCallback(() => {
    const clientId = clientIdRef.current;
    if (!clientId) {
      setError("Spotify is not configured yet.");
      return;
    }
    setError(null);
    // Spotify's login page refuses to render inside an embedded preview frame,
    // so when running in a frame we do the login in a separate tab and wait
    // for it to report back (see the message listener below).
    const inFrame = window.self !== window.top;
    let popup = null;
    if (inFrame) {
      popup = window.open("", "spotify-auth");
      popupRef.current = popup;
    }
    buildAuthUrl(clientId, getSpotifyRedirectUri()).then((url) => {
      if (!inFrame) {
        window.location.href = url;
      } else if (popup && !popup.closed) {
        popup.location.href = url;
      } else {
        popupRef.current = window.open(url, "spotify-auth");
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    clearStoredTokens();
    setStatus("disconnected");
    setProfile(null);
    setError(null);
  }, []);

  // Saved tokens alone aren't ready: all consumers must wait for the client configuration.
  const connectionStatus = status === "connected" && configured !== true ? "connecting" : status;
  return { status: connectionStatus, connectionVersion, configured, profile, error, setError, connect, disconnect, getAccessToken };
}