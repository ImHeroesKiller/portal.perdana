import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Layers, Info, UserCircle } from 'lucide-react';
import { getCurrentUser } from '../services/auth-session';
import { useLanguage } from '../services/i18n';
import { useIsMobile } from '../hooks/useMediaQuery';

type BottomNavItem = {
  id: string;
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  match: (pathname: string) => boolean;
};

const HIDDEN_PREFIXES = ['/interview-session', '/admin', '/apply', '/login', '/register'];

function buildItems(loggedIn: boolean, isAdmin: boolean): BottomNavItem[] {
  const accountHref = loggedIn ? (isAdmin ? '/admin' : '/portal') : '/login';

  return [
    {
      id: 'home',
      labelKey: 'bottom_nav_home',
      href: '/',
      icon: Home,
      match: (p) => p === '/',
    },
    {
      id: 'vacancies',
      labelKey: 'bottom_nav_jobs',
      href: '/vacancies',
      icon: Briefcase,
      match: (p) => p === '/vacancies',
    },
    {
      id: 'services',
      labelKey: 'bottom_nav_services',
      href: '/services',
      icon: Layers,
      match: (p) => p === '/services',
    },
    {
      id: 'about',
      labelKey: 'bottom_nav_about',
      href: '/about',
      icon: Info,
      match: (p) => p === '/about' || p === '/contact',
    },
    {
      id: 'account',
      labelKey: loggedIn ? 'bottom_nav_account' : 'bottom_nav_login',
      href: accountHref,
      icon: UserCircle,
      match: (p) =>
        p === '/login' ||
        p === '/portal' ||
        p === '/settings' ||
        p.startsWith('/admin'),
    },
  ];
}

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const currentUser = getCurrentUser();
  const loggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin';

  if (!isMobile) return null;
  if (HIDDEN_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))) return null;

  const items = buildItems(loggedIn, isAdmin);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={t('bottom_nav_aria')}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95 ${
                active ? 'text-[#0056C6]' : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span className="absolute top-1 h-1 w-8 rounded-full bg-[#0056C6]" aria-hidden="true" />
              )}
              <Icon
                className={`h-5 w-5 ${active ? 'text-[#0056C6]' : ''}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`max-w-full truncate text-center leading-none ${
                  active ? 'text-[10px] font-extrabold' : 'text-[9px] font-bold'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};