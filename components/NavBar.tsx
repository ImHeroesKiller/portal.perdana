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
} from '@heroicons/react/24/outline';
import { getCurrentUser, logout } from '../services/auth';
import { useLanguage } from '../services/i18n';
import { getCompanySettings } from '../services/companySettings';
import {
  getNavNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  formatNotificationDate,
} from '../services/navNotifications';
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
  const [settings, setSettings] = useState(() => getCompanySettings());

  const refreshNotifications = () => {
    setNotifications(getNavNotifications());
    setUnreadCount(getUnreadNotificationCount());
  };

  useEffect(() => {
    refreshNotifications();
    const handleUpdate = () => setSettings(getCompanySettings());
    window.addEventListener('company-settings-updated', handleUpdate);
    return () => window.removeEventListener('company-settings-updated', handleUpdate);
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
      : 'text-gray-600 hover:text-gray-900 font-medium';

  const mobileLinkClass = (path: string) =>
    `block px-3 py-2.5 rounded-xl text-sm font-semibold ${
      location.pathname === path
        ? 'bg-blue-50 text-[#0056C6]'
        : 'text-gray-700 hover:bg-gray-50'
    }`;

  const openNotification = (id: string, href?: string) => {
    markNotificationRead(id);
    refreshNotifications();
    setIsNotifOpen(false);
    if (href) navigate(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 md:h-16">
          {/* Left: menu + logo */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              aria-label={isMobileNavOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMobileNavOpen}
            >
              {isMobileNavOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <img
                src="/assets/logo.png"
                alt="PT Perdana Adi Yuda Logo"
                className="h-9 w-auto object-contain sm:h-10"
              />
              <div className="hidden min-w-0 flex-col sm:flex">
                <span className="truncate text-sm font-extrabold leading-tight text-gray-900 md:text-base">
                  {settings.companyName}
                </span>
                <span className="hidden text-[10px] font-medium text-slate-400 md:block">
                  {t('nav_tagline')}
                </span>
              </div>
            </Link>

            <div className="ml-4 hidden items-center gap-5 md:flex">
              <Link to="/" className={isActive('/')}>
                {t('nav_home')}
              </Link>
              <Link to="/vacancies" className={isActive('/vacancies')}>
                {t('nav_vacancies')}
              </Link>
              {currentUser?.role === 'user' && (
                <Link to="/portal" className={isActive('/portal')}>
                  {t('nav_portal')}
                </Link>
              )}
              <Link to="/services" className={isActive('/services')}>
                {t('nav_services')}
              </Link>
              <Link to="/about" className={isActive('/about')}>
                {t('nav_about')}
              </Link>
              <Link to="/contact" className={isActive('/contact')}>
                {t('nav_contact')}
              </Link>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Mobile quick vacancies */}
            <Link
              to="/vacancies"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-[#0056C6] md:hidden"
            >
              <BriefcaseIcon className="h-4 w-4" />
              <span className="hidden xs:inline">{t('nav_vacancies_short')}</span>
            </Link>

            {/* Language switcher — always visible */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0056C6] sm:px-2.5"
              aria-label={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              <GlobeAltIcon className="h-4 w-4 shrink-0" />
              <span>{language === 'id' ? 'ID' : 'EN'}</span>
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsAccountOpen(false);
                }}
                className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#0056C6]"
                aria-label={t('nav_notifications')}
                aria-expanded={isNotifOpen}
              >
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,20rem)] origin-top-right rounded-xl border border-slate-100 bg-white shadow-xl animate-fade-in-down sm:w-80">
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

            {/* Login desktop */}
            {!currentUser && (
              <Link
                to="/login"
                className="hidden items-center rounded-lg border border-[#0056C6] px-3 py-1.5 text-xs font-bold text-[#0056C6] transition hover:bg-blue-50 sm:inline-flex md:px-4"
              >
                {t('nav_login')}
              </Link>
            )}

            {/* Account menu */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => {
                  setIsAccountOpen(!isAccountOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100"
                aria-expanded={isAccountOpen}
              >
                <UserCircleIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                {currentUser && (
                  <span className="hidden max-w-[5rem] truncate text-xs font-medium sm:inline">
                    {currentUser.username}
                  </span>
                )}
              </button>

              {isAccountOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-xl border border-slate-100 bg-white py-1 shadow-xl animate-fade-in-down">
                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={() => handleNavigation('/login')}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
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
                        className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {currentUser.role === 'admin' ? t('nav_admin') : t('nav_settings')}
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
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
                    className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
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
        <div className="border-t border-slate-100 bg-white md:hidden">
          <p className="px-4 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t('nav_more_menu')}
          </p>
          <div className="space-y-1 px-3 py-3">
            <Link to="/contact" className={mobileLinkClass('/contact')}>
              {t('nav_contact')}
            </Link>
            <Link to="/help" className={mobileLinkClass('/help')}>
              {t('nav_help')}
            </Link>
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                {t('nav_logout')}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};