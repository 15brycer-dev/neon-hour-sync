import React, { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 56;
const FLASH_MS = 700; // how long the round-change burst holds

// Deterministic per-round visual identity: every track gets a stable
// "personality" (motion style, tempo, wave shape) derived from its id —
// the same track always moves the same way, no two rounds look alike.
function hash01(id, salt) {
  let h = 2166136261;
  const s = `${id}:${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function trackIdentity(id) {
  const key = id || "idle";
  return {
    styleA: Math.floor(hash01(key, "style") * 3),
    styleB: Math.floor(hash01(key, "alt") * 3),
    speed: 0.6 + hash01(key, "tempo") * 1.1,
    wobble: 0.7 + hash01(key, "wobble") * 0.9,
    falloff: 0.3 + hash01(key, "falloff") * 0.45,
  };
}

// Motion signatures a round can move with
const STYLES = [
  // rolling wave across the bar
  (e, t, idn) => 0.55 + 0.45 * Math.sin(t * idn.speed * 2 + e * idn.wobble * 5),
  // heartbeat — center-weighted pulse travelling outward
  (e, t, idn) => 0.5 + 0.5 * Math.cos(e * 3.1 - t * idn.speed * 1.6),
  // staircase — blocky steps marching across the bar
  (e, t, idn) => {
    const step = Math.floor((t * idn.speed + e * 4) % 4);
    return step === 0 ? 0.9 : step === 2 ? 0.55 : 0.3;
  },
];

export default function MusicVisualizer({ phase, remainingMs, intervalMs, trackId, palette, roundFlash, className }) {
  const canvasRef = useRef(null);
  const active = phase === "running";

  const stateRef = useRef({ phase, remainingMs, intervalMs, roundFlash });
  stateRef.current = { phase, remainingMs, intervalMs, roundFlash };

  const identity = useMemo(() => trackIdentity(trackId), [trackId]);
  const identityRef = useRef(identity);
  identityRef.current = identity;

  const [lowColor, highColor, glowColor] = useMemo(() => {
    if (!palette) return ["rgba(255,196,0,0.5)", "rgba(255,59,78,0.85)", "rgba(255,59,78,0.55)"];
    const low = `rgba(${palette.low.join(",")},0.5)`;
    const high = `rgba(${palette.high.join(",")},0.85)`;
    return [low, high, `rgba(${palette.high.join(",")},0.55)`];
  }, [palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
      const edge = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2); // 0 center, 1 edges
      return { level: 0, target: 0, vel: 0, edge };
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let last = performance.now();
    // Smooth sub-frame round clock: extrapolate remaining time between React updates
    let seenRemaining = null;
    let seenAt = 0;
    let flashStartedAt = -1;

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const s = stateRef.current;
      const idn = identityRef.current;
      const tSec = now / 1000;

      if (s.remainingMs !== seenRemaining) {
        seenRemaining = s.remainingMs;
        seenAt = now;
      }
      const remaining = Math.max(0, s.remainingMs - (now - seenAt));
      const p = s.intervalMs > 0 ? 1 - remaining / s.intervalMs : 0; // elapsed fraction of the round

      // Round-change burst: full-strength spike at the shot, fading into the new round
      if (s.roundFlash && flashStartedAt < 0) flashStartedAt = now;
      if (!s.roundFlash && flashStartedAt >= 0) flashStartedAt = -1;
      const burst = flashStartedAt >= 0 ? Math.max(0, 1 - (now - flashStartedAt) / FLASH_MS) : 0;

      // The round's choreography — driven by the game clock, not the music:
      // begins calm → intensity rises → animation changes → countdown → big buildup → next round
      let intensity = 0;
      let pulse = 0;
      if (s.phase === "running") {
        if (p < 0.5) intensity = 0.25 + 0.25 * (p / 0.5); // round begins — calm
        else intensity = 0.5 + 0.25 * Math.pow((p - 0.5) / 0.5, 1.6); // builds toward the end
        if (p >= 0.75) { // countdown begins — pulse on every second
          const frac = (remaining % 1000) / 1000;
          pulse = Math.max(pulse, Math.pow(1 - frac, 1.5) * 0.45);
        }
        if (p >= 0.92) { // big buildup — fast pulse at full intensity
          intensity = Math.max(intensity, 0.85);
          const f2 = (remaining % 250) / 250;
          pulse = Math.max(pulse, Math.pow(1 - f2, 2) * 0.55);
        }
        intensity = Math.max(intensity, burst);
        pulse = Math.max(pulse, burst * 0.8);
      } else if (s.phase === "paused") {
        intensity = 0.12; // resting shimmer
      } else if (s.phase === "finished") {
        intensity = 0.3 + 0.15 * Math.sin(tSec * 2);
      } else {
        intensity = 0.1;
      }

      // The animation changes mid-round: style A hands off to style B around halfway
      const styleBWeight = s.phase === "running" ? Math.min(1, Math.max(0, (p - 0.46) / 0.1)) : 0;

      for (const b of bars) {
        const a = STYLES[idn.styleA](b.edge, tSec, idn);
        const alt = STYLES[idn.styleB](b.edge, tSec, idn);
        const motion = a * (1 - styleBWeight) + alt * styleBWeight;
        const falloff = 1 - b.edge * idn.falloff;
        b.target = Math.max(0, Math.min(1, motion * intensity * falloff + pulse * (1 - b.edge * 0.6)));
        b.vel += (b.target - b.level) * 50 * dt;
        b.vel *= Math.exp(-9 * dt);
        b.level = Math.max(0, b.level + b.vel * dt);
      }

      const bw = w / BAR_COUNT;
      const barW = bw * 0.6;
      const maxH = h * 0.55;
      for (let i = 0; i < BAR_COUNT; i++) {
        const b = bars[i];
        const bh = b.level * maxH;
        if (bh < 1) continue;
        const x = i * bw + bw * 0.2;
        const grad = ctx.createLinearGradient(0, h, 0, h - bh);
        grad.addColorStop(0, lowColor);
        grad.addColorStop(1, highColor);
        ctx.fillStyle = grad;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14 + burst * 20;
        ctx.fillRect(x, h - bh, barW, bh);
      }
      ctx.shadowBlur = 0;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [lowColor, highColor, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none -z-10 transition-opacity duration-700",
        active ? "opacity-100" : "opacity-30",
        className
      )}
    />
  );
}