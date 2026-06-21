import { COMPANY_LOGO_PNG, COMPANY_LOGO_WEBP } from './brand-assets';

/** Hero JPGs that have a matching WebP on disk (see scripts/optimize-images.mjs). */
export const HERO_IMAGE_WEBP: Record<string, string> = {
  '/assets/hero/site_workers.jpg': '/assets/hero/site_workers.webp',
  '/assets/hero/site_scaffolding.jpg': '/assets/hero/site_scaffolding.webp',
  '/assets/hero/site_bricklaying.jpg': '/assets/hero/site_bricklaying.webp',
  '/assets/hero/site_shoveling.jpg': '/assets/hero/site_shoveling.webp',
  [COMPANY_LOGO_PNG]: COMPANY_LOGO_WEBP,
};

/** Return WebP URL only when a variant is known to exist — avoids SPA HTML fallback on 404. */
export function resolveWebpSrc(src: string | undefined): string | null {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || /^https?:\/\//i.test(src)) {
    return null;
  }
  return HERO_IMAGE_WEBP[src] ?? null;
}