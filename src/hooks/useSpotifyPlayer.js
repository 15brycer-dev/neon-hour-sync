import { useCallback, useEffect, useRef, useState } from "react";
import playOnSpotifyDevice, { isMissingSpotifyDevice } from "@/lib/spotifyPlayback";

// Tokens keep the scopes they were granted with; the playback SDK additionally
// requires user-read-email, which only a fresh authorization can add.
const isScopeError = (message) => /scope/i.test(message || "");

let sdkPromise = null;

function loadSpotifySdk() {
  if (window.Spotify?.Player) return Promise.resolve(window.Spotify);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error("Spotify's player couldn't load. Check your connection or browser content blocker, then retry."));
    };
    const timeout = setTimeout(fail, 20000);
    window.onSpotifyWebPlaybackSDKReady = () => {
      clearTimeout(timeout);
      resolve(window.Spotify);
    };
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });
  return sdkPromise;
}

export default function useSpotifyPlayer({ auth }) {
  const [ready, setReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [paused, setPaused] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const authenticationRecoveryRef = useRef(false);
  const pendingPlaybackRef = useRef(null);
  const positionRef = useRef(0);
  const retry = useCallback(() => {
    authenticationRecoveryRef.current = false;
    setRetryAttempt((attempt) => attempt + 1);
  }, []);
  const playerRef = useRef(null);
  const deviceIdRef = useRef(null);
  const activeDeviceRef = useRef(null);
  const getAccessTokenRef = useRef(auth.getAccessToken);
  getAccessTokenRef.current = auth.getAccessToken;

  useEffect(() => {
    if (auth.status !== "connected") {
      authenticationRecoveryRef.current = false;
      return undefined;
    }
    let cancelled = false;
    let player = null;
    let setupTimeout;
    setReady(false);
    setError(null);
    setCurrentTrack(null);
    const fail = (message) => {
      if (cancelled) return;
      clearTimeout(setupTimeout);
      deviceIdRef.current = null;
      activeDeviceRef.current = null;
      setReady(false);
      setError(message);
    };
    const policy = document.permissionsPolicy || document.featurePolicy;
    if (policy?.allowsFeature && !policy.allowsFeature("encrypted-media")) {
      fail("This embedded preview doesn't allow Spotify's protected audio. Open the app in a separate tab to play music.");
      return undefined;
    }
    setupTimeout = setTimeout(() => fail("Spotify didn't finish connecting. Retry, or open the app in a separate tab if you're using the embedded preview."), 30000);
    loadSpotifySdk()
      .then(async (Spotify) => {
        if (cancelled) return;
        // Device retries rebuild the SDK, not the login. Only authentication
        // recovery needs to force new credentials.
        const token = await getAccessTokenRef.current({ forceRefresh: authenticationRecoveryRef.current });
        if (cancelled) return;
        if (!token) {
          fail("Connect Spotify again to renew playback access.");
          return;
        }
        player = new Spotify.Player({
          name: "Power Hour Club",
          getOAuthToken: (cb) => {
            getAccessTokenRef.current()
              .then((token) => {
                if (cancelled) return;
                if (!token) {
                  fail("Spotify session is unavailable — disconnect and reconnect Spotify.");
                  return;
                }
                cb(token);
              })
              .catch((e) => fail(e.message));
          },
          volume: 0.8,
        });
        playerRef.current = player;
        player.addListener("ready", ({ device_id }) => {
          if (cancelled) return;
          clearTimeout(setupTimeout);
          deviceIdRef.current = device_id;
          activeDeviceRef.current = null;
          // SDK readiness is authoritative. Waiting for the separate device list
          // here prevents the Start click from activating an otherwise ready player.
          setReady(true);
          setError(null);
        });
        player.addListener("not_ready", ({ device_id }) => {
          if (device_id === deviceIdRef.current) fail("Spotify player went offline. Retry to reconnect.");
        });
        player.addListener("player_state_changed", (state) => {
          if (cancelled || !state) return;
          positionRef.current = state.position || 0;
          setCurrentTrack(state.track_window.current_track);
          setPaused(state.paused);
        });
        player.addListener("initialization_error", ({ message }) => fail(`${message || "This browser couldn't initialize Spotify's protected audio."} Try opening the app in a separate tab with protected content enabled.`));
        player.addListener("account_error", () => fail("Spotify Premium is required to play music in the app."));
        player.addListener("authentication_error", ({ message }) => {
          if (cancelled) return;
          if (isScopeError(message)) {
            auth.disconnect();
            auth.setError("Spotify needs new permissions — connect Spotify again to enable playback.");
            return;
          }
          fail(message || "Spotify rejected playback authorization. Reconnect Spotify.");
          // Recover once with fresh credentials; preserve the real error if rejected again.
          if (!authenticationRecoveryRef.current) {
            authenticationRecoveryRef.current = true;
            setRetryAttempt((attempt) => attempt + 1);
          }
        });
        player.addListener("playback_error", ({ message }) => {
          if (cancelled) return;
          if (isMissingSpotifyDevice({ message })) {
            // Don't invalidate the device while its registration retry is in progress.
            if (pendingPlaybackRef.current?.player !== player) fail(message);
          } else setError(message || "Spotify playback error.");
        });
        const connected = await player.connect();
        if (cancelled || playerRef.current !== player) {
          player.disconnect();
          return;
        }
        if (!connected) fail("Spotify couldn't connect this player. Retry or open the app in a separate tab.");
      })
      .catch((e) => fail(e.message));
    return () => {
      cancelled = true;
      clearTimeout(setupTimeout);
      if (playerRef.current === player) {
        playerRef.current = null;
        deviceIdRef.current = null;
        activeDeviceRef.current = null;
        setReady(false);
      }
      if (player) player.disconnect();
    };
  }, [auth.status, auth.connectionVersion, retryAttempt]);

  const playTrackUri = useCallback(async (uri) => {
    const player = playerRef.current;
    const deviceId = deviceIdRef.current;
    const request = { player, deviceId };
    pendingPlaybackRef.current = request;
    try {
      if (!player || !deviceId) throw new Error("Spotify player not ready yet.");
      // Run synchronously from the Start click before token/network requests.
      await player.activateElement();
      const isCurrent = () => playerRef.current === player && deviceIdRef.current === deviceId;
      await playOnSpotifyDevice({
        getAccessToken: () => getAccessTokenRef.current(), deviceId, uri, isCurrent,
      });
      if (!isCurrent()) return;
      activeDeviceRef.current = deviceId;
      setError(null);
    } catch (e) {
      if (playerRef.current === player && deviceIdRef.current === deviceId) {
        activeDeviceRef.current = null;
        if (isMissingSpotifyDevice(e)) {
          deviceIdRef.current = null;
          setReady(false);
        }
        setError(e.message);
      }
      throw e;
    } finally {
      if (pendingPlaybackRef.current === request) pendingPlaybackRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current) playerRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    if (playerRef.current) playerRef.current.resume();
  }, []);

  return { ready, currentTrack, paused, error, positionRef, playTrackUri, pause, resume, setError, retry };
}