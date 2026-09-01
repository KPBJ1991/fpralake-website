// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TEMPORARY — serving from the GitHub Pages project subpath while
  // fpralake.org DNS is sorted out.
  //
  // TO SWITCH BACK to the custom domain:
  //   1. site: 'https://fpralake.org'
  //   2. delete the `base` line below
  //   3. re-set the Pages custom domain:
  //      gh api -X PUT repos/KPBJ1991/fpralake-website/pages -f cname=fpralake.org
  // Internal links go through withBase() in src/lib/url.ts, so they follow
  // this setting automatically and need no edits either way.
  site: 'https://kpbj1991.github.io',
  base: '/fpralake-website',

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