# Neon Hour — GitHub Pages deployment

URL: https://15brycer-dev.github.io/neon-hour-sync/

GitHub Pages hosts the frontend. Base44 remains the backend.

## GitHub Actions secrets
Add these repository secrets using the values from your Base44 environment:
- VITE_BASE44_APP_ID
- VITE_BASE44_FUNCTIONS_VERSION
- VITE_BASE44_APP_BASE_URL

## Pages
Settings → Pages → Build and deployment → Source → GitHub Actions

## Spotify
Register this exact redirect URI in the Spotify Developer Dashboard:
https://15brycer-dev.github.io/neon-hour-sync/
