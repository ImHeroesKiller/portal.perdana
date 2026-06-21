import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useJobs, useClients } from '../hooks/useDbQueries';
import { applyPublicJobFilter, applyVacancyFilters } from '../lib/job-filters';
import type { JobDisplayFields } from '../lib/job-display';
import { JobList } from './jobs/JobList';
import { VacancyFilterChips } from './jobs/VacancyFilterChips';
import { VacancyJobCard, resolveVacancyCardFields } from './jobs/VacancyJobCard';
import { buildJobApplyHref, buildJobDetailHref, getJobDetailFields } from '../lib/job-display';
import { VACANCY_FILTER_OPTIONS, type VacancyFilter } from './home/homeContent';
import { setSeoOverride } from '../hooks/usePageSeo';
import {
  buildJobListJsonLd,
  getOrganizationJsonLd,
  getWebSiteJsonLd,
  resolvePageSeo,
} from '../lib/seo';
import { appLangToSeoLocale, useLanguage } from '../services/i18n';
import { MarketingPageShell } from './layout/MarketingPageLayout';
import {
  CardSectionHeader,
  NAVY_BTN,
  NAVY_BTN_OUTLINE,
  RecruitmentBackButton,
  WizardCard,
  WizardHero,
} from './recruitment/recruitmentUi';
import { BRAND_NAVY } from './home/homeContent';
import { Search, SlidersHorizontal, FileText, Briefcase, Loader2 } from 'lucide-react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function VacanciesLoadingCard() {
  return (
    <WizardCard className="flex min-h-[14rem] flex-col items-center justify-center gap-4 p-8">
      <ArrowPathIcon className="h-10 w-10 animate-spin text-[#003087]" aria-hidden />
      <div className="text-center">
        <p className="text-sm font-black text-slate-900">Memuat lowongan...</p>
        <p className="mt-1 text-xs text-slate-500">Mohon tunggu sebentar</p>
      </div>
    </WizardCard>
  );
}

function VacanciesEmptyCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <WizardCard className="p-7 text-center sm:p-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 ring-4 ring-cyan-400/20">
        <Briefcase className="h-8 w-8 text-[#003087]" aria-hidden />
      </div>
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`${NAVY_BTN_OUTLINE} mt-5`}
        >
          {actionLabel}
        </button>
      )}
    </WizardCard>
  );
}

function VacanciesErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <WizardCard className="p-7 text-center sm:p-8">
      <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500" aria-hidden />
      <h3 className="mt-3 text-lg font-black text-slate-900">Gagal memuat data</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`${NAVY_BTN} mt-5`}
          style={{ backgroundColor: BRAND_NAVY }}
        >
          Coba Lagi
        </button>
      )}
    </WizardCard>
  );
}

export const VacanciesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, tVars, language } = useLanguage();
  const {
    data: jobs = [],
    allJobs,
    isLoading: loading,
    isFetching,
    isError,
    error,
    refetch,
  } = useJobs();
  const { data: clients = [] } = useClients();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<VacancyFilter>('Semua');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [mapModalData, setMapModalData] = useState<{ lat: number; lng: number; title: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const locale = appLangToSeoLocale(language);
    const base = resolvePageSeo('/vacancies', '', locale);
    const activeJobs = jobs.filter((j) => j.isActive);
    setSeoOverride({
      ...base,
      jsonLd: [getOrganizationJsonLd(), getWebSiteJsonLd(), buildJobListJsonLd(activeJobs)],
    });
    return () => setSeoOverride(null);
  }, [jobs, language]);

  useEffect(() => {
    const saved = localStorage.getItem('bookmarked_jobs');
    if (saved) {
      try {
        setBookmarkedJobs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleBookmark = (id: string) => {
    const updated = bookmarkedJobs.includes(id)
      ? bookmarkedJobs.filter((bId) => bId !== id)
      : [...bookmarkedJobs, id];
    setBookmarkedJobs(updated);
    localStorage.setItem('bookmarked_jobs', JSON.stringify(updated));
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);

    const filter = searchParams.get('filter');
    if (filter && VACANCY_FILTER_OPTIONS.includes(filter as VacancyFilter)) {
      setSelectedFilter(filter as VacancyFilter);
    }
  }, [searchParams]);

  const rawJobs = useMemo(
    () => (allJobs.length > 0 ? allJobs : jobs),
    [allJobs, jobs]
  );

  const { jobs: publicJobs, filterRelaxed: publicFilterRelaxed } = useMemo(
    () => applyPublicJobFilter(rawJobs),
    [rawJobs]
  );

  const { jobs: uiFilteredJobs, filterRelaxed: uiFilterRelaxed } = useMemo(
    () => applyVacancyFilters(publicJobs, searchQuery, selectedFilter),
    [publicJobs, searchQuery, selectedFilter]
  );

  const jobsToRender = useMemo(() => {
    if (uiFilteredJobs.length > 0) return uiFilteredJobs;
    if (publicJobs.length > 0) return publicJobs;
    if (rawJobs.length > 0) return rawJobs;
    return [];
  }, [uiFilteredJobs, publicJobs, rawJobs]);

  const filterRelaxed = uiFilterRelaxed || publicFilterRelaxed;
  const fetchInProgress = loading || isFetching;
  const showLoading = fetchInProgress && rawJobs.length === 0;
  const hasNoJobsAtAll =
    !fetchInProgress && !isError && rawJobs.length === 0 && jobsToRender.length === 0;
  const hasJobsButFilteredEmpty =
    !showLoading &&
    !isError &&
    rawJobs.length > 0 &&
    uiFilteredJobs.length === 0 &&
    jobsToRender.length > 0 &&
    !filterRelaxed;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFilter('Semua');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getClientName = (clientId?: string) => {
    return clients.find((c) => c.id === clientId)?.name || '';
  };

  const handleOpenMap = (lat?: number, lng?: number, title?: string) => {
    if (lat && lng) {
      setMapModalData({ lat, lng, title: title || t('vacancies_location_default') });
    } else {
      setMapModalData({ lat: -2.6781, lng: 121.9315, title: title || 'Morowali' });
    }
  };

  return (
    <div className="min-h-screen select-none bg-slate-50 pb-24 font-sans antialiased text-slate-800">
      <MarketingPageShell className="gap-5 px-6 pb-8 pt-6 sm:gap-6 sm:px-6 sm:py-8">
        <RecruitmentBackButton
          onClick={() => navigate('/')}
          label={t('vacancies_back_aria')}
        />

        <WizardHero
          showLogo
          title={t('vacancies_title')}
          subtitle={t('vacancies_subtitle')}
        />

        <WizardCard className="p-5 sm:p-6">
          <CardSectionHeader
            label={t('vacancies_filter')}
            title={t('vacancies_search_aria')}
            subtitle={t('vacancies_search_placeholder')}
          />
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                className="block w-full rounded-2xl border border-slate-100 bg-slate-50/80 py-3.5 pl-10 pr-4 text-sm font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#003087]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/20"
                placeholder={t('vacancies_search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t('vacancies_search_aria')}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className={`${NAVY_BTN_OUTLINE} shrink-0 px-3.5`}
              aria-label={t('vacancies_filter_aria')}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              <span className="hidden xs:inline sm:inline">{t('vacancies_filter')}</span>
            </button>
          </div>
        </WizardCard>

        <VacancyFilterChips
          value={selectedFilter}
          onChange={setSelectedFilter}
          className="-mx-1"
        />

        {filterRelaxed && jobsToRender.length > 0 && (
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-[11px] font-semibold text-amber-800">
            {tVars('vacancies_filter_relaxed', { count: jobsToRender.length })}
            <button type="button" onClick={resetFilters} className="ml-2 font-bold underline">
              {t('vacancies_reset_filter')}
            </button>
          </div>
        )}

        {isFetching && rawJobs.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#003087]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Memperbarui data...
          </div>
        )}

        {showLoading && <VacanciesLoadingCard />}

        {isError && error && (
          <VacanciesErrorCard message={error.message} onRetry={() => { void refetch(); }} />
        )}

        {hasJobsButFilteredEmpty && (
          <VacanciesEmptyCard
            title={t('vacancies_no_match_title')}
            description={t('vacancies_no_match_desc')}
            actionLabel={t('vacancies_reset_all')}
            onAction={resetFilters}
          />
        )}

        {hasNoJobsAtAll && !showLoading && !isError && (
          <VacanciesEmptyCard
            title={t('vacancies_empty')}
            description="Silakan cek kembali nanti atau hubungi tim HR."
          />
        )}

        {!showLoading && !isError && jobsToRender.length > 0 && (
          <JobList
            source="VacanciesPage"
            jobs={jobsToRender}
            showCount
            className="space-y-4"
            pagination={{ page: currentPage, onPageChange: handlePageChange }}
            renderItem={(job, display: JobDisplayFields) => {
              const fields = resolveVacancyCardFields(job, display, t);
              const detailFields = getJobDetailFields(job);
              const clientName = getClientName(job.clientId);

              return (
                <VacancyJobCard
                  compact
                  title={fields.title}
                  department={fields.department}
                  location={fields.location}
                  jobType={fields.jobType}
                  clientName={clientName || undefined}
                  description={fields.description}
                  requirements={fields.requirements}
                  skills={detailFields.requiredSkills}
                  isBookmarked={bookmarkedJobs.includes(job.id)}
                  onToggleBookmark={() => toggleBookmark(job.id)}
                  onOpenMap={() => handleOpenMap(job.latitude, job.longitude, fields.location)}
                  detailHref={buildJobDetailHref(job)}
                  applyHref={buildJobApplyHref(job, fields.title)}
                  maxRequirements={3}
                />
              );
            }}
          />
        )}

        <WizardCard className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-2.5 text-[#003087] ring-1 ring-[#003087]/10">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{t('vacancies_cta_title')}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{t('vacancies_cta_desc')}</p>
              <Link
                to="/contact"
                className="mt-3 inline-flex min-h-[44px] items-center text-xs font-bold text-[#003087] underline-offset-2 transition hover:underline"
              >
                {t('vacancies_cta_link')}
              </Link>
            </div>
          </div>
        </WizardCard>
      </MarketingPageShell>

      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setShowFilterModal(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="filter-modal-title"
          >
            <div
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#003087] to-transparent opacity-50"
              aria-hidden
            />
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <h3
                id="filter-modal-title"
                className="text-xs font-black uppercase tracking-wider text-slate-900"
              >
                {t('vacancies_filter_modal_title')}
              </h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="text-sm font-bold text-slate-400 transition hover:text-[#003087]"
              >
                {t('vacancies_filter_close')}
              </button>
            </div>
            <div className="space-y-2 p-4">
              {VACANCY_FILTER_OPTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(f);
                    setShowFilterModal(false);
                  }}
                  className={`w-full min-h-[48px] rounded-xl border px-4 text-left text-xs font-bold transition active:scale-[0.98] ${
                    selectedFilter === f
                      ? 'border-[#003087] bg-[#003087] text-white shadow-md ring-2 ring-cyan-400/25'
                      : 'border-slate-100 bg-white text-slate-700 hover:border-[#003087]/20 hover:bg-blue-50/50'
                  }`}
                >
                  {f === 'Semua' ? t('vacancies_filter_all') : tVars('vacancies_filter_sector', { name: f })}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mapModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setMapModalData(null)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={tVars('vacancies_map_title', { name: mapModalData.title })}
          >
            <div
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#003087] to-transparent opacity-50"
              aria-hidden
            />
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <h3 className="text-xs font-black text-slate-950">
                {tVars('vacancies_map_title', { name: mapModalData.title })}
              </h3>
              <button
                type="button"
                onClick={() => setMapModalData(null)}
                className="text-base font-extrabold text-slate-400 hover:text-[#003087]"
                aria-label={t('vacancies_map_close')}
              >
                ×
              </button>
            </div>
            <div className="aspect-video w-full bg-slate-100">
              <iframe
                title={tVars('vacancies_map_iframe_title', { name: mapModalData.title })}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapModalData.lng - 0.015},${mapModalData.lat - 0.015},${mapModalData.lng + 0.015},${mapModalData.lat + 0.015}&layer=mapnik&marker=${mapModalData.lat},${mapModalData.lng}`}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};