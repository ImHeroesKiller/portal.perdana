import type { Map as LeafletMap } from 'leaflet';

type LeafletModule = typeof import('leaflet');

let leafletPromise: Promise<LeafletModule> | null = null;

/** Load Leaflet + CSS on demand (avoids global script in index.html). */
export async function loadLeaflet(): Promise<LeafletModule> {
  if (typeof window === 'undefined') {
    throw new Error('Leaflet can only load in the browser');
  }

  if (!leafletPromise) {
    leafletPromise = (async () => {
      await import('leaflet/dist/leaflet.css');
      const mod = await import('leaflet');
      const L = mod.default ?? mod;
      (window as Window & { L?: LeafletModule }).L = L;
      return L;
    })();
  }

  return leafletPromise;
}

export type { LeafletMap };