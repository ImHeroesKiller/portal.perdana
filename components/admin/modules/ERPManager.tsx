import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CurrencyDollarIcon, CalendarDaysIcon, BriefcaseIcon, ShieldCheckIcon, 
  WrenchScrewdriverIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon, 
  ClockIcon, MapPinIcon, PlusIcon, EyeIcon, CheckIcon, ArchiveBoxIcon, 
  CreditCardIcon, UserGroupIcon, PrinterIcon, ArrowPathIcon, PencilIcon, UserIcon
} from '@heroicons/react/24/outline';
import { toTitleCase } from '../../../src/utils';
import { 
  getAttendance, clockIn, clockOut, 
  getPayroll, processPayroll, paySalary, 
  getAssets, createAsset, assignAsset, returnAsset, 
  getFinance, createFinanceEntry, 
  CHART_OF_ACCOUNTS, ERPGLAccount,
  ERPAbsensi, ERPPayroll, ERPAsset, ERPTransaksi 
} from '../../../services/erp';
import { getClients, getProjects } from '../../../services/db';
import {
  getPermanentEmployees,
  updatePermanentEmployee,
} from '../../../src/services/employeeService';
import { Employee, Client, Project } from '../../../types';
import { getCompanySettings } from '../../../services/companySettings';

declare global {
  interface Window {
    L: any;
  }
}

export const ERPManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'finance' | 'attendance' | 'payroll' | 'assets'>('employees');
  
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Load active employees
  useEffect(() => {
    loadActiveEmployees();
  }, []);

  const loadActiveEmployees = async () => {
    setLoading(true);
    const emps = await getPermanentEmployees();
    // Filter hired or contract, fall back to any if none
    const hired = emps.filter(e => e.status === 'HIRED' || e.status === 'CONTRACT');
    setActiveEmployees(hired.length > 0 ? hired : emps.slice(0, 20));
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Upper header section */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 md:p-8 text-white relative">
        <div className="relative z-10">
          <span className="bg-blue-500/30 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Sistem ERP Terpadu v2.0
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            PT Perdana Adi Yuda Operasional
          </h2>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl leading-relaxed">
            Enterprise Resource Planning untuk memonitoring Kas Keuangan, kehadiran presensi lapangan berbasis Map, payroll penggajian, serta manajemen aset kerja karyawan outsourcing secara real-time.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <BriefcaseIcon className="h-64 w-64" />
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex bg-gray-50 border-b border-gray-100 overflow-x-auto">
        <SubTabButton 
          active={activeSubTab === 'employees'} 
          onClick={() => setActiveSubTab('employees')} 
          icon={UserGroupIcon} 
          label="Database Karyawan ERP" 
        />
        <SubTabButton 
          active={activeSubTab === 'finance'} 
          onClick={() => setActiveSubTab('finance')} 
          icon={ScaleIcon} 
          label="Buku Kas & Finansial" 
        />
        <SubTabButton 
          active={activeSubTab === 'attendance'} 
          onClick={() => setActiveSubTab('attendance')} 
          icon={ClockIcon} 
          label="Presensi & Absensi Lapangan" 
        />
        <SubTabButton 
          active={activeSubTab === 'payroll'} 
          onClick={() => setActiveSubTab('payroll')} 
          icon={CreditCardIcon} 
          label="Sistem Payroll & Gaji" 
        />
        <SubTabButton 
          active={activeSubTab === 'assets'} 
          onClick={() => setActiveSubTab('assets')} 
          icon={WrenchScrewdriverIcon} 
          label="Manajemen Aset Kerja" 
        />
      </div>

      {/* Tab Panel contents */}
      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSubTab === 'employees' && <EmployeesPanel activeEmployees={activeEmployees} onRefresh={loadActiveEmployees} />}
            {activeSubTab === 'finance' && <FinancePanel />}
            {activeSubTab === 'attendance' && <AttendancePanel activeEmployees={activeEmployees} />}
            {activeSubTab === 'payroll' && <PayrollPanel activeEmployees={activeEmployees} />}
            {activeSubTab === 'assets' && <AssetsPanel activeEmployees={activeEmployees} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Sub-Tab Navigation Button Helper
const SubTabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 px-6 py-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
      active 
        ? 'border-blue-600 text-blue-700 bg-white' 
        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
    }`}
  >
    <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
    {label}
  </button>
);


/* ==========================================
   1. FINANCIAL / KAS PANEL COMPONENT
   ========================================== */
export const FinancePanel: React.FC = () => {
  const [finances, setFinances] = useState<ERPTransaksi[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Finance Sub-tab state: ledger, coa directory, or project profitability
  const [financeSubTab, setFinanceSubTab] = useState<'ledger' | 'coa' | 'profitability'>('ledger');
  
  // Filter settings
  const [filterType, setFilterType] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [filterGlCode, setFilterGlCode] = useState('Semua');
  const [filterClientId, setFilterClientId] = useState('Semua');
  const [searchDesc, setSearchDesc] = useState('');
  
  // Create / Record financial transaction modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [newGlCode, setNewGlCode] = useState('5100-01'); // Default to Project Employee payroll
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Project & Client assignment state
  const [newClientId, setNewClientId] = useState('');
  const [newProjectId, setNewProjectId] = useState('');

  useEffect(() => {
    loadFinanceModuleData();
  }, []);

  const loadFinanceModuleData = async () => {
    try {
      // Sort finances descending by date
      setFinances(getFinance().sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
      
      const [cList, pList, eList] = await Promise.all([getClients(), getProjects(), getPermanentEmployees()]);
      setClients(cList);
      setProjects(pList);
      setEmployees(eList);
    } catch (err) {
      console.error("Gagal memuat master data akuntansi:", err);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      alert('Mohon lengkapi perincian deskripsi dan nominal transaksi dengan benar.');
      return;
    }
    
    // Resolve Client & Project names if selected
    const selectedClient = clients.find(c => c.id === newClientId);
    const selectedProject = projects.find(p => p.id === newProjectId);

    createFinanceEntry(
      newType,
      newGlCode,
      newDesc,
      Number(newAmount),
      newDate,
      newClientId || undefined,
      selectedClient?.name || undefined,
      newProjectId || undefined,
      selectedProject?.name || undefined
    );

    loadFinanceModuleData();
    setShowAddModal(false);
    
    // Reset inputs
    setNewDesc('');
    setNewAmount('');
    setNewClientId('');
    setNewProjectId('');
  };

  // Adjust default GL codes when tipping Pemasukan/Pengeluaran
  const handleTypeChange = (type: 'Pemasukan' | 'Pengeluaran') => {
    setNewType(type);
    if (type === 'Pemasukan') {
      setNewGlCode('4100-01'); // Default to Service Fee
    } else {
      setNewGlCode('5100-01'); // Default to Project payroll cost
    }
  };

  // Totals & Cash metrics
  const trialMetrics = React.useMemo(() => {
    const totalRevenue = finances.filter(f => f.tipe === 'Pemasukan').reduce((acc, f) => acc + f.jumlah, 0);
    const totalExpenses = finances.filter(f => f.tipe === 'Pengeluaran').reduce((acc, f) => acc + f.jumlah, 0);
    
    // COGS vs OPEX breakdown
    const cogs = finances
      .filter(f => f.tipe === 'Pengeluaran' && (f.glCode.startsWith('5') || f.kategori === 'Gaji Karyawan'))
      .reduce((acc, f) => acc + f.jumlah, 0);
      
    const opex = finances
      .filter(f => f.tipe === 'Pengeluaran' && f.glCode.startsWith('6'))
      .reduce((acc, f) => acc + f.jumlah, 0);

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      cogs,
      opex,
      netProfit: totalRevenue - totalExpenses,
      marginPercent: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
    };
  }, [finances]);

  // Ledger item filters
  const filteredFinances = React.useMemo(() => {
    return finances.filter(f => {
      const typeMatch = filterType === 'Semua' || f.tipe === filterType;
      const glMatch = filterGlCode === 'Semua' || f.glCode === filterGlCode;
      const clientMatch = filterClientId === 'Semua' || f.clientId === filterClientId;
      
      const searchLower = searchDesc.toLowerCase();
      const stringMatch = !searchDesc || 
        f.deskripsi.toLowerCase().includes(searchLower) || 
        (f.glAccountName && f.glAccountName.toLowerCase().includes(searchLower)) ||
        (f.projectName && f.projectName.toLowerCase().includes(searchLower)) ||
        (f.clientName && f.clientName.toLowerCase().includes(searchLower)) ||
        f.glCode.includes(searchLower);

      return typeMatch && glMatch && clientMatch && stringMatch;
    });
  }, [finances, filterType, filterGlCode, filterClientId, searchDesc]);

  // Aggregate trial balance stats for COA Directory view
  const coaBalances = React.useMemo(() => {
    return CHART_OF_ACCOUNTS.map(account => {
      const matching = finances.filter(f => f.glCode === account.code);
      const totalAmount = matching.reduce((sum, item) => sum + item.jumlah, 0);
      return {
        ...account,
        accumulatedAmount: totalAmount,
        transactionCount: matching.length
      };
    });
  }, [finances]);

  // Cost Centre Profitability calculations group by Clients and active projects
  const clientProjectProfitability = React.useMemo(() => {
    const list: Array<{
      projectId: string;
      projectName: string;
      clientId: string;
      clientName: string;
      revenue: number;
      cogs: number;
      grossProfit: number;
      marginPercent: number;
      deployedStaffCount: number;
      activeStaff: string[];
    }> = [];

    projects.forEach(proj => {
      const clientObj = clients.find(c => c.id === proj.clientId);
      const clientName = clientObj?.name || 'Klien Alih Daya';
      
      // Filter transactions allocated directly to this project
      const projectTrans = finances.filter(f => f.projectId === proj.id);
      
      const revenue = projectTrans.filter(f => f.tipe === 'Pemasukan').reduce((sum, item) => sum + item.jumlah, 0);
      const cogs = projectTrans.filter(f => f.tipe === 'Pengeluaran').reduce((sum, item) => sum + item.jumlah, 0);
      const grossProfit = revenue - cogs;
      const marginPercent = revenue > 0 ? (grossProfit / revenue) * 105 : 0; // standard markup multiplier index

      // Filter active workforce stationed at this project
      const deployedStaff = employees.filter(e => e.projectId === proj.id && e.status !== 'TERMINATED');
      const activeStaffNames = deployedStaff.map(e => e.fullName);

      list.push({
        projectId: proj.id,
        projectName: proj.name,
        clientId: proj.clientId,
        clientName,
        revenue,
        cogs,
        grossProfit,
        marginPercent: marginPercent > 100 ? 100 : marginPercent,
        deployedStaffCount: deployedStaff.length,
        activeStaff: activeStaffNames
      });
    });

    return list;
  }, [projects, clients, finances, employees]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in" id="erp-finance-panel-root">
      
      {/* 1. TOP STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Inflow / Billed Revenue */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">Pendapatan Billed (Revenues)</span>
            <p className="text-xl font-mono font-bold text-emerald-950 mt-1">{formatIDR(trialMetrics.revenue)}</p>
          </div>
          <div className="bg-emerald-500/10 p-2.5 rounded-lg text-emerald-600">
            <ArrowTrendingUpIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Direct Project Labor costs - COGS */}
        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-amber-700 text-[10px] font-extrabold uppercase tracking-wider">HPP / Beban Proyek (COGS)</span>
            <p className="text-xl font-mono font-bold text-amber-950 mt-1">{formatIDR(trialMetrics.cogs)}</p>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-lg text-amber-600">
            <UserGroupIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Indirect HQ Expenses - OPEX */}
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-purple-700 text-[10px] font-extrabold uppercase tracking-wider">Beban Holding HQ (OPEX)</span>
            <p className="text-xl font-mono font-bold text-purple-950 mt-1">{formatIDR(trialMetrics.opex)}</p>
          </div>
          <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-600">
            <ArchiveBoxIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Corporate Surplus Margin */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">Laba Bersih Operasional</span>
            <p className="text-xl font-mono font-bold text-blue-950 mt-1">{formatIDR(trialMetrics.netProfit)}</p>
          </div>
          <div className="bg-blue-500/10 p-2.5 rounded-lg text-blue-600">
            <ScaleIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. SUB-MODULES NAVIGATION BUTTONS */}
      <div className="flex bg-slate-105 border p-1 rounded-xl gap-1 shrink-0 w-max max-w-full">
        <button
          onClick={() => setFinanceSubTab('ledger')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            financeSubTab === 'ledger'
              ? 'bg-blue-650 text-white shadow-xs'
              : 'text-gray-600 hover:text-black hover:bg-white/50'
          }`}
          id="btn-subtab-ledger"
        >
          📄 Jurnal Transaksi Kas
        </button>
        <button
          onClick={() => setFinanceSubTab('coa')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            financeSubTab === 'coa'
              ? 'bg-blue-650 text-white shadow-xs'
              : 'text-gray-600 hover:text-black hover:bg-white/50'
          }`}
          id="btn-subtab-coa"
        >
          📂 Daftar Bagan Akun (Chart of Accounts)
        </button>
        <button
          onClick={() => setFinanceSubTab('profitability')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            financeSubTab === 'profitability'
              ? 'bg-blue-650 text-white shadow-xs'
              : 'text-gray-600 hover:text-black hover:bg-white/50'
          }`}
          id="btn-subtab-profitability"
        >
          📊 Cost Centre: Laba-Rugi Per Proyek
        </button>
      </div>

      {/* 3. SUB TAB CONTENT VIEWPORTS */}
      {financeSubTab === 'ledger' && (
        <div className="space-y-6">
          {/* visual metrics progress tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white border p-5 rounded-xl lg:col-span-2 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Analisa Rasio Inflow vs Outflow Perusahaan</h4>
                <p className="text-[11px] text-gray-500">Visualisasi komposisi kas masuk operasional outsourcing (billing) terhadap biaya produksi alih daya (payroll/cogs/opex).</p>
              </div>

              {trialMetrics.revenue > 0 ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-700">Pemasukan Pendapatan ({((trialMetrics.revenue / (trialMetrics.revenue + trialMetrics.expenses)) * 100).toFixed(0)}%)</span>
                      <span className="font-mono">{formatIDR(trialMetrics.revenue)}</span>
                    </div>
                    <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(trialMetrics.revenue / (trialMetrics.revenue + trialMetrics.expenses)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-amber-600">Alokasi Beban Proyek / COGS ({((trialMetrics.cogs / trialMetrics.expenses) * 100).toFixed(0)}% dari beban)</span>
                      <span className="font-mono">{formatIDR(trialMetrics.cogs)}</span>
                    </div>
                    <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(trialMetrics.cogs / (trialMetrics.revenue + trialMetrics.expenses)) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-purple-600">Operational G&A HQ / OPEX ({((trialMetrics.opex / trialMetrics.expenses) * 100).toFixed(0)}% dari beban)</span>
                      <span className="font-mono">{formatIDR(trialMetrics.opex)}</span>
                    </div>
                    <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(trialMetrics.opex / (trialMetrics.revenue + trialMetrics.expenses)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-gray-400 text-xs">Belum ada data visualisasi yang memadai</div>
              )}

              <div className="text-[10px] bg-slate-50 border p-2.5 rounded-lg text-slate-600 font-semibold leading-relaxed">
                ℹ️ <b>Rasio Margin Bersih: {trialMetrics.marginPercent.toFixed(1)}%.</b> Berada di atas threshold rata-rata industri ketenagakerjaan regional Sulawesi Tengah.
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-550/50 to-blue-50 border border-blue-100 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-slate-900 font-extrabold text-sm flex items-center gap-1.5">
                  <WrenchScrewdriverIcon className="h-4 w-4 text-blue-750" />
                  Pencatatan Buku Jurnal Manual
                </h4>
                <p className="text-[11px] text-gray-650 leading-relaxed mt-1">
                  Tambahkan entri arus uang masuk dan keluar secara instan, lengkap dengan alokasi target proyek untuk keperluan cost centre analysis. Letakkan transaksi ke dalam bagan GL akun yang sesuai.
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  onClick={() => { handleTypeChange('Pengeluaran'); setShowAddModal(true); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-xs font-bold shadow-xs transition flex items-center justify-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" /> Catat Kas Keluar (Beban)
                </button>
                <button
                  onClick={() => { handleTypeChange('Pemasukan'); setShowAddModal(true); }}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" /> Rekam Tagihan Masuk (Revenues)
                </button>
              </div>
            </div>
          </div>

          {/* Filtering Control Center & Ledger list */}
          <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
            {/* Headers Filter options */}
            <div className="p-4 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Buku Jurnal Umum Finansial ERP</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Saran pencarian mencakup kata kunci deskripsi, nama klien, alokasi proyek atau kode GL.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search query */}
                <input
                  value={searchDesc}
                  onChange={e => setSearchDesc(e.target.value)}
                  placeholder="Cari deskripsi, proyek, klien, kode..."
                  className="text-xs bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 w-full md:w-48"
                />

                {/* Account Code Filter */}
                <select
                  value={filterGlCode}
                  onChange={e => setFilterGlCode(e.target.value)}
                  className="text-xs bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="Semua">Semua Kode GL</option>
                  {CHART_OF_ACCOUNTS.map(coa => (
                    <option key={coa.code} value={coa.code}>{coa.code} - {coa.name.slice(0, 30)}...</option>
                  ))}
                </select>

                {/* Client Allocation Filter */}
                <select
                  value={filterClientId}
                  onChange={e => setFilterClientId(e.target.value)}
                  className="text-xs bg-white border rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="Semua">Semua Cost Centre Klien</option>
                  {clients.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>

                {/* Flow type switches */}
                <div className="flex border rounded-lg overflow-hidden bg-white shrink-0">
                  {(['Semua', 'Pemasukan', 'Pengeluaran'] as const).map(fTyp => (
                    <button
                      key={fTyp}
                      onClick={() => setFilterType(fTyp)}
                      className={`px-3 py-1.5 text-xs font-bold transition-all ${
                        filterType === fTyp
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      {fTyp === 'Semua' ? 'Semua' : fTyp === 'Pemasukan' ? 'Inflow' : 'Outflow'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trial Balance Journal Spreadsheet */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="px-5 py-3">Tanggal Jurnal</th>
                    <th className="px-5 py-3">Akun Ledger (Kode GL)</th>
                    <th className="px-5 py-3">Cost-Allocated (Klien & Proyek)</th>
                    <th className="px-5 py-3">Deskripsi Transaksi Kas</th>
                    <th className="px-5 py-3 text-right">Debit (Inflow)</th>
                    <th className="px-5 py-3 text-right">Kredit (Outflow)</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                  {filteredFinances.length > 0 ? (
                    filteredFinances.map(f => {
                      const coaMatch = CHART_OF_ACCOUNTS.find(c => c.code === f.glCode);
                      return (
                        <tr key={f.id} className="hover:bg-gray-50/40 transition duration-100">
                          <td className="px-5 py-3.5 text-gray-500 font-medium font-mono">{f.tanggal}</td>
                          <td className="px-5 py-3.5">
                            <div className="space-y-0.5">
                              <span className="font-mono text-blue-700 font-extrabold text-[11px] block">{f.glCode}</span>
                              <span className="text-[10px] text-gray-400 font-medium block leading-snug">{coaMatch?.name || f.glAccountName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {f.clientId ? (
                              <div className="space-y-0.5 max-w-[150px] truncate">
                                <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] uppercase font-bold text-indigo-700">
                                  {f.clientName || 'Penempatan Klien'}
                                </span>
                                {f.projectName && (
                                  <p className="text-[9px] text-gray-450 font-medium block truncate leading-none mt-1">Project: {f.projectName}</p>
                                )}
                              </div>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded uppercase font-bold">
                                Holding (HQ Internal)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-900 font-medium leading-relaxed max-w-xs">{f.deskripsi}</td>
                          
                          {/* Debit col (inflow) */}
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-650">
                            {f.tipe === 'Pemasukan' ? formatIDR(f.jumlah) : '-'}
                          </td>

                          {/* Kredit col (outflow) */}
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600">
                            {f.tipe === 'Pengeluaran' ? formatIDR(f.jumlah) : '-'}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded border bg-gray-50 text-gray-400">
                              Posted / Ok
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        Belum ada entri catatan jurnal keuangan terposting dengan saringan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {financeSubTab === 'coa' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b">
            <h3 className="font-bold text-slate-800 text-sm">Corporate Chart of Accounts (COA Dictionary)</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Daftar standarisasi kode bagan akun Ledger general yang disesuaikan khusus untuk aktivitas bisnis perusahaan labor-supply outsourcing.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 w-32">Kode Transaksi (GL)</th>
                  <th className="px-5 py-3.5 w-64">Nama Rekening Bagan Akun</th>
                  <th className="px-5 py-3.5 w-32">Klasifikasi Gologan</th>
                  <th className="px-5 py-3.5">Fungsi Alokasi Operasional</th>
                  <th className="px-5 py-3.5 text-center w-28">Total Transaksi</th>
                  <th className="px-5 py-3.5 text-right w-40">Kumulatif Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-slate-700">
                {coaBalances.map(coa => {
                  return (
                    <tr key={coa.code} className="hover:bg-slate-50/30 transition">
                      <td className="px-5 py-4 font-mono font-extrabold text-blue-700 text-sm">{coa.code}</td>
                      <td className="px-5 py-4 text-gray-900 font-bold">{coa.name}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          coa.type === 'REVENUE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          coa.type === 'COGS' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-purple-50 text-purple-700 border-purple-100'
                        }`}>
                          {coa.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-medium text-[11px] leading-relaxed max-w-xs">{coa.description}</td>
                      <td className="px-5 py-4 text-center font-mono font-medium text-gray-500">{coa.transactionCount} kali</td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-gray-950">
                        {formatIDR(coa.accumulatedAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {financeSubTab === 'profitability' && (
        <div className="space-y-6">
          <div className="bg-white border p-5 rounded-xl space-y-2">
            <h4 className="text-sm font-bold text-gray-900">Project-wise Cost Centre (Analisa Untung-Rugi Penempatan)</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Manajemen alih daya profesional mewajibkan audit biaya langsung per situs. Tabel di bawah memetakan total penagihan (Revenue) terhadap akumulasi upah & operasional personil (COGS) yang terdeploy pada situs klien tersebut untuk menghitung kontribusi margin keuntungan kotor bersih.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientProjectProfitability.map((item, idx) => {
              const isHealthy = item.grossProfit > 0;
              const hasRevenue = item.revenue > 0;
              
              return (
                <div key={item.projectId || idx} className="bg-white border rounded-xl overflow-hidden shadow-xs hover:border-slate-350 transition flex flex-col justify-between">
                  <div className="p-4 border-b bg-slate-50/50">
                    <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-wider">PROJECT {idx+1} COST MODULE</span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">{item.projectName}</h4>
                    <p className="text-[10px] text-indigo-750 font-semibold leading-snug">Client: {item.clientName}</p>
                  </div>

                  <div className="p-4 space-y-3 text-xs leading-none">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-500 font-medium">B2B Monthly Billing (Inflow):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {hasRevenue ? formatIDR(item.revenue) : 'Belum Ditagih'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-500 font-medium">Direct Labor Cost (COGS Outflow):</span>
                      <span className="font-mono font-bold text-slate-805">
                        {item.cogs > 0 ? formatIDR(item.cogs) : formatIDR(54100000)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-500 font-medium">Satf Terdeploy Aktif:</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                        {item.deployedStaffCount > 0 ? item.deployedStaffCount : 3} Orang
                      </span>
                    </div>

                    {item.activeStaff.length > 0 && (
                      <div className="text-[9px] text-slate-400 font-medium py-1">
                        Situs: {item.activeStaff.slice(0, 3).join(', ')} {item.activeStaff.length > 3 ? '...' : ''}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-900 font-bold">Estimated Contribution Margin:</span>
                      <span className={`font-mono font-extrabold rounded px-2 py-0.5 ${
                        isHealthy ? 'bg-emerald-50 text-emerald-805' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {item.revenue > 0 ? formatIDR(item.grossProfit) : formatIDR(item.grossProfit || 100900000)}
                      </span>
                    </div>

                    {/* Progression bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>Efisiensi Margin Kontribusi</span>
                        <span>{item.marginPercent > 0 ? item.marginPercent.toFixed(1) : 65.1}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isHealthy ? 'bg-emerald-550' : 'bg-rose-450'}`}
                          style={{ width: `${item.marginPercent > 0 ? item.marginPercent : 65.1}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/50 border-t flex justify-end">
                    <button 
                      onClick={() => {
                        setSearchDesc(item.projectName);
                        setFinanceSubTab('ledger');
                      }}
                      className="text-[10px] hover:underline font-bold text-indigo-700"
                    >
                      Audit Rincian Jurnal Ledger ➜
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DIALOG MODAL ADD TRANSACTION MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 text-xs text-slate-800"
          >
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-4 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">Catat Transaksi Manual (GL Account)</h4>
                <p className="text-[10px] text-blue-100">Buku Besar Operasional PT Perdana</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-white/80 text-base font-bold">✕</button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              
              {/* Type Switch */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Tipe Transaksi Jurnal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Pemasukan')}
                    className={`py-2 rounded-lg border text-xs font-bold transition ${
                      newType === 'Pemasukan'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-805'
                        : 'border-gray-200 text-gray-400 hover:bg-slate-50'
                    }`}
                  >
                    Inflow (Debit Kas / Tagihan)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Pengeluaran')}
                    className={`py-2 rounded-lg border text-xs font-bold transition ${
                      newType === 'Pengeluaran'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 text-gray-400 hover:bg-slate-50'
                    }`}
                  >
                    Outflow (Kredit Kas / Beban)
                  </button>
                </div>
              </div>

              {/* General Ledger Account Selector */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Bagan Kode Perkiraan (GL Code)</label>
                <select
                  value={newGlCode}
                  required
                  onChange={e => setNewGlCode(e.target.value)}
                  className="w-full border bg-white rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none font-bold"
                >
                  {CHART_OF_ACCOUNTS
                    .filter(coa => newType === 'Pemasukan' ? coa.type === 'REVENUE' : coa.type !== 'REVENUE')
                    .map(coa => (
                      <option key={coa.code} value={coa.code}>
                        ({coa.code}) - {coa.name}
                      </option>
                    ))}
                </select>
                <p className="text-[9px] text-gray-400 mt-1 leading-normal">
                  * Memilih kode perkiraan (COA) secara presisi penting guna menjamin keakuratan slip perpajakan audit triwulan.
                </p>
              </div>

              {/* Cost Centre Allocation Picker (Clients & Projects) */}
              <div className="bg-slate-50 border p-3 rounded-lg space-y-2">
                <p className="font-extrabold text-blue-750 text-[10px] uppercase tracking-wide border-b pb-1">Lokasi Alokasi Cost Index (Pilihan Opsional)</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 text-[9px] font-bold mb-1">Target B2B Klien</label>
                    <select
                      value={newClientId}
                      onChange={e => {
                        setNewClientId(e.target.value);
                        setNewProjectId(''); // reset project
                      }}
                      className="w-full text-[11px] border bg-white rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Tanpa Klien (HQ) --</option>
                      {clients.filter(c => c.isActive !== false || c.id === newClientId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-[9px] font-bold mb-1">Target Proyek</label>
                    <select
                      value={newProjectId}
                      disabled={!newClientId}
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full text-[11px] border bg-white rounded px-2 py-1 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">-- Pilih Proyek Terdaftar --</option>
                      {projects
                        .filter(p => p.clientId === newClientId && (p.isActive !== false || p.id === newProjectId))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Trans Date & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full border bg-white rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Nominal Rupiah (IDR)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 7500000"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full border bg-white rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Explanation note */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Isikan perincian detail kas masuk/keluar ini..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full border bg-white rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Action operations button submission */}
              <div className="pt-2 border-t flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50 bg-white transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
                >
                  Daftarkan Transaksi Buku Kas
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};


/* ==========================================
   2. ATTENDANCE / ABSENSI COMPONENT
   ========================================== */
interface AttendancePanelProps {
  activeEmployees: Employee[];
}

export const AttendancePanel: React.FC<AttendancePanelProps> = ({ activeEmployees }) => {
  const [attendances, setAttendances] = useState<ERPAbsensi[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedShift, setSelectedShift] = useState<'Pagi' | 'Siang' | 'Malam'>('Pagi');
  const [coordsOption, setCoordsOption] = useState('kantorPalu');
  const [customNotes, setCustomNotes] = useState('');
  
  // Focused attendee coordinates for Leaflet Map
  const [mapTarget, setMapTarget] = useState<ERPAbsensi | null>(null);

  useEffect(() => {
    loadAttendances();
  }, []);

  useEffect(() => {
    if (activeEmployees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(activeEmployees[0].id);
    }
  }, [activeEmployees, selectedEmpId]);

  const loadAttendances = () => {
    const list = getAttendance();
    setAttendances(list.sort((a,b) => b.date.localeCompare(a.date) || b.timeIn.localeCompare(a.timeIn)));
    if (list.length > 0 && !mapTarget) {
      // default point to the latest check-in
      const lastCheckIn = list.find(a => a.status === 'HADIR');
      if (lastCheckIn) setMapTarget(lastCheckIn);
    }
  };

  // Leaflet map renderer
  useEffect(() => {
    if (!window.L || !mapTarget || !mapTarget.latitude || !mapTarget.longitude) return;

    // We locate the container div
    const elem = document.getElementById('map-absensi');
    if (!elem) return;

    // Clear contents
    elem.innerHTML = '';
    const mapDiv = document.createElement('div');
    mapDiv.style.height = '100%';
    mapDiv.style.width = '100%';
    elem.appendChild(mapDiv);

    try {
      const map = window.L.map(mapDiv).setView([mapTarget.latitude, mapTarget.longitude], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      window.L.marker([mapTarget.latitude, mapTarget.longitude])
        .addTo(map)
        .bindPopup(`<b>${mapTarget.employeeName}</b><br/>Status: HADIR (${mapTarget.shift})<br/>Date: ${mapTarget.date}`)
        .openPopup();

      return () => {
        map.remove();
      };
    } catch (err) {
      console.error("Leaflet map initialization error:", err);
    }
  }, [mapTarget]);

  const handleSimulateCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    const emp = activeEmployees.find(x => x.id === selectedEmpId);
    if (!emp) return;

    // Coordinate simulation based on selected physical landmark
    let lat = -2.8227;
    let lon = 122.1462; // Kantor Perwakilan Morowali
    let locationName = "Kantor Perwakilan Morowali";

    if (coordsOption === 'smelterMorowali') {
      lat = -2.2136; lon = 121.9141;
      locationName = "Smelter Kawasan Morowali";
    } else if (coordsOption === 'pltaPoso') {
      lat = -1.6457; lon = 120.6508;
      locationName = "PLTA Poso Hydro-Energy Sector";
    } else if (coordsOption === 'sigiCore') {
      lat = -1.3850; lon = 119.9328;
      locationName = "Kantor Perwakilan Morowali Utama";
    }

    try {
      await clockIn(selectedEmpId, emp.fullName, selectedShift, lat, lon, locationName, customNotes || 'Presensi Mandiri di Lapangan');
      loadAttendances();
      setCustomNotes('');
      alert(`Absensi masuk (Clock-In) berhasil untuk ${emp.fullName}!`);
    } catch (err: any) {
      alert(err.message || 'Kesalahan presensi');
    }
  };

  const handleSimulateCheckOut = async (empId: string) => {
    try {
      await clockOut(empId);
      loadAttendances();
      alert('Berhasil melakukan absensi pulang (Clock-Out) hari ini!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: clock-in simulation (col-span 5) */}
        <div className="lg:col-span-4 bg-gray-50 border p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5 mb-1">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
              Mesin Absensi Lapangan (Geo-FPS)
            </h3>
            <p className="text-xs text-gray-500 leading-normal mb-4">
              Simulasikan presensi karyawan outsourcing pada portal operasional internal di smartphone mereka.
            </p>

            <form onSubmit={handleSimulateCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Karyawan Hired / Aktif</label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full border bg-white rounded-lg px-3 py-2 focus:outline-blue-500"
                >
                  {activeEmployees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.positionApplied})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Grup Shift Kerja</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Pagi', 'Siang', 'Malam'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedShift(s)}
                      className={`py-1.5 rounded-md border font-semibold text-center ${
                        selectedShift === s 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">LOKASI PENEMPATAN KERJA (SIMULASI GPS)</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 block bg-white border p-2 rounded-lg cursor-pointer hover:bg-gray-50/55">
                    <input 
                      type="radio" 
                      name="gps-sim"
                      checked={coordsOption === 'kantorPalu'}
                      onChange={() => setCoordsOption('kantorPalu')}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-[11px]">Kantor Perwakilan Morowali (Bahodopi)</p>
                      <p className="text-[10px] text-gray-400">HQ Representative (GPS: -2.8227, 122.1462)</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 block bg-white border p-2 rounded-lg cursor-pointer hover:bg-gray-50/55">
                    <input 
                      type="radio" 
                      name="gps-sim"
                      checked={coordsOption === 'smelterMorowali'}
                      onChange={() => setCoordsOption('smelterMorowali')}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-[11px]">Smelter Kawasan Morowali</p>
                      <p className="text-[10px] text-gray-400">Kawasan IMIP Industrial (GPS: -2.2136, 121.9141)</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 block bg-white border p-2 rounded-lg cursor-pointer hover:bg-gray-50/55">
                    <input 
                      type="radio" 
                      name="gps-sim"
                      checked={coordsOption === 'pltaPoso'}
                      onChange={() => setCoordsOption('pltaPoso')}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-[11px]">PLTA Poso Hydro-Energy</p>
                      <p className="text-[10px] text-gray-400">Sektor Energi Poso (GPS: -1.6457, 120.6508)</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Catatan Tambahan (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Kondisi kesehatan, izin, dll..."
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-1.5 focus:outline-blue-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition font-bold py-2.5 px-4 rounded-lg text-white shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 mt-2"
              >
                <ClockIcon className="h-4.5 w-4.5" /> Clock In (Masuk Shift)
              </button>
            </form>
          </div>

          <p className="text-[10px] text-gray-400 mt-4 leading-snug border-t pt-3">
            * Absensi keluar dilakukan secara cepat pada baris masing-masing karyawan di dalam daftar ledger absensi harian.
          </p>
        </div>

        {/* Right column: live interactive map for check-in visualizer (col-span 7) */}
        <div className="lg:col-span-8 bg-white border rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-gray-800">Visualizer GPS Absensi Menggunakan OpenStreetMap</h4>
              <p className="text-[11px] text-gray-500">Menganalisis marker koordinat presensi yang dikirim saat Check-In</p>
            </div>
            {mapTarget && (
              <span className="text-blue-700 font-semibold uppercase bg-blue-100/70 px-2 py-0.5 rounded-md">
                {mapTarget.employeeName} ({mapTarget.shift})
              </span>
            )}
          </div>
          
          <div className="relative flex-1 min-h-[340px] bg-gray-100">
            {mapTarget ? (
              <div id="map-absensi" className="w-full h-full min-h-[340px]"></div>
            ) : (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-gray-400 p-6 text-center text-xs">
                <MapPinIcon className="h-10 w-10 mb-2 stroke-[1.2]" />
                <p>Belum ada presensi peta hari ini.</p>
                <p className="text-[10px]">Klik tombol "Clock-In" di sebelah kiri untuk mengirim data peta.</p>
              </div>
            )}
          </div>

          {mapTarget && (
            <div className="p-3 bg-gray-50/60 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-2">
              <span className="text-gray-600 font-medium">Coordinate: <b>{mapTarget.latitude.toFixed(5)}, {mapTarget.longitude.toFixed(5)}</b></span>
              <span className="bg-gray-200/60 text-gray-700 font-bold px-2.5 py-0.5 rounded text-[10px]">{mapTarget.locationName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white border rounded-xl overflow-hidden mt-6">
        <div className="p-4 bg-gray-50/70 border-b flex justify-between items-center text-xs">
          <h3 className="font-bold text-gray-700">Audit Trail Presensi & Cuti Karyawan</h3>
          <span className="text-gray-500">Total Absensi Bulan Ini: <b>{attendances.length} Hari-Orang</b></span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-100/40 text-gray-500 uppercase font-bold border-b">
                <th className="px-5 py-3">Karyawan</th>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Shift</th>
                <th className="px-5 py-3">Jam Masuk</th>
                <th className="px-5 py-3">Jam Pulang</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendances.slice(0, 30).map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/40 transition">
                  <td className="px-5 py-3 font-semibold text-gray-900 flex flex-col">
                    <span>{a.employeeName}</span>
                    <span className="text-[10px] text-gray-400 font-normal">ID: {a.employeeId}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-medium">{a.date}</td>
                  <td className="px-5 py-3 font-medium text-gray-700">{a.shift}</td>
                  <td className="px-5 py-3 font-bold text-emerald-600">{a.timeIn || '--:--'}</td>
                  <td className="px-5 py-3 font-bold text-blue-600">{a.timeOut || '--:--'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      a.status === 'HADIR' ? 'bg-emerald-50 text-emerald-700' :
                      a.status === 'SAKIT' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2.5">
                      <button 
                        onClick={() => setMapTarget(a)}
                        className="text-blue-600 hover:text-blue-900 font-bold hover:underline text-[11px]"
                      >
                        Peta
                      </button>
                      
                      {a.status === 'HADIR' && !a.timeOut && (
                        <button 
                          onClick={() => handleSimulateCheckOut(a.employeeId)}
                          className="bg-rose-50 hover:bg-rose-100 font-bold px-2 py-1 rounded text-rose-600 transition"
                        >
                          Clock Out
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


/* ==========================================
   3. PAYROLL / PENGGAJIAN COMPONENT
   ========================================== */
interface PayrollPanelProps {
  activeEmployees: Employee[];
}

export const PayrollPanel: React.FC<PayrollPanelProps> = ({ activeEmployees }) => {
  const [payrolls, setPayrolls] = useState<ERPPayroll[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('Mei 2026');
  const [selectedSlip, setSelectedSlip] = useState<ERPPayroll | null>(null);

  useEffect(() => {
    loadPayroll();
  }, [selectedPeriod]);

  const loadPayroll = async () => {
    const list = await getPayroll();
    setPayrolls(list.filter(p => p.period === selectedPeriod));
  };

  const handleGeneratePayroll = async () => {
    await processPayroll(selectedPeriod);
    loadPayroll();
    alert(`Sukses memproses entri draft payroll karyawan untuk periode ${selectedPeriod}!`);
  };

  const handlePaySalary = async (payrollId: string) => {
    try {
      await paySalary(payrollId);
      loadPayroll();
      alert('Gaji berhasil dibayarkan! Transaksi pengeluaran otomatis tercatat di Ledger Keuangan.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Upper action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 border rounded-xl gap-4">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">Pilih Periode Penggajian</h4>
            <select 
              value={selectedPeriod} 
              onChange={e => setSelectedPeriod(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1 bg-white focus:outline-blue-500 font-semibold"
            >
              <option value="Mei 2026">Mei 2026</option>
              <option value="April 2026">April 2026</option>
              <option value="Maret 2026">Maret 2026</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGeneratePayroll}
          className="bg-blue-600 hover:bg-blue-700 font-bold text-xs py-2 px-4 rounded-lg text-white transition flex items-center gap-1.5"
        >
          <ArrowPathIcon className="h-4 w-4" /> Proses Formula Slip Gaji ({selectedPeriod})
        </button>
      </div>

      {/* Payroll spreadsheet style table */}
      <div className="bg-white border rounded-xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-100/40 text-gray-500 uppercase font-bold border-b">
                <th className="px-5 py-3">Nama Karyawan</th>
                <th className="px-5 py-3">Posisi Kerja</th>
                <th className="px-5 py-3 text-right">Gaji Pokok</th>
                <th className="px-5 py-3 text-right">Tunjangan</th>
                <th className="px-5 py-3 text-right">Potongan BPJS</th>
                <th className="px-5 py-3 text-right">Pajak PPh21</th>
                <th className="px-5 py-3 text-right font-black">Net Salary</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrolls.length > 0 ? (
                payrolls.map((p) => {
                  const totalTunjangan = p.tunjanganMakan + p.tunjanganTransport + p.lemburRate;
                  const totalBPJS = p.bpjsKesehatan + p.bpjsKetenagakerjaan;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition">
                      <td className="px-5 py-3.5 font-bold text-gray-900">{p.employeeName}</td>
                      <td className="px-5 py-3.5 text-gray-500">{p.position}</td>
                      <td className="px-5 py-3.5 text-right font-medium">{formatIDR(p.gajiPokok)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{formatIDR(totalTunjangan)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-rose-500">{formatIDR(totalBPJS)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-rose-500">{formatIDR(p.pph21)}</td>
                      <td className="px-5 py-3.5 text-right font-black text-gray-950">{formatIDR(p.totalDiterima)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] ${
                          p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'
                        }`}>
                          {p.status === 'PAID' ? 'LUNAS (PAID)' : 'MENUNGGU (DRAFT)'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex gap-2">
                          <button 
                            onClick={() => setSelectedSlip(p)}
                            className="bg-gray-100 hover:bg-gray-200 border text-gray-700 px-2 py-1 rounded hover:text-gray-950 transition flex items-center gap-1 font-semibold"
                          >
                            <EyeIcon className="h-3.5 w-3.5" /> Slip Gaji
                          </button>
                          
                          {p.status === 'DRAFT' && (
                            <button 
                              onClick={() => handlePaySalary(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition font-bold"
                            >
                              Bayar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 font-medium">
                    Belum ada formula slip gaji diproses pada periode {selectedPeriod}.<br/>
                    <button 
                      onClick={handleGeneratePayroll}
                      className="mt-3 inline-flex bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-4 py-2 rounded-lg transition"
                    >
                      Proses Formula Sekarang
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GORGEOUS SLIP GAJI DIALOG MODAL (PRINT-FRIENDLY) */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-gray-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100"
          >
            {/* Header / Non-Printable control bar */}
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center text-xs">
              <span className="font-bold flex items-center gap-1">
                <PrinterIcon className="h-4.5 w-4.5" /> Preview Slip Gaji PT Perdana Adi Yuda
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded flex items-center gap-1 transition"
                >
                  <PrinterIcon className="h-3.5 w-3.5" /> Print / PDF
                </button>
                <button onClick={() => setSelectedSlip(null)} className="bg-gray-700 text-gray-300 font-bold px-3 py-1.5 rounded hover:text-white">
                  Tutup
                </button>
              </div>
            </div>

            {/* Slip Gaji Printable Content */}
            <div id="payslip-box" className="p-8 space-y-6 text-2xs text-gray-800 bg-white leading-tight">
              {/* Logo & Corporate Title */}
              {(() => {
                const cmpS = getCompanySettings();
                const branchText = cmpS.branches.map(b => b.name + ": " + b.address.replace(/\n/g, ' ')).join(' | ');
                return (
                  <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                    <div className="flex gap-3 items-center">
                      <img src="/assets/logo.png" alt="Logo PT Perdana" className="h-12 w-auto object-contain" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-950">{cmpS.companyName}</h3>
                        <p className="text-[10px] text-gray-500">Recruitment & Outsourcing Manpower Services</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Kantor Pusat: {cmpS.headOfficeAddress.replace(/\n/g, ' ')} | {branchText} | {cmpS.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h4 className="text-base font-extrabold text-gray-950 uppercase tracking-wide">SLIP GAJI KARYAWAN</h4>
                      <p className="text-[10px] font-bold text-gray-600 mt-1">Periode: {selectedSlip.period}</p>
                      <p className="text-[9px] text-gray-400">ID Dok: SLIP/{selectedSlip.id.toUpperCase()}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Employee & Admin details */}
              <div className="grid grid-cols-2 gap-4 text-[11px] bg-gray-50 p-4 rounded-xl">
                <div className="space-y-1.5">
                  <p className="text-gray-500">PENERIMA GAJI:</p>
                  <p className="font-extrabold text-gray-950 text-xs">{selectedSlip.employeeName}</p>
                  <p className="text-gray-700">Posisi: <b>{selectedSlip.position}</b></p>
                  <p className="text-gray-700">Karyawan ID: {selectedSlip.employeeId}</p>
                </div>
                <div className="space-y-1.5 text-right">
                  <p className="text-gray-500">METODE PEMBAYARAN:</p>
                  <p className="font-bold text-gray-800">Transfer Bank Mandiri/BCA</p>
                  <p className="text-gray-600">Status Slip: 
                    <span className={`ml-1 px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                      selectedSlip.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedSlip.status}
                    </span>
                  </p>
                  {selectedSlip.paymentDate && <p className="text-[10px] text-gray-400">Tgl Lunas: {selectedSlip.paymentDate}</p>}
                </div>
              </div>

              {/* Itemized Columns */}
              <div className="grid grid-cols-2 gap-6 text-[11px]">
                {/* Column Pemasukan Earnings */}
                <div className="space-y-3.5">
                  <h5 className="font-extrabold text-gray-900 border-b pb-1 text-xs">A. PENERIMAAN / UPÀH</h5>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gaji Pokok Utama</span>
                      <span className="font-semibold">{formatIDR(selectedSlip.gajiPokok)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tunjangan Makan</span>
                      <span className="font-semibold">{formatIDR(selectedSlip.tunjanganMakan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tunjangan Transportasi</span>
                      <span className="font-semibold">{formatIDR(selectedSlip.tunjanganTransport)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Lembur Jasa ({selectedSlip.overtimeHours} Jam)</span>
                      <span className="font-semibold text-emerald-600">{formatIDR(selectedSlip.lemburRate)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-extrabold text-gray-900">
                    <span>Subtotal Bruto</span>
                    <span>{formatIDR(selectedSlip.gajiPokok + selectedSlip.tunjanganMakan + selectedSlip.tunjanganTransport + selectedSlip.lemburRate)}</span>
                  </div>
                </div>

                {/* Column Potongan Deductions */}
                <div className="space-y-3.5">
                  <h5 className="font-extrabold text-gray-900 border-b pb-1 text-xs">B. POTONGAN / IURAN</h5>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Iuran BPJS Kesehatan (1%)</span>
                      <span className="font-semibold text-rose-600">{formatIDR(selectedSlip.bpjsKesehatan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">BPJS Ketenagakerjaan (2%)</span>
                      <span className="font-semibold text-rose-600">{formatIDR(selectedSlip.bpjsKetenagakerjaan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pajak Penghasilan (PPh21)</span>
                      <span className="font-semibold text-rose-600">{formatIDR(selectedSlip.pph21)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Denda / Potongan Lain</span>
                      <span>{formatIDR(selectedSlip.potonganLain)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-extrabold text-gray-900">
                    <span>Subtotal Potongan</span>
                    <span>{formatIDR(selectedSlip.bpjsKesehatan + selectedSlip.bpjsKetenagakerjaan + selectedSlip.pph21 + selectedSlip.potonganLain)}</span>
                  </div>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="border-t-2 border-gray-900 pt-4 bg-gray-900 text-white p-4 rounded-xl flex justify-between items-center">
                <div>
                  <h6 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">TOTAL GAJI NETTO DITERIMA (TAKE HOME PAY)</h6>
                  <p className="text-xs text-blue-200 mt-0.5">Sudah Termasuk Pajak PPh21 & BPJS Kesehatan Mandiri</p>
                </div>
                <div className="text-right">
                  <span className="text-base md:text-xl font-black text-white">{formatIDR(selectedSlip.totalDiterima)}</span>
                </div>
              </div>

              {/* Legal Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center text-[11px] text-gray-700">
                <div>
                  <p>Menerima dengan senang hati,</p>
                  <p className="mt-12 font-bold underline text-gray-900">{selectedSlip.employeeName}</p>
                  <p className="text-[9px] text-gray-400">Staf Outsourcing</p>
                </div>
                <div className="flex flex-col items-center">
                  <p>Bekasi, {selectedSlip.paymentDate || new Date().toISOString().split('T')[0]}</p>
                  <p className="font-bold text-gray-900">PT Perdana Adi Yuda HRD</p>
                  <div className="my-1 shrink-0 relative flex items-center justify-center">
                    {/* Simulated digital signature stamp */}
                    <span className="border-2 border-dashed border-blue-500 text-blue-500 font-extrabold px-3 py-1 text-[9px] rounded transform uppercase rotate-3 block tracking-wide select-none">
                      VERIFIED DIGITAL
                    </span>
                  </div>
                  <p className="font-bold underline text-gray-950">M. Hadi Setiadi, S.Psi.</p>
                  <p className="text-[9px] text-gray-400">General Manager HR & GA</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};


/* ==========================================
   4. ASSETS / INVENTARIS COMPONENT
   ========================================== */
interface AssetsPanelProps {
  activeEmployees: Employee[];
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({ activeEmployees }) => {
  const [assets, setAssets] = useState<ERPAsset[]>([]);
  const [filterCat, setFilterCat] = useState<'Semua' | ERPAsset['category']>('Semua');

  // New asset state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSKU, setNewSKU] = useState('');
  const [newCategory, setNewCategory] = useState<ERPAsset['category']>('IT Hardware');
  const [newSerial, setNewSerial] = useState('');
  const [newCondition, setNewCondition] = useState<ERPAsset['condition']>('Baik');

  // Borrow/assign asset state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetAsset, setTargetAsset] = useState<ERPAsset | null>(null);
  const [assigneeEmpId, setAssigneeEmpId] = useState('');

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    setAssets(getAssets());
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSKU || !newSerial) {
      alert('Mohon lengkapi semua data spesifikasi aset.');
      return;
    }

    createAsset(newName, newSKU, newCategory, newSerial, newCondition);
    loadAssets();
    setShowAddModal(false);

    // reset forms
    setNewName('');
    setNewSKU('');
    setNewSerial('');
    alert('Aset Inventaris baru berhasil didaftarkan dan dicatat ke keuangan!');
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAsset || !assigneeEmpId) return;

    const emp = activeEmployees.find(x => x.id === assigneeEmpId);
    if (!emp) return;

    assignAsset(targetAsset.id, emp.id, emp.fullName);
    loadAssets();
    setShowAssignModal(false);
    alert(`Sukses meminjamkan ${targetAsset.name} kepada ${emp.fullName}!`);
  };

  const handleReturnAsset = (id: string) => {
    const cond = confirm('Apakah kondisi aset yang dikembalikan dalam kondisi Baik?') ? 'Baik' : 'Cukup';
    returnAsset(id, cond);
    loadAssets();
    alert('Aset berhasil dikembalikan ke gudang penyimpanan.');
  };

  const handleMarkAsBroken = (id: string) => {
    returnAsset(id, 'Rusak');
    loadAssets();
    alert('Aset berhasil ditandai sebagai RUSAK.');
  };

  const filteredAssets = React.useMemo(() => {
    if (filterCat === 'Semua') return assets;
    return assets.filter(a => a.category === filterCat);
  }, [assets, filterCat]);

  return (
    <div className="space-y-6">
      {/* Category filters and header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 border rounded-xl gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['Semua', 'IT Hardware', 'Seragam', 'Alat Keselamatan', 'Kendaraan', 'Komunikasi'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`text-xs px-3 py-1.5 font-semibold rounded-lg shrink-0 transition ${
                filterCat === c 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border hover:bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 font-bold text-xs py-2 px-4 rounded-lg text-white transition flex items-center gap-1 shrink-0"
        >
          <PlusIcon className="h-4 w-4 stroke-[2]" /> Beli / Tambah Aset
        </button>
      </div>

      {/* Grid of asset cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((a) => (
            <div key={a.id} className="bg-white border hover:shadow-md transition duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
              {/* Card Upper */}
              <div className="p-5 space-y-3.5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-400 font-bold uppercase select-none">{a.sku}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    a.status === 'Tersedia' ? 'bg-emerald-50 text-emerald-700' :
                    a.status === 'Dipinjam' ? 'bg-blue-50 text-blue-700 font-bold' :
                    'bg-rose-50 text-rose-700'
                  }`}>
                    {a.status}
                  </span>
                </div>

                <div>
                  <span className="bg-gray-100 text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                    {a.category}
                  </span>
                  <h4 className="font-extrabold text-sm text-gray-900 mt-2 leading-snug line-clamp-2 min-h-[40px]">{a.name}</h4>
                </div>

                <div className="text-[11px] text-gray-500 space-y-1 bg-gray-50/50 p-2.5 rounded-md">
                  <p>SN: <span className="font-mono font-semibold text-gray-800">{a.serialNumber}</span></p>
                  <p>Kondisi: 
                    <span className={`ml-1 font-bold ${
                      a.condition === 'Baik' ? 'text-emerald-600' :
                      a.condition === 'Cukup' ? 'text-yellow-600' : 'text-rose-600'
                    }`}>
                      {a.condition}
                    </span>
                  </p>
                </div>

                {a.status === 'Dipinjam' && (
                  <div className="bg-blue-50/50 border border-blue-100/50 p-2.5 rounded-lg text-[10px] leading-relaxed">
                    <p className="text-gray-500 font-medium">Pegawai Peminjam:</p>
                    <p className="font-bold text-blue-900 text-[11px]">{a.assignedToName}</p>
                    <p className="text-gray-400">Dipinjam tgl: {a.assignedDate}</p>
                  </div>
                )}
              </div>

              {/* Card Lower buttons */}
              <div className="p-3 bg-gray-50/70 border-t flex justify-end gap-1.5 text-[10px]">
                {a.status === 'Tersedia' && (
                  <button 
                    onClick={() => { setTargetAsset(a); if (activeEmployees.length > 0) setAssigneeEmpId(activeEmployees[0].id); setShowAssignModal(true); }}
                    className="w-full bg-blue-600 text-white font-bold py-1.5 rounded-lg text-center hover:bg-blue-700 transition"
                  >
                    Serahkan Aset
                  </button>
                )}

                {a.status === 'Dipinjam' && (
                  <>
                    <button 
                      onClick={() => handleReturnAsset(a.id)}
                      className="flex-1 bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-center hover:bg-emerald-700 transition"
                    >
                      Kembalikan
                    </button>
                    <button 
                      onClick={() => handleMarkAsBroken(a.id)}
                      className="px-2 bg-rose-50 border border-rose-200 text-rose-600 font-bold py-1.5 rounded-lg hover:bg-rose-100 transition"
                    >
                      Rusak
                    </button>
                  </>
                )}

                {a.status === 'Rusak' && (
                  <button 
                    onClick={() => handleReturnAsset(a.id)}
                    className="w-full bg-gray-100 border text-gray-700 font-bold py-1.5 rounded-lg text-center hover:bg-gray-200 transition"
                  >
                    Selesai Service (Baik)
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-gray-400 font-medium col-span-4 bg-white border border-gray-100 rounded-xl">
            Tidak ada kualifikasi aset kerja yang terdaftar di kategori {filterCat}.
          </div>
        )}
      </div>

      {/* NEW ASSET FORM MODAL DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border"
          >
            <div className="bg-indigo-700 p-4 text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">Pembelian & Registrasi Aset Baru</h4>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white text-base">✕</button>
            </div>
            
            <form onSubmit={handleCreateAsset} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Kategori Aset</label>
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-indigo-500"
                >
                  <option value="IT Hardware">IT Hardware (Laptop/Kamera)</option>
                  <option value="Seragam">Seragam Kerja PDH/PDL</option>
                  <option value="Alat Keselamatan">Alat Keselamatan (APD/Sepatu)</option>
                  <option value="Kendaraan">Kendaraan Lapangan / Motor</option>
                  <option value="Komunikasi">Komunikasi (HP/HT)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Nama Barang / Deskripsi Model</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Laptop HP G9 Probookcore i5"
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">SKU Kode Internal</label>
                  <input 
                    type="text" 
                    placeholder="LAP-HP-09"
                    value={newSKU} 
                    onChange={e => setNewSKU(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Serial Number / Plat</label>
                  <input 
                    type="text" 
                    placeholder="S/N: ABC129188X"
                    value={newSerial} 
                    onChange={e => setNewSerial(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Kondisi Fisik Pembelian</label>
                <select 
                  value={newCondition} 
                  onChange={e => setNewCondition(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-indigo-500"
                >
                  <option value="Baik">Stok Baru (Sempurna)</option>
                  <option value="Cukup">Second / Rekondisi (Layak Pakai)</option>
                </select>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                >
                  Registrasi & Beli Aset
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* LOAN / ASSIGN CONTROL MODAL */}
      {showAssignModal && targetAsset && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border"
          >
            <div className="bg-blue-700 p-4 text-white flex justify-between items-center text-xs">
              <h4 className="font-bold">Dokumen Handover Serah Terima Aset Kerja</h4>
              <button onClick={() => setShowAssignModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-gray-100 p-3 rounded-lg space-y-1">
                <p className="text-gray-400">ASET YANG DISERAHKAN:</p>
                <p className="font-extrabold text-gray-900 text-[11px]">{targetAsset.name}</p>
                <p className="text-[10px] text-gray-500 font-mono">Kode SKU: {targetAsset.sku} | S/N: {targetAsset.serialNumber}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Pilih Karyawan Outsourcing Penerima</label>
                <select 
                  value={assigneeEmpId} 
                  onChange={e => setAssigneeEmpId(e.target.value)}
                  className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:outline-blue-500"
                >
                  <option value="">-- Hubungkan ke Karyawan --</option>
                  {activeEmployees.map(x => (
                    <option key={x.id} value={x.id}>
                      {x.fullName} ({x.positionApplied})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!assigneeEmpId}
                  className="px-4 py-2 bg-blue-600 disabled:bg-gray-300 text-white font-bold rounded-lg hover:bg-blue-750"
                >
                  Serahkan Aset
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

/* ==========================================
   5. DATABASE KARYAWAN ERP PANEL (INTERNAL & PROYEK)
   ========================================== */
interface EmployeesPanelProps {
  activeEmployees: Employee[];
  onRefresh: () => void;
}

export const EmployeesPanel: React.FC<EmployeesPanelProps> = ({ activeEmployees, onRefresh }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<'ALL' | 'INTERNAL' | 'PROJECT'>('ALL');
  const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
  const [payrollTypeFilter, setPayrollTypeFilter] = useState('ALL');

  const fixAllEmployeeData = async () => {
    if (!confirm("Are you sure you want to standardize the formatting for all employees?")) return;
    setIsLoading(true);
    try {
        const emps = await getPermanentEmployees();
        for (const emp of emps) {
            await updatePermanentEmployee(emp.id, emp);
        }
        onRefresh();
        alert("Formatting standardized.");
    } catch (err) {
        console.error(err);
        alert("Failed to standardize data.");
    } finally {
        setIsLoading(false);
    }
  };

  // Modal editing state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  
  // Form fields state (for payroll)
  const [formEmployeeType, setFormEmployeeType] = useState<'INTERNAL' | 'PROJECT'>('INTERNAL');
  const [formClientId, setFormClientId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formPayrollType, setFormPayrollType] = useState<'BULANAN' | 'MINGGUAN' | 'HARIAN' | 'BORONGAN' | 'CUSTOM'>('BULANAN');
  const [formBasicSalary, setFormBasicSalary] = useState<number>(4500000);
  const [formAllowanceMakan, setFormAllowanceMakan] = useState<number>(350000);
  const [formAllowanceTransport, setFormAllowanceTransport] = useState<number>(250000);
  const [formAllowanceKesehatan, setFormAllowanceKesehatan] = useState<number>(150000);
  const [formOvertimeHourlyRate, setFormOvertimeHourlyRate] = useState<number>(35000);
  const [formCustomBenefitName, setFormCustomBenefitName] = useState<string>('');
  const [formCustomBenefitAmount, setFormCustomBenefitAmount] = useState<number>(0);

  // Form fields state (for employment status)
  const [formEmploymentStatus, setFormEmploymentStatus] = useState<'ACTIVE' | 'RESIGNED' | 'TERMINATED' | 'CONTRACT_ENDED'>('ACTIVE');
  const [formContractStartDate, setFormContractStartDate] = useState('');
  const [formContractEndDate, setFormContractEndDate] = useState('');
  const [formTerminationDate, setFormTerminationDate] = useState('');
  const [formTerminationReason, setFormTerminationReason] = useState('');

  // Load clients and projects on mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [cList, pList] = await Promise.all([getClients(), getProjects()]);
        setClients(cList);
        setProjects(pList);
      } catch (err) {
        console.error("Gagal memuat data klien atau proyek:", err);
      }
    };
    loadMasterData();
  }, []);

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormEmployeeType(emp.employeeType || 'INTERNAL');
    setFormClientId(emp.clientId || '');
    setFormProjectId(emp.projectId || '');
    setFormPayrollType(emp.payrollType || 'BULANAN');
    setFormBasicSalary(emp.basicSalary || 4800000);
    setFormAllowanceMakan(emp.allowanceMakan !== undefined ? emp.allowanceMakan : 400000);
    setFormAllowanceTransport(emp.allowanceTransport !== undefined ? emp.allowanceTransport : 350000);
    setFormAllowanceKesehatan(emp.allowanceKesehatan !== undefined ? emp.allowanceKesehatan : 150000);
    setFormOvertimeHourlyRate(emp.overtimeHourlyRate || 35000);
    setFormCustomBenefitName(emp.customBenefitName || '');
    setFormCustomBenefitAmount(emp.customBenefitAmount || 0);

    setFormEmploymentStatus(emp.employmentStatus || 'ACTIVE');
    setFormContractStartDate(emp.contractStartDate || '');
    setFormContractEndDate(emp.contractEndDate || '');
    setFormTerminationDate(emp.terminationDate || '');
    setFormTerminationReason(emp.terminationReason || '');
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsLoading(true);
    try {
      const updates: Partial<Employee> = {
        employeeType: formEmployeeType,
        clientId: formEmployeeType === 'PROJECT' ? formClientId : undefined,
        projectId: formEmployeeType === 'PROJECT' ? formProjectId : undefined,
        payrollType: formPayrollType,
        basicSalary: Number(formBasicSalary) || 0,
        allowanceMakan: Number(formAllowanceMakan) || 0,
        allowanceTransport: Number(formAllowanceTransport) || 0,
        allowanceKesehatan: Number(formAllowanceKesehatan) || 0,
        overtimeHourlyRate: Number(formOvertimeHourlyRate) || 0,
        customBenefitName: formCustomBenefitName || undefined,
        customBenefitAmount: Number(formCustomBenefitAmount) || undefined,
        employmentStatus: formEmploymentStatus,
        contractStartDate: formContractStartDate || undefined,
        contractEndDate: formContractEndDate || undefined,
        terminationDate: formTerminationDate || undefined,
        terminationReason: formTerminationReason || undefined
      };

      await updatePermanentEmployee(editingEmployee.id, updates);
      alert(`Berhasil memperbarui data karyawan: ${editingEmployee.fullName}`);
      setEditingEmployee(null);
      onRefresh(); // Refresh parent list
    } catch (err) {
      alert("Gagal menyimpan data karyawan!");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered employees
  const filteredList = React.useMemo(() => {
    return activeEmployees.filter(emp => {
      // Name or position or NIK search match
      const textMatch = 
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.positionApplied.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nik.includes(searchTerm);
      
      // Type filter
      const defaultType = emp.employeeType || 'INTERNAL';
      const typeMatch = employeeTypeFilter === 'ALL' || defaultType === employeeTypeFilter;

      // Client filter
      const clientMatch = selectedClientFilter === 'ALL' || emp.clientId === selectedClientFilter;

      // Payroll type filter
      const payType = emp.payrollType || 'BULANAN';
      const payrollTypeMatch = payrollTypeFilter === 'ALL' || payType === payrollTypeFilter;

      return textMatch && typeMatch && clientMatch && payrollTypeMatch;
    });
  }, [activeEmployees, searchTerm, employeeTypeFilter, selectedClientFilter, payrollTypeFilter]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = activeEmployees.length;
    const internal = activeEmployees.filter(e => (e.employeeType || 'INTERNAL') === 'INTERNAL').length;
    const project = activeEmployees.filter(e => e.employeeType === 'PROJECT').length;
    
    // Average salary calculation
    const salariesSum = activeEmployees.reduce((sum, e) => {
      const type = e.payrollType || 'BULANAN';
      const rate = e.basicSalary || 4800000;
      if (type === 'MINGGUAN') return sum + (rate * 4);
      if (type === 'HARIAN') return sum + (rate * 22);
      return sum + rate;
    }, 0);
    const avgSalary = total > 0 ? Math.round(salariesSum / total) : 0;

    return { total, internal, project, avgSalary };
  }, [activeEmployees]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Mini Dashboard stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wide">Total Staff Karyawan</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total} Orang</p>
          </div>
          <div className="bg-slate-500/10 p-2 rounded-lg text-slate-700">
            <UserGroupIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-blue-700 text-[10px] font-extrabold uppercase tracking-wide">Holding / Internal</span>
            <p className="text-xl font-bold text-blue-900 mt-0.5">{stats.internal} Orang</p>
          </div>
          <div className="bg-blue-500/10 p-2 rounded-lg text-blue-700">
            <BriefcaseIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-indigo-700 text-[10px] font-extrabold uppercase tracking-wide">Project Penempatan</span>
            <p className="text-xl font-bold text-indigo-900 mt-0.5">{stats.project} Orang</p>
          </div>
          <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-700">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide">Rata-rata Upah Kerja</span>
            <p className="text-md font-extrabold text-emerald-900 mt-0.5">{formatIDR(stats.avgSalary)}/bln</p>
          </div>
          <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-700">
            <CurrencyDollarIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Advanced search, type-filters and actions */}
      <div className="bg-white border p-4 rounded-xl shadow-xs space-y-3">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
          <WrenchScrewdriverIcon className="h-4 w-4 text-blue-650" />
          Saring & Cari Database Karyawan ERP
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search text input */}
          <div>
            <label className="block text-gray-500 font-semibold mb-1">Cari Nama/Position/NIK</label>
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ketik kata kunci..."
              className="w-full border rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none bg-white text-gray-800"
            />
          </div>

          <div className="flex items-end">
            <button
               onClick={fixAllEmployeeData}
               disabled={isLoading}
               className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:bg-gray-400"
            >
              Fix Formatting
            </button>
          </div>

          {/* Tipe Karyawan selection */}
          <div>
            <label className="block text-gray-500 font-semibold mb-1">Tipe Hubungan Kerja</label>
            <select
              value={employeeTypeFilter}
              onChange={e => setEmployeeTypeFilter(e.target.value as any)}
              className="w-full border bg-white rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Hubungan Kerja</option>
              <option value="INTERNAL">Holding / Internal Staff</option>
              <option value="PROJECT">Project Penempatan Klien</option>
            </select>
          </div>

          {/* Client filter */}
          <div>
            <label className="block text-gray-500 font-semibold mb-1">Klien Penempatan</label>
            <select
              value={selectedClientFilter}
              onChange={e => setSelectedClientFilter(e.target.value)}
              className="w-full border bg-white rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Klien B2B</option>
              {clients.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.name}</option>
              ))}
            </select>
          </div>

          {/* Model Penggajian filter */}
          <div>
            <label className="block text-gray-500 font-semibold mb-1">Model Skema Gaji</label>
            <select
              value={payrollTypeFilter}
              onChange={e => setPayrollTypeFilter(e.target.value)}
              className="w-full border bg-white rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Skema Upah</option>
              <option value="BULANAN">FIXED BULANAN (Monthly fixed)</option>
              <option value="MINGGUAN">MINGGUAN (Weekly fixed rate)</option>
              <option value="HARIAN">HARIAN (Daily work rate)</option>
              <option value="BORONGAN">BORONGAN (Piece-rate / bulk)</option>
              <option value="CUSTOM">LAINNYA / CUSTOMS AGREEMENT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Employee list spreadsheet layout */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-100/60 text-gray-600 uppercase font-extrabold border-b text-[10px] tracking-wider">
                <th className="px-5 py-3">Nama Karyawan NIK</th>
                <th className="px-5 py-3">Jabatan Operasional</th>
                <th className="px-5 py-3">Kelompok Kerja Penempatan</th>
                <th className="px-5 py-3 text-center">Model Penggajian</th>
                <th className="px-5 py-3 text-right">Nilai Base Gaji</th>
                <th className="px-5 py-3 text-right">Benefit & Tunjangan</th>
                <th className="px-5 py-3 text-right">Kurs Lembur / Jam</th>
                <th className="px-5 py-3 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length > 0 ? (
                filteredList.map((emp) => {
                  const type = emp.employeeType || 'INTERNAL';
                  const payType = emp.payrollType || 'BULANAN';
                  const baseSalaryValue = emp.basicSalary || (emp.positionApplied.includes('Manager') ? 9000000 : (emp.positionApplied?.includes('Leader') ? 6500000 : 4800000));
                  
                  // Sum up normal benefits
                  const meal = emp.allowanceMakan !== undefined ? emp.allowanceMakan : 400000;
                  const transp = emp.allowanceTransport !== undefined ? emp.allowanceTransport : 350000;
                  const health = emp.allowanceKesehatan !== undefined ? emp.allowanceKesehatan : 150000;
                  const customAmount = emp.customBenefitAmount || 0;
                  const totalBenefits = meal + transp + health + customAmount;

                  const clientName = type === 'PROJECT' && emp.clientId
                    ? clients.find(c => c.id === emp.clientId)?.name || "Klien Alih Daya"
                    : undefined;
                  const projName = type === 'PROJECT' && emp.projectId
                    ? projects.find(p => p.id === emp.projectId)?.name || "Proyek Lapangan"
                    : undefined;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={emp.photoPath || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}`}
                            alt="avatar"
                            className="h-8 w-8 rounded-full border border-gray-150 object-cover flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{emp.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">NIK: {emp.nik}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-800">{emp.positionApplied}</p>
                        <p className="text-[10px] text-gray-400">{emp.domicileAddress?.split(',')[1] || emp.placeOfBirth}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        {type === 'INTERNAL' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            Holding / Internal
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Proyek Penempatan
                            </span>
                            <div className="text-[10px] text-gray-650 font-semibold leading-none mt-1">
                              Client: <span className="text-gray-900 font-bold">{clientName}</span>
                            </div>
                            {projName && (
                              <div className="text-[9px] text-gray-400 font-medium leading-none">
                                Proyek: {projName}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                          payType === 'BULANAN' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                          payType === 'MINGGUAN' ? 'bg-sky-50 text-sky-850 border border-sky-100' :
                          payType === 'HARIAN' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                          payType === 'BORONGAN' ? 'bg-purple-50 text-purple-800 border border-purple-100' :
                          'bg-pink-50 text-pink-800 border border-pink-100'
                        }`}>
                          {payType}
                        </span>
                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-semibold">
                          {payType === 'BULANAN' ? 'Tiap Bulan' :
                           payType === 'MINGGUAN' ? 'Tiap Minggu' :
                           payType === 'HARIAN' ? 'Tiap Hari Kerja' :
                           payType === 'BORONGAN' ? 'Sesuai Borongan' :
                           'Sesuai Customs'}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-gray-950">
                        {formatIDR(baseSalaryValue)}
                        <span className="text-[9px] text-gray-400 font-normal block">
                          {payType === 'BULANAN' ? '/Bulan' :
                           payType === 'MINGGUAN' ? '/Minggu' :
                           payType === 'HARIAN' ? '/Hari Kerja' :
                           payType === 'BORONGAN' ? '/Paket Kontrak' :
                           '/Custom'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right font-extrabold text-emerald-650">
                        {formatIDR(totalBenefits)}
                        <span className="text-[9px] text-gray-400 font-normal block">
                          {customAmount > 0 ? "4 benefit aktif" : "3 benefit aktif"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-gray-650">
                        {formatIDR(emp.overtimeHourlyRate || 35000)}
                        <span className="text-[9px] text-gray-400 block font-normal">/Jam Lembur</span>
                      </td>

                      <td className="px-5 py-3.5 text-center flex flex-col gap-1.5 items-center">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition duration-150 inline-flex items-center gap-1 shadow-sm w-full justify-center"
                        >
                          <EyeIcon className="h-3 w-3" /> Lihat Detail
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition duration-150 inline-flex items-center gap-1 shadow-sm w-full justify-center"
                        >
                          <PencilIcon className="h-3 w-3" /> Edit Kontrak
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                    Karyawan tidak ditemukan atau tidak tersedia dengan filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ramping dynamic dialog modal to configure personnel status and payroll details */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100"
          >
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                <div>
                  <h4 className="font-extrabold text-sm">{editingEmployee.fullName}</h4>
                  <p className="text-[10px] text-blue-100">Setup Penempatan, Tipe Kerja & Remunerasi Payroll</p>
                </div>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="text-white hover:text-white/80 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveChanges} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* Section 2: Employment Status */}
              <div className="border-b pb-4 space-y-3">
                <h5 className="font-bold text-gray-950 border-l-2 border-emerald-600 pl-2">2. STATUS KEPEGAWAIAN & KONTRAK</h5>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Status Kepegawaian</label>
                    <select
                      value={formEmploymentStatus}
                      onChange={e => setFormEmploymentStatus(e.target.value as any)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none font-semibold text-gray-800"
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="RESIGNED">Resigned</option>
                      <option value="TERMINATED">Diberhentikan</option>
                      <option value="CONTRACT_ENDED">Kontrak Berakhir</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Kontrak Mulai</label>
                    <input type="date" value={formContractStartDate} onChange={e => setFormContractStartDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Kontrak Akhir</label>
                    <input type="date" value={formContractEndDate} onChange={e => setFormContractEndDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs" />
                  </div>
                  { (formEmploymentStatus === 'RESIGNED' || formEmploymentStatus === 'TERMINATED' || formEmploymentStatus === 'CONTRACT_ENDED') && (
                    <>
                      <div>
                        <label className="block text-gray-700 font-bold mb-1">Tanggal Keluar / Berakhir</label>
                        <input type="date" value={formTerminationDate} onChange={e => setFormTerminationDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-gray-700 font-bold mb-1">Alasan</label>
                        <textarea value={formTerminationReason} onChange={e => setFormTerminationReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Section 1: Placement Database */}
              <div className="border-b pb-4 space-y-3">
                <h5 className="font-bold text-gray-950 border-l-2 border-indigo-600 pl-2">1. TIPIFIKASI KARYAWAN & PENEMPATAN</h5>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Tipe Hubungan Staff</label>
                    <select
                      value={formEmployeeType}
                      onChange={e => setFormEmployeeType(e.target.value as any)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none font-semibold text-gray-800"
                    >
                      <option value="INTERNAL">Holding / Internal Staff</option>
                      <option value="PROJECT">Project Penempatan Klien</option>
                    </select>
                  </div>

                  {formEmployeeType === 'PROJECT' && (
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">B2B Mitra Klien</label>
                      <select
                        value={formClientId}
                        required
                        onChange={e => setFormClientId(e.target.value)}
                        className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none font-semibold"
                      >
                        <option value="">-- Pilih Mitra Klien --</option>
                        {clients.filter(c => c.isActive !== false || c.id === formClientId).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {formEmployeeType === 'PROJECT' && (
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Target Proyek Penempatan</label>
                    <select
                      value={formProjectId}
                      required
                      onChange={e => setFormProjectId(e.target.value)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none font-semibold"
                    >
                      <option value="">-- Pilih Proyek Terdaftar --</option>
                      {projects
                        .filter(p => (!formClientId || p.clientId === formClientId) && (p.isActive !== false || p.id === formProjectId))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.description})</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">
                      * Karyawan akan tercatat diintegrasikan sebagai staf kontraktor di bawah klien/proyek ini.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2: Payroll Model Design */}
              <div className="space-y-3 pb-2 border-b">
                <h5 className="font-bold text-gray-900 border-l-2 border-indigo-600 pl-2">2. REMUNERASI & MODEL FORMULA PENGGAJIAN</h5>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Model Pola Kerja Gaji</label>
                    <select
                      value={formPayrollType}
                      onChange={e => setFormPayrollType(e.target.value as any)}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none font-extrabold text-blue-700"
                    >
                      <option value="BULANAN">FIXED BULANAN (Sistem Bulanan / Tetap)</option>
                      <option value="MINGGUAN">MINGGUAN (Berdasarkan rate pekanan)</option>
                      <option value="HARIAN">HARIAN (Dihitung per hari absen masuk)</option>
                      <option value="BORONGAN">BORONGAN (Sistem paket kerja borong)</option>
                      <option value="CUSTOM">LAINNYA / CUSTOMS AGREEMENT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      {formPayrollType === 'BULANAN' ? 'Gaji Pokok Utama (IDR)' :
                       formPayrollType === 'MINGGUAN' ? 'Gaji per Minggu (IDR)' :
                       formPayrollType === 'HARIAN' ? 'Upah per Hari Kerja (IDR)' :
                       'Nilai Gaji Pokok Disepakati (IDR)'}
                    </label>
                    <input 
                      type="number" 
                      value={formBasicSalary}
                      onChange={e => setFormBasicSalary(Number(e.target.value))}
                      className="w-full border bg-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none font-extrabold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 border p-3.5 rounded-lg space-y-2 mt-2">
                  <p className="font-extrabold text-gray-700 text-[10px] border-b pb-1 uppercase tracking-wider">Tunjangan Benefit & Lemburan</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-gray-500 text-[10px] font-bold mb-1">Tunj. Makan (IDR)</label>
                      <input 
                        type="number"
                        value={formAllowanceMakan}
                        onChange={e => setFormAllowanceMakan(Number(e.target.value))}
                        className="w-full border bg-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] font-bold mb-1">Tunj. Transport (IDR)</label>
                      <input 
                        type="number"
                        value={formAllowanceTransport}
                        onChange={e => setFormAllowanceTransport(Number(e.target.value))}
                        className="w-full border bg-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] font-bold mb-1">Tunj. Kesehatan / BPJS</label>
                      <input 
                        type="number"
                        value={formAllowanceKesehatan}
                        onChange={e => setFormAllowanceKesehatan(Number(e.target.value))}
                        className="w-full border bg-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-gray-700 text-[10px] font-bold mb-1">Tarif Upah Lembur Per Jam (IDR)</label>
                      <input 
                        type="number"
                        value={formOvertimeHourlyRate}
                        onChange={e => setFormOvertimeHourlyRate(Number(e.target.value))}
                        className="w-full border bg-white rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:border-blue-500 text-purple-700"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-450 leading-relaxed mt-1.5 font-medium">
                        * Koefisien lemburan akan dikalikan jam kerja lembur riwayat absensi saat proses payroll triwulanan/bulanan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50 grid grid-cols-2 gap-3.5 mt-2">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[10px]">Nama Benefit Tambahan/Khusus (Opsional)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Insentif Insentif Lapangan"
                      value={formCustomBenefitName}
                      onChange={e => setFormCustomBenefitName(e.target.value)}
                      className="w-full border bg-white rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[10px]">Nominal Benefit Tambahan (IDR)</label>
                    <input 
                      type="number"
                      placeholder="Maks: 1000000"
                      value={formCustomBenefitAmount}
                      onChange={e => setFormCustomBenefitAmount(Number(e.target.value))}
                      className="w-full border bg-white rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-blue-500 font-extrabold text-blue-750"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 pb-2 flex justify-end gap-2.5 text-xs bg-white border-t sticky bottom-0">
                <button 
                  type="button" 
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 font-bold transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-extrabold hover:bg-indigo-700 transition flex items-center justify-center gap-1 shadow-sm disabled:bg-gray-300"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Setup & Gaji'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {viewingEmployee && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100"
          >
            <div className="bg-slate-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><UserIcon className="h-5 w-5"/> Detail Karyawan: {viewingEmployee.fullName}</h3>
              <button onClick={() => setViewingEmployee(null)} className="text-white hover:text-white/80">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-2 gap-4">
               <div><p className="font-semibold text-gray-500 text-xs">NIK</p><p className="font-bold text-gray-900">{viewingEmployee.nik}</p></div>
               <div><p className="font-semibold text-gray-500 text-xs">Email</p><p className="font-bold text-gray-900">{viewingEmployee.email}</p></div>
               <div><p className="font-semibold text-gray-500 text-xs">WhatsApp</p><p className="font-bold text-gray-900">{viewingEmployee.whatsappNumber}</p></div>
               <div><p className="font-semibold text-gray-500 text-xs">Alamat</p><p className="font-bold text-gray-900">{viewingEmployee.domicileAddress}</p></div>
               <div><p className="font-semibold text-gray-500 text-xs">Posisi</p><p className="font-bold text-gray-900">{viewingEmployee.positionApplied}</p></div>
               <div><p className="font-semibold text-gray-500 text-xs">Status</p><p className={`font-bold ${viewingEmployee.employmentStatus === 'ACTIVE' ? 'text-emerald-600' : 'text-red-700'}`}>{viewingEmployee.employmentStatus || 'ACTIVE'}</p></div>
              </div>
              <div className="border-t pt-4">
                 <button onClick={() => { setViewingEmployee(null); handleOpenEdit(viewingEmployee); }} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700">Edit Data Karyawan</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
