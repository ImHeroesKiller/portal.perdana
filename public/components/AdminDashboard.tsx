import React, { useState, useEffect } from 'react';
import { TalentManager } from './admin/modules/TalentManager';
import { ClientManager } from './admin/modules/ClientManager';
import { ProjectManager } from './admin/modules/ProjectManager';
import { ReportsManager } from './admin/modules/ReportsManager';
import { 
  EmployeesPanel, 
  FinancePanel, 
  AttendancePanel, 
  PayrollPanel, 
  AssetsPanel 
} from './admin/modules/ERPManager';
import { RBACManager } from './admin/modules/RBACManager';
import { 
  getCurrentUser, logout 
} from '../services/auth';
import { getEmployees } from '../services/db';
import { Employee } from '../types';

import { 
  UsersIcon, BuildingOfficeIcon, ClipboardDocumentListIcon, 
  ChartPieIcon, ShieldCheckIcon, UserGroupIcon, ClockIcon, 
  CreditCardIcon, ScaleIcon, WrenchScrewdriverIcon, 
  ArrowRightOnRectangleIcon, LockClosedIcon
} from '@heroicons/react/24/outline';

const ALL_MODULES = [
  { id: 'talent', label: 'Talent', desc: 'ATS & Pipeline Rekrutmen', icon: UsersIcon, panel: 'talent' },
  { id: 'client', label: 'Klien B2B', desc: 'Mitra & Relasi Legalitas', icon: BuildingOfficeIcon, panel: 'client' },
  { id: 'project', label: 'Proyek', desc: 'Situs & Alokasi Penempatan', icon: ClipboardDocumentListIcon, panel: 'project' },
  { id: 'employees', label: 'Kepegawaian', desc: 'Database Gaji & Kontrak Kerja', icon: UserGroupIcon, panel: 'employees' },
  { id: 'attendance', label: 'Presensi Lapangan', desc: 'Absensi GPS & Jam Kerja', icon: ClockIcon, panel: 'attendance' },
  { id: 'payroll', label: 'Sistem Payroll', desc: 'Upah Bulanan Karyawan', icon: CreditCardIcon, panel: 'payroll' },
  { id: 'finance', label: 'Kas & Buku Kas', desc: 'Ledger Keuangan & Laba-Rugi', icon: ScaleIcon, panel: 'finance' },
  { id: 'assets', label: 'Aset Logistik', desc: 'Alat Kerja & Inventaris', icon: WrenchScrewdriverIcon, panel: 'assets' },
  { id: 'reports', label: 'Reports', desc: 'Sync Telegram & Visual Statistik', icon: ChartPieIcon, panel: 'reports' },
  { id: 'rbac', label: 'Hak Akses RBAC', desc: 'Manajemen Staf Admin & Otoritas', icon: ShieldCheckIcon, panel: 'rbac' }
];

export const AdminDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<string>('');
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Authenticate and load permissions
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role === 'admin') {
      setCurrentUser(user);
      
      // Determine default active module based on permitted modules list
      const permissions = user.permissions || [];
      if (permissions.length > 0) {
        // Default to 'talent' if permitted, otherwise first permitted module
        if (permissions.includes('talent')) {
          setActiveModule('talent');
        } else {
          setActiveModule(permissions[0]);
        }
      } else {
        // Fallback for older admin models
        setActiveModule('talent');
      }
    } else {
      setCurrentUser(null);
    }
    
    loadActiveEmployees();
  }, []);

  const loadActiveEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const emps = await getEmployees();
      const hired = emps.filter(e => e.status === 'HIRED' || e.status === 'CONTRACT');
      setActiveEmployees(hired.length > 0 ? hired : emps.slice(0, 20));
    } catch (err) {
      console.error("Gagal memuat kandidat aktif untuk panel ERP:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari Dashboard Admin?")) {
      logout();
    }
  };

  // Guard Clause - No current user or not admin
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 antialiased text-slate-800">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg space-y-6">
          <div className="mx-auto bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 inline-block">
            <LockClosedIcon className="h-12 w-12 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Akses Ditolak / Tidak Sah</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2.5 max-w-xs mx-auto">
              Maaf, Anda harus login menggunakan akun Administrator untuk mengelola pipeline rekrutmen, akuntansi, dan administrasi B2B PT Perdana.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '#/login?redirect=/admin'}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition duration-150 shadow-sm inline-block transform active:scale-95 cursor-pointer"
          >
            Masuk Sebagai Administrator
          </button>
        </div>
      </div>
    );
  }

  // Get only modules that are permitted for the current admin
  const permittedModules = ALL_MODULES.filter(mod => {
    // Superadmin has all permissions by default. Otherwise check specific user permissions.
    if (currentUser.username === 'admin') return true;
    return currentUser.permissions?.includes(mod.id);
  });

  return (
    <div className="min-h-screen bg-gray-100 text-slate-800 font-sans antialiased">
      {/* 1. COMPACT DASHBOARD TOP HEADER BAR */}
      <header className="bg-[#0f172a] text-white py-4.5 px-4 md:px-8 shadow-md">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Round company avatar placeholder */}
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <ShieldCheckIcon className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight leading-none text-white">
                PT Perdana Adi Yuda Operasional
              </h1>
              <span className="text-[10px] text-blue-300 font-bold block leading-none mt-1 uppercase tracking-wider">
                Console Dashboard Multi-Admin & Module RBAC v3.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="text-right leading-none hidden md:block">
              <p className="font-extrabold text-xs text-slate-100">
                {currentUser.profile?.fullName || currentUser.username}
              </p>
              <span className="text-[9px] text-blue-400 font-bold tracking-widest uppercase mt-0.5 block">
                {currentUser.username === 'admin' ? '⭐ SUPERADMIN MASTER' : '👥 ASISTEN ADMIN OPERATOR'}
              </span>
            </div>

            {/* Logout anchor design */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 border border-slate-750 bg-slate-850 hover:bg-slate-750 text-slate-350 hover:text-white rounded-xl text-[10px] font-black transition duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Keluar dari Panel Admin"
            >
              <ArrowRightOnRectangleIcon className="h-4.5 w-4.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* 2. MAIN MODULAR NAVIGATION SELECTOR - Responsive Bento Style Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider pl-1 font-mono">
              Situs Navigasi Modul Terpedomani
            </span>
            <span className="text-[10px] text-blue-700 bg-blue-50 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {permittedModules.length} Modul Diizinkan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5" id="main-module-menu-re-segmented">
            {permittedModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`flex items-start text-left p-3 md:p-4 rounded-xl border transition-all duration-150 relative select-none cursor-pointer ${
                    isActive
                      ? 'bg-white border-blue-600 ring-2 ring-blue-500 text-blue-700 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-gray-500 hover:text-slate-800 hover:bg-white/50 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-xl mr-3 shrink-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-gray-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="font-extrabold text-xs text-slate-900 leading-none">{item.label}</p>
                    <p className="text-[9.5px] leading-relaxed text-gray-405 font-medium mt-1 truncate hidden md:block">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SHARP ROUTED LAYOUT VIEWPORT CONTAINER */}
        <div className="animate-fade-in">
          {activeModule === 'talent' && <TalentManager />}
          {activeModule === 'client' && <ClientManager />}
          {activeModule === 'project' && <ProjectManager />}
          
          {/* Newly separated first-class modules from the old monolithic ERPManager */}
          {activeModule === 'employees' && (
            <EmployeesPanel 
              activeEmployees={activeEmployees} 
              onRefresh={loadActiveEmployees} 
            />
          )}
          {activeModule === 'attendance' && (
            <AttendancePanel activeEmployees={activeEmployees} />
          )}
          {activeModule === 'payroll' && (
            <PayrollPanel activeEmployees={activeEmployees} />
          )}
          {activeModule === 'finance' && <FinancePanel />}
          {activeModule === 'assets' && (
            <AssetsPanel activeEmployees={activeEmployees} />
          )}

          {/* Standard Reports and RBAC */}
          {activeModule === 'reports' && <ReportsManager />}
          {activeModule === 'rbac' && <RBACManager />}
        </div>
      </div>
    </div>
  );
};
