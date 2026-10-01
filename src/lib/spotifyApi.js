// Shared Spotify Web API client: surfaces Spotify's own error messages and
// handles HTTP 429 with the Retry-After header + exponential backoff.
export async function spotifyFetch(url, options = {}) {
  const { retries = 3, ...fetchOptions } = options;
  let backoffMs = 1000;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, fetchOptions);
    } catch (e) {
      throw new Error("Could not reach Spotify. Check your connection.");
    }
    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get("Retry-After"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      backoffMs *= 2;
      continue;
    }
    if (res.ok) {
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    }
    let message = `Spotify request failed (${res.status}).`;
    let reason;
    try {
      const body = await res.json();
      if (body && body.error && body.error.message) message = body.error.message;
      reason = body?.error?.reason;
    } catch (e) { /* response had no JSON body */ }
    const error = new Error(message);
    error.status = res.status;
    error.reason = reason;
    throw error;
  }
}