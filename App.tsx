
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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
import { JobDetailPage } from './components/jobs/JobDetailPage';
import { NavBar } from './components/NavBar';
import { BottomNavigation } from './components/BottomNavigation';
import { useIsMobile } from './hooks/useMediaQuery';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { LanguageProvider } from './services/i18n';

const MOBILE_BOTTOM_PAD = 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))]';

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
          <Route path="/vacancies/:jobId" element={<JobDetailPage />} />
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
    </>
  );
}
