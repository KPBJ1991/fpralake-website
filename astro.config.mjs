// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Canonical origin, used for absolute URLs in metadata. Update if the
  // chapter deploys to a github.io subpath instead of the custom domain.
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