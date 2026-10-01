// The app's default track-switch sound (user-uploaded soda can opening).
export const DEFAULT_CUSTOM_SOUND =
  "https://media.base44.com/files/public/6abd15a83c517452f008a04d/a0f0f2adc_SODACANOpening-SoundEffect.mp3";

let ctx = null;
let master = null;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return { ctx, master };
}

export function setMasterVolume(volume) {
  const { master: m } = getCtx();
  m.gain.value = Math.max(0, Math.min(1, volume));
}

// A beer can opening: metallic tab crack, gas "psst", then a long fizz.
export function playCanCrack() {
  const { ctx: c, master: m } = getCtx();
  const now = c.currentTime;

  const noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // Layer filtered noise bursts: type, freq, Q, gain, attack, decay, startAt, stopAt (relative to now)
  const layer = (type, freq, q, gainValue, attack, decay, startAt, stopAt) => {
    const src = c.createBufferSource();
    src.buffer = noise;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = c.createGain();
    const t = now + startAt;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainValue, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
    src.connect(filter).connect(gain).connect(m);
    src.start(t);
    src.stop(now + stopAt);
  };

  // The tab cracking open — sharp, broadband click
  layer("bandpass", 3200, 0.8, 1.2, 0.002, 0.03, 0, 0.1);
  // Metallic ping of the tab, resonant and short
  layer("bandpass", 5200, 12, 0.5, 0.001, 0.12, 0.002, 0.2);
  // Gas escaping — "psst"
  layer("bandpass", 1800, 0.5, 0.6, 0.02, 0.15, 0.01, 0.25);
  // Lingering foam fizz
  layer("lowpass", 9000, 0.7, 0.18, 0.06, 0.9, 0.03, 1.0);
  // Tiny popping bubbles in the fizz
  for (let i = 0; i < 6; i++) {
    const t = 0.08 + Math.random() * 0.5;
    layer("highpass", 6000, 0.7, 0.12, 0.001, 0.012, t, t + 0.05);
  }
}

const customBufferCache = new Map();

// Play a user-uploaded sound file through the master volume.
export async function playCustomSound(url) {
  const { ctx: c, master: m } = getCtx();
  let buf = customBufferCache.get(url);
  if (!buf) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load custom sound");
    buf = await c.decodeAudioData(await res.arrayBuffer());
    customBufferCache.set(url, buf);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(m);
  src.start();
}

export function playAirhorn() {
  const { ctx: c, master: m } = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.7);
  lfo.frequency.value = 6;
  lfoGain.gain.value = 18;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, now);
  [0, 0.28, 0.56].forEach((t) => {
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(0.6, now + t + 0.03);
    gain.gain.setValueAtTime(0.6, now + t + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.26);
  });
  osc.connect(gain);
  gain.connect(m);
  osc.start(now);
  lfo.start(now);
  osc.stop(now + 0.9);
  lfo.stop(now + 0.9);
}

export function playCue() {
  const { ctx: c, master: m } = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(950, now + 0.28);
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain);
  gain.connect(m);
  osc.start(now);
  osc.stop(now + 0.4);
}