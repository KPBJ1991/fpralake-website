/**
 * Base-aware URL helper.
 *
 * Astro applies the configured `base` to imported assets automatically, but
 * NOT to literal hrefs written in templates — `<a href="/about">` stays
 * `/about` and 404s when the site is served from a subpath. Every internal
 * link and public/ asset reference goes through withBase() so the site works
 * at both `https://kpbj1991.github.io/fpralake-website/` and a bare domain,
 * with no edits beyond astro.config.mjs.
 */

/** '/fpralake-website/' when a base is set, otherwise '/'. */
const BASE_URL = import.meta.env.BASE_URL;

/** Base with no trailing slash: '/fpralake-website', or '' at the root. */
const prefix = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

/**
 * Prefixes an absolute internal path with the base.
 * Leaves external URLs, fragments, and mailto: links untouched.
 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  if (path === '/') return `${prefix}/`;
  return `${prefix}${path}`;
}
