export type NavNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  href?: string;
};

const READ_IDS_KEY = 'portal_nav_notifications_read';

const DEFAULT_NOTIFICATIONS: NavNotification[] = [
  {
    id: 'recruitment-update',
    title: 'Informasi Rekrutmen Terbaru',
    message: 'Lowongan operator dan staff tersedia di site Morowali & Palu. Segera daftar!',
    date: new Date().toISOString(),
    href: '/vacancies',
  },
  {
    id: 'portal-reminder',
    title: 'Pantau Status Lamaran',
    message: 'Pelamar terdaftar dapat login ke Portal untuk melacak progres rekrutmen.',
    date: new Date(Date.now() - 86400000).toISOString(),
    href: '/login',
  },
];

function readReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeReadIds(ids: Set<string>) {
  localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
}

export function getNavNotifications(): (NavNotification & { read: boolean })[] {
  const readIds = readReadIds();
  return DEFAULT_NOTIFICATIONS.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));
}

export function getUnreadNotificationCount(): number {
  return getNavNotifications().filter((n) => !n.read).length;
}

export function markNotificationRead(id: string) {
  const ids = readReadIds();
  ids.add(id);
  writeReadIds(ids);
}

export function markAllNotificationsRead() {
  const ids = new Set(DEFAULT_NOTIFICATIONS.map((n) => n.id));
  writeReadIds(ids);
}

export function formatNotificationDate(iso: string, language: 'id' | 'en'): string {
  try {
    return new Date(iso).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}