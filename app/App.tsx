
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { RecruitmentForm } from './components/RecruitmentForm';
import { AdminDashboard } from './components/AdminDashboard';
import { HomePage } from './components/HomePage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Services } from './components/Services';
import { AIInterviewSession } from './components/AIInterviewSession';
import { EmployeePortal } from './components/EmployeePortal';
import { VacanciesPage } from './components/VacanciesPage';
import { Cog6ToothIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { getCurrentUser, logout } from './services/auth';
import { LanguageProvider, useLanguage } from './services/i18n';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUser();
  const { t, language, toggleLanguage } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide Navbar only on Interview Session
  if (location.pathname.startsWith('/interview-session')) return null;

  const isActive = (path: string) => location.pathname === path ? 'text-blue-700 font-bold' : 'text-gray-500 hover:text-gray-900';
  const mobileLinkClass = (path: string) => `block px-3 py-2 rounded-md text-base font-medium ${location.pathname === path ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 md:h-16">
          <div className="flex items-center flex-1 min-w-0">
             {/* Mobile Hamburger */}
             <div className="flex items-center md:hidden mr-2">
                <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                    {isMobileNavOpen ? <XMarkIcon className="h-6 w-6"/> : <Bars3Icon className="h-6 w-6"/>}
                </button>
             </div>

            <Link to="/" className="flex-shrink-0 flex items-center gap-2 md:gap-3">
              <img 
                src="/assets/logo.png" 
                alt="PT Perdana Adi Yuda Logo" 
                className="h-8 w-auto md:h-10 object-contain"
              />
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-bold text-gray-900 leading-tight text-xs sm:text-sm md:text-base truncate">PT Perdana Adi Yuda</span>
                <span className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-wider truncate">Portal Rekrutmen</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="ml-10 hidden md:flex items-baseline space-x-6">
              <Link to="/" className={isActive('/')}>{t('nav_home')}</Link>
              {currentUser && currentUser.role === 'user' && (
                <Link to="/portal" className={isActive('/portal')}>💼 Portal Saya</Link>
              )}
              <Link to="/services" className={isActive('/services')}>{t('nav_services')}</Link>
              <Link to="/about" className={isActive('/about')}>{t('nav_about')}</Link>
              <Link to="/contact" className={isActive('/contact')}>{t('nav_contact')}</Link>
            </div>
          </div>
          
          <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0 gap-3">
             
             {/* Login Button (If not logged in) - Placed left of gear */}
             {!currentUser && (
                <Link 
                    to="/login" 
                    className="hidden xs:inline-flex items-center px-4 py-1.5 border border-blue-600 text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 transition-colors"
                >
                    {t('nav_login')}
                </Link>
             )}

             {/* Admin / User Status Badge (Just username) */}
             {currentUser && (
                <span className="text-xs text-gray-600 truncate max-w-[80px]">
                    {currentUser.username}
                </span>
             )}

             {/* Gear Icon Menu */}
             <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition focus:outline-none"
                >
                    <Cog6ToothIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none animate-fade-in-down origin-top-right">
                        {/* 1. Dwi Bahasa */}
                        <button onClick={toggleLanguage} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 italic">
                             {language === 'id' ? 'English (EN)' : 'Bahasa Indonesia (ID)'}
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>

                        {!currentUser ? (
                            // 2. Login (Posisi belum login)
                            <button onClick={() => handleNavigation('/login')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                <UserCircleIcon className="h-4 w-4" /> {t('nav_login')}
                            </button>
                        ) : (
                            <>
                                {/* 3. Profile (Posisi sudah login) */}
                                <button
                                    onClick={() => handleNavigation(currentUser?.role === 'admin' ? '/admin' : '/settings')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    {currentUser?.role === 'admin' ? 'Dashboard Admin' : 'Profile User'}
                                </button>
                                {/* 4. Log Out (Posisi sudah login) */}
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <ArrowRightOnRectangleIcon className="h-4 w-4" /> {t('nav_logout')}
                                </button>
                            </>
                        )}
                        
                        {/* 5. Bantuan */}
                        <button onClick={() => handleNavigation('/help')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            {t('nav_help')}
                        </button>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileNavOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  <Link to="/" onClick={() => setIsMobileNavOpen(false)} className={mobileLinkClass('/')}>{t('nav_home')}</Link>
                  {currentUser && currentUser.role === 'user' && (
                      <Link to="/portal" onClick={() => setIsMobileNavOpen(false)} className={mobileLinkClass('/portal')}>💼 Portal Saya</Link>
                  )}
                  <Link to="/services" onClick={() => setIsMobileNavOpen(false)} className={mobileLinkClass('/services')}>{t('nav_services')}</Link>
                  <Link to="/about" onClick={() => setIsMobileNavOpen(false)} className={mobileLinkClass('/about')}>{t('nav_about')}</Link>
                  <Link to="/contact" onClick={() => setIsMobileNavOpen(false)} className={mobileLinkClass('/contact')}>{t('nav_contact')}</Link>
                  <Link to="/help" onClick={() => setIsMobileNavOpen(false)} className={mobileLinkClass('/help')}>{t('nav_help')}</Link>
                  {!currentUser && (
                     <Link to="/login" onClick={() => setIsMobileNavOpen(false)} className={mobileLinkClass('/login')}>{t('nav_login')}</Link>
                  )}
              </div>
          </div>
      )}
    </nav>
  );
};

const Footer = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
          setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Hide Footer on Interview Session
    if (location.pathname.startsWith('/interview-session')) return null;

    if (isMobile) {
        return (
          <div className="bg-transparent pt-2 pb-6 px-4">
            <div className="rounded-3xl bg-[#00B5F1] text-white py-5 px-6 flex flex-col sm:flex-row items-center justify-between shadow-xs gap-3">
              <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
                <div className="bg-white px-2.5 py-1 rounded-xl flex items-center justify-center shadow-xs">
                  <img 
                    src="/assets/logo.png" 
                    alt="PT Perdana" 
                    className="h-6 w-auto object-contain" 
                  />
                </div>
                <div className="h-6 w-[1.5px] bg-white/30"></div>
                <span className="text-[10px] font-extrabold tracking-wider whitespace-nowrap">
                  PT PERDANA ADI YUDA
                </span>
              </Link>
              <p className="text-[9px] text-white/80 font-medium font-sans text-center sm:text-right">
                © 2026 PT Perdana Adi Yuda. All rights reserved.
              </p>
            </div>
          </div>
        );
    }

    return (
      <footer className="bg-gray-800 text-white py-12 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div className="text-center md:text-left flex flex-col items-center md:items-start gap-4">
                <Link to="/" className="bg-white px-4 py-1.5 rounded-2xl inline-flex items-center justify-center shadow-md hover:bg-gray-25 transition-colors cursor-pointer">
                    <img 
                        src="/assets/logo.png" 
                        alt="PT Perdana Adi Yuda" 
                        className="h-9 w-auto object-contain" 
                    />
                </Link>
                <div>
                    <h3 className="font-bold text-lg mb-2 text-white">PT Perdana Adi Yuda</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {t('footer_desc')}
                    </p>
                </div>
            </div>
            
            <div className="text-center md:text-left">
                <h3 className="font-bold text-lg mb-4 text-white">{t('contact_office')}</h3>
                <div className="text-gray-400 space-y-4 text-xs md:text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-200">Kantor Pusat:</h4>
                    <p>
                      Plaza Summarecon Bekasi Lt. 7<br/>
                      Jl. Bulevar Ahmad Yani, Marga Mulya<br/>
                      Bekasi Utara, Kota Bekasi - 17142
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-200">Kantor Cabang (Sulteng):</h4>
                    <p>
                      Jl. Wolter Monginsidi No. 45, Palu Selatan<br/>
                      Kota Palu, Sulawesi Tengah - 94111
                    </p>
                  </div>
                </div>
            </div>

            <div className="text-center md:text-left">
                <h3 className="font-bold text-lg mb-4 text-white">{t('contact_title')}</h3>
                <div className="space-y-2 text-gray-400">
                  <p>
                    <span className="font-medium text-gray-300">Telp:</span> 0858 9366 1683
                  </p>
                  <p>
                    <span className="font-medium text-gray-300">Email:</span> info@perada.net
                  </p>
                  <p>
                    <span className="font-medium text-gray-300">Website:</span>{' '}
                    <a href="https://perada.net" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      https://perada.net
                    </a>
                  </p>
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-10 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} PT Perdana Adi Yuda. {t('footer_rights')}</p>
        </div>
      </footer>
    );
};

export default function App() {
  // 15-minute Inactivity (AFK) Automatic Logout Implementation
  useEffect(() => {
    // Check if a user session exists
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds
    let lastActiveTime = Date.now();

    const updateActivity = () => {
      lastActiveTime = Date.now();
    };

    // Events that signify the user is active
    const activeEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    activeEvents.forEach(evt => {
      window.addEventListener(evt, updateActivity, { passive: true });
    });

    // Check inactivity every 10 seconds
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActiveTime;
      if (elapsed >= INACTIVITY_LIMIT) {
        clearInterval(intervalId);
        
        // Remove event listeners
        activeEvents.forEach(evt => {
          window.removeEventListener(evt, updateActivity);
        });

        // Trigger session logout
        logout();
      }
    }, 10000);

    return () => {
      activeEvents.forEach(evt => {
        window.removeEventListener(evt, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, []);

  return (
    <LanguageProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NavBar />
        <main className="min-h-screen pb-20 bg-gray-50">
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vacancies" element={<VacanciesPage />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/apply" element={<RecruitmentForm />} />
            <Route path="/portal" element={<EmployeePortal />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/interview-session/:employeeId" element={<AIInterviewSession />} />
            </Routes>
        </main>
        <Footer />
        </HashRouter>
    </LanguageProvider>
  );
}
