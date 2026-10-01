// Samples a track's album artwork to find its dominant colors, so the
// visualizer can take on the mood of each record spinning.
const cache = new Map();
const TIMEOUT_MS = 10000;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Artwork failed to load"));
    img.src = url;
  });
}

async function fetchAsObjectUrl(url) {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("Artwork fetch failed");
  return URL.createObjectURL(await res.blob());
}

function sample(img) {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size); // throws if tainted
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 24 || lum > 236) continue; // skip near-black and near-white wash
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const entry = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    entry.r += r; entry.g += g; entry.b += b; entry.n++;
    buckets.set(key, entry);
  }
  // Favor vivid, mid-brightness regions — the colors that define the art.
  const scored = [...buckets.values()].map((e) => {
    const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return { r, g, b, score: e.n * (0.3 + sat) * (1 - Math.abs(lum - 140) / 220) };
  }).sort((x, y) => y.score - x.score);
  if (!scored.length) throw new Error("No usable colors in artwork");
  const first = scored[0];
  // A second, visibly different color for the bar-top highlight.
  const second = scored.find((c) =>
    Math.abs(c.r - first.r) + Math.abs(c.g - first.g) + Math.abs(c.b - first.b) > 90
  ) || { r: Math.min(255, first.r + 45), g: Math.min(255, first.g + 45), b: Math.min(255, first.b + 45) };
  return {
    low: [Math.round(first.r), Math.round(first.g), Math.round(first.b)],
    high: [Math.round(second.r), Math.round(second.g), Math.round(second.b)],
  };
}

async function extractPalette(url) {
  // Route 1: fetch the art as a blob so its pixels are same-origin — the
  // canvas can never be tainted, no matter the browser's CORS quirks.
  let cleanup = null;
  let img;
  try {
    const objectUrl = await fetchAsObjectUrl(url);
    cleanup = () => URL.revokeObjectURL(objectUrl);
    img = await loadImage(objectUrl);
  } catch {
    // Route 2: load the CDN image directly with CORS attributes; sampling
    // throws if the browser still refuses pixel access.
    img = await loadImage(url);
  }
  try {
    return sample(img);
  } finally {
    if (cleanup) cleanup();
  }
}

export default async function getAlbumPalette(imageUrl) {
  if (!imageUrl) return null;
  if (cache.has(imageUrl)) return cache.get(imageUrl);
  let palette = null;
  try {
    palette = await Promise.race([
      extractPalette(imageUrl),
      new Promise((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
  } catch {
    palette = null;
  }
  cache.set(imageUrl, palette);
  return palette;
}