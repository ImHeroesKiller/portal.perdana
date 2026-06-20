import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { DEFAULT_QUERY_OPTIONS } from './queryOptions';

let queryListenersConfigured = false;

function setupQueryListeners() {
  if (queryListenersConfigured || typeof window === 'undefined') return;
  queryListenersConfigured = true;

  focusManager.setEventListener((onFocus) => {
    const handler = () => onFocus();
    window.addEventListener('visibilitychange', handler, false);
    window.addEventListener('focus', handler, false);
    return () => {
      window.removeEventListener('visibilitychange', handler);
      window.removeEventListener('focus', handler);
    };
  });

  onlineManager.setEventListener((setOnline) => {
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener('online', onlineHandler, false);
    window.addEventListener('offline', offlineHandler, false);
    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  });
}

setupQueryListeners();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: DEFAULT_QUERY_OPTIONS,
    mutations: {
      retry: 1,
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    queryListenersConfigured = false;
    focusManager.setEventListener(() => undefined);
    onlineManager.setEventListener(() => undefined);
  });
}