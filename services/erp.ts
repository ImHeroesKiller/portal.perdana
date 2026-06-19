import { Employee } from '../types';
import { getPermanentEmployees } from '../src/services/employeeService';

const ATTENDANCE_KEY = 'pt_perdana_erp_attendance';
const PAYROLL_KEY = 'pt_perdana_erp_payroll';
const ASSETS_KEY = 'pt_perdana_erp_assets';
const FINANCE_KEY = 'pt_perdana_erp_finance';

export interface ERPAbsensi {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // HH:mm
  timeOut?: string; // HH:mm
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  shift: 'Pagi' | 'Siang' | 'Malam';
  latitude: number;
  longitude: number;
  locationName: string;
  notes?: string;
}

export interface ERPPayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  period: string; // e.g. "Mei 2026"
  gajiPokok: number;
  tunjanganMakan: number;
  tunjanganTransport: number;
  overtimeHours: number;
  lemburRate: number;
  bpjsKesehatan: number;
  bpjsKetenagakerjaan: number;
  pph21: number;
  potonganLain: number;
  totalDiterima: number;
  status: 'DRAFT' | 'PAID';
  paymentDate?: string;
}

export interface ERPAsset {
  id: string;
  name: string;
  sku: string;
  category: 'IT Hardware' | 'Seragam' | 'Alat Keselamatan' | 'Kendaraan' | 'Komunikasi';
  serialNumber: string;
  status: 'Tersedia' | 'Dipinjam' | 'Rusak';
  condition: 'Baik' | 'Cukup' | 'Rusak';
  assignedTo?: string; // employeeId
  assignedToName?: string;
  assignedDate?: string;
}

export interface ERPGLAccount {
  code: string;
  name: string;
  type: 'REVENUE' | 'COGS' | 'OPEX';
  description: string;
}

export const CHART_OF_ACCOUNTS: ERPGLAccount[] = [
  { code: '4100-01', name: 'Pendapatan Jasa Alih Daya (Service Fee)', type: 'REVENUE', description: 'Fee pengelolaan/manajerial outsourcing alih daya' },
  { code: '4100-02', name: 'Pendapatan Reclaimed Payroll (Reimbursable)', type: 'REVENUE', description: 'Penggantian dana gaji personil langsung dari klien' },
  { code: '4100-03', name: 'Pendapatan Layanan Seleksi & Rekrutmen (Fee)', type: 'REVENUE', description: 'Komisi perekrutan & headhunting talent baru untuk klien' },
  { code: '4100-04', name: 'Pendapatan Lembaga Diklat Sertifikasi', type: 'REVENUE', description: 'Hasil pelaksanaan pelatihan lisensi & sertifikasi satpam atau HSE' },
  { code: '4100-09', name: 'Pendapatan Operasional Lainnya', type: 'REVENUE', description: 'Pemasukan aneka jasa pendukung kearsipan & adm' },

  { code: '5100-01', name: 'GL - Gaji & Upah Pokok Personil Proyek (COGS)', type: 'COGS', description: 'Gaji pokok bulanan/mingguan/harian personil alih daya' },
  { code: '5100-02', name: 'GL - Biaya Lembur Personil Lapangan (COGS)', type: 'COGS', description: 'Upah jam lembur tambahan tenaga kerja penempatan' },
  { code: '5100-03', name: 'GL - Tunjangan Taktis & Benefit Proyek (COGS)', type: 'COGS', description: 'Premi tunjangan makan, transport, dan insentif lapangan' },
  { code: '5100-04', name: 'GL - Beban Asuransi & BPJS Ketenagakerjaan (COGS)', type: 'COGS', description: 'Kontribusi iuran wajib BPJS kesehatan/ketenagakerjaan proyek' },
  { code: '5100-05', name: 'GL - Pengadaan Seragam & Atribut K3 (COGS)', type: 'COGS', description: 'Biaya pembelian seragam security, PDH, safety helm, sepatu' },
  { code: '5100-06', name: 'GL - Beban Sponsor Pendidikan & Lisensi (COGS)', type: 'COGS', description: 'Sponsor sertifikasi pelatihan personil proyek' },

  { code: '6100-01', name: 'Beban Gaji Staff Holding / Kantor Pusat (OPEX)', type: 'OPEX', description: 'Sistem remunerasi jajaran direksi, finance, HR, admin pusat' },
  { code: '6100-02', name: 'Beban Iklan Sourcing & Portal Lowongan (OPEX)', type: 'OPEX', description: 'Biaya pasang iklan job portal, seleksi rekrutmen holding' },
  { code: '6100-03', name: 'Beban Sewa Gedung Kantor Cabang & HQ (OPEX)', type: 'OPEX', description: 'Sewa ruang kantor pusat regional Palu dan Morowali' },
  { code: '6100-04', name: 'Beban Listrik, Internet & Utilitas Office (OPEX)', type: 'OPEX', description: 'Biaya rutin bulanan utilitas kantor holding' },
  { code: '6100-05', name: 'Beban Depresiasi & Penyusutan Inventaris Aset (OPEX)', type: 'OPEX', description: 'Amortisasi laptop, HP operasional, kendaraan operasional' },
  { code: '6100-06', name: 'Beban Konsultan Hukum, Perizinan & Pajak (OPEX)', type: 'OPEX', description: 'Bantuan jasa konsultan hukum ketenagakerjaan, perpajakan' },
  { code: '6100-09', name: 'Beban Administrasi Bank & Umum Holding (OPEX)', type: 'OPEX', description: 'Biaya admin bank, materai, ATK, entertainment tamu' },
];

export interface ERPTransaksi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  tipe: 'Pemasukan' | 'Pengeluaran';
  glCode: string; // Account Code mapping
  glAccountName?: string; // Account Name cached
  clientId?: string; // Associated Client for Cost Centre Routing
  clientName?: string; // Associated Client Name
  projectId?: string; // Associated Project for Cost Centre Routing
  projectName?: string; // Associated Project Name
  deskripsi: string;
  jumlah: number;
  refId?: string;
  kategori: string; // Kept as general category for backward compatibility
}

// Seed helper
const randomCoordinatesInSulteng = () => {
  // Center near Palu / Sulawesi Tengah area
  const lat = -0.90 + (Math.random() - 0.5) * 0.15;
  const lon = 119.83 + (Math.random() - 0.5) * 0.15;
  return { lat, lon };
};

const defaultAssets: ERPAsset[] = [
  { id: 'ast01', name: 'Laptop Lenovo ThinkPad L14', sku: 'LAP-LNV-01', category: 'IT Hardware', serialNumber: 'LNV-8823712-X', status: 'Dipinjam', condition: 'Baik', assignedTo: 'emp-1', assignedToName: 'Andi Pratama', assignedDate: '2026-04-10' },
  { id: 'ast02', name: 'Smartphone Samsung Galaxy A15 LTE', sku: 'MBL-SAM-02', category: 'Komunikasi', serialNumber: 'SAM-0019283-A', status: 'Tersedia', condition: 'Baik' },
  { id: 'ast03', name: 'HT Motorola CP1660', sku: 'COM-MOT-03', category: 'Komunikasi', serialNumber: 'MOT-3841123-B', status: 'Dipinjam', condition: 'Baik', assignedTo: 'emp-2', assignedToName: 'Siti Aminah', assignedDate: '2026-04-15' },
  { id: 'ast04', name: 'Seragam Security PDH Lengkap L', sku: 'UNI-SEC-04', category: 'Seragam', serialNumber: 'UNI-SEC-L-10', status: 'Dipinjam', condition: 'Baik', assignedTo: 'emp-3', assignedToName: 'Joko Widodo', assignedDate: '2026-05-01' },
  { id: 'ast05', name: 'Helm Proyek V-Gard Kuning', sku: 'SAF-HLM-05', category: 'Alat Keselamatan', serialNumber: 'SAF-00122', status: 'Tersedia', condition: 'Baik' },
  { id: 'ast06', name: 'Sepatu Safety Krisbow Gladiator 6"', sku: 'SAF-SHS-06', category: 'Alat Keselamatan', serialNumber: 'SAF-SHS-42', status: 'Tersedia', condition: 'Cukup' },
  { id: 'ast07', name: 'Honda Revo Fit 110 cc FI', sku: 'VEH-HON-07', category: 'Kendaraan', serialNumber: 'DN 3829 PA', status: 'Dipinjam', condition: 'Baik', assignedTo: 'emp-4', assignedToName: 'Budi Santoso', assignedDate: '2026-03-01' },
  { id: 'ast08', name: 'Tablet iPad 9th Gen 64GB', sku: 'TAB-APL-08', category: 'IT Hardware', serialNumber: 'GGNFX817291', status: 'Tersedia', condition: 'Baik' },
];

const defaultFinance: ERPTransaksi[] = [
  { id: 'tr01', tanggal: '2026-05-01', tipe: 'Pemasukan', glCode: '4100-02', glAccountName: 'Pendapatan Reclaimed Payroll (Reimbursable)', clientId: '1', clientName: 'PT IMIP Nickel Group', projectId: '1', projectName: 'Smelter Construction Morowali', deskripsi: 'Pembayaran invoice Proyek Smelter Construction Morowali - April', jumlah: 155000000, kategori: 'Tagihan Proyek' },
  { id: 'tr02', tanggal: '2026-05-05', tipe: 'Pengeluaran', glCode: '6100-03', glAccountName: 'Beban Sewa Gedung Kantor Cabang & HQ (OPEX)', deskripsi: 'Sewa space kantor perwakilan Palu Mei', jumlah: 25000000, kategori: 'Sewa Kantor' },
  { id: 'tr03', tanggal: '2026-05-25', tipe: 'Pengeluaran', glCode: '5100-01', glAccountName: 'GL - Gaji & Upah Pokok Personil Proyek (COGS)', clientId: '1', clientName: 'PT IMIP Nickel Group', projectId: '1', projectName: 'Smelter Construction Morowali', deskripsi: 'Pembayaran Payroll Karyawan Penempatan Lapangan April 2026', jumlah: 54100000, kategori: 'Gaji Karyawan' },
  { id: 'tr04', tanggal: '2026-05-28', tipe: 'Pemasukan', glCode: '4100-01', glAccountName: 'Pendapatan Jasa Alih Daya (Service Fee)', clientId: '2', clientName: 'Bank Sulteng TBK', projectId: '2', projectName: 'Sipil Bank Sulteng Admin', deskripsi: 'Pembayaran invoice Service Fee Sipil Bank Sulteng Admin - April 2026', jumlah: 98000000, kategori: 'Tagihan Proyek' },
  { id: 'tr05', tanggal: '2026-05-28', tipe: 'Pengeluaran', glCode: '6100-05', glAccountName: 'Beban Depresiasi & Penyusutan Inventaris Aset (OPEX)', deskripsi: 'Pembelian Laptop Lenovo ThinkPad L14 x1 unit', jumlah: 8500000, kategori: 'Pembelian Aset' },
  { id: 'tr06', tanggal: '2026-05-29', tipe: 'Pengeluaran', glCode: '5100-03', glAccountName: 'GL - Tunjangan Taktis & Benefit Proyek (COGS)', clientId: '3', clientName: 'PT Poso Energy', projectId: '3', projectName: 'Hulu Dam Security Patrol', deskripsi: 'Operational Petrol & Parkir Lapangan Patroli Security Poso', jumlah: 1250000, kategori: 'Reimbursement' },
];

export const getAttendance = (): ERPAbsensi[] => {
  const data = localStorage.getItem(ATTENDANCE_KEY);
  if (!data) {
    // Generate dummy attendance for the past 5 days
    const mockAbsensi: ERPAbsensi[] = [];
    const shifts: ('Pagi' | 'Siang' | 'Malam')[] = ['Pagi', 'Siang', 'Malam'];
    const names = ['Andi Pratama', 'Siti Aminah', 'Joko Widodo', 'Budi Santoso', 'Lestari Wahyu', 'Rizky Pratama', 'Citra Dewi'];
    const ids = ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6', 'emp-7'];
    
    // Last 5 days
    for (let d = 0; d < 5; d++) {
      const dateString = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      names.forEach((name, idx) => {
        const { lat, lon } = randomCoordinatesInSulteng();
        const randTimeIn = `07:${String(10 + Math.floor(Math.random() * 40)).padStart(2, '0')}`;
        const randTimeOut = `16:${String(0 + Math.floor(Math.random() * 15)).padStart(2, '0')}`;
        const status = Math.random() > 0.93 ? (Math.random() > 0.5 ? 'SAKIT' : 'IZIN') : 'HADIR';
        
        mockAbsensi.push({
          id: `att-${d}-${idx}`,
          employeeId: ids[idx],
          employeeName: name,
          date: dateString,
          timeIn: status === 'HADIR' ? randTimeIn : '',
          timeOut: status === 'HADIR' ? randTimeOut : '',
          status: status as any,
          shift: shifts[idx % 3],
          latitude: lat,
          longitude: lon,
          locationName: `Penempatan Kerja Area Sulawesi Tengah (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          notes: status !== 'HADIR' ? 'Melampirkan surat keterangan dokter' : 'Tepat waktu'
        });
      });
    }
    
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(mockAbsensi));
    return mockAbsensi;
  }
  return JSON.parse(data);
};

export const saveAttendance = (attendances: ERPAbsensi[]) => {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendances));
};

export const clockIn = async (employeeId: string, employeeName: string, shift: 'Pagi' | 'Siang' | 'Malam', latitude: number, longitude: number, locationName: string, notes?: string): Promise<ERPAbsensi> => {
  const current = getAttendance();
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  
  // Check if already checked in today
  const existing = current.find(a => a.employeeId === employeeId && a.date === dateStr);
  if (existing) {
    throw new Error('Anda sudah melakukan absensi masuk (Clock In) hari ini.');
  }

  const newRecord: ERPAbsensi = {
    id: `att-live-${Math.random().toString(36).substr(2, 9)}`,
    employeeId,
    employeeName,
    date: dateStr,
    timeIn: timeStr,
    status: 'HADIR',
    shift,
    latitude,
    longitude,
    locationName,
    notes: notes || 'Absensi Mandiri'
  };

  current.push(newRecord);
  saveAttendance(current);
  return newRecord;
};

export const clockOut = async (employeeId: string): Promise<ERPAbsensi> => {
  const current = getAttendance();
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

  const idx = current.findIndex(a => a.employeeId === employeeId && a.date === dateStr);
  if (idx === -1) {
    throw new Error('Anda belum melakukan absensi masuk (Clock In) hari ini.');
  }

  current[idx].timeOut = timeStr;
  saveAttendance(current);
  return current[idx];
};

export const getPayroll = async (): Promise<ERPPayroll[]> => {
  const data = localStorage.getItem(PAYROLL_KEY);
  if (!data) {
    // Generate dummy payrolls for active employees
    const employees = await getPermanentEmployees();
    const hired = employees.filter(e => e.status === 'HIRED' || e.status === 'CONTRACT' || e.bankName);
    
    const mockPayroll: ERPPayroll[] = [];
    const periods = ['April 2026', 'Mei 2026'];
    
    periods.forEach(p => {
      hired.slice(0, 10).forEach((emp, index) => {
        // Base salary depending on position
        let baseSalary = 4800000; // standard UMR
        if (emp.positionApplied.includes('Leader') || emp.positionApplied.includes('Supervisor') || emp.positionApplied.includes('IT')) {
          baseSalary = 6500000;
        } else if (emp.positionApplied.includes('Manager')) {
          baseSalary = 9000000;
        }

        const meal = 400000;
        const transport = 350000;
        const ovtHours = index % 3 === 0 ? 8 : 0;
        const ovtRate = ovtHours * 30000;
        const bpjsKes = Math.floor(baseSalary * 0.01);
        const bpjsTk = Math.floor(baseSalary * 0.02);
        const tax = Math.floor((baseSalary - 2000000) * 0.02); // simple dummy tax
        
        const net = baseSalary + meal + transport + ovtRate - bpjsKes - bpjsTk - tax;
        
        mockPayroll.push({
          id: `pay-${p.replace(' ', '-')}-${emp.id}`,
          employeeId: emp.id,
          employeeName: emp.fullName,
          position: emp.positionApplied,
          period: p,
          gajiPokok: baseSalary,
          tunjanganMakan: meal,
          tunjanganTransport: transport,
          overtimeHours: ovtHours,
          lemburRate: ovtRate,
          bpjsKesehatan: bpjsKes,
          bpjsKetenagakerjaan: bpjsTk,
          pph21: tax > 0 ? tax : 0,
          potonganLain: 0,
          totalDiterima: net,
          status: p === 'April 2026' ? 'PAID' : 'DRAFT',
          paymentDate: p === 'April 2026' ? '2026-04-25' : undefined
        });
      });
    });

    localStorage.setItem(PAYROLL_KEY, JSON.stringify(mockPayroll));
    return mockPayroll;
  }
  return JSON.parse(data);
};

export const savePayroll = (payrolls: ERPPayroll[]) => {
  localStorage.setItem(PAYROLL_KEY, JSON.stringify(payrolls));
};

export const processPayroll = async (period: string): Promise<ERPPayroll[]> => {
  const current = await getPayroll();
  const employees = await getPermanentEmployees();
  const hired = employees.filter(e => e.status === 'HIRED' || e.status === 'CONTRACT' || e.bankName);

  // Check if period already exists
  const existing = current.filter(p => p.period === period);
  if (existing.length > 0) {
    return existing;
  }

  const newPayrolls: ERPPayroll[] = [];
  hired.forEach((emp) => {
    // Determine formula based on employee's payrollType (or default to BULANAN)
    const type = emp.payrollType || 'BULANAN';
    const rate = emp.basicSalary || (emp.positionApplied.includes('Manager') ? 9000000 : (emp.positionApplied?.includes('Leader') ? 6500000 : 4800000));
    
    let baseSalary = rate;
    
    if (type === 'MINGGUAN') {
      baseSalary = rate * 4; // weekly rate * 4 weeks
    } else if (type === 'HARIAN') {
      baseSalary = rate * 22; // daily rate * 22 working days
    } else if (type === 'BORONGAN') {
      baseSalary = rate; // single bulk contract
    } else if (type === 'CUSTOM') {
      baseSalary = rate;
    }

    const meal = emp.allowanceMakan !== undefined ? emp.allowanceMakan : 400000;
    const transport = emp.allowanceTransport !== undefined ? emp.allowanceTransport : 350000;
    const health = emp.allowanceKesehatan !== undefined ? emp.allowanceKesehatan : 150000;
    const customBenAmount = emp.customBenefitAmount || 0;
    
    // Benefits sum
    const benefitsSum = meal + transport + health + customBenAmount;
    
    // Overtime calculation
    const ovtHours = Math.floor(Math.random() * 12) + 4; // simulated 4-15 hours
    const hourlyRate = emp.overtimeHourlyRate || 35000;
    const ovtRate = ovtHours * hourlyRate;

    const bpjsKes = Math.floor(baseSalary * 0.01);
    const bpjsTk = Math.floor(baseSalary * 0.02);
    const tax = Math.floor((baseSalary - 2500000) * 0.02);
    
    const net = baseSalary + benefitsSum + ovtRate - bpjsKes - bpjsTk - (tax > 0 ? tax : 0);

    const pay: ERPPayroll = {
      id: `pay-${period.replace(' ', '-')}-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      position: `${emp.positionApplied} (${type})`,
      period,
      gajiPokok: baseSalary,
      tunjanganMakan: meal,
      tunjanganTransport: transport,
      overtimeHours: ovtHours,
      lemburRate: ovtRate,
      bpjsKesehatan: bpjsKes + health, // bundle healthcare allowance and bpjs kes
      bpjsKetenagakerjaan: bpjsTk,
      pph21: tax > 0 ? tax : 0,
      potonganLain: 0,
      totalDiterima: net,
      status: 'DRAFT'
    };
    newPayrolls.push(pay);
    current.push(pay);
  });

  savePayroll(current);
  return newPayrolls;
};

export const paySalary = async (payrollId: string): Promise<ERPPayroll> => {
  const current = await getPayroll();
  const index = current.findIndex(p => p.id === payrollId);
  if (index === -1) throw new Error('Payroll record not found');

  current[index].status = 'PAID';
  current[index].paymentDate = new Date().toISOString().split('T')[0];
  savePayroll(current);

  // Auto record into finance outflow with advanced GL accounting coding
  const finances = getFinance();
  const transactionId = `tr-pay-${payrollId}`;
  
  if (!finances.some(f => f.id === transactionId)) {
    // Determine dynamic GL code, Client & Project allocation by fetching active employees database
    const employees = await getPermanentEmployees();
    const emp = employees.find(e => e.id === current[index].employeeId);
    
    const employeeType = emp?.employeeType || 'INTERNAL';
    const clientId = emp?.clientId;
    const projectId = emp?.projectId;
    
    // Resolve client and project names
    const clientsData = localStorage.getItem('pt_perdana_recruitment_clients');
    const projectsData = localStorage.getItem('pt_perdana_recruitment_projects');
    
    let clientName: string | undefined;
    let projectName: string | undefined;

    if (clientId && clientsData) {
      try {
        const cParsed = JSON.parse(clientsData);
        clientName = cParsed.find((c: any) => c.id === clientId)?.name;
      } catch (e) {}
    }
    if (projectId && projectsData) {
      try {
        const pParsed = JSON.parse(projectsData);
        projectName = pParsed.find((p: any) => p.id === projectId)?.name;
      } catch (e) {}
    }

    const glCode = employeeType === 'PROJECT' ? '5100-01' : '6100-01';
    const glAccountName = employeeType === 'PROJECT' 
      ? 'GL - Gaji & Upah Pokok Personil Proyek (COGS)' 
      : 'Beban Gaji Staff Holding / Kantor Pusat (OPEX)';

    finances.push({
      id: transactionId,
      tanggal: new Date().toISOString().split('T')[0],
      tipe: 'Pengeluaran',
      glCode,
      glAccountName,
      clientId,
      clientName,
      projectId,
      projectName,
      deskripsi: `Gaji Karyawan (${employeeType}): ${current[index].employeeName} - Periode ${current[index].period}`,
      jumlah: current[index].totalDiterima,
      refId: payrollId,
      kategori: 'Gaji Karyawan'
    });
    saveFinance(finances);
  }

  return current[index];
};

export const getAssets = (): ERPAsset[] => {
  const data = localStorage.getItem(ASSETS_KEY);
  if (!data) {
    localStorage.setItem(ASSETS_KEY, JSON.stringify(defaultAssets));
    return defaultAssets;
  }
  return JSON.parse(data);
};

export const saveAssets = (assets: ERPAsset[]) => {
  localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
};

export const createAsset = (name: string, sku: string, category: ERPAsset['category'], serialNumber: string, condition: ERPAsset['condition']): ERPAsset => {
  const current = getAssets();
  const id = `ast-${Math.random().toString(36).substr(2, 9)}`;
  const item: ERPAsset = {
    id,
    name,
    sku,
    category,
    serialNumber,
    status: 'Tersedia',
    condition
  };
  current.push(item);
  saveAssets(current);

  // Track as financial expense
  const finances = getFinance();
  let assetCost = 450000;
  if (category === 'IT Hardware') assetCost = 8500000;
  if (category === 'Komunikasi') assetCost = 2500000;
  if (category === 'Kendaraan') assetCost = 16000000;

  finances.push({
    id: `tr-ast-${id}`,
    tanggal: new Date().toISOString().split('T')[0],
    tipe: 'Pengeluaran',
    glCode: '6100-05',
    glAccountName: 'Beban Depresiasi & Penyusutan Inventaris Aset (OPEX)',
    kategori: 'Pembelian Aset',
    deskripsi: `Pembelian aset inventaris baru: ${name}`,
    jumlah: assetCost
  });
  saveFinance(finances);

  return item;
};

export const assignAsset = (assetId: string, employeeId: string, employeeName: string): ERPAsset => {
  const current = getAssets();
  const index = current.findIndex(a => a.id === assetId);
  if (index === -1) throw new Error('Asset not found');

  current[index].status = 'Dipinjam';
  current[index].assignedTo = employeeId;
  current[index].assignedToName = employeeName;
  current[index].assignedDate = new Date().toISOString().split('T')[0];
  saveAssets(current);
  return current[index];
};

export const returnAsset = (assetId: string, condition: 'Baik' | 'Cukup' | 'Rusak'): ERPAsset => {
  const current = getAssets();
  const index = current.findIndex(a => a.id === assetId);
  if (index === -1) throw new Error('Asset not found');

  current[index].status = current[index].status === 'Dipinjam' ? 'Tersedia' : current[index].status;
  if (condition === 'Rusak') {
    current[index].status = 'Rusak';
  }
  current[index].condition = condition;
  current[index].assignedTo = undefined;
  current[index].assignedToName = undefined;
  current[index].assignedDate = undefined;
  saveAssets(current);
  return current[index];
};

export const getFinance = (): ERPTransaksi[] => {
  const data = localStorage.getItem(FINANCE_KEY);
  let finances: ERPTransaksi[] = [];
  if (!data) {
    finances = [...defaultFinance];
    localStorage.setItem(FINANCE_KEY, JSON.stringify(finances));
  } else {
    try {
      finances = JSON.parse(data);
    } catch (e) {
      finances = [...defaultFinance];
    }
  }

  // Auto-upgrade / backward compatibility migration
  let isMigrated = false;
  const migrated = finances.map(item => {
    let changed = false;
    if (!item.glCode) {
      changed = true;
      if (item.tipe === 'Pemasukan') {
        item.glCode = '4100-01'; // Default to Service Fee
      } else {
        if (item.kategori === 'Sewa Kantor' || item.deskripsi.toLowerCase().includes('sewa')) {
          item.glCode = '6100-03';
        } else if (item.kategori === 'Gaji Karyawan' || item.deskripsi.toLowerCase().includes('gaji')) {
          item.glCode = '5100-01';
        } else if (item.kategori === 'Pembelian Aset' || item.deskripsi.toLowerCase().includes('aset') || item.deskripsi.toLowerCase().includes('laptop')) {
          item.glCode = '6100-05';
        } else if (item.kategori === 'Reimbursement' || item.deskripsi.toLowerCase().includes('operational')) {
          item.glCode = '5100-03';
        } else {
          item.glCode = '6100-09'; // HQ admin
        }
      }
    }

    if (!item.glAccountName && item.glCode) {
      const acct = CHART_OF_ACCOUNTS.find(a => a.code === item.glCode);
      if (acct) {
        item.glAccountName = acct.name;
        changed = true;
      }
    }

    // Default category if missing
    if (!item.kategori) {
      item.kategori = item.tipe === 'Pemasukan' ? 'Tagihan Proyek' : 'Operasional';
      changed = true;
    }

    if (changed) {
      isMigrated = true;
    }
    return item;
  });

  if (isMigrated) {
    localStorage.setItem(FINANCE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  return finances;
};

export const saveFinance = (finances: ERPTransaksi[]) => {
  localStorage.setItem(FINANCE_KEY, JSON.stringify(finances));
};

export const createFinanceEntry = (
  tipe: 'Pemasukan' | 'Pengeluaran',
  glCode: string,
  deskripsi: string,
  jumlah: number,
  tanggal?: string,
  clientId?: string,
  clientName?: string,
  projectId?: string,
  projectName?: string,
  refId?: string
): ERPTransaksi => {
  const current = getFinance();
  const acc = CHART_OF_ACCOUNTS.find(a => a.code === glCode);
  
  // Set category for backward compatibility and dashboard filters
  let categorizedAs = 'Lain-lain';
  if (tipe === 'Pemasukan') {
    categorizedAs = 'Tagihan Proyek';
  } else {
    if (glCode === '5100-01' || glCode === '6100-01') {
      categorizedAs = 'Gaji Karyawan';
    } else if (glCode === '6100-03') {
      categorizedAs = 'Sewa Kantor';
    } else if (glCode === '6100-05') {
      categorizedAs = 'Pembelian Aset';
    } else if (glCode.startsWith('5')) {
      categorizedAs = 'Reimbursement';
    } else {
      categorizedAs = 'Lain-lain';
    }
  }

  const item: ERPTransaksi = {
    id: `tr-${Math.random().toString(36).substr(2, 9)}`,
    tanggal: tanggal || new Date().toISOString().split('T')[0],
    tipe,
    glCode,
    glAccountName: acc ? acc.name : 'Rekening Operasional Alih Daya',
    clientId,
    clientName,
    projectId,
    projectName,
    deskripsi,
    jumlah,
    refId,
    kategori: categorizedAs
  };
  current.push(item);
  saveFinance(current);
  return item;
};


/* =========================================================================
   NEW ADDITIONS: LEAVE (CUTI), OVERTIME (LEMBUR), LETTERS & ANNOUNCEMENTS
   ========================================================================= */

export interface ERPLeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveType: 'Cuti Tahunan' | 'Cuti Sakit' | 'Cuti Melahirkan' | 'Izin Urusan Pribadi';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedBy?: string;
}

export interface ERPOvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  activity: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedBy?: string;
}

export interface ERPLetterRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  letterType: 'Surat Keterangan Kerja (Paklaring)' | 'Surat Rekomendasi' | 'Surat Keterangan Penghasilan (Slip Gaji Resmi)';
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  downloadUrl?: string;
  createdAt: string;
  approvedBy?: string;
}

export interface ERPAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'K3LH' | 'Info Operasional' | 'Kebijakan' | 'Pelatihan';
  isImportant: boolean;
}

const LEAVE_KEY = 'pt_perdana_erp_leave';
const OVERTIME_KEY = 'pt_perdana_erp_overtime';
const LETTER_KEY = 'pt_perdana_erp_letter';

export const getLeaveRequests = (employeeId?: string): ERPLeaveRequest[] => {
  const data = localStorage.getItem(LEAVE_KEY);
  const list: ERPLeaveRequest[] = data ? JSON.parse(data) : [];
  if (employeeId) {
    return list.filter(item => item.employeeId === employeeId);
  }
  return list;
};

export const createLeaveRequest = (
  employeeId: string, 
  employeeName: string, 
  startDate: string, 
  endDate: string, 
  leaveType: ERPLeaveRequest['leaveType'], 
  reason: string
): ERPLeaveRequest => {
  const list = getLeaveRequests();
  const newReq: ERPLeaveRequest = {
    id: `lv-${Math.random().toString(36).substring(2, 9)}`,
    employeeId,
    employeeName,
    startDate,
    endDate,
    leaveType,
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  list.push(newReq);
  localStorage.setItem(LEAVE_KEY, JSON.stringify(list));
  return newReq;
};

export const updateLeaveRequestStatus = (id: string, status: 'APPROVED' | 'REJECTED', approvedBy?: string): void => {
  const list = getLeaveRequests();
  const idx = list.findIndex(l => l.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    if (approvedBy) list[idx].approvedBy = approvedBy;
    localStorage.setItem(LEAVE_KEY, JSON.stringify(list));
  }
};

export const getOvertimeRequests = (employeeId?: string): ERPOvertimeRequest[] => {
  const data = localStorage.getItem(OVERTIME_KEY);
  const list: ERPOvertimeRequest[] = data ? JSON.parse(data) : [];
  if (employeeId) {
    return list.filter(item => item.employeeId === employeeId);
  }
  return list;
};

export const createOvertimeRequest = (
  employeeId: string, 
  employeeName: string, 
  date: string, 
  hours: number, 
  activity: string
): ERPOvertimeRequest => {
  const list = getOvertimeRequests();
  const newReq: ERPOvertimeRequest = {
    id: `ot-${Math.random().toString(36).substring(2, 9)}`,
    employeeId,
    employeeName,
    date,
    hours,
    activity,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  list.push(newReq);
  localStorage.setItem(OVERTIME_KEY, JSON.stringify(list));
  return newReq;
};

export const updateOvertimeRequestStatus = (id: string, status: 'APPROVED' | 'REJECTED', approvedBy?: string): void => {
  const list = getOvertimeRequests();
  const idx = list.findIndex(o => o.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    if (approvedBy) list[idx].approvedBy = approvedBy;
    localStorage.setItem(OVERTIME_KEY, JSON.stringify(list));
  }
};

export const getLetterRequests = (employeeId?: string): ERPLetterRequest[] => {
  const data = localStorage.getItem(LETTER_KEY);
  const list: ERPLetterRequest[] = data ? JSON.parse(data) : [];
  if (employeeId) {
    return list.filter(item => item.employeeId === employeeId);
  }
  return list;
};

export const createLetterRequest = (
  employeeId: string, 
  employeeName: string, 
  letterType: ERPLetterRequest['letterType'], 
  purpose: string
): ERPLetterRequest => {
  const list = getLetterRequests();
  const newReq: ERPLetterRequest = {
    id: `lt-${Math.random().toString(36).substring(2, 9)}`,
    employeeId,
    employeeName,
    letterType,
    purpose,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  list.push(newReq);
  localStorage.setItem(LETTER_KEY, JSON.stringify(list));
  return newReq;
};

export const updateLetterRequestStatus = (id: string, status: 'APPROVED' | 'REJECTED', approvedBy?: string): void => {
  const list = getLetterRequests();
  const idx = list.findIndex(l => l.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    if (status === 'APPROVED') {
      list[idx].downloadUrl = `data:text/html;charset=utf-8,${encodeURIComponent(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; color: #333;">
            <div style="border: 2px solid #333; padding: 30px; border-radius: 8px;">
              <h2 style="text-align: center; color: #1b365d;">PT PERDANA ADI YUDA</h2>
              <p style="text-align: center; font-size: 12px; border-bottom: 2px double #333; padding-bottom: 15px;">
                Plaza Summarecon Bekasi Lt. 7, Bekasi | Cabang Palu: Jl. Wolter Monginsidi No. 45, Palu
              </p>
              <h3 style="text-align: center; text-transform: uppercase;">${list[idx].letterType}</h3>
              <p style="text-align: center; font-size: 11px;">Nomor: PERDANA/SURAT-KETERANGAN/${new Date().getFullYear()}/${list[idx].id.toUpperCase()}</p>
              
              <p style="margin-top: 30px;">Dengan ini menerangkan bahwa:</p>
              <table style="margin-left: 20px; font-weight: bold;">
                <tr><td>Nama Karyawan</td><td>: ${list[idx].employeeName}</td></tr>
                <tr><td>ID Karyawan</td><td>: ${list[idx].employeeId}</td></tr>
              </table>
              <p style="text-align: justify; line-height: 1.6;">
                Adalah benar yang bersangkutan merupakan pekerja dalam masa penempatan resmi di bawah kelolaan kearsipan 
                dan penugasan alih daya <b>PT Perdana Adi Yuda</b>. Pihak manajemen memberikan validasi penuh atas dedikasi, 
                integritas, dan etos kerja yang bersangkutan selama penugasan. Dokumen ini diajukan untuk keperluan: <b>${list[idx].purpose}</b>.
              </p>
              <p style="margin-top: 40px; text-align: right;">
                Palu, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
                <b>PT Perdana Adi Yuda</b><br/><br/><br/>
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e2/Fake_Signature.png" height="50" /><br/>
                <b><u>HR & Recruitment Division Representative</u></b>
              </p>
            </div>
          </body>
        </html>
      `)}`;
    }
    if (approvedBy) list[idx].approvedBy = approvedBy;
    localStorage.setItem(LETTER_KEY, JSON.stringify(list));
  }
};

export const getAnnouncements = (): ERPAnnouncement[] => {
  const defaultAnnouncements: ERPAnnouncement[] = [
    {
      id: 'ann-1',
      title: 'Penerapan Standar K3LH Baru di Kawasan Nikel Morowali',
      content: 'Wajib kepada seluruh operator dump truck, trailer, dan excavator penempatan site Morowali untuk melengkapi APD lengkap (Helm V-Gard, Kacamata UV, Masker Carbon, dan Rompi Reflektif Kelas II) serta wajib mengikuti toolbox meeting harian pukul 07:45 sebelum start unit demi menjaga zero-incident.',
      date: '2026-05-28',
      category: 'K3LH',
      isImportant: true
    },
    {
      id: 'ann-2',
      title: 'Informasi Penyesuaian Pengajuan Klaim Lembur (Overtime)',
      content: 'Untuk akurasi pencatatan payroll bulanan, pengajuan lembur & pengajuan cuti wajib diinput selambat-lambatnya tanggal 23 pada bulan berjalan melalui Portal Karyawan ini agar langsung masuk dalam kalkulasi slip gaji.',
      date: '2026-05-25',
      category: 'Info Operasional',
      isImportant: false
    },
    {
      id: 'ann-3',
      title: 'Sponsorship Program Sertifikasi Lisensi Ketenagakerjaan',
      content: 'PT Perdana Adi Yuda membuka pendaftaran kuota program sertifikasi upgrade SIO Kemnaker RI bagi Helper Crew senior yang berdedikasi tinggi. Silakan mengajukan surat rekomendasi atau menghubungi HR Representative.',
      date: '2026-05-20',
      category: 'Pelatihan',
      isImportant: true
    }
  ];
  const data = localStorage.getItem('pt_perdana_erp_announcements');
  if (!data) {
    localStorage.setItem('pt_perdana_erp_announcements', JSON.stringify(defaultAnnouncements));
    return defaultAnnouncements;
  }
  return JSON.parse(data);
};
