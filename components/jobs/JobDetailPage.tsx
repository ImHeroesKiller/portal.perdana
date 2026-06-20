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
import { SectionHeader } from '../home/SectionHeader';
import { BRAND_NAVY } from '../home/homeContent';
import {
  ContentCard,
  MarketingPageShell,
  PageHero,
  PageTopBar,
} from '../layout/MarketingPageLayout';
import { useJobSeo } from '../../hooks/usePageSeo';
import { useLanguage } from '../../services/i18n';

type MetaItem = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
};

function JobMetaGrid({ items }: { items: MetaItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
              {item.label}
            </div>
            <p className="mt-1.5 text-xs font-extrabold leading-snug text-slate-800 sm:text-sm">
              {item.value}
            </p>
          </div>
        );
      })}
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
      className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white shadow-md transition hover:opacity-95 active:scale-[0.98] ${className}`}
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
  const { t, language } = useLanguage();
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

  const applyHref = job ? buildJobApplyHref(job, fields?.title) : '/apply';

  useJobSeo(job, language);

  const metaItems: MetaItem[] = fields
    ? [
        { label: t('job_meta_contract'), value: fields.type, icon: Briefcase },
        { label: t('job_meta_department'), value: fields.department, icon: Building2 },
        { label: t('job_meta_salary'), value: formatSalaryRange(fields.salaryRange), icon: Wallet },
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
    ? [clientName || 'PT Perdana Adi Yuda', fields.location].filter(Boolean).join(' • ')
    : '';

  const showLoading = (isLoading || isFetching) && rawJobs.length === 0;

  return (
    <div
      id="job-detail-page"
      className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800"
    >
      <PageTopBar
        backTo="/vacancies"
        backLabel={t('job_back_label')}
        badge={t('job_badge')}
      />

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
            <MarketingPageShell className="pb-[calc(9rem+env(safe-area-inset-bottom,0px))] md:pb-8">
              <PageHero
                compact
                eyebrow={fields.department}
                title={fields.title}
                subtitle={heroSubtitle}
                imageSrc="/assets/hero/site_workers.jpg"
                imageAlt={fields.title}
              />

              <ContentCard>
                <SectionHeader compact title={t('job_main_info')} />
                <JobMetaGrid items={metaItems} />
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#003087]/10 bg-blue-50/40 px-3.5 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#003087]" aria-hidden />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {t('job_placement_location')}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900">{fields.location}</p>
                  </div>
                </div>
              </ContentCard>

              {fields.description && (
                <ContentCard>
                  <SectionHeader compact title={t('job_description')} />
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {fields.description}
                  </p>
                </ContentCard>
              )}

              {fields.requirements.length > 0 && (
                <ContentCard>
                  <SectionHeader compact title={t('job_requirements')} />
                  <ul className="space-y-2.5">
                    {fields.requirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: BRAND_NAVY }}
                          aria-hidden
                        />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </ContentCard>
              )}

              {fields.requiredSkills.length > 0 && (
                <ContentCard>
                  <SectionHeader compact title={t('job_required_skills')} />
                  <div className="flex flex-wrap gap-2">
                    {fields.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex rounded-full border border-[#003087]/15 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#003087]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </ContentCard>
              )}

              <div className="hidden md:block">
                <ApplyButton href={applyHref} label={t('job_apply_now')} />
              </div>
            </MarketingPageShell>

            <div
              className="fixed inset-x-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
              style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <ApplyButton href={applyHref} label={t('job_apply_now')} />
            </div>
          </>
        ) : (
          !showLoading &&
          !isError && (
            <MarketingPageShell>
              <ContentCard className="text-center">
                <p className="text-sm font-bold text-slate-700">{t('job_not_found')}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {t('job_not_found_desc', { id: jobId || '—' })}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/vacancies')}
                  className="mt-5 min-h-[44px] rounded-xl px-5 py-2.5 text-xs font-bold text-[#003087] underline"
                >
                  {t('job_view_all')}
                </button>
              </ContentCard>
            </MarketingPageShell>
          )
        )}
      </DataFetchState>
    </div>
  );
};