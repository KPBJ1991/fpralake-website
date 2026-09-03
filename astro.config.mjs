// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Canonical origin. No `base` — the site is served from the domain apex.
  //
  // Internal links go through withBase() in src/lib/url.ts, which reads
  // import.meta.env.BASE_URL. With no base set that is '/', so it passes paths
  // through unchanged; if the site ever moves back to a subpath, adding a
  // `base` line here is the only change needed.
  site: 'https://fpralake.org',

  vite: {
    plugins: [tailwindcss()],
    server: {
      // Vite rejects requests whose Host header it does not recognize, which
      // makes the dev server return 403 through a tunnel. Allow Cloudflare
      // quick tunnels so `cloudflared tunnel --url http://localhost:4321`
      // works for sharing a preview. Dev-only; has no effect on the build.
      allowedHosts: ['.trycloudflare.com'],
    },
  }
});