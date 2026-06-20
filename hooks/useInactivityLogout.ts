import { useEffect } from 'react';
import { getCurrentUser, logout } from '../services/auth';

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
const CHECK_INTERVAL_MS = 10_000;
const THROTTLE_MS = 1_000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'] as const;

/** Registers one throttled activity listener set per logged-in session. */
export function useInactivityLogout() {
  useEffect(() => {
    if (!getCurrentUser()) return;

    let lastActiveTime = Date.now();
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();

    const markActive = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        lastActiveTime = Date.now();
      }, THROTTLE_MS);
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, markActive, { passive: true, signal: controller.signal });
    });

    const intervalId = setInterval(() => {
      if (Date.now() - lastActiveTime >= INACTIVITY_LIMIT_MS) {
        controller.abort();
        clearInterval(intervalId);
        logout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(intervalId);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);
}