
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { NavBar } from './components/NavBar';
import { BottomNavigation } from './components/BottomNavigation';
import { RouteFallback } from './components/layout/RouteFallback';
import { useIsMobile } from './hooks/useMediaQuery';
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { RouteSeo } from './components/seo/RouteSeo';
import { LanguageProvider } from './services/i18n';

const VacanciesPage = lazy(() =>
  import('./components/VacanciesPage').then((m) => ({ default: m.VacanciesPage }))
);
const JobDetailPage = lazy(() =>
  import('./components/jobs/JobDetailPage').then((m) => ({ default: m.JobDetailPage }))
);
const About = lazy(() => import('./components/About').then((m) => ({ default: m.About })));
const Contact = lazy(() => import('./components/Contact').then((m) => ({ default: m.Contact })));
const Services = lazy(() => import('./components/Services').then((m) => ({ default: m.Services })));
const Login = lazy(() => import('./components/Login').then((m) => ({ default: m.Login })));
const RecruitmentForm = lazy(() =>
  import('./components/RecruitmentForm').then((m) => ({ default: m.RecruitmentForm }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const Register = lazy(() =>
  import('./components/Register').then((m) => ({ default: m.Register }))
);
const Settings = lazy(() =>
  import('./components/Settings').then((m) => ({ default: m.Settings }))
);
const Help = lazy(() => import('./components/Help').then((m) => ({ default: m.Help })));
const AIInterviewSession = lazy(() =>
  import('./components/AIInterviewSession').then((m) => ({ default: m.AIInterviewSession }))
);
const EmployeePortal = lazy(() =>
  import('./components/EmployeePortal').then((m) => ({ default: m.EmployeePortal }))
);

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
  useGoogleAnalytics();
  const isMobile = useIsMobile();

  return (
    <>
      <RouteSeo />
      <NavBar />
      <main
        className={`min-h-screen bg-[#F1F5F9] md:bg-gray-50 ${
          isMobile ? MOBILE_BOTTOM_PAD : ''
        }`}
      >
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </main>
      <BottomNavigation />
    </>
  );
}