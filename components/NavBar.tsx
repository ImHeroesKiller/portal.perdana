import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  HomeIcon,
  InformationCircleIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { getCurrentUser, logout } from '../services/auth';
import { useLanguage } from '../services/i18n';
import {
  getNavNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  formatNotificationDate,
} from '../services/navNotifications';

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav_home', icon: HomeIcon },
  { path: '/vacancies', labelKey: 'nav_vacancies', icon: BriefcaseIcon },
  { path: '/services', labelKey: 'nav_services', icon: WrenchScrewdriverIcon },
  { path: '/about', labelKey: 'nav_about', icon: InformationCircleIcon },
  { path: '/contact', labelKey: 'nav_contact', icon: PhoneIcon },
] as const;

export const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState(getNavNotifications());
  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUser();
  const { t, language, toggleLanguage } = useLanguage();

  const refreshNotifications = () => {
    setNotifications(getNavNotifications());
    setUnreadCount(getUnreadNotificationCount());
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsNotifOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname]);

  if (location.pathname.startsWith('/interview-session')) return null;

  const handleLogout = () => {
    logout();
    setIsAccountOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsAccountOpen(false);
    setIsMobileNavOpen(false);
  };

  const navLinkClass = (path: string) => {
    const active = location.pathname === path;
    return `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
      active
        ? 'bg-slate-100 text-[#0056C6]'
        : 'text-slate-700 hover:bg-slate-50'
    }`;
  };

  const openNotification = (id: string, href?: string) => {
    markNotificationRead(id);
    refreshNotifications();
    setIsNotifOpen(false);
    if (href) navigate(href);
  };

  const avatarInitial =
    currentUser?.username?.charAt(0)?.toUpperCase() ||
    currentUser?.email?.charAt(0)?.toUpperCase() ||
    null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Kiri: hamburger */}
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="-ml-1 rounded-lg p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label={isMobileNavOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={isMobileNavOpen}
        >
          {isMobileNavOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>

        {/* Kanan: bahasa, notifikasi, profil */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
          >
            <GlobeAltIcon className="h-[18px] w-[18px]" />
            <span>{language === 'id' ? 'ID' : 'EN'}</span>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsAccountOpen(false);
              }}
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label={t('nav_notifications')}
              aria-expanded={isNotifOpen}
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] origin-top-right rounded-xl border border-slate-100 bg-white shadow-lg sm:w-80">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{t('nav_notifications')}</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        markAllNotificationsRead();
                        refreshNotifications();
                      }}
                      className="text-xs font-medium text-[#0056C6] hover:underline"
                    >
                      {t('nav_mark_all_read')}
                    </button>
                  )}
                </div>
                <ul className="max-h-72 overflow-y-auto py-1">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(n.id, n.href)}
                        className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                          !n.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{n.message}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatNotificationDate(n.date, language)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => {
                setIsAccountOpen(!isAccountOpen);
                setIsNotifOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-200"
              aria-label={currentUser ? 'Menu akun' : t('nav_login')}
              aria-expanded={isAccountOpen}
            >
              {avatarInitial ? (
                <span className="text-xs font-bold text-slate-700">{avatarInitial}</span>
              ) : (
                <UserCircleIcon className="h-5 w-5" />
              )}
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
                {!currentUser ? (
                  <button
                    type="button"
                    onClick={() => handleNavigation('/login')}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    {t('nav_login')}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigation(currentUser.role === 'admin' ? '/admin' : '/settings')
                      }
                      className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {currentUser.role === 'admin' ? t('nav_admin') : t('nav_settings')}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      {t('nav_logout')}
                    </button>
                  </>
                )}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => handleNavigation('/help')}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t('nav_help')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer navigasi dari hamburger */}
      {isMobileNavOpen && (
        <div className="border-t border-slate-100 bg-white">
          <nav className="mx-auto max-w-7xl space-y-0.5 px-3 py-3 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={navLinkClass(item.path)}
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-500" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
            {currentUser?.role === 'user' && (
              <Link
                to="/portal"
                className={navLinkClass('/portal')}
                onClick={() => setIsMobileNavOpen(false)}
              >
                <UserCircleIcon className="h-5 w-5 shrink-0 text-slate-500" />
                {t('nav_portal')}
              </Link>
            )}
            {!currentUser && (
              <Link
                to="/login"
                className="mt-2 flex items-center justify-center rounded-xl bg-[#0056C6] px-3.5 py-2.5 text-sm font-semibold text-white"
                onClick={() => setIsMobileNavOpen(false)}
              >
                {t('nav_login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};