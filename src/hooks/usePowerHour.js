import { useCallback, useEffect, useRef, useState } from "react";
import { playCanCrack, playCustomSound } from "@/lib/soundboard";

export default function usePowerHour({ player, mode, getTrackUri, chimeEnabled, customSound, onSessionEnd }) {
  const [phase, setPhase] = useState("idle"); // idle | running | paused | finished
  const [shotIndex, setShotIndex] = useState(0);
  const [shotsCompleted, setShotsCompleted] = useState(0);
  const [remainingMs, setRemainingMs] = useState(mode.intervalSeconds * 1000);
  const [drinkFlash, setDrinkFlash] = useState(false);

  const phaseRef = useRef("idle");
  const startingRef = useRef(false);
  const shotRef = useRef(0);
  const completedRef = useRef(0);
  const remainingRef = useRef(mode.intervalSeconds * 1000);
  const lastTickRef = useRef(0);
  const flashTimerRef = useRef(null);
  const intervalMsRef = useRef(mode.intervalSeconds * 1000);
  const totalRef = useRef(mode.totalShots);
  const playerRef = useRef(player);
  playerRef.current = player;
  const getTrackUriRef = useRef(getTrackUri);
  getTrackUriRef.current = getTrackUri;
  const chimeRef = useRef(chimeEnabled);
  chimeRef.current = chimeEnabled;
  const customSoundRef = useRef(customSound);
  customSoundRef.current = customSound;
  const onEndRef = useRef(onSessionEnd);
  onEndRef.current = onSessionEnd;

  // Reset counters when the mode changes while idle
  useEffect(() => {
    if (phaseRef.current !== "idle") return;
    intervalMsRef.current = mode.intervalSeconds * 1000;
    totalRef.current = mode.totalShots;
    shotRef.current = 0;
    setShotIndex(0);
    completedRef.current = 0;
    setShotsCompleted(0);
    remainingRef.current = mode.intervalSeconds * 1000;
    setRemainingMs(mode.intervalSeconds * 1000);
  }, [mode.intervalSeconds, mode.totalShots]);

  const fireDrink = useCallback(() => {
    setDrinkFlash(true);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setDrinkFlash(false), 3200);
    if (chimeRef.current) {
      const url = customSoundRef.current;
      if (url) playCustomSound(url).catch(() => playCanCrack());
      else playCanCrack();
    }
  }, []);

  const finish = useCallback(() => {
    setPhase("finished");
    phaseRef.current = "finished";
    playerRef.current.pause();
    if (onEndRef.current) {
      onEndRef.current({
        completed: true,
        shotsCompleted: totalRef.current,
        totalShots: totalRef.current,
        intervalSeconds: intervalMsRef.current / 1000,
      });
    }
  }, []);

  const advance = useCallback(() => {
    fireDrink();
    const done = completedRef.current + 1;
    completedRef.current = done;
    setShotsCompleted(done);
    if (done >= totalRef.current) {
      finish();
      return;
    }
    const next = shotRef.current + 1;
    shotRef.current = next;
    setShotIndex(next);
    remainingRef.current = intervalMsRef.current;
    setRemainingMs(intervalMsRef.current);
    const uri = getTrackUriRef.current ? getTrackUriRef.current(next) : null;
    if (uri && playerRef.current) {
      playerRef.current.playTrackUri(uri).catch(() => { /* surfaced via player error state */ });
    }
  }, [fireDrink, finish]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Ticking clock while running
  useEffect(() => {
    if (phase !== "running") return undefined;
    lastTickRef.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      const rem = remainingRef.current - delta;
      if (rem <= 0) {
        remainingRef.current = 0;
        setRemainingMs(0);
        advanceRef.current();
      } else {
        remainingRef.current = rem;
        setRemainingMs(rem);
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  const start = useCallback(async () => {
    const uri = getTrackUriRef.current ? getTrackUriRef.current(0) : null;
    if (!uri || !playerRef.current || startingRef.current) return false;
    startingRef.current = true;
    shotRef.current = 0;
    setShotIndex(0);
    completedRef.current = 0;
    setShotsCompleted(0);
    remainingRef.current = intervalMsRef.current;
    setRemainingMs(intervalMsRef.current);
    setDrinkFlash(false);
    try {
      await playerRef.current.playTrackUri(uri);
      // Don't advance tracks while Spotify is still activating the device.
      setPhase("running");
      phaseRef.current = "running";
      return true;
    } catch (e) {
      setPhase("idle");
      phaseRef.current = "idle";
      return false;
    } finally {
      startingRef.current = false;
    }
  }, []);

  const pause = useCallback(() => {
    if (phaseRef.current === "running") {
      setPhase("paused");
      phaseRef.current = "paused";
      playerRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (phaseRef.current === "paused") {
      setPhase("running");
      phaseRef.current = "running";
      playerRef.current.resume();
    }
  }, []);

  const skip = useCallback(() => {
    if (phaseRef.current === "running" || phaseRef.current === "paused") {
      advanceRef.current();
    }
  }, []);

  const reset = useCallback(() => {
    if ((phaseRef.current === "running" || phaseRef.current === "paused") && completedRef.current > 0 && onEndRef.current) {
      onEndRef.current({
        completed: false,
        shotsCompleted: completedRef.current,
        totalShots: totalRef.current,
        intervalSeconds: intervalMsRef.current / 1000,
      });
    }
    setPhase("idle");
    phaseRef.current = "idle";
    shotRef.current = 0;
    setShotIndex(0);
    completedRef.current = 0;
    setShotsCompleted(0);
    remainingRef.current = intervalMsRef.current;
    setRemainingMs(intervalMsRef.current);
    setDrinkFlash(false);
    playerRef.current.pause();
  }, []);

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  const intervalMs = mode.intervalSeconds * 1000;
  const progress = Math.min(1, Math.max(0, (intervalMs - remainingMs) / intervalMs));

  return {
    phase,
    shotIndex,
    shotsCompleted,
    remainingMs,
    drinkFlash,
    progress,
    secondsLeft: Math.ceil(remainingMs / 1000),
    start,
    pause,
    resume,
    skip,
    reset,
  };
}