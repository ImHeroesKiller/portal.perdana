import React, { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  GraduationCap,
  MapPin,
  Send,
  UserRound,
  Wallet,
  Calendar,
} from 'lucide-react';
import { useJobs, useClients } from '../../hooks/useDbQueries';
import {
  buildJobApplyHref,
  formatGenderPreference,
  formatMaxAge,
  formatSalaryRange,
  getJobDetailFields,
} from '../../lib/job-display';
import { DataFetchState } from '../../src/components/DataFetchState';
import { BRAND_NAVY } from '../home/homeContent';
import { MarketingPageShell } from '../layout/MarketingPageLayout';
import {
  CardSectionHeader,
  NAVY_BTN,
  RecruitmentBackButton,
  WizardCard,
  WizardHero,
} from '../recruitment/recruitmentUi';
import { useJobSeo } from '../../hooks/usePageSeo';
import { useLanguage } from '../../services/i18n';

type MetaItem = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
};

function JobMetaGrid({ items }: { items: MetaItem[] }) {
  const primary = items.filter((i) => i.primary);
  const secondary = items.filter((i) => !i.primary);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
                {item.label}
              </div>
              <p className="mt-1.5 text-sm font-black leading-snug text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      {secondary.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {secondary.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white px-3.5 py-3"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
                  {item.label}
                </div>
                <p className="mt-1 text-xs font-black leading-snug text-slate-800 sm:text-sm">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ApplyButton({
  href,
  label,
  className = '',
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      to={href}
      className={`${NAVY_BTN} w-full sm:w-auto ${className}`}
      style={{ backgroundColor: BRAND_NAVY }}
    >
      <Send className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

export const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t, tVars, language } = useLanguage();
  const {
    data: jobs = [],
    allJobs,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useJobs();
  const { data: clients = [] } = useClients();

  const rawJobs = useMemo(() => (allJobs.length > 0 ? allJobs : jobs), [allJobs, jobs]);

  const job = useMemo(
    () => rawJobs.find((j) => j.id === jobId),
    [rawJobs, jobId]
  );

  const fields = useMemo(() => (job ? getJobDetailFields(job) : null), [job]);

  const clientName = useMemo(() => {
    if (!fields?.clientId) return '';
    return clients.find((c) => c.id === fields.clientId)?.name || '';
  }, [clients, fields?.clientId]);

  const companyLabel = clientName || 'PT Perdana Adi Yuda';
  const applyHref = job ? buildJobApplyHref(job, fields?.title) : '/apply/start';

  useJobSeo(job, language);

  const metaItems: MetaItem[] = fields
    ? [
        { label: t('job_meta_salary'), value: formatSalaryRange(fields.salaryRange), icon: Wallet, primary: true },
        { label: t('job_placement_location'), value: fields.location, icon: MapPin, primary: true },
        { label: t('job_meta_contract'), value: fields.type, icon: Briefcase, primary: true },
        { label: t('job_meta_department'), value: fields.department, icon: Building2, primary: true },
        { label: t('job_meta_education'), value: fields.minEducation || t('job_meta_unspecified'), icon: GraduationCap },
        { label: t('job_meta_age'), value: formatMaxAge(fields.maxAge), icon: Calendar },
        {
          label: t('job_meta_gender'),
          value: formatGenderPreference(fields.genderPreference),
          icon: UserRound,
        },
      ]
    : [];

  const heroSubtitle = fields
    ? [fields.department, fields.type, fields.location].filter(Boolean).join(' • ')
    : '';

  const showLoading = (isLoading || isFetching) && rawJobs.length === 0;

  return (
    <div
      id="job-detail-page"
      className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800"
    >
      <DataFetchState
        isLoading={showLoading}
        isFetching={isFetching && rawJobs.length > 0}
        error={isError ? error : null}
        isEmpty={false}
        onRetry={() => {
          void refetch();
        }}
        minHeight="16rem"
      >
        {job && fields ? (
          <>
            <MarketingPageShell className="gap-5 px-6 pb-[calc(9rem+env(safe-area-inset-bottom,0px))] pt-6 sm:gap-6 sm:px-6 sm:py-8 md:pb-10">
              <RecruitmentBackButton
                onClick={() => navigate('/vacancies')}
                label={t('job_back_label')}
              />

              <WizardHero
                showLogo
                title={fields.title}
                subtitle={heroSubtitle}
                company={companyLabel}
              />

              <WizardCard className="p-7 sm:p-8">
                <CardSectionHeader label={t('job_badge')} title={t('job_main_info')} />
                <JobMetaGrid items={metaItems} />
              </WizardCard>

              {fields.description && (
                <WizardCard className="p-7 sm:p-8">
                  <CardSectionHeader title={t('job_description')} />
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {fields.description}
                  </p>
                </WizardCard>
              )}

              {fields.requirements.length > 0 && (
                <WizardCard className="p-7 sm:p-8">
                  <CardSectionHeader title={t('job_requirements')} />
                  <ul className="space-y-2.5">
                    {fields.requirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500 ring-2 ring-cyan-200"
                          aria-hidden
                        />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </WizardCard>
              )}

              {fields.requiredSkills.length > 0 && (
                <WizardCard className="p-7 sm:p-8">
                  <CardSectionHeader title={t('job_required_skills')} />
                  <div className="flex flex-wrap gap-2">
                    {fields.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex rounded-full border border-[#003087]/15 bg-gradient-to-r from-blue-50 to-cyan-50/50 px-3 py-1.5 text-xs font-bold text-[#003087] ring-1 ring-[#003087]/10"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </WizardCard>
              )}

              <div className="hidden md:flex md:justify-center">
                <ApplyButton href={applyHref} label={t('job_apply_now')} className="min-w-[16rem] px-8" />
              </div>
            </MarketingPageShell>

            <div
              className="fixed inset-x-0 z-40 border-t border-slate-200/90 bg-white/95 px-6 py-3.5 shadow-[0_-4px_24px_rgba(0,48,135,0.12)] backdrop-blur-md md:hidden"
              style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <ApplyButton href={applyHref} label={t('job_apply_now')} />
            </div>
          </>
        ) : (
          !showLoading &&
          !isError && (
            <MarketingPageShell className="px-6 pb-10 pt-6 sm:px-6 sm:py-8">
              <RecruitmentBackButton
                onClick={() => navigate('/vacancies')}
                label={t('job_back_label')}
              />
              <WizardCard className="p-7 text-center sm:p-8">
                <CardSectionHeader title={t('job_not_found')} subtitle={tVars('job_not_found_desc', { id: jobId || '—' })} />
                <button
                  type="button"
                  onClick={() => navigate('/vacancies')}
                  className={`${NAVY_BTN} mt-4`}
                  style={{ backgroundColor: BRAND_NAVY }}
                >
                  {t('job_view_all')}
                </button>
              </WizardCard>
            </MarketingPageShell>
          )
        )}
      </DataFetchState>
    </div>
  );
};