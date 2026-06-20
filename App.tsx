
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import { NavBar } from './components/NavBar';
import { BottomNavigation } from './components/BottomNavigation';
import { useIsMobile } from './hooks/useMediaQuery';
import { useCompanySettings } from './hooks/useCompanySettings';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { LanguageProvider, useLanguage } from './services/i18n';

const MOBILE_BOTTOM_PAD = 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))]';

const Footer = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const isMobile = useIsMobile();
    const settings = useCompanySettings();

    // Hide Footer on Interview Session
    if (location.pathname.startsWith('/interview-session')) return null;

    if (isMobile) {
        return (
          <div className={`bg-transparent px-4 pt-2 ${MOBILE_BOTTOM_PAD}`}>
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
                  {settings.companyName.toUpperCase()}
                </span>
              </Link>
              <p className="text-[9px] text-white/80 font-medium font-sans text-center sm:text-right">
                © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
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
                        alt="PT Perdana" 
                        className="h-9 w-auto object-contain" 
                    />
                </Link>
                <div>
                    <h3 className="font-bold text-lg mb-2 text-white">{settings.companyName}</h3>
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
                    <p className="whitespace-pre-wrap">{settings.headOfficeAddress}</p>
                  </div>
                  {settings.branches.map((branch) => (
                    <div key={branch.id}>
                      <h4 className="font-semibold text-gray-200">{branch.name}:</h4>
                      <p className="whitespace-pre-wrap">{branch.address}</p>
                    </div>
                  ))}
                </div>
            </div>

            <div className="text-center md:text-left">
                <h3 className="font-bold text-lg mb-4 text-white">{t('contact_title')}</h3>
                <div className="space-y-2 text-gray-400">
                  <p>
                    <span className="font-medium text-gray-300">Telp:</span> {settings.phone}
                  </p>
                  <p>
                    <span className="font-medium text-gray-300">Email:</span> {settings.email}
                  </p>
                  {settings.website && (
                    <p>
                      <span className="font-medium text-gray-300">Website:</span>{' '}
                      <a href={settings.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        {settings.website}
                      </a>
                    </p>
                  )}
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-10 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} {settings.companyName}. {t('footer_rights')}</p>
        </div>
      </footer>
    );
};

export default function App() {
  useInactivityLogout();

  return (
    <LanguageProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppShell />
      </HashRouter>
    </LanguageProvider>
  );
}

function AppShell() {
  const isMobile = useIsMobile();

  return (
    <>
      <NavBar />
      <main
        className={`min-h-screen bg-[#F1F5F9] md:bg-gray-50 ${
          isMobile ? MOBILE_BOTTOM_PAD : ''
        }`}
      >
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
      <BottomNavigation />
      <Footer />
    </>
  );
}
