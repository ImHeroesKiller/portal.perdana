import { useEffect, useState } from 'react';

type MediaSubscription = {
  mql: MediaQueryList;
  listeners: Set<() => void>;
  onChange: () => void;
};

const mediaSubscriptions = new Map<string, MediaSubscription>();

function getOrCreateSubscription(query: string): MediaSubscription {
  let sub = mediaSubscriptions.get(query);
  if (sub) return sub;

  const mql = window.matchMedia(query);
  const listeners = new Set<() => void>();
  const onChange = () => listeners.forEach((listener) => listener());

  mql.addEventListener('change', onChange);
  sub = { mql, listeners, onChange };
  mediaSubscriptions.set(query, sub);
  return sub;
}

function subscribeToMediaQuery(query: string, listener: () => void): () => void {
  const sub = getOrCreateSubscription(query);
  sub.listeners.add(listener);
  listener();

  return () => {
    sub.listeners.delete(listener);
    if (sub.listeners.size === 0) {
      sub.mql.removeEventListener('change', sub.onChange);
      mediaSubscriptions.delete(query);
    }
  };
}

/** One matchMedia listener per query string, shared across hook instances. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    return subscribeToMediaQuery(query, () => {
      setMatches(window.matchMedia(query).matches);
    });
  }, [query]);

  return matches;
}

export function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}