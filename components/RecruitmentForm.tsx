
import React, { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createEmployee, uploadFileMock, getJobs } from '../services/db';
import { getCurrentUser, updateUserProfile } from '../services/auth';
import { sendTelegramMessage } from '../services/telegram';
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
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const [availableJobs, setAvailableJobs] = useState<JobVacancy[]>([]);
  const [files, setFiles] = useState<FileState>({
    applicationLetter: null, cv: null, ktp: null, diploma: null, photo: null, kk: null, certificate: null,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    const init = async () => {
      const jobs = await getJobs();
      setAvailableJobs(jobs.filter(j => j.isActive));
      
      const paramPosition = searchParams.get('position');
      let userData = { ...initialFormState };
      
      if (currentUser && currentUser.profile) {
        userData = { 
            ...initialFormState, ...currentUser.profile,
             graduationYear: currentUser.profile.graduationYear?.toString() || '',
             latitude: currentUser.profile.latitude?.toString() || '',
             longitude: currentUser.profile.longitude?.toString() || '',
        } as FormDataState;
      }
      if (paramPosition) userData.positionApplied = paramPosition;
      setFormData(userData);
    };
    init();
  }, [searchParams]);

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

      await createEmployee(payload);
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
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-lg text-center animate-fade-in">
        <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lamaran Terkirim!</h2>
        <p className="text-gray-600 mb-6">Terima kasih {submittedName}, data Anda berhasil kami terima.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Kirim Lagi</button>
      </div>
    );
  }

  return (
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
  );
};
