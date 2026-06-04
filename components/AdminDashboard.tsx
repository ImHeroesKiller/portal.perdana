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
  ArrowRightOnRectangleIcon, LockClosedIcon, Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { SettingsManager } from './admin/modules/SettingsManager';

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
  { id: 'settings', label: 'Settings', desc: 'Konfigurasi Sistem', icon: Cog6ToothIcon, panel: 'settings' },
  { id: 'rbac', label: 'Hak Akses RBAC', desc: 'Manajemen Staf Admin & Otoritas', icon: ShieldCheckIcon, panel: 'rbac' }
];

export const AdminDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<string>('');
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');

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

  // Filter modules by search
  const filteredModules = permittedModules.filter(m => 
    m.label.toLowerCase().includes(moduleSearch.toLowerCase()) || 
    m.desc.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex text-slate-800 font-sans antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
           <h1 className="text-sm font-black text-white tracking-tight">PT Perdana Adi Yuda</h1>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Console Dashboard</p>
        </div>

        <div className="p-4">
           <input 
             type="text"
             placeholder="Cari modul..."
             className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-xs border border-slate-700 outline-none focus:border-blue-500"
             value={moduleSearch}
             onChange={(e) => setModuleSearch(e.target.value)}
           />
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 p-2">
           {filteredModules.map(item => {
             const Icon = item.icon;
             const isActive = activeModule === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => setActiveModule(item.id)}
                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition ${
                   isActive 
                   ? 'bg-blue-600 text-white' 
                   : 'text-slate-400 hover:text-white hover:bg-slate-800'
                 }`}
               >
                 <Icon className="h-4 w-4" />
                 {item.label}
               </button>
             );
           })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white px-2 py-2"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
           <h2 className="font-bold text-sm text-slate-900 capitalize">
             {ALL_MODULES.find(m => m.id === activeModule)?.label || 'Dashboard'}
           </h2>
           <p className="text-xs text-slate-500 font-bold">
             {currentUser.profile?.fullName || currentUser.username}
           </p>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            {activeModule === 'talent' && <TalentManager />}
            {activeModule === 'client' && <ClientManager />}
            {activeModule === 'project' && <ProjectManager />}
            
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

            {activeModule === 'reports' && <ReportsManager />}
            {activeModule === 'settings' && <SettingsManager />}
            {activeModule === 'rbac' && <RBACManager />}
          </div>
        </main>
      </div>
    </div>
  );
};
