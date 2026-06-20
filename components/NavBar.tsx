import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  HomeIcon,
  InformationCircleIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { getCurrentUser, logout } from '../services/auth';
import { useLanguage } from '../services/i18n';
import { useCompanySettings } from '../hooks/useCompanySettings';
import {
  getNavNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  formatNotificationDate,
} from '../services/navNotifications';

const MOBILE_NAV_ITEMS = [
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
  const settings = useCompanySettings();

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

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-[#0056C6] font-bold'
      : 'text-gray-600 hover:text-gray-900 font-semibold';

  const mobileLinkClass = (path: string) => {
    const active = location.pathname === path;
    return `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition ${
      active
        ? 'bg-blue-50 text-[#0056C6] ring-1 ring-blue-100'
        : 'text-gray-700 hover:bg-slate-50'
    }`;
  };

  const openNotification = (id: string, href?: string) => {
    markNotificationRead(id);
    refreshNotifications();
    setIsNotifOpen(false);
    if (href) navigate(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white shadow-md">
      {/* Brand accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#0056C6] via-cyan-500 to-[#F59E0B]" aria-hidden="true" />

      <div className="bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-[3.75rem] items-center justify-between gap-2 md:h-16">
            {/* Left: menu + logo */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="rounded-xl p-2 text-gray-600 transition hover:bg-blue-50 hover:text-[#0056C6] md:hidden"
                aria-label={isMobileNavOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={isMobileNavOpen}
              >
                {isMobileNavOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>

              <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm sm:h-11 sm:w-11">
                  <img
                    src="/assets/logo.png"
                    alt="PT Perdana Adi Yuda Logo"
                    className="h-7 w-auto object-contain sm:h-8"
                  />
                </div>
                <div className="min-w-0 flex-col leading-tight">
                  <span className="truncate text-xs font-extrabold text-gray-900 sm:text-sm md:text-base">
                    {settings.companyName}
                  </span>
                  <span className="truncate text-[9px] font-semibold text-[#0056C6] sm:text-[10px]">
                    {t('nav_tagline')}
                  </span>
                </div>
              </Link>

              <div className="ml-2 hidden items-center gap-1 lg:ml-6 lg:flex lg:gap-1">
                <Link to="/" className={`rounded-lg px-3 py-2 text-sm ${isActive('/')}`}>
                  {t('nav_home')}
                </Link>
                <Link to="/vacancies" className={`rounded-lg px-3 py-2 text-sm ${isActive('/vacancies')}`}>
                  {t('nav_vacancies')}
                </Link>
                {currentUser?.role === 'user' && (
                  <Link to="/portal" className={`rounded-lg px-3 py-2 text-sm ${isActive('/portal')}`}>
                    {t('nav_portal')}
                  </Link>
                )}
                <Link to="/services" className={`rounded-lg px-3 py-2 text-sm ${isActive('/services')}`}>
                  {t('nav_services')}
                </Link>
                <Link to="/about" className={`rounded-lg px-3 py-2 text-sm ${isActive('/about')}`}>
                  {t('nav_about')}
                </Link>
                <Link to="/contact" className={`rounded-lg px-3 py-2 text-sm ${isActive('/contact')}`}>
                  {t('nav_contact')}
                </Link>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Link
                to="/vacancies"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0056C6] px-2.5 py-2 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-blue-700 md:hidden"
              >
                <BriefcaseIcon className="h-4 w-4" />
                <span>{t('nav_vacancies_short')}</span>
              </Link>

              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0056C6] sm:px-2.5"
                aria-label={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
              >
                <GlobeAltIcon className="h-4 w-4 shrink-0" />
                <span>{language === 'id' ? 'ID' : 'EN'}</span>
              </button>

              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsAccountOpen(false);
                  }}
                  className="relative rounded-xl p-2 text-gray-600 transition hover:bg-blue-50 hover:text-[#0056C6]"
                  aria-label={t('nav_notifications')}
                  aria-expanded={isNotifOpen}
                >
                  <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,20rem)] origin-top-right rounded-2xl border border-slate-100 bg-white shadow-2xl animate-fade-in-down sm:w-80">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{t('nav_notifications')}</p>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            markAllNotificationsRead();
                            refreshNotifications();
                          }}
                          className="text-xs font-semibold text-[#0056C6] hover:underline"
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
                              !n.read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <p className="text-xs font-bold text-gray-900">{n.title}</p>
                            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{n.message}</p>
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

              {!currentUser && (
                <Link
                  to="/login"
                  className="hidden items-center rounded-xl border-2 border-[#0056C6] px-3 py-1.5 text-xs font-extrabold text-[#0056C6] transition hover:bg-blue-50 sm:inline-flex md:px-4"
                >
                  {t('nav_login')}
                </Link>
              )}

              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(!isAccountOpen);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-xl p-1.5 text-gray-600 transition hover:bg-gray-100"
                  aria-expanded={isAccountOpen}
                >
                  <UserCircleIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                  {currentUser && (
                    <span className="hidden max-w-[5rem] truncate text-xs font-semibold sm:inline">
                      {currentUser.username}
                    </span>
                  )}
                </button>

                {isAccountOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-2xl border border-slate-100 bg-white py-1 shadow-2xl animate-fade-in-down">
                    {!currentUser ? (
                      <button
                        type="button"
                        onClick={() => handleNavigation('/login')}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
                          className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {currentUser.role === 'admin' ? t('nav_admin') : t('nav_settings')}
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          {t('nav_logout')}
                        </button>
                      </>
                    )}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => handleNavigation('/help')}
                      className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav_help')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isMobileNavOpen && (
          <div className="border-t border-slate-100 bg-slate-50 md:hidden">
            <p className="px-4 pt-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {t('nav_main_menu')}
            </p>
            <div className="space-y-1.5 px-3 py-3">
              {MOBILE_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={mobileLinkClass(item.path)}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              {currentUser?.role === 'user' && (
                <Link
                  to="/portal"
                  className={mobileLinkClass('/portal')}
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <UserCircleIcon className="h-5 w-5 shrink-0" />
                  {t('nav_portal')}
                </Link>
              )}
              <Link
                to="/help"
                className={mobileLinkClass('/help')}
                onClick={() => setIsMobileNavOpen(false)}
              >
                <InformationCircleIcon className="h-5 w-5 shrink-0" />
                {t('nav_help')}
              </Link>
              {!currentUser && (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#0056C6] px-3.5 py-3 text-sm font-extrabold text-white shadow-sm"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {t('nav_login')}
                </Link>
              )}
              {currentUser && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                  {t('nav_logout')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};