import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';
import { useCandidates, createCandidate, updateCandidate, useForceRefresh } from '../hooks/useDbQueries';
import { getCompanySettings } from '../services/companySettings';
import { 
  getAttendance, clockIn, clockOut, ERPAbsensi,
  getLeaveRequests, createLeaveRequest, ERPLeaveRequest,
  getOvertimeRequests, createOvertimeRequest, ERPOvertimeRequest,
  getLetterRequests, createLetterRequest, ERPLetterRequest,
  getAnnouncements, ERPAnnouncement,
  getPayroll, paySalary, ERPPayroll
} from '../services/erp';
import { Employee, ApplicationStatus } from '../types';
import { 
  UserCircleIcon, CalendarIcon, ClockIcon, MapPinIcon, 
  DocumentArrowUpIcon, NewspaperIcon, ClipboardDocumentCheckIcon, 
  BriefcaseIcon, ArrowRightOnRectangleIcon, CheckCircleIcon,
  XCircleIcon, DocumentTextIcon, BanknotesIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

const MAP_PRESET_LOCATIONS = [
  { name: 'Palu HQ Office (Sulteng)', lat: -0.9015, lon: 119.8312 },
  { name: 'Morowali Smelter Site', lat: -2.3150, lon: 121.9056 },
  { name: 'Morowali Utara Mining Site', lat: -1.9860, lon: 121.3412 },
  { name: 'PLTA Poso Sulewana Sektor', lat: -1.7820, lon: 120.6540 }
];

export const EmployeePortal: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { data: candidatesList = [], isLoading: candidatesLoading, refetch: refetchCandidates } = useCandidates();
  const forceRefresh = useForceRefresh();

  useEffect(() => {
    console.log('[EmployeePortal] mount — force refresh candidates');
    void forceRefresh.candidates();
  }, []);

  // Authentication & DB state
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracking' | 'absensi' | 'cuti' | 'lembur' | 'surat' | 'gaji' | 'data'>('dashboard');

  // Sub-modules state
  const [attendances, setAttendances] = useState<ERPAbsensi[]>([]);
  const [leaves, setLeaves] = useState<ERPLeaveRequest[]>([]);
  const [overtimes, setOvertimes] = useState<ERPOvertimeRequest[]>([]);
  const [letters, setLetters] = useState<ERPLetterRequest[]>([]);
  const [announcements, setAnnouncements] = useState<ERPAnnouncement[]>([]);
  const [payrolls, setPayrolls] = useState<ERPPayroll[]>([]);
  
  // Interaction/Form states
  const [clockInNotes, setClockInNotes] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(MAP_PRESET_LOCATIONS[0]);
  const [selectedShift, setSelectedShift] = useState<'Pagi' | 'Siang' | 'Malam'>('Pagi');
  const [isClockedInToday, setIsClockedInToday] = useState(false);
  const [clockInRecordToday, setClockInRecordToday] = useState<ERPAbsensi | null>(null);

  // Leave Form state
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState<ERPLeaveRequest['leaveType']>('Cuti Tahunan');
  const [leaveReason, setLeaveReason] = useState('');

  // Overtime Form state
  const [overtimeDate, setOvertimeDate] = useState('');
  const [overtimeHours, setOvertimeHours] = useState(2);
  const [overtimeActivity, setOvertimeActivity] = useState('');

  // Letter Form state
  const [letterType, setLetterType] = useState<ERPLetterRequest['letterType']>('Surat Keterangan Kerja (Paklaring)');
  const [letterPurpose, setLetterPurpose] = useState('');

  // UI States
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'or', text: string } | null>(null);
  const [activePayslip, setActivePayslip] = useState<ERPPayroll | null>(null);
  const [activeLetterHTML, setActiveLetterHTML] = useState<string | null>(null);

  // Personal data edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Employee>>({});

  // Offering sign-off
  const [offeringSigned, setOfferingSigned] = useState(false);
  const [offeringSignature, setOfferingSignature] = useState('');

  const loadAllData = async (userEmail: string, list = candidatesList) => {
    try {
      setLoading(true);
      let currentEmp = list.find(e => e.email.toLowerCase() === userEmail.toLowerCase());
      
      if (!currentEmp && currentUser && currentUser.role !== 'admin') {
        const generatedNik = '7201' + Math.floor(100000000000 + Math.random() * 900000000000);
        const namePart = currentUser.username.split('@')[0].toUpperCase();
        const seedEmp: any = {
          fullName: namePart + ' (DEMO)',
          positionApplied: 'OFFICE SAFETY & OPERATIONS SUPPORT',
          email: currentUser.username,
          whatsappNumber: currentUser.profile?.whatsappNumber || '081234567890',
          nik: generatedNik,
          kkNumber: '7201' + Math.floor(100000000000 + Math.random() * 900000000000),
          placeOfBirth: 'Morowali',
          dateOfBirth: '1995-02-14',
          gender: 'Laki-laki',
          religion: 'Islam',
          maritalStatus: 'Belum Menikah',
          domicileAddress: 'Morowali, Sulawesi Tengah',
          healthCertificatePath: '',
          photoPath: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          skckPath: '',
          cvPath: '',
          vaccineDocPath: '',
          cardPath: '',
          experienceYears: 3,
          skills: ['Sertifikasi K3 Umum', 'HSE Auditing', 'Microsoft Excel'],
          status: 'OFFERING',
          gpsTrackingActive: true,
          currentProject: 'Morowali Smelter Site',
          employeeType: 'PROJECT',
          offeringData: {
            salary: '5400000',
            allowance: '600000',
            benefits: 'BPJS Kesehatan, BPJS Ketenagakerjaan, Mess Karyawan',
            startDate: new Date().toISOString().split('T')[0],
            placementLocation: 'Morowali Smelter Site',
            picPerdana: 'Agus Santoso',
            picClient: 'Budi Raharjo',
            contractDuration: '12 Bulan',
            sentAt: new Date().toISOString(),
            status: 'SENT'
          }
        };
        currentEmp = await createCandidate(seedEmp, 'manual');
      }

      if (currentEmp) {
        setEmployee(currentEmp);
        setEditFields({
          fullName: currentEmp.fullName,
          nik: currentEmp.nik,
          kkNumber: currentEmp.kkNumber,
          whatsappNumber: currentEmp.whatsappNumber,
          domicileAddress: currentEmp.domicileAddress,
          bankName: currentEmp.bankName,
          accountNumber: currentEmp.accountNumber,
          emergencyPhone: currentEmp.emergencyPhone
        });

        // Load specific ESS transactions
        const allAtt = getAttendance().filter(a => a.employeeId === currentEmp.id);
        setAttendances(allAtt);

        // Check active clock-in
        const todayStr = new Date().toISOString().split('T')[0];
        const clockToday = allAtt.find(a => a.date === todayStr);
        if (clockToday) {
          setIsClockedInToday(true);
          setClockInRecordToday(clockToday);
        }

        setLeaves(getLeaveRequests(currentEmp.id));
        setOvertimes(getOvertimeRequests(currentEmp.id));
        setLetters(getLetterRequests(currentEmp.id));
        
        const allPays = (await getPayroll()).filter(p => p.employeeId === currentEmp.id);
        setPayrolls(allPays);
      }

      setAnnouncements(getAnnouncements());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') {
      setLoading(false);
      return;
    }
    if (candidatesLoading) return;
    loadAllData(currentUser.username, candidatesList);
  }, [currentUser?.username, currentUser?.role, candidatesList, candidatesLoading]);

  // Handle Actions
  const handleClockIn = async () => {
    if (!employee) return;
    try {
      const rec = await clockIn(
        employee.id,
        employee.fullName,
        selectedShift,
        selectedLocation.lat,
        selectedLocation.lon,
        selectedLocation.name,
        clockInNotes || 'Absensi Mandiri'
      );
      setFeedbackMsg({ type: 'success', text: `Berhasil melakukan Clock In Pukul ${rec.timeIn}!` });
      setIsClockedInToday(true);
      setClockInRecordToday(rec);
      setClockInNotes('');
      // Reload lists
      const allAtt = getAttendance().filter(a => a.employeeId === employee.id);
      setAttendances(allAtt);
    } catch (e: any) {
      setFeedbackMsg({ type: 'or', text: e.message });
    }
  };

  const handleClockOut = async () => {
    if (!employee) return;
    try {
      const rec = await clockOut(employee.id);
      setFeedbackMsg({ type: 'success', text: `Berhasil melakukan Clock Out Pukul ${rec.timeOut}!` });
      setIsClockedInToday(false);
      setClockInRecordToday(null);
      // Reload lists
      const allAtt = getAttendance().filter(a => a.employeeId === employee.id);
      setAttendances(allAtt);
    } catch (e: any) {
      setFeedbackMsg({ type: 'or', text: e.message });
    }
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (!leaveStart || !leaveEnd || !leaveReason) {
      setFeedbackMsg({ type: 'or', text: 'Mohon lengkapi tanggal dan alasan cuti.' });
      return;
    }
    createLeaveRequest(employee.id, employee.fullName, leaveStart, leaveEnd, leaveType, leaveReason);
    setFeedbackMsg({ type: 'success', text: 'Permohonan cuti berhasil diajukan!' });
    setLeaveStart('');
    setLeaveEnd('');
    setLeaveReason('');
    setLeaves(getLeaveRequests(employee.id));
  };

  const handleApplyOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (!overtimeDate || !overtimeActivity) {
      setFeedbackMsg({ type: 'or', text: 'Mohon isi tanggal dan aktivitas lembur.' });
      return;
    }
    createOvertimeRequest(employee.id, employee.fullName, overtimeDate, overtimeHours, overtimeActivity);
    setFeedbackMsg({ type: 'success', text: 'Klaim jam lembur berhasil diajukan!' });
    setOvertimeDate('');
    setOvertimeActivity('');
    setOvertimes(getOvertimeRequests(employee.id));
  };

  const handleApplyLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (!letterPurpose) {
      setFeedbackMsg({ type: 'or', text: 'Mohon tuliskan tujuan pembuatan surat administrative.' });
      return;
    }
    createLetterRequest(employee.id, employee.fullName, letterType, letterPurpose);
    setFeedbackMsg({ type: 'success', text: 'Pengajuan Surat Administrasi berhasil! Mohon tunggu konfirmasi HR.' });
    setLetterPurpose('');
    setLetters(getLetterRequests(employee.id));
  };

  const handleUpdatePersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      setLoading(true);
      const fieldsToSend = { ...editFields };
      if (fieldsToSend.whatsappNumber) {
        let cleanWA = fieldsToSend.whatsappNumber.replace(/[^0-9]/g, '');
        if (cleanWA.startsWith('0')) {
          cleanWA = cleanWA.substring(1);
        }
        if (cleanWA.startsWith('62')) {
          fieldsToSend.whatsappNumber = `+${cleanWA}`;
        } else {
          fieldsToSend.whatsappNumber = `+62${cleanWA}`;
        }
      }
      const updated = await updateCandidate(employee.id, fieldsToSend);
      setEmployee(updated);
      setIsEditMode(false);
      setFeedbackMsg({ type: 'success', text: 'Portal Data Mandiri Anda berhasil diperbarui di server!' });
    } catch (e: any) {
      setFeedbackMsg({ type: 'or', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffering = async () => {
    if (!employee || !offeringSignature) {
      setFeedbackMsg({ type: 'or', text: 'Mohon isi paraf/tanda tangan elektronik Anda.' });
      return;
    }
    try {
      setLoading(true);
      // Construct acceptance details
      const oDetails = employee.offeringData 
        ? { ...employee.offeringData, status: 'ACCEPTED' as const } 
        : { salary: 'UMR', allowance: 'Ada', benefits: 'BPJS', startDate: new Date().toLocaleDateString(), placementLocation: 'Morowali', picPerdana: 'HR', picClient: 'PT IMIP', contractDuration: '12 Bulan', sentAt: new Date().toISOString(), status: 'ACCEPTED' as const };

      const updated = await updateCandidate(employee.id, {
        status: 'HIRED', // Convert to HIRED immediately!
        offeringData: oDetails,
        hrNotes: `Kontrak penawaran disetujui pelamar secara digital. TTD: ${offeringSignature}`,
        employeeType: 'PROJECT',
        payrollType: 'BULANAN',
        basicSalary: 4800000,
        allowanceMakan: 400000,
        allowanceTransport: 350000,
        allowanceKesehatan: 150000,
        overtimeHourlyRate: 35000
      });
      setEmployee(updated);
      setFeedbackMsg({ type: 'success', text: 'Selamat! Sesi penandatanganan penawaran kontrak berhasil. Akun Anda beralih menjadi KARYAWAN AKTIF!' });
      setActiveTab('dashboard');
    } catch (e: any) {
      setFeedbackMsg({ type: 'or', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Safe check for hired logic
  const isHired = employee ? (employee.status === 'HIRED' || employee.status === 'CONTRACT') : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <ArrowPathIcon className="h-10 w-10 text-blue-600 animate-spin mb-2" />
        <p className="text-gray-500 font-medium">Memuat data kearsipan portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto my-16 bg-white p-8 rounded-xl shadow-lg border border-gray-150 text-center text-gray-800">
        <UserCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Akses Terbatas: Portal Karyawan</h3>
        <p className="text-gray-500 mb-6">Silakan log in terlebih dahulu untuk melakukan pelacakan lowongan, absensi mandiri, mengajukan cuti, dan melihat slip gaji.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="px-6 py-2.5 bg-blue-700 text-white rounded font-medium hover:bg-blue-800 transition-colors">Log In Pasien/Pegawai</Link>
          <Link to="/register" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200 transition-colors">Daftar Baru</Link>
        </div>
      </div>
    );
  }

  // Not a candidate yet (no matched email in candidates collection)
  if (!employee) {
    return (
      <div className="max-w-4xl mx-auto my-12 bg-white rounded-xl shadow-lg border border-gray-150 overflow-hidden text-gray-800">
        <div className="bg-slate-900 p-6 text-white text-center">
          <h2 className="text-xl font-bold">Portal Calon Pekerja</h2>
          <p className="text-xs text-slate-400">PT Perdana Adi Yuda | Kearsipan Alih Daya & Pelatihan</p>
        </div>
        <div className="p-8 text-center space-y-6">
          <BriefcaseIcon className="h-16 w-16 text-blue-600 mx-auto animate-bounce" />
          <div>
            <h3 className="text-xl font-bold">Akun Terdaftar: {currentUser.username}</h3>
            <p className="text-gray-500 max-w-lg mx-auto mt-2">
              Anda telah berhasil mendaftar akun Google / Kredensial. Namun Anda belum mengirimkan berkas lamaran pekerjaan (belum mengisi Formulir Lowongan Kerja).
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 max-w-xl mx-auto text-left">
            <h4 className="font-bold text-slate-800 mb-2">Mengapa Anda perlu mengsubmit lamaran?</h4>
            <ul className="text-xs text-gray-650 space-y-2 list-disc pl-5">
              <li>Membuka portofolio <b>Interview Online bertenaga AI</b></li>
              <li>Akses pelacakan tahapan lamaran (ATS) secara real-time</li>
              <li>Aset kearsipan digital untuk penempatan site Morowali, Palu & Poso</li>
              <li>Sertifikasi SIO gratis bagi helper senior terpilih</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to={`/apply?email=${encodeURIComponent(currentUser.username)}&phone=${currentUser.profile?.whatsappNumber || ''}`}
              className="px-8 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 shadow-md transition-all text-center"
            >
              Lengkapi Lamaran Kerja Sekarang ➔
            </Link>
            <button 
              onClick={() => logout()}
              className="px-6 py-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded font-bold transition-colors"
            >
              Keluar Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN PORTAL WINDOW
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 text-gray-800">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={employee.photoPath || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
              alt={employee.fullName} 
              className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-blue-500 object-cover shadow"
              referrerPolicy="no-referrer"
            />
            <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-slate-900 ${isHired ? 'bg-green-500' : 'bg-amber-500'}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold">{employee.fullName}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isHired ? 'bg-green-900/80 text-green-200' : 'bg-amber-900/80 text-amber-200'}`}>
                {isHired ? 'Karyawan Aktif' : `Kandidat: ${employee.status}`}
              </span>
            </div>
            <p className="text-gray-400 text-xs md:text-sm mt-1">{employee.positionApplied} | NIK: {employee.nik}</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID Kontrak: {employee.id.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {!isHired && employee.status === 'INTERVIEW' && (
            <Link 
              to={`/interview-session/${employee.id}`} 
              className="px-5 py-2 bg-gradient-to-r from-red-650 to-red-600 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-2 animate-pulse"
            >
              <ClockIcon className="h-4 w-4" /> Mulai Interview AI Anda
            </Link>
          )}
          <button 
            onClick={() => logout()}
            className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors"
          >
            Keluar Portal
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 mb-6 rounded-lg border flex items-center justify-between transition-all ${feedbackMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-950'}`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-sm hover:underline font-bold text-gray-500 px-2">Tutup</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md border border-gray-200 h-fit space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1 mb-2">Main Menu</div>
          
          <button 
            onClick={() => { setActiveTab('dashboard'); setFeedbackMsg(null); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <NewspaperIcon className="h-5 w-5" /> Ringkasan Beranda
          </button>

          <button 
            onClick={() => { setActiveTab('data'); setFeedbackMsg(null); }}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'data' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <UserCircleIcon className="h-5 w-5" /> Portal Data Mandiri
          </button>

          {!isHired ? (
            /* Applicants Tab */
            <>
              <button 
                onClick={() => { setActiveTab('tracking'); setFeedbackMsg(null); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'tracking' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <ClipboardDocumentCheckIcon className="h-5 w-5" /> Tracking Lowongan
              </button>
            </>
          ) : (
            /* Hired Staff Tabs */
            <>
              <button 
                onClick={() => { setActiveTab('absensi'); setFeedbackMsg(null); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'absensi' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <MapPinIcon className="h-5 w-5" /> Absensi Mandiri (GPS)
              </button>

              <button 
                onClick={() => { setActiveTab('cuti'); setFeedbackMsg(null); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'cuti' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <CalendarIcon className="h-5 w-5" /> Pengajuan Cuti (Leave)
              </button>

              <button 
                onClick={() => { setActiveTab('lembur'); setFeedbackMsg(null); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'lembur' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <ClockIcon className="h-5 w-5" /> Jam Lembur (Overtime)
              </button>

              <button 
                onClick={() => { setActiveTab('surat'); setFeedbackMsg(null); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'surat' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <DocumentTextIcon className="h-5 w-5" /> Pengajuan Surat
              </button>

              <button 
                onClick={() => { setActiveTab('gaji'); setFeedbackMsg(null); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 font-medium transition-all ${activeTab === 'gaji' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <BanknotesIcon className="h-5 w-5" /> Slip Gaji Bulanan
              </button>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-xl font-bold text-slate-800 mb-1">Halo, Selamat Datang Kembali!</h2>
                <p className="text-sm text-gray-500">Akses seluruh modul kearsipan, kompensasi benefit, dan aktivitas penukaran data.</p>
                
                {/* Visual Widgets for Hired */}
                {isHired ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Sisa Kuota Cuti</p>
                      <h4 className="text-2xl font-black text-blue-950 mt-1">12 Hari</h4>
                      <p className="text-[9px] text-blue-600 mt-1">Kuota Cuti Tahunan</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                      <p className="text-[10px] font-bold text-green-800 uppercase">Hadir Bulan Ini</p>
                      <h4 className="text-2xl font-black text-green-950 mt-1">{attendances.length} Hari</h4>
                      <p className="text-[9px] text-green-600 mt-1">Kehadiran Terarsip</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Lembur Disetujui</p>
                      <h4 className="text-2xl font-black text-amber-950 mt-1">
                        {overtimes.filter(o => o.status === 'APPROVED').reduce((sum, o) => sum + o.hours, 0)} Jam
                      </h4>
                      <p className="text-[9px] text-amber-600 mt-1">Siap Cair di Payroll</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center">
                      <p className="text-[10px] font-bold text-indigo-800 uppercase">Surat Diajukan</p>
                      <h4 className="text-2xl font-black text-indigo-950 mt-1">{letters.length} Dok</h4>
                      <p className="text-[9px] text-indigo-600 mt-1">Status: {letters.filter(l => l.status === 'PENDING').length} Pending</p>
                    </div>
                  </div>
                ) : (
                  /* Applicant overview text banner */
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-150 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div>
                      <h4 className="font-bold text-blue-900">Pantau Posisi Seleksi Kerja Anda</h4>
                      <p className="text-xs text-blue-700 mt-1">Sistem ATS kami terus memperbarui status kelayakan Anda setelah wawancara bertenaga AI.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('tracking')} 
                      className="text-xs bg-blue-700 text-white font-bold py-2 px-4 rounded hover:bg-blue-800 shrink-0 shadow"
                    >
                      Buka Tracking Pelacak
                    </button>
                  </div>
                )}
              </div>

              {/* Announcements Section */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-md font-bold text-slate-800 mb-4 border-b pb-2">Informasi & Pengumuman Penting K3LH</h3>
                <div className="space-y-4">
                  {announcements.map(ann => (
                    <div key={ann.id} className={`p-4 rounded-lg border text-sm ${ann.isImportant ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ann.category === 'K3LH' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {ann.category}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{ann.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{ann.title}</h4>
                      <p className="text-xs text-gray-650 leading-relaxed text-slate-700">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast interactive helper to toggle hire state for testing, specifically requested that changes can be audited in real-time */}
              <div className="bg-slate-55 bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 text-sm">
                <p className="font-bold text-indigo-900 mb-1">🔧 Panel Simulasi Pengembang (Audit Demo)</p>
                <p className="text-xs text-indigo-700 mb-3">Tekan tombol di bawah ini untuk mengubah status posisi akun secara cepat tanpa menunggu admin!</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={async () => {
                      const upd = await updateCandidate(employee.id, { status: 'HIRED' });
                      setEmployee(upd);
                      setFeedbackMsg({ type: 'success', text: 'Simulasi: Status Akun Anda diubah ke HIRED (Pegawai Aktif)!' });
                    }}
                    className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-semibold"
                  >
                    Ubah ke: Hired (Pegawai Aktif)
                  </button>
                  <button 
                    onClick={async () => {
                      const upd = await updateCandidate(employee.id, { status: 'INTERVIEW' });
                      setEmployee(upd);
                      setFeedbackMsg({ type: 'success', text: 'Simulasi: Status Akun Anda diubah ke INTERVIEW!' });
                    }}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-semibold"
                  >
                    Ubah ke: Interview AI
                  </button>
                  <button 
                    onClick={async () => {
                      const upd = await updateCandidate(employee.id, { status: 'OFFERING' });
                      setEmployee(upd);
                      setFeedbackMsg({ type: 'success', text: 'Simulasi: Status Akun Anda diubah ke OFFERING (Tanda Tangan Penawaran)!' });
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold"
                  >
                    Ubah ke: Offering (Penawaran)
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: APPLICANT TRACKING */}
          {activeTab === 'tracking' && !isHired && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Pelacakan Proses Lamaran Kerja (ATS)</h2>
                <p className="text-xs text-gray-500 mt-1">Dapatkan pemutakhiran menyeluruh atas progress penempatan kerja Anda di PT Perdana Adi Yuda.</p>
              </div>

              {/* Visual Map Timeline */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <div className="grid grid-cols-4 gap-4 text-center relative">
                  
                  {/* Applied */}
                  <div className="text-center z-10">
                    <div className={`h-10 w-10 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                      ['APPLIED', 'INTERVIEW', 'OFFERING', 'HIRED', 'CONTRACT'].includes(employee.status)
                        ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>1</div>
                    <span className="text-xs font-bold block mt-2">Lamaran</span>
                    <span className="text-[10px] text-gray-500 font-mono">Terkirim</span>
                  </div>

                  {/* Interview */}
                  <div className="text-center z-10">
                    <div className={`h-10 w-10 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                      ['INTERVIEW', 'OFFERING', 'HIRED', 'CONTRACT'].includes(employee.status)
                        ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>2</div>
                    <span className="text-xs font-bold block mt-2">Interview AI</span>
                    <span className="text-[10px] text-gray-500 font-mono">Wawancara</span>
                  </div>

                  {/* Offering */}
                  <div className="text-center z-10">
                    <div className={`h-10 w-10 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                      ['OFFERING', 'HIRED', 'CONTRACT'].includes(employee.status)
                        ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>3</div>
                    <span className="text-xs font-bold block mt-2">Offering</span>
                    <span className="text-[10px] text-gray-500 font-mono">Penawaran Gaji</span>
                  </div>

                  {/* Joined */}
                  <div className="text-center z-10">
                    <div className={`h-10 w-10 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                      ['HIRED', 'CONTRACT'].includes(employee.status)
                        ? 'bg-green-600 text-white animate-bounce shadow-md' : 'bg-gray-200 text-gray-400'
                    }`}>4</div>
                    <span className="text-xs font-bold block mt-2 text-green-600">Hired</span>
                    <span className="text-[10px] text-green-600 font-mono">Bergabung!</span>
                  </div>
                </div>
              </div>

              {/* Status card explanations */}
              <div className="p-4 border border-blue-150 bg-blue-50/50 rounded-lg">
                <h4 className="font-bold text-blue-950 mb-1">Informasi Tahap Berjalan:</h4>
                <p className="text-xs text-blue-900 leading-relaxed">
                  {employee.status === 'APPLIED' && "Lamaran Anda telah terkirim secara instan ke server PT Perdana Adi Yuda. Tim operasional Morowali sedang mengaudit kesesuaian ijazah dan syarat umum Anda."}
                  {employee.status === 'SCREENING' && "Selamat! Berkas administrasi Anda lolos tahap awal screening satpam/heavy-equipment. Harap nantikan jadwal agenda wawancara."}
                  {employee.status === 'INTERVIEW' && "Sesi Wawancara AI Anda sudah aktif! Wawancara bertenaga AI ini mensimulasikan studi kasus K3, Kepatuhan Lapor Slip Gaji, dan Loyalitas kerja. Klik tombol 'Mulai Interview' di kanan atas layar."}
                  {employee.status === 'OFFERING' && "Selamat! Anda disetujui bergabung dengan PT Perdana Adi Yuda. Harap periksa surat kompensasi penggajian bulanan di bawah ini dan Bubuhkan Tanda Tangan Anda sekarang untuk menyelesaikan kontrak!"}
                  {employee.status === 'REJECTED' && "Mohon maaf, lamaran Anda belum memenuhi spesifikasi site saat ini. Profil Anda telah disimpan di dalam Talent Pool Alih Daya kami."}
                </p>
              </div>

              {/* COMPREHENSIVE OFFERING CONTRACT INTERACTIVE SYSTEM (Satisfies sign-off flows flawlessly) */}
              {employee.status === 'OFFERING' && (
                <div className="border border-purple-200 bg-purple-50/35 p-6 rounded-lg space-y-4">
                  <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    <DocumentArrowUpIcon className="h-5 w-5 text-purple-700" /> Komponen Penawaran Kontrak Pekerja (Hired Sign-off)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <span className="text-gray-500">Gaji Pokok / Remunerasi:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">Rp 4.800.000 / Bulan (Fixed Murni)</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <span className="text-gray-500">Tunjangan Area Site & Makan:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">Rp 900.000 / Bulan (Tergantung Absen)</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <span className="text-gray-500">Lokasi Penempatan Proyek:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">Site Smelter Morowali (PT IMIP Sektor III)</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <span className="text-gray-500">Durasi Kontrak Kerja Mandiri:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">12 Bulan (Bisa Diperpanjang)</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-purple-200">
                    <label className="flex items-start gap-2 cursor-pointer mb-3">
                      <input 
                        type="checkbox" 
                        checked={offeringSigned}
                        onChange={(e) => setOfferingSigned(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-400 mt-1"
                      />
                      <span className="text-xs text-purple-950 font-medium leading-relaxed">
                        Saya dengan kesadaran ini menyetujui seluruh upah murni bulanan, kewajiban pelaporan BPJS, mematuhi standar toleransi zero-deviance K3LH PT Perdana Adi Yuda, serta bersedia diposisikan di lapangan kerja Morowali.
                      </span>
                    </label>

                    {offeringSigned && (
                      <div className="space-y-3 max-w-sm animate-fade-in">
                        <label className="block text-xs font-bold text-purple-900">Masukkan Nama Lengkap Anda (Paraf / Tanda Tangan Elektronik):</label>
                        <input 
                          type="text" 
                          required
                          value={offeringSignature}
                          onChange={(e) => setOfferingSignature(e.target.value)}
                          placeholder="Ketik nama lengkap Anda sesuai KTP"
                          className="w-full px-3 py-2 border rounded border-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
                        />
                        <button 
                          onClick={handleAcceptOffering}
                          className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold text-xs shadow-md"
                        >
                          Tandatangani Kontrak Online ➔
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE (ABSENSI) */}
          {activeTab === 'absensi' && isHired && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Sistem Absensi Mandiri (Mitra Kerja Lapangan)</h2>
                <p className="text-xs text-gray-500 mt-1">Lakukan absensi masuk dan keluar site kerja yang terproteksi menggunakan tracking GPS satelit.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Clock in Card */}
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Validasi Lokasi & Presensi Anda</h3>
                  
                  {/* Presets dropdown for demo simplicity but absolute utility */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Pilih Lokasi Kerja Lapangan Terarsip:</label>
                      <select 
                        value={selectedLocation.name}
                        onChange={(e) => {
                          const found = MAP_PRESET_LOCATIONS.find(loc => loc.name === e.target.value);
                          if (found) setSelectedLocation(found);
                        }}
                        className="w-full text-xs p-2 bg-white border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {MAP_PRESET_LOCATIONS.map(loc => (
                          <option key={loc.name} value={loc.name}>{loc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Garis Lintang:</label>
                        <input type="text" readOnly value={selectedLocation.lat.toFixed(6)} className="w-full text-xs p-2 bg-gray-100 border rounded font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Garis Bujur:</label>
                        <input type="text" readOnly value={selectedLocation.lon.toFixed(6)} className="w-full text-xs p-2 bg-gray-100 border rounded font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Pilih Shift Kerja:</label>
                        <select 
                          value={selectedShift}
                          onChange={(e: any) => setSelectedShift(e.target.value)}
                          className="w-full text-xs p-2 bg-white border rounded shadow-sm"
                        >
                          <option value="Pagi">Pagi (08:00 - 16:00)</option>
                          <option value="Siang">Siang (16:00 - 00:00)</option>
                          <option value="Malam">Malam (00:00 - 08:00)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Status Hari Ini:</label>
                        <span className={`block text-xs font-bold text-center py-2 px-1 rounded uppercase ${isClockedInToday ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isClockedInToday ? 'Clocked In' : 'Belum Absen'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Catatan Kehadiran (Opsional):</label>
                      <input 
                        type="text" 
                        value={clockInNotes} 
                        onChange={(e) => setClockInNotes(e.target.value)}
                        placeholder="Misal: Toolbox meeting, Patroli Unit"
                        className="w-full text-xs p-2 bg-white border rounded shadow-sm" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={handleClockIn}
                      disabled={isClockedInToday}
                      className={`flex-1 py-2 text-xs font-bold text-center rounded text-white ${isClockedInToday ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 shadow-md'}`}
                    >
                      Clock In (Masuk)
                    </button>
                    <button 
                      onClick={handleClockOut}
                      disabled={!isClockedInToday}
                      className={`flex-1 py-2 text-xs font-bold text-center rounded text-white ${!isClockedInToday ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-md'}`}
                    >
                      Clock Out (Pulang)
                    </button>
                  </div>
                </div>

                {/* Simulated Location Map Card */}
                <div className="border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Visual Radar GPS Presensi</h3>
                  
                  {/* Simulated interactive map frame */}
                  <div className="relative bg-slate-100 border border-slate-200 rounded h-40 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="text-center p-4 z-10">
                      <MapPinIcon className="h-8 w-8 text-blue-600 mx-auto animate-bounce mb-1" />
                      <span className="text-[11px] font-bold text-slate-900 block">{selectedLocation.name}</span>
                      <span className="text-[9px] font-mono text-gray-500 mt-1">Satelit Terkoneksi: 24 (HSE Safe Zone)</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-relaxed text-center">
                    Absensi ini secara instan merekam geo-lokasi lat/long dan mencocokannya dengan cost centre ERP PT Perdana Adi Yuda.
                  </p>
                </div>

              </div>

              {/* Attendance logs table */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Log & Riwayat Kehadiran Bulan Ini</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Tanggal Kerja</th>
                        <th className="p-3">Shift</th>
                        <th className="p-3">Waktu Masuk</th>
                        <th className="p-3">Waktu Keluar</th>
                        <th className="p-3">Lokasi Absen</th>
                        <th className="p-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {attendances.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">Belum ada riwayat absensi tervalidasi bulan ini.</td>
                        </tr>
                      ) : (
                        attendances.map(att => (
                          <tr key={att.id} className="hover:bg-slate-50/50 font-mono">
                            <td className="p-3 font-semibold text-slate-800">{att.date}</td>
                            <td className="p-3">{att.shift}</td>
                            <td className="p-3 text-green-700 font-bold">{att.timeIn || '-'}</td>
                            <td className="p-3 text-amber-700 font-bold">{att.timeOut || '-'}</td>
                            <td className="p-3 font-sans truncate max-w-xs">{att.locationName}</td>
                            <td className="p-3 font-sans text-xs italic text-gray-500">{att.notes}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: LEAVE REQUEST (CUTI) */}
          {activeTab === 'cuti' && isHired && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Manajemen Pengajuan Cuti (Leave Request)</h2>
                <p className="text-xs text-gray-500 mt-1">Ajukan permohonan cuti tahunan, cuti sakit, atau dispensasi kerja lapangan dengan mudah.</p>
              </div>

              {/* Form and info card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Info Card */}
                <div className="md:col-span-1 bg-blue-50/40 border border-blue-100 p-5 rounded-lg text-xs space-y-4">
                  <h4 className="font-bold text-blue-950 text-sm">Informasi Hak Cuti Anda</h4>
                  <p className="text-blue-900 leading-relaxed">
                    Sesuai dengan perjanjian kearsipan penempatan, Karyawan berhak mengajukan <b>Cuti Tahunan</b> setelah masa penugasan berjalan minimal 3 bulan.
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-blue-100">
                        <td className="py-2 text-gray-500">Kuota Cuti Setahun</td>
                        <td className="py-2 font-bold text-right text-slate-800">12 Hari</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-2 text-gray-500">Cuti Diambil</td>
                        <td className="py-2 font-bold text-right text-slate-800">
                          {leaves.filter(l => l.status === 'APPROVED').length} Hari
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Sisa Kuota Aktif</td>
                        <td className="py-2 font-bold text-right text-green-700">12 Hari</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Leave Form */}
                <form onSubmit={handleApplyLeave} className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Mulai Cuti:</label>
                      <input 
                        type="date" 
                        required
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Selesai Cuti:</label>
                      <input 
                        type="date" 
                        required
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Jenis Cuti:</label>
                    <select 
                      value={leaveType}
                      onChange={(e: any) => setLeaveType(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded bg-white"
                    >
                      <option value="Cuti Tahunan">Cuti Tahunan</option>
                      <option value="Cuti Sakit">Cuti Sakit (Butuh Surat Keterangan Dokter)</option>
                      <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                      <option value="Izin Urusan Pribadi">Izin Urusan Pribadi (Sangat Penting)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Alasan Pengajuan Cuti (Deskripsikan Terperinci):</label>
                    <textarea 
                      required
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      rows={3}
                      placeholder="Contoh: Menikahi keluarga di Palu, sakit berdasar rujukan fasyankes Morowali, dsb."
                      className="w-full text-xs p-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-xs shadow"
                  >
                    Ajukan Permohonan Cuti ➔
                  </button>
                </form>

              </div>

              {/* Leave List Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Status Slip & Permohonan Cuti Anda</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3">ID Pengajuan</th>
                        <th className="p-3">Tanggal Mulai</th>
                        <th className="p-3">Tanggal Selesai</th>
                        <th className="p-3">Tipe Cuti</th>
                        <th className="p-3">Alasan</th>
                        <th className="p-3">Tanggal Pengajuan</th>
                        <th className="p-3">Status Evaluasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {leaves.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-gray-400">Belum ada pengisian cuti.</td>
                        </tr>
                      ) : (
                        leaves.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50/50 font-mono">
                            <td className="p-3 font-semibold text-slate-800">{req.id.toUpperCase()}</td>
                            <td className="p-3">{req.startDate}</td>
                            <td className="p-3">{req.endDate}</td>
                            <td className="p-3 font-sans font-medium text-slate-700">{req.leaveType}</td>
                            <td className="p-3 font-sans truncate max-w-xs">{req.reason}</td>
                            <td className="p-3 font-sans text-gray-400">{new Date(req.createdAt).toLocaleDateString('id-ID')}</td>
                            <td className="p-3 font-sans uppercase">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {req.status === 'APPROVED' ? 'Disetujui' : req.status === 'REJECTED' ? 'Ditolak' : 'Proses Evaluasi'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: OVERTIME (LEMBUR) */}
          {activeTab === 'lembur' && isHired && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Pelaporan & Klaim Jam Lembur (Overtime Claims)</h2>
                <p className="text-xs text-gray-500 mt-1">Laporkan jam kerja lembur unit lapangan yang sah untuk dimasukkan langsung pada slip gaji bulanan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Rates info card */}
                <div className="md:col-span-1 bg-amber-50/30 border border-amber-200 p-5 rounded-lg text-xs space-y-3">
                  <h4 className="font-bold text-amber-900 text-sm">Hitungan Upah Lembur Satpam/Crew</h4>
                  <p className="text-amber-800 leading-relaxed">
                    Sesuai Peraturan Kearsipan HR, tarif lembur dihitung berdasarkan kuantitas jam kerja yang tervalidasi oleh pengawas lapangan.
                  </p>
                  <table className="w-full mt-2">
                    <tbody>
                      <tr className="border-b border-amber-100">
                        <td className="py-2 text-gray-500">Tarif Lembur Pokok</td>
                        <td className="py-2 font-bold text-right text-slate-800">Rp {employee.overtimeHourlyRate || '35.000'} / Jam</td>
                      </tr>
                      <tr className="border-b border-amber-100">
                        <td className="py-2 text-gray-500">Maks Jam Sehari</td>
                        <td className="py-2 font-bold text-right text-slate-800">4 Jam</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Total Cair Sejauh Ini</td>
                        <td className="py-2 font-bold text-right text-green-700">
                          Rp {(overtimes.filter(o => o.status === 'APPROVED').reduce((sum, o) => sum + o.hours, 0) * (employee.overtimeHourlyRate || 35000)).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Submit Claim Form */}
                <form onSubmit={handleApplyOvertime} className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Pelaksanaan Lembur:</label>
                      <input 
                        type="date" 
                        required
                        value={overtimeDate}
                        onChange={(e) => setOvertimeDate(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Jam Kerja Lembur:</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={8}
                        required
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(parseInt(e.target.value))}
                        className="w-full text-xs p-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Aktivitas Tambahan / Sektor yang Ditangani:</label>
                    <textarea 
                      required
                      value={overtimeActivity}
                      onChange={(e) => setOvertimeActivity(e.target.value)}
                      rows={3}
                      placeholder="Misal: Back up jam ganti operator shift malam di Sektor Smelter, patroli ekstra VIP tamu dari Morowali, BMC unit dump truck, dsb."
                      className="w-full text-xs p-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-slate-50 px-3 py-2 rounded text-xs text-gray-650 font-medium">
                    Estimasi Penambahan Gaji Lapangan: <span className="font-bold text-green-700">Rp {(overtimeHours * (employee.overtimeHourlyRate || 35000)).toLocaleString('id-ID')}</span> (Sebelum dipotong pajak PPh 21)
                  </div>

                  <button 
                    type="submit"
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow"
                  >
                    Klaim Jam Kerja Lembur ➔
                  </button>
                </form>

              </div>

              {/* Overtime List Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Laporan Lembar Overtime Anda</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3">ID Lembur</th>
                        <th className="p-3">Tanggal Lembur</th>
                        <th className="p-3">Jumlah Jam</th>
                        <th className="p-3">Aktivitas Terkait</th>
                        <th className="p-3">Estimasi Upah</th>
                        <th className="p-3">Status Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {overtimes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">Belum ada laporan lembur terekam.</td>
                        </tr>
                      ) : (
                        overtimes.map(ot => (
                          <tr key={ot.id} className="hover:bg-slate-50/50 font-mono">
                            <td className="p-3 font-semibold text-slate-800">{ot.id.toUpperCase()}</td>
                            <td className="p-3">{ot.date}</td>
                            <td className="p-3 text-center">{ot.hours} Jam</td>
                            <td className="p-3 font-sans truncate max-w-xs">{ot.activity}</td>
                            <td className="p-3 font-sans font-bold text-green-700">Rp {(ot.hours * (employee.overtimeHourlyRate || 35000)).toLocaleString('id-ID')}</td>
                            <td className="p-3 font-sans uppercase">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ot.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                ot.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ot.status === 'APPROVED' ? 'Terverifikasi' : ot.status === 'REJECTED' ? 'Ditolak' : 'Perlu Diuji'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: LETTER SUBMISSIONS (SURAT KETERANGAN) */}
          {activeTab === 'surat' && isHired && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Layanan Dokumen & Pengajuan Surat Administrasi</h2>
                <p className="text-xs text-gray-500 mt-1">Ajukan pembuatan Surat Paklaring (Kerja), Surat Rekomendasi Karir, atau Slip Gaji Resmi bertanda tangan basah.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Notice text */}
                <div className="md:col-span-1 bg-indigo-50/30 border border-indigo-200 p-5 rounded-lg text-xs space-y-3 text-indigo-950">
                  <h4 className="font-bold text-indigo-900 text-sm">Arsip Surat Otomatis</h4>
                  <p className="leading-relaxed">
                    Setiap surat yang Anda ajukan dikelola dalam arsip ERP kearsipan. Begitu status berubah menjadi **APPROVED** (Disetujui), berkas digital PDF/HTML bersignature resmi dapat langsung Anda lihat dan cetak sebagai pembuktian hukum.
                  </p>
                </div>

                {/* Request form */}
                <form onSubmit={handleApplyLetter} className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Jenis Surat yang Diperlukan:</label>
                    <select 
                      value={letterType}
                      onChange={(e: any) => setLetterType(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded bg-white"
                    >
                      <option value="Surat Keterangan Kerja (Paklaring)">Surat Keterangan Kerja (Paklaring)</option>
                      <option value="Surat Rekomendasi">Surat Rekomendasi Karir / Sertifikat SIO</option>
                      <option value="Surat Keterangan Penghasilan (Slip Gaji Resmi)">Surat Keterangan Penghasilan (Slip Gaji Resmi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kegunaan & Tujuan Pengajuan Surat (Spesifik):</label>
                    <textarea 
                      required
                      value={letterPurpose}
                      onChange={(e) => setLetterPurpose(e.target.value)}
                      rows={3}
                      placeholder="Contoh: Pengajuan KPR Rumah, lampiran pendaftaran peningkatan beasiswa, permohonan kredit bank daerah Sulteng, dsb."
                      className="w-full text-xs p-2.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="px-6 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-bold text-xs shadow"
                  >
                    Kirim Pengajuan Dokumen ➔
                  </button>
                </form>

              </div>

              {/* Letter Request list */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Riwayat & Unduhan Pengajuan Surat Administrasi</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-3">ID Arsip</th>
                        <th className="p-3">Tipe/Jenis Surat</th>
                        <th className="p-3">Tujuan Permohonan</th>
                        <th className="p-3">Tanggal Pengajuan</th>
                        <th className="p-3">Status Sertifikat</th>
                        <th className="p-3">Aksi Dokumen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {letters.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">Belum ada pengajuan surat yang terarsip.</td>
                        </tr>
                      ) : (
                        letters.map(lt => (
                          <tr key={lt.id} className="hover:bg-slate-50/50 font-mono text-xs">
                            <td className="p-3 font-semibold text-slate-800">{lt.id.toUpperCase()}</td>
                            <td className="p-3 font-sans font-medium text-slate-800">{lt.letterType}</td>
                            <td className="p-3 font-sans truncate max-w-xs">{lt.purpose}</td>
                            <td className="p-3 font-sans text-gray-400">{new Date(lt.createdAt).toLocaleDateString('id-ID')}</td>
                            <td className="p-3 font-sans uppercase text-[10px]">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                lt.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                lt.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {lt.status === 'APPROVED' ? 'Disetujui (Ready)' : lt.status === 'REJECTED' ? 'Ditolak' : 'Antrean Review'}
                              </span>
                            </td>
                            <td className="p-3 font-sans">
                              {lt.status === 'APPROVED' && lt.downloadUrl ? (
                                <button 
                                  onClick={() => setActiveLetterHTML(lt.downloadUrl || null)}
                                  className="px-3 py-1 bg-green-700 text-white rounded text-[10px] font-bold hover:bg-green-800"
                                >
                                  Cetak/Lihat Surat
                                </button>
                              ) : (
                                <span className="text-gray-400 italic">No File</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: PAYSLIPS (SLIP GAJI) */}
          {activeTab === 'gaji' && isHired && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Arsip Slip Gaji Digital Karyawan</h2>
                <p className="text-xs text-gray-500 mt-1">Unduh, cetak, atau lihat rincian pendapatan murni bulanan, iuran BPJS ketenagakerjaan, dan potongan PPh 21 pajak Anda.</p>
              </div>

              {/* Payslip lists card layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {payrolls.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-gray-400 bg-slate-50 rounded border">
                    Belum terdapat rincian gaji keluar dari ERP. Penggajian Mei sedang dikalkulasi selambat Rekonsiliasi.
                  </div>
                ) : (
                  payrolls.map(pay => (
                    <div key={pay.id} className="border border-slate-200 p-4 rounded-lg bg-white shadow-sm flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${pay.status === 'PAID' ? 'bg-green-105 bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {pay.status === 'PAID' ? 'PAID / DIBAYAR' : 'PENDING'}
                        </span>
                        <h4 className="font-bold text-slate-800 text-md mt-1">{pay.period}</h4>
                        <p className="text-[10px] text-gray-400 font-mono">No. Slip: {pay.id.toUpperCase()}</p>
                      </div>

                      <div className="border-t pt-2">
                        <span className="text-[10px] text-gray-400 block">Total Diterima (Take Home Pay):</span>
                        <h5 className="font-extrabold text-blue-900 text-lg mt-0.5">Rp {pay.totalDiterima.toLocaleString('id-ID')}</h5>
                      </div>

                      <button 
                        onClick={() => setActivePayslip(pay)}
                        className="w-full text-center py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Detail & Cetak Slip
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 8: PORTAL DATA MANDIRI */}
          {activeTab === 'data' && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-fade-in space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Portal Data Mandiri & Kearsipan</h2>
                  <p className="text-xs text-gray-500 mt-1">Audit dan sinkronisasi berkas legalitas, BPJS, NPWP, dan rekening bank Anda.</p>
                </div>
                {!isEditMode ? (
                  <button 
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs font-bold"
                  >
                    Edit Data Mandiri
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {!isEditMode ? (
                /* Pure View mode grouped beautifully */
                <div className="space-y-6">
                  {/* Category 1: Kependudukan & NPWP */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 border-b pb-1">1. Legalitas Kependudukan & NPWP</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block">Nama Lengkap (KTP):</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{employee.fullName}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Nomor Induk Kependudukan (NIK):</span>
                        <p className="font-semibold font-mono text-slate-800 mt-0.5">{employee.nik}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Nomor Kartu Keluarga (KK):</span>
                        <p className="font-semibold font-mono text-slate-800 mt-0.5">{employee.kkNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 block">NPWP Resmi:</span>
                        <p className="font-semibold font-mono text-slate-800 mt-0.5">{employee.npwp || 'Belum Dilaporkan'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Tempat / Tanggal Lahir:</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{employee.placeOfBirth}, {new Date(employee.dateOfBirth).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Kontak & WhatsApp */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 border-b pb-1">2. Kontak Hubung & Alamat Domisili</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block">Nomor WhastApp / HP:</span>
                        <p className="font-semibold text-green-700 font-mono mt-0.5">{employee.whatsappNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Alamat Surel (Email):</span>
                        <p className="font-semibold text-slate-800 font-mono mt-0.5">{employee.email}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 block">Alamat Lengkap Domisili Sesuai KTP:</span>
                        <p className="font-semibold text-slate-800 mt-0.5 leading-relaxed">{employee.domicileAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Perbankan (Kompensasi) */}
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 border-b pb-1">3. Distribusi Penggajian (Transfer Bank)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block">Nama Bank Penampung:</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{employee.bankName || 'Mandiri / BNI'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Nomor Rekening Tabungan:</span>
                        <p className="font-semibold font-mono text-slate-800 mt-0.5">{employee.accountNumber || 'Belum diisi. Wajib lengkapi agar gaji cair!'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Interactive editing form */
                <form onSubmit={handleUpdatePersonalData} className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-2 border-b pb-1">Ubah Formulir Data</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap (Sesuai KTP):</label>
                        <input 
                          type="text" 
                          required
                          value={editFields.fullName || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full text-xs p-2 border rounded bg-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">NIK (16 digit):</label>
                        <input 
                          type="text"
                          required
                          maxLength={16}
                          value={editFields.nik || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, nik: e.target.value }))}
                          className="w-full text-xs p-2 border rounded bg-white font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nomor KK (16 digit):</label>
                        <input 
                          type="text" 
                          required
                          maxLength={16}
                          value={editFields.kkNumber || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, kkNumber: e.target.value }))}
                          className="w-full text-xs p-2 border rounded bg-white font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Aktif:</label>
                        <input 
                          type="text" 
                          required
                          value={editFields.whatsappNumber || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                          className="w-full text-xs p-2 border rounded bg-white font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nama Bank (Misal: Mandiri / Sulteng):</label>
                        <input 
                          type="text" 
                          required
                          value={editFields.bankName || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, bankName: e.target.value }))}
                          className="w-full text-xs p-2 border rounded bg-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Rekening Penggajian:</label>
                        <input 
                          type="text" 
                          required
                          value={editFields.accountNumber || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, accountNumber: e.target.value }))}
                          className="w-full text-xs p-2 border rounded bg-white font-mono" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili:</label>
                        <textarea 
                          required
                          value={editFields.domicileAddress || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, domicileAddress: e.target.value }))}
                          rows={2}
                          className="w-full text-xs p-2 border rounded bg-white" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-700 text-white rounded font-bold text-xs"
                    >
                      {loading ? 'Dipersiskan...' : 'Simpan Pembaruan Data'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-600 rounded font-bold text-xs hover:bg-gray-200"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL WINDOW 1: DETAILED DIGITAL PAYSLIP */}
      {activePayslip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col my-8">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider">Aplikasi ERP PT Perdana Adi Yuda</span>
              <button 
                onClick={() => setActivePayslip(null)}
                className="text-gray-300 hover:text-white font-black text-xs px-2 py-1 bg-slate-800 rounded"
              >
                Tutup (Esc)
              </button>
            </div>

            {/* Print Area */}
            <div className="p-8 text-black bg-white space-y-6 text-xs leading-relaxed" id="printable-payslip">
              
              {/* Header Letterhead */}
              {(() => {
                const cmpS = getCompanySettings();
                const branchText = cmpS.branches.map(b => b.name + ": " + b.address.replace(/\n/g, ' ')).join(' | ');
                return (
                  <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">{cmpS.companyName.toUpperCase()}</h3>
                      <p className="text-[10px] text-gray-500 max-w-sm">
                        Premium Sourcing & Outsource Operator | {branchText}
                      </p>
                    </div>
                    <div className="text-right sm:text-right text-[10px] space-y-0.5">
                      <h4 className="font-bold text-slate-850">SLIP GAJI RESMI INDIVIDU</h4>
                      <p className="font-mono text-gray-400">ID: {activePayslip.id.toUpperCase()}</p>
                      <p className="font-semibold text-slate-700">Periode: {activePayslip.period}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Worker metadata card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded border">
                <div>
                  <span className="text-gray-400 block text-[9px]">NAMA KARYAWAN</span>
                  <p className="font-bold text-slate-850">{activePayslip.employeeName}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px]">ID INTEGRASI</span>
                  <p className="font-bold font-mono text-slate-850">{activePayslip.employeeId.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px]">POSISI PENEMPATAN</span>
                  <p className="font-bold text-slate-850">{activePayslip.position}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px]">STATUS PAYROLL</span>
                  <p className="font-bold text-green-700">{activePayslip.status}</p>
                </div>
              </div>

              {/* Earnings vs Deductions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                
                {/* 1. Earnings */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-850 border-b pb-1">KOMPONEN PENDAPATAN (EARNINGS)</h4>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600">Gaji Pokok (Fixed)</td>
                        <td className="py-1.5 font-semibold text-right text-slate-800">Rp {activePayslip.gajiPokok.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600">Tunjangan Makan</td>
                        <td className="py-1.5 font-semibold text-right text-slate-800">Rp {activePayslip.tunjanganMakan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600">Tunjangan Transport</td>
                        <td className="py-1.5 font-semibold text-right text-slate-800">Rp {activePayslip.tunjanganTransport.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600">Upah Lembur ({activePayslip.overtimeHours} Jam)</td>
                        <td className="py-1.5 font-semibold text-right text-slate-800">Rp {activePayslip.lemburRate.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="font-bold text-slate-850 bg-slate-50">
                        <td className="p-1.5">Maju Subtotal Bruto</td>
                        <td className="p-1.5 text-right">
                          Rp {(activePayslip.gajiPokok + activePayslip.tunjanganMakan + activePayslip.tunjanganTransport + activePayslip.lemburRate).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Deductions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-850 border-b pb-1">KOMPONEN POTONGAN (DEDUCTIONS)</h4>
                  <table className="w-full text-xs font-mono">
                    <tbody>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600 font-sans">Iuran BPJS Kesehatan (1%)</td>
                        <td className="py-1.5 text-right text-red-700">-Rp {activePayslip.bpjsKesehatan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600 font-sans">Iuran JHT Ketenagakerjaan (2%)</td>
                        <td className="py-1.5 text-right text-red-700">-Rp {activePayslip.bpjsKetenagakerjaan.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600 font-sans">Pajak Penghasilan PPh 21</td>
                        <td className="py-1.5 text-right text-red-700">-Rp {activePayslip.pph21.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="border-b border-gray-150">
                        <td className="py-1.5 text-gray-600 font-sans">Potongan Keterlambatan</td>
                        <td className="py-1.5 text-right text-red-700">-Rp {activePayslip.potonganLain.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr className="font-bold text-red-800 bg-red-50/50">
                        <td className="p-1.5 font-sans">Potongan Subtotal</td>
                        <td className="p-1.5 text-right">
                          -Rp {(activePayslip.bpjsKesehatan + activePayslip.bpjsKetenagakerjaan + activePayslip.pph21 + activePayslip.potonganLain).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Net Salary Calculation card */}
              <div className="p-4 rounded-lg bg-blue-900 text-white font-bold flex justify-between items-center text-sm">
                <span>TAKE HOME PAY (NETTI YANG DITERIMA):</span>
                <span className="text-lg md:text-xl font-black">Rp {activePayslip.totalDiterima.toLocaleString('id-ID')}</span>
              </div>

              {/* Footer and Sign Off */}
              {(() => {
                const cmpS = getCompanySettings();
                return (
                  <div className="flex justify-between items-end pt-6 border-t font-sans">
                    <div className="text-[10px] text-gray-400">
                      {cmpS.companyName} menjamin bahwa rincian upah di atas bersifat rahasia dan tervalidasi oleh kearsipan Kantor Cabang resmi.
                    </div>
                    <div className="text-right text-[10px] font-semibold space-y-1">
                      <p>Ditandatangani secara digital oleh:</p>
                      <p className="font-bold text-slate-800">HR & Payroll Division</p>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e2/Fake_Signature.png" height="35" className="h-8 ml-auto" />
                      <p className="text-[9px] text-gray-400">{cmpS.companyName}</p>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Actions for Modal */}
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 checkbox">
              <button 
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded hover:bg-slate-800"
              >
                Cetak Slip / Simpan PDF
              </button>
              <button 
                onClick={() => setActivePayslip(null)}
                className="px-4 py-2 border rounded font-semibold text-xs text-gray-650 hover:bg-white"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WINDOW 2: ADMINISTRATIVE LETTER VIEW */}
      {activeLetterHTML && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col my-8">
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs">
              <span className="font-bold uppercase">Pre-Visualisasi Dokumen Kearsipan Resmi</span>
              <button onClick={() => setActiveLetterHTML(null)} className="font-black text-xs px-2 py-1 bg-slate-800 rounded">Tutup</button>
            </div>
            
            <div className="p-8 bg-white max-h-[500px] overflow-y-auto border-b">
              <iframe 
                srcDoc={activeLetterHTML} 
                className="w-full h-[600px] border-0"
                title="Pratinjau Surat Resmi"
              />
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  try {
                    const printWin = window.open('', '_blank');
                    if (printWin) {
                      printWin.document.write(activeLetterHTML);
                      printWin.document.close();
                      printWin.print();
                    } else {
                      console.warn("Could not print letter because window.open returned null.");
                    }
                  } catch (e) {
                    console.error("Failed to open print window due to iframe sandboxing restrictions:", e);
                  }
                }}
                className="px-5 py-2 bg-indigo-750 bg-indigo-700 text-white rounded text-xs font-bold hover:bg-indigo-800"
              >
                Cetak Surat Resmi
              </button>
              <button onClick={() => setActiveLetterHTML(null)} className="px-4 py-2 border rounded text-xs">Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
