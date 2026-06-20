
import React, { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserIcon,
  PhoneIcon,
  AcademicCapIcon,
  PaperClipIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { uploadFileMock } from '../services/db';
import { useJobs, createCandidate } from '../hooks/useDbQueries';
import { getCompanySettings } from '../services/companySettings';
import { getCurrentUser, updateUserProfile, createCredentialsForCandidateSubmit } from '../services/auth';
import { sendTelegramMessage } from '../services/telegram';
import { sendCandidateCredentialsNotification } from '../services/notifications';
import { NewEmployee } from '../types';
import { INITIAL_FORM_STATE, type FormDataState, type FileState } from '../types/recruitment-form';
import {
  validateRecruitmentStep,
  validateDocuments,
  type FieldErrors,
} from '../lib/recruitment-validation';
import { BRAND_NAVY } from './home/homeContent';
import { StepIdentity } from './recruitment/StepIdentity';
import { StepContact } from './recruitment/StepContact';
import { StepProfessional } from './recruitment/StepProfessional';
import { StepDocuments } from './recruitment/StepDocuments';
import { AIChatroomForm } from './AIChatroomForm';
import { FormModeSwitcher, type ApplyFormMode } from './recruitment/FormModeSwitcher';
import { WizardStepper } from './recruitment/WizardStepper';
import {
  ApplySuccessView,
  FormErrorBanner,
  NAVY_BTN,
  NAVY_BTN_OUTLINE,
  SaraPromoBanner,
} from './recruitment/recruitmentUi';

export type { FormDataState, FileState } from '../types/recruitment-form';

const STEPS = [
  { id: 1, title: 'Identitas', icon: UserIcon },
  { id: 2, title: 'Kontak', icon: PhoneIcon },
  { id: 3, title: 'Profesional', icon: AcademicCapIcon },
  { id: 4, title: 'Dokumen', icon: PaperClipIcon },
];

export const RecruitmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [formMode, setFormMode] = useState<ApplyFormMode>('manual');
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_STATE);
  const { data: availableJobs = [] } = useJobs({ activeOnly: true });
  const [files, setFiles] = useState<FileState>({
    applicationLetter: null,
    cv: null,
    ktp: null,
    diploma: null,
    photo: null,
    kk: null,
    certificate: null,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    isNew: boolean;
  } | null>(null);

  const gwSettings = getCompanySettings().googleWorkspace;
  const googleFormUrl = gwSettings?.formEmbedUrl || '';
  const currentUser = getCurrentUser();
  const initialPosition = searchParams.get('position') || '';
  const initialJobId = searchParams.get('jobId') || '';

  useEffect(() => {
    let userData = { ...INITIAL_FORM_STATE };

    if (currentUser?.profile) {
      userData = {
        ...INITIAL_FORM_STATE,
        ...currentUser.profile,
        graduationYear: currentUser.profile.graduationYear?.toString() || '',
        latitude: currentUser.profile.latitude?.toString() || '',
        longitude: currentUser.profile.longitude?.toString() || '',
      } as FormDataState;
    }
    if (initialPosition) userData.positionApplied = initialPosition;
    setFormData(userData);
  }, [initialPosition, currentUser]);

  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const titleFields = [
      'fullName',
      'placeOfBirth',
      'addressLine',
      'desa',
      'kecamatan',
      'kabupaten',
      'provinsi',
      'institutionName',
      'major',
      'bankName',
      'emergencyName',
    ];

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name as keyof FieldErrors];
      return next;
    });

    if (titleFields.includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: toTitleCase(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FileState) => {
    if (e.target.files?.[0]) {
      setFiles((prev) => ({ ...prev, [fieldName]: e.target.files![0] }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleNext = () => {
    const result = validateRecruitmentStep(currentStep, formData);
    if (!result.valid) {
      setError(result.message || 'Periksa kembali data Anda.');
      setFieldErrors(result.fieldErrors || {});
      return;
    }
    setError(null);
    setFieldErrors({});
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const docResult = validateDocuments(files);
    if (!docResult.valid) {
      setError(docResult.message || 'Dokumen belum lengkap.');
      setFieldErrors(docResult.fieldErrors || {});
      setLoading(false);
      return;
    }

    try {
      const filePaths: Record<string, string> = {};
      for (const [key, value] of Object.entries(files)) {
        filePaths[`${key}Path`] = value ? await uploadFileMock(value) : '';
      }

      let cleanCC = formData.whatsappCountryCode.replace(/[^0-9]/g, '') || '62';
      let cleanWA = formData.whatsappNumber.replace(/[^0-9]/g, '');
      if (cleanWA.startsWith('0')) cleanWA = cleanWA.substring(1);
      const finalWA = cleanWA.startsWith(cleanCC) ? `+${cleanWA}` : `+${cleanCC}${cleanWA}`;

      let cleanEC = formData.emergencyCountryCode.replace(/[^0-9]/g, '') || '62';
      let cleanEP = formData.emergencyPhone.replace(/[^0-9]/g, '');
      if (cleanEP.startsWith('0')) cleanEP = cleanEP.substring(1);
      const finalEP = cleanEP.startsWith(cleanEC) ? `+${cleanEP}` : `+${cleanEC}${cleanEP}`;

      const domicileAddress = `${formData.addressLine}, Desa ${formData.desa}, Kec. ${formData.kecamatan}, ${formData.kabupaten}, ${formData.provinsi}, RT ${formData.rt} RW ${formData.rw}`;

      const payload: NewEmployee = {
        ...formData,
        domicileAddress,
        whatsappNumber: finalWA,
        emergencyPhone: finalEP,
        graduationYear: parseInt(formData.graduationYear, 10) || 0,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        jobId: initialJobId || undefined,
        applicationLetterPath: filePaths.applicationLetterPath,
        cvPath: filePaths.cvPath,
        ktpPath: filePaths.ktpPath,
        diplomaPath: filePaths.diplomaPath,
        photoPath: filePaths.photoPath,
        kkPath: filePaths.kkPath,
        certificatePath: filePaths.certificatePath,
      };

      await createCandidate(payload, 'manual');

      const credentials = createCredentialsForCandidateSubmit(payload.email, payload.whatsappNumber);
      setCreatedCredentials(credentials);

      try {
        await sendCandidateCredentialsNotification(
          payload.fullName,
          payload.email,
          credentials.password,
          payload.positionApplied
        );
      } catch (gmailErr) {
        console.warn('Gmail credentials send skipped:', gmailErr);
      }

      if (currentUser) updateUserProfile(payload);
      if (payload.telegramId) {
        await sendTelegramMessage(payload.telegramId, `*Lamaran Terkirim*\nPosisi: ${payload.positionApplied}`);
      }

      setSubmittedName(formData.fullName);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim lamaran. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <ApplySuccessView
          submittedName={submittedName}
          credentials={createdCredentials}
          onLogin={() =>
            navigate(`/login?email=${encodeURIComponent(createdCredentials?.email || '')}`)
          }
          onNewApplication={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10 font-sans antialiased">
      <FormModeSwitcher
        mode={formMode}
        onChange={setFormMode}
        showGoogleForm={Boolean(googleFormUrl)}
      />

      {formMode === 'ai' ? (
        <AIChatroomForm
          initialPosition={initialPosition}
          initialJobId={initialJobId}
          onSwitchToManual={() => setFormMode('manual')}
        />
      ) : formMode === 'google_form' ? (
        <div className="relative mx-auto my-6 max-w-4xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/25"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Kembali
          </button>
          <div className="p-6 text-center text-white" style={{ backgroundColor: BRAND_NAVY }}>
            <h1 className="text-xl font-black">Google Form Terintegrasi</h1>
            <p className="mt-1 text-sm text-blue-100">PT Perdana Adi Yuda</p>
          </div>
          <div className="h-[min(700px,75vh)] w-full">
            <iframe
              src={googleFormUrl}
              width="100%"
              height="100%"
              className="border-none"
              title="Google Form Rekrutmen"
            />
          </div>
        </div>
      ) : (
        <div className="relative mx-auto my-6 max-w-4xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 z-10 flex min-h-[40px] items-center gap-1 rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/25"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Kembali
          </button>

          <div className="px-6 pb-6 pt-14 text-center text-white sm:pt-16" style={{ backgroundColor: BRAND_NAVY }}>
            <h1 className="text-xl font-black sm:text-2xl">Formulir Lamaran Kerja</h1>
            <p className="mt-1 text-sm text-blue-100">
              {initialPosition ? `Posisi: ${initialPosition}` : 'Lengkapi data Anda langkah demi langkah'}
            </p>
          </div>

          <WizardStepper steps={STEPS} currentStep={currentStep} />

          <form onSubmit={handleSubmit} className="p-5 sm:p-8">
            <SaraPromoBanner onStart={() => setFormMode('ai')} />
            {error && <FormErrorBanner message={error} />}

            <div className="min-h-[320px]">
              {currentStep === 1 && (
                <StepIdentity
                  formData={formData}
                  onChange={handleChange}
                  setFormData={setFormData}
                  jobs={availableJobs}
                  fieldErrors={fieldErrors}
                />
              )}
              {currentStep === 2 && (
                <StepContact
                  formData={formData}
                  onChange={handleChange}
                  setFormData={setFormData}
                  fieldErrors={fieldErrors}
                />
              )}
              {currentStep === 3 && (
                <StepProfessional
                  formData={formData}
                  onChange={handleChange}
                  fieldErrors={fieldErrors}
                />
              )}
              {currentStep === 4 && (
                <StepDocuments
                  files={files}
                  onFileChange={handleFileChange}
                  fieldErrors={fieldErrors}
                />
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
              {currentStep > 1 ? (
                <button type="button" onClick={() => setCurrentStep((p) => p - 1)} className={NAVY_BTN_OUTLINE}>
                  <ChevronLeftIcon className="h-4 w-4" aria-hidden />
                  Sebelumnya
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {currentStep < 4 ? (
                <button type="button" onClick={handleNext} className={NAVY_BTN} style={{ backgroundColor: BRAND_NAVY }}>
                  Lanjut
                  <ChevronRightIcon className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={NAVY_BTN}
                  style={{ backgroundColor: BRAND_NAVY }}
                >
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