import { useSyncExternalStore } from 'react';
import { getCompanySettings, type CompanySettings } from '../services/companySettings';

let snapshot = getCompanySettings();
const subscribers = new Set<() => void>();
let windowListenerAttached = false;

function emitUpdate() {
  snapshot = getCompanySettings();
  subscribers.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function ensureWindowListener() {
  if (windowListenerAttached || typeof window === 'undefined') return;
  windowListenerAttached = true;
  window.addEventListener('company-settings-updated', emitUpdate);
}

/** Single shared window listener for company settings updates. */
export function useCompanySettings(): CompanySettings {
  ensureWindowListener();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}