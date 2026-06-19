
import React, { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createCandidate, uploadFileMock } from '../services/db';
import { useJobs } from '../hooks/useDbQueries';
import { getCompanySettings } from '../services/companySettings';
import { getCurrentUser, updateUserProfile, createCredentialsForCandidateSubmit } from '../services/auth';
import { sendTelegramMessage } from '../services/telegram';
import { sendCandidateCredentialsNotification } from '../services/notifications';
import { NewEmployee, JobVacancy } from '../types';
import {
  UserIcon, PhoneIcon, AcademicCapIcon, BriefcaseIcon, 
  BanknotesIcon, PaperClipIcon, CheckCircleIcon, ChevronRightIcon, ChevronLeftIcon
} from '@heroicons/react/24/outline';

// Import Modular Steps
import { StepIdentity } from './recruitment/StepIdentity';
import { StepContact } from './recruitment/StepContact';
import { StepProfessional } from './recruitment/StepProfessional';
import { StepDocuments } from './recruitment/StepDocuments';
import { AIChatroomForm } from './AIChatroomForm';

// Shared Types
export interface FormDataState {
  // Identity
  positionApplied: string; fullName: string; nik: string; kkNumber: string;
  npwp: string; placeOfBirth: string; dateOfBirth: string; gender: string;
  religion: string; maritalStatus: string;
  willingToRelocate: string;
  certifications: string;
  customCertifications: string; // New field
  // Contact
  whatsappCountryCode: string; whatsappNumber: string; // Separated
  email: string;
  // Address Hiera
  addressLine: string; provinsi: string; kabupaten: string; kecamatan: string; desa: string; rt: string; rw: string;
  latitude: string; longitude: string; telegramId: string;
  facebook: string; instagram: string; twitter: string; linkedin: string;
  // Education & Exp
  lastEducation: string; institutionName: string; major: string;
  graduationYear: string; skills: string; workExperience: string;
  // Bank & Emergency
  bankName: string; accountNumber: string;
  emergencyName: string; emergencyRelation: string; emergencyCountryCode: string; emergencyPhone: string;
}

export interface FileState {
  applicationLetter: File | null; cv: File | null; ktp: File | null;
  diploma: File | null; photo: File | null; kk: File | null; certificate: File | null;
}

const initialFormState: FormDataState = {
  positionApplied: '', fullName: '', nik: '', kkNumber: '', npwp: '', placeOfBirth: '', dateOfBirth: '', gender: '', religion: '', maritalStatus: '',
  willingToRelocate: 'Ya', certifications: '', customCertifications: '',
  whatsappCountryCode: '+62', whatsappNumber: '', email: '',
  addressLine: '', provinsi: '', kabupaten: '', kecamatan: '', desa: '', rt: '', rw: '',
  latitude: '', longitude: '', telegramId: '', facebook: '', instagram: '', twitter: '', linkedin: '',
  lastEducation: '', institutionName: '', major: '', graduationYear: '', skills: '', workExperience: '',
  bankName: '', accountNumber: '', emergencyName: '', emergencyRelation: '', emergencyCountryCode: '+62', emergencyPhone: '',
};

const STEPS = [
    { id: 1, title: 'Identitas', icon: UserIcon },
    { id: 2, title: 'Kontak', icon: PhoneIcon },
    { id: 3, title: 'Profesional', icon: AcademicCapIcon },
    { id: 4, title: 'Dokumen', icon: PaperClipIcon }
];

export const RecruitmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [formMode, setFormMode] = useState<'manual' | 'ai' | 'google_form'>('manual');
  const [useAIChat, setUseAIChat] = useState(false);
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const { data: availableJobs = [] } = useJobs({ activeOnly: true });
  const [files, setFiles] = useState<FileState>({
    applicationLetter: null, cv: null, ktp: null, diploma: null, photo: null, kk: null, certificate: null,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; isNew: boolean } | null>(null);

  // Read Google Form embed url from settings
  const gwSettings = getCompanySettings().googleWorkspace;
  const googleFormUrl = gwSettings?.formEmbedUrl || '';

  // Handle switching modes cleanly
  const changeMode = (mode: 'manual' | 'ai' | 'google_form') => {
    setFormMode(mode);
    setUseAIChat(mode === 'ai');
  };

  const currentUser = getCurrentUser();

  useEffect(() => {
    const paramPosition = searchParams.get('position');
    let userData = { ...initialFormState };

    if (currentUser && currentUser.profile) {
      userData = {
        ...initialFormState,
        ...currentUser.profile,
        graduationYear: currentUser.profile.graduationYear?.toString() || '',
        latitude: currentUser.profile.latitude?.toString() || '',
        longitude: currentUser.profile.longitude?.toString() || '',
      } as FormDataState;
    }
    if (paramPosition) userData.positionApplied = paramPosition;
    setFormData(userData);
  }, [searchParams, currentUser]);

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const standardFields = ['fullName', 'placeOfBirth', 'addressLine', 'desa', 'kecamatan', 'kabupaten', 'provinsi', 'institutionName', 'major', 'bankName', 'emergencyName'];
    
    if (standardFields.includes(name)) {
        setFormData(prev => ({ ...prev, [name]: toTitleCase(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FileState) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const validateStep = (step: number) => {
      setError(null);

      if (step === 1) {
          if (!formData.positionApplied) { setError('Mohon pilih posisi yang dilamar.'); return false; }
          if (!formData.fullName) { setError('Nama Lengkap wajib diisi.'); return false; }
          
          if (!formData.nik) { setError('NIK wajib diisi.'); return false; }
          if (!/^\d{16}$/.test(formData.nik)) { setError('NIK harus berupa 16 digit angka.'); return false; }
          
          if (!formData.kkNumber) { setError('Nomor Kartu Keluarga (KK) wajib diisi.'); return false; }
          if (!/^\d{16}$/.test(formData.kkNumber)) { setError('Nomor KK harus berupa 16 digit angka.'); return false; }
          
          if (!formData.placeOfBirth) { setError('Tempat Lahir wajib diisi.'); return false; }
          
          if (!formData.dateOfBirth) { setError('Tanggal Lahir wajib diisi.'); return false; }
          const dob = new Date(formData.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
              age--;
          }
          if (age < 18) { setError('Pelamar wajib berusia minimal 18 tahun.'); return false; }
          if (age > 60) { setError('Pelamar berusia maksimal 60 tahun.'); return false; }

          if (!formData.gender) { setError('Mohon tentukan Gender.'); return false; }
          if (!formData.religion) { setError('Mohon tentukan Agama.'); return false; }
          if (!formData.maritalStatus) { setError('Mohon pilih Status Pernikahan.'); return false; }
      } 
      else if (step === 2) {
          if (!formData.whatsappNumber) { setError('Nomor WhatsApp wajib diisi.'); return false; }
          const cleanedWA = formData.whatsappNumber.replace(/[\s\-\+]/g, '');
          if (!/^\d{9,15}$/.test(cleanedWA)) {
              setError('Nomor WhatsApp tidak valid. Masukkan angka mulai dari 9 hingga 15 karakter.');
              return false;
          }
          if (!formData.email) { setError('Alamat Email wajib diisi.'); return false; }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
              setError('Alamat Email tidak valid.');
              return false;
          }
      }
      else if (step === 3) {
          if (!formData.lastEducation) { setError('Pendidikan Terakhir wajib diisi.'); return false; }
          if (!formData.institutionName) { setError('Nama Institusi wajib diisi.'); return false; }
          if (!formData.major) { setError('Jurusan wajib diisi.'); return false; }
          if (!formData.graduationYear) { setError('Tahun Kelulusan wajib diisi.'); return false; }
          
          const gradY = parseInt(formData.graduationYear);
          const thisY = new Date().getFullYear();
          if (gradY < 1960 || gradY > thisY + 5) {
              setError(`Tahun Lulus harus di antara 1960 dan ${thisY + 5}.`);
              return false;
          }
          if (!formData.skills) { setError('Mohon isi Keahlian (Skill) Anda.'); return false; }
      }
      
      return true;
  };

  const handleNext = () => {
      if (!validateStep(currentStep)) {
          return;
      }
      setError(null);
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate Documents (Step 4)
    if (!files.applicationLetter || !files.cv || !files.ktp || !files.photo) {
        setError('Wajib upload: Surat Lamaran, CV, KTP, dan Foto Diri');
        setLoading(false);
        return;
    }

    try {
      const filePaths: Record<string, string> = {};
      for (const [key, value] of Object.entries(files)) {
        if (value) filePaths[`${key}Path`] = await uploadFileMock(value);
        else filePaths[`${key}Path`] = '';
      }

      // 1. Format and prepend "+62" (or selected country code) to whatsappNumber
      let cleanCC = formData.whatsappCountryCode.replace(/[^0-9]/g, '') || '62';
      let cleanWA = formData.whatsappNumber.replace(/[^0-9]/g, '');
      if (cleanWA.startsWith('0')) {
        cleanWA = cleanWA.substring(1);
      }
      const finalWA = cleanWA.startsWith(cleanCC) ? `+${cleanWA}` : `+${cleanCC}${cleanWA}`;

      // 2. Format and prepend country code to emergencyPhone
      let cleanEC = formData.emergencyCountryCode.replace(/[^0-9]/g, '') || '62';
      let cleanEP = formData.emergencyPhone.replace(/[^0-9]/g, '');
      if (cleanEP.startsWith('0')) {
        cleanEP = cleanEP.substring(1);
      }
      const finalEP = cleanEP.startsWith(cleanEC) ? `+${cleanEP}` : `+${cleanEC}${cleanEP}`;

      const domicileAddress = `${formData.addressLine}, Desa ${formData.desa}, Kec. ${formData.kecamatan}, ${formData.kabupaten}, ${formData.provinsi}, RT ${formData.rt} RW ${formData.rw}`;
      const payload: NewEmployee = {
        ...formData,
        domicileAddress,
        whatsappNumber: finalWA,
        emergencyPhone: finalEP,
        graduationYear: parseInt(formData.graduationYear) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        applicationLetterPath: filePaths['applicationLetterPath'],
        cvPath: filePaths['cvPath'],
        ktpPath: filePaths['ktpPath'],
        diplomaPath: filePaths['diplomaPath'],
        photoPath: filePaths['photoPath'],
        kkPath: filePaths['kkPath'],
        certificatePath: filePaths['certificatePath'],
      };

      await createCandidate(payload, 'manual');
      
      // Automatically generate access credentials for the new applicant
      const credentials = createCredentialsForCandidateSubmit(payload.email, payload.whatsappNumber);
      setCreatedCredentials(credentials);

      // Attempt to send the credentials via Gmail API automatically
      try {
        await sendCandidateCredentialsNotification(payload.fullName, payload.email, credentials.password, payload.positionApplied);
      } catch (gmailErr) {
        console.warn("Gmail API credentials auto-send failed (Expected if Admin is not synced in this browser):", gmailErr);
      }

      if (currentUser) updateUserProfile(payload);
      if (payload.telegramId) await sendTelegramMessage(payload.telegramId, `*Lamaran Terkirim*\nPosisi: ${payload.positionApplied}`);

      setSubmittedName(formData.fullName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-15 p-8 sm:p-10 bg-white rounded-3xl shadow-xl border border-slate-100 text-center animate-fade-in font-sans">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-4">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Lamaran Terkirim!</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Terima kasih <b>{submittedName}</b>, berkas administrasi dan data lamaran kerja Anda berhasil kami arsipkan di database internal perusahaan.
        </p>

        {/* Credentials Info card */}
        {createdCredentials && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-8 text-left space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">🔐 Akun Portal Anda Telah Dibuat</span>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border border-indigo-150 uppercase tracking-widest animate-pulse">AKTIF</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              Sistem telah menerima formulir baru Anda dan otomatis membuat akun agar Anda dapat memantau status lamaran secara langsung. Kredensial login Anda juga diusahakan terkirim otomatis via email (Gmail API):
            </p>
            <div className="space-y-2 font-sans">
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Username (Email Anda)</span>
                <div className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl mt-1">
                  <span className="text-xs font-mono font-bold text-slate-705 truncate select-all">{createdCredentials.email}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      alert('Username disalin ke clipboard!');
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Salin
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kata Sandi (Password Otomatis)</span>
                <div className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl mt-1">
                  <span className="text-xs font-mono font-bold text-slate-800 select-all">{createdCredentials.password}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      alert('Kata sandi disalin ke clipboard!');
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Salin
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-amber-600 font-bold leading-normal italic pl-1 pt-1">
              Catatan: Pastikan Anda menyalin kredensial ini sekarang untuk masuk ke Portal. Admin juga akan mengirimkannya secara manual via WhatsApp sebagai alternatif.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <button 
            onClick={() => {
              navigate(`/login?email=${encodeURIComponent(createdCredentials?.email || '')}`);
            }} 
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            🔑 Masuk Melacak Progres
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-750 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Kirim Ulang / Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sticky Dual/Triple Mode Switcher Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-xs text-gray-500 font-medium font-sans">
          Mendaftar Pekerjaan di <b>PT Perdana Adi Yuda</b>: Pilih metode pengisian data pendaftaran Anda.
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            id="btn_mode_traditional"
            onClick={() => changeMode('manual')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${formMode === 'manual' ? 'bg-blue-900 border-blue-900 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            📝 Formulir Manual
          </button>
          <button
            type="button"
            id="btn_mode_ai"
            onClick={() => changeMode('ai')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${formMode === 'ai' ? 'bg-blue-950 border-blue-950 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            💬 Virtual Assistant SARA
          </button>
          {googleFormUrl && (
            <button
              type="button"
              id="btn_mode_google_form"
              onClick={() => changeMode('google_form')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${formMode === 'google_form' ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              📊 Google Form Sematan
            </button>
          )}
        </div>
      </div>

      {formMode === 'ai' ? (
        <AIChatroomForm />
      ) : formMode === 'google_form' ? (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden my-8 relative">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="absolute top-4 left-4 text-white hover:text-blue-150 transition-colors flex items-center gap-1 bg-white/15 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-white/25 active:scale-95"
          >
            <ChevronLeftIcon className="h-4 w-4 stroke-2" /> Kembali
          </button>

          <div className="bg-blue-900 text-white p-6 text-center">
              <h1 className="text-2xl font-bold">Google Form Terintegrasi</h1>
              <p className="text-blue-200 text-sm">PT Perdana Adi Yuda</p>
          </div>

          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <span className="text-xs text-emerald-800 font-medium">Modul Form rekrutmen dialihkan ke Google Forms resmi PT Perdana Adi Yuda. Mohon selesaikan pendaftaran Anda secara langsung melalui media form di bawah ini.</span>
          </div>

          <div className="w-full overflow-hidden" style={{ height: '700px' }}>
            <iframe 
              src={googleFormUrl} 
              width="100%" 
              height="100%" 
              className="border-none"
              title="Google Form Rekrutmen"
            >
              Loading…
            </iframe>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden my-8 relative">
          {/* Absolute Header Back navigation */}
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="absolute top-4 left-4 text-white hover:text-blue-150 transition-colors flex items-center gap-1 bg-white/15 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-white/25 active:scale-95"
          >
            <ChevronLeftIcon className="h-4 w-4 stroke-2" /> Kembali
          </button>

          <div className="bg-blue-900 text-white p-6 text-center">
              <h1 className="text-2xl font-bold">Formulir Rekrutmen</h1>
              <p className="text-blue-200 text-sm">PT Perdana Adi Yuda</p>
          </div>

          <div className="bg-gray-50 p-4 border-b">
              <div className="flex justify-between max-w-2xl mx-auto">
                  {STEPS.map((step) => {
                      const Icon = step.icon;
                      const active = currentStep === step.id;
                      const done = currentStep > step.id;
                      return (
                          <div key={step.id} className={`flex flex-col items-center ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                              <Icon className={`h-6 w-6 mb-1 ${active || done ? 'stroke-2' : ''}`} />
                              <span className="text-xs font-medium">{step.title}</span>
                          </div>
                      );
                  })}
              </div>
              <div className="h-1 bg-gray-200 mt-2 rounded-full overflow-hidden max-w-2xl mx-auto">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
              </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white">💬</div>
                <div>
                   <h4 className="text-xs font-bold text-indigo-900">Ingin dibantu Sara?</h4>
                   <p className="text-[10px] text-indigo-700">Gunakan Virtual Assistant untuk mengisi form lebih cepat.</p>
                </div>
              </div>
                <button type="button" onClick={() => setUseAIChat(true)} className="w-full sm:w-auto px-4 py-2 bg-indigo-700 text-white text-xs font-bold rounded-xl hover:bg-indigo-900 transition-all shadow-sm">
                    Gunakan Virtual Assistant
                </button>
            </div>
            {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm">{error}</div>}

            <div className="min-h-[400px]">
                {currentStep === 1 && <StepIdentity formData={formData} onChange={handleChange} setFormData={setFormData} jobs={availableJobs} />}
                {currentStep === 2 && <StepContact formData={formData} onChange={handleChange} setFormData={setFormData} />}
                {currentStep === 3 && <StepProfessional formData={formData} onChange={handleChange} />}
                {currentStep === 4 && <StepDocuments formData={formData} onChange={handleChange} files={files} onFileChange={handleFileChange} />}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t">
                {currentStep > 1 ? (
                    <button type="button" onClick={() => setCurrentStep(p => p - 1)} className="flex items-center px-6 py-2 border border-gray-300 rounded hover:bg-gray-50">
                        <ChevronLeftIcon className="h-4 w-4 mr-1" /> Kembali
                    </button>
                ) : <div />}

                {currentStep < 4 ? (
                    <button type="button" onClick={handleNext} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Lanjut <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </button>
                ) : (
                    <button type="submit" disabled={loading} className="flex items-center px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        {loading ? 'Mengirim...' : 'Kirim Lamaran'}
                    </button>
                )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
