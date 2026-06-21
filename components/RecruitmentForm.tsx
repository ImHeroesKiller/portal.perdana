
import React, { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserIcon,
  PhoneIcon,
  AcademicCapIcon,
  PaperClipIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
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
import { MarketingPageShell } from './layout/MarketingPageLayout';
import { BRAND_NAVY } from './home/homeContent';
import { StepIdentity } from './recruitment/StepIdentity';
import { StepContact } from './recruitment/StepContact';
import { StepProfessional } from './recruitment/StepProfessional';
import { StepDocuments } from './recruitment/StepDocuments';
import { AIChatroomForm } from './AIChatroomForm';
import type { ApplyFormMode } from './recruitment/FormModeSwitcher';
import { WizardStepper } from './recruitment/WizardStepper';
import {
  ApplySuccessPage,
  type ApplySuccessData,
  FormErrorBanner,
  NAVY_BTN,
  NAVY_BTN_OUTLINE,
  RecruitmentBackButton,
  WizardCard,
  WizardHero,
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
  const [successData, setSuccessData] = useState<ApplySuccessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const gwSettings = getCompanySettings().googleWorkspace;
  const googleFormUrl = gwSettings?.formEmbedUrl || '';
  const currentUser = getCurrentUser();
  const initialPosition = searchParams.get('position') || '';
  const initialJobId = searchParams.get('jobId') || '';
  const modeParam = searchParams.get('mode');

  useEffect(() => {
    if (modeParam === 'ai' || modeParam === 'manual' || modeParam === 'google_form') {
      setFormMode(modeParam);
    }
  }, [modeParam]);

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

      const result = await createCandidate(payload, 'manual');

      const credentials = createCredentialsForCandidateSubmit(payload.email, payload.whatsappNumber);

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

      setSuccessData({
        fullName: formData.fullName,
        position: formData.positionApplied,
        nik: formData.nik,
        email: formData.email,
        whatsapp: finalWA,
        referenceId: result.id,
        credentials,
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim lamaran. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const applyStartHref = (() => {
    const params = new URLSearchParams();
    if (initialPosition) params.set('position', initialPosition);
    if (initialJobId) params.set('jobId', initialJobId);
    const qs = params.toString();
    return qs ? `/apply/start?${qs}` : '/apply/start';
  })();

  if (success && successData) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased">
        <MarketingPageShell className="px-6 pb-10 pt-6 sm:px-6 sm:py-8">
          <ApplySuccessPage
            data={successData}
            onViewStatus={() =>
              navigate(`/login?email=${encodeURIComponent(successData.credentials?.email || successData.email || '')}`)
            }
            onApplyOther={() => navigate('/vacancies')}
            onGoHome={() => navigate('/')}
          />
        </MarketingPageShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10 font-sans antialiased">
      <MarketingPageShell className="gap-5 px-6 pb-10 pt-6 sm:gap-6 sm:px-6 sm:py-8">
        {formMode === 'ai' ? (
          <AIChatroomForm
            initialPosition={initialPosition}
            initialJobId={initialJobId}
            onSwitchToManual={() => setFormMode('manual')}
          />
        ) : formMode === 'google_form' ? (
          <>
            <RecruitmentBackButton onClick={() => navigate(applyStartHref)} />
            <WizardHero
              title="Google Form Terintegrasi"
              subtitle="Formulir resmi PT Perdana Adi Yuda"
              position={initialPosition || undefined}
            />
            <WizardCard>
              <div className="h-[min(700px,75vh)] w-full">
                <iframe
                  src={googleFormUrl}
                  width="100%"
                  height="100%"
                  className="border-none"
                  title="Google Form Rekrutmen"
                />
              </div>
            </WizardCard>
          </>
        ) : (
          <>
            <RecruitmentBackButton onClick={() => navigate(applyStartHref)} />

            <WizardHero
              title="Formulir Lamaran Kerja"
              subtitle="Lengkapi data Anda langkah demi langkah"
              position={initialPosition || undefined}
            />

            <WizardCard>
              <WizardStepper steps={STEPS} currentStep={currentStep} />

              <form onSubmit={handleSubmit} className="p-7 sm:p-8">
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

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100/90 pt-7 sm:flex-row sm:justify-between">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((p) => p - 1)}
                      className={NAVY_BTN_OUTLINE}
                    >
                      <ChevronLeftIcon className="h-4 w-4" aria-hidden />
                      Sebelumnya
                    </button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className={NAVY_BTN}
                      style={{ backgroundColor: BRAND_NAVY }}
                    >
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
            </WizardCard>
          </>
        )}
      </MarketingPageShell>
    </div>
  );
};