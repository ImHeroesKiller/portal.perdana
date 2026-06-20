import { useEffect } from 'react';
import { getCurrentUser } from '../services/auth-session';

/** Lazy-load Firebase auth sync only when an admin session exists. */
export function useAuthFirebaseSync() {
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') return;

    const timer = window.setTimeout(() => {
      void import('../services/auth-firebase').then((m) => m.initializeAuthSync());
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);
}