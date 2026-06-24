
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHomePageData } from '../hooks/useDbQueries';
import { useIsMobile } from '../hooks/useMediaQuery';
import { filterJobsBySearch, getLatestJobsForHome, HOME_PREVIEW_JOB_LIMIT } from '../lib/job-filters';
import {
  buildJobApplyHref,
  buildJobDetailHref,
  getJobDetailFields,
  type JobDisplayFields,
} from '../lib/job-display';
import { DataFetchState } from '../src/components/DataFetchState';
import { JobList } from './jobs/JobList';
import { VacancyJobCard, resolveVacancyCardFields } from './jobs/VacancyJobCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { BRAND_NAVY } from './home/homeContent';
import { CardSectionHeader, JobCardSkeleton, NAVY_BTN } from './recruitment/recruitmentUi';
import { useLanguage } from '../services/i18n';
import { MobileHomePage } from './MobileHomePage';
import { HeroSection } from './home/HeroSection';
import { StatsCards } from './home/StatsCards';
import { QuickAccessGrid } from './home/QuickAccessGrid';
import { JobSectorsGrid } from './home/JobSectorsGrid';
import { Footer } from './layout/Footer';

export const HomePage: React.FC = () => {
  const {
    jobs,
    candidates,
    clients,
    projects,
    loading,
    jobsLoading,
    allJobs,
    fetchError,
    refetchJobs,
  } = useHomePageData();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => ({
    jobs: allJobs.length > 0 ? allJobs.length : jobs.length,
    applicants: candidates.length,
    clients: clients.filter((c) => c.isActive !== false).length,
    projects: projects.filter((p) => p.isActive !== false).length,
  }), [allJobs.length, jobs.length, candidates, clients, projects]);
  const [mapModalData, setMapModalData] = useState<{lat: number, lng: number, title: string} | null>(null);
  const isMobile = useIsMobile();
  const { t, tVars, tJobCountLabel } = useLanguage();

  const jobsForList = allJobs.length > 0 ? allJobs : jobs;

  const filteredJobs = useMemo(
    () => filterJobsBySearch(jobsForList, searchQuery),
    [jobsForList, searchQuery]
  );

  const homePreviewJobs = useMemo(
    () => getLatestJobsForHome(filteredJobs),
    [filteredJobs]
  );

  const showJobsLoading = jobsLoading && allJobs.length === 0;
  const hasNoJobs = !showJobsLoading && !fetchError && allJobs.length === 0;
  const hasSearchMiss =
    !showJobsLoading && !fetchError && allJobs.length > 0 && filteredJobs.length === 0;

  useEffect(() => {
    console.log('[HomePage] jobs state', {
      raw: allJobs.length,
      visible: jobs.length,
      filtered: filteredJobs.length,
      jobsLoading,
      loading,
      searchQuery,
    });
  }, [allJobs.length, jobs.length, filteredJobs.length, jobsLoading, loading, searchQuery]);

  const getClientName = (clientId?: string) => {
      return clients.find(c => c.id === clientId)?.name || '';
  }

  const openMap = (lat?: number, lng?: number, title?: string) => {
      if (lat && lng) {
          setMapModalData({ lat, lng, title: title || t('vacancies_location_default') });
      } else {
          alert(t('home_location_unavailable'));
      }
  }

  if (isMobile) {
    return (
      <MobileHomePage
        jobs={jobsForList}
        filteredJobs={filteredJobs}
        previewJobs={homePreviewJobs}
        totalFilteredJobs={filteredJobs.length}
        clients={clients}
        projects={projects}
        stats={stats}
        loading={loading}
        jobsLoading={showJobsLoading}
        fetchError={fetchError}
        refetchJobs={refetchJobs}
        hasNoJobs={hasNoJobs}
        hasSearchMiss={hasSearchMiss}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openMap={openMap}
      />
    );
  }

  const handleHeroSearch = () => {
    const element = document.getElementById('vacancies');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleHeroSearch}
        jobCount={stats.jobs}
      />

      {/* Stats + Quick Access + Sectors */}
      <div className="relative z-10 -mt-14 max-w-7xl mx-auto space-y-12 px-4 pb-6 sm:px-6 lg:px-8">
        <StatsCards variant="desktop" stats={stats} loading={loading} />
        <QuickAccessGrid variant="desktop" stats={stats} />
        <JobSectorsGrid variant="desktop" />
      </div>

      {/* Job Listings Section */}
      <div id="vacancies" className="bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl space-y-6 px-6 sm:space-y-8 sm:px-6 lg:px-8">
          <div className="text-center sm:text-left">
            <CardSectionHeader
              label={t('nav_vacancies_short')}
              title={t('home_vac_title')}
              subtitle={t('home_vac_desc')}
            />
          </div>

          <div className="mx-auto max-w-xl sm:mx-0">
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                className="block w-full rounded-2xl border border-slate-100 bg-white py-3.5 pl-10 pr-4 text-sm font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#003087]/30 focus:outline-none focus:ring-2 focus:ring-[#003087]/20"
                placeholder={t('home_search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t('home_search_placeholder')}
              />
            </div>
          </div>

          {hasSearchMiss && (
            <p className="text-center text-sm font-medium text-slate-500 sm:text-left">
              {t('home_empty_search')}
            </p>
          )}

          <DataFetchState
            isLoading={showJobsLoading}
            isFetching={jobsLoading && allJobs.length > 0}
            error={fetchError}
            isEmpty={hasNoJobs}
            emptyMessage={t('vacancies_empty')}
            onRetry={() => { void refetchJobs(); }}
            skeleton={
              <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <JobCardSkeleton key={i} compact />
                ))}
              </div>
            }
          >
            <JobList
              source="HomePage"
              jobs={homePreviewJobs}
              showCount
              countLabel={(count) =>
                filteredJobs.length > HOME_PREVIEW_JOB_LIMIT
                  ? tVars('home_vac_preview_count', { shown: count, total: filteredJobs.length })
                  : tJobCountLabel(count)
              }
              className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6"
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
                    detailHref={buildJobDetailHref(job)}
                    applyHref={buildJobApplyHref(job, fields.title)}
                    detailLabel="Lihat Detail"
                    applyLabel={t('home_btn_apply')}
                    maxRequirements={3}
                  />
                );
              }}
            />

            {filteredJobs.length > 0 && (
              <div className="flex justify-center pt-2 sm:justify-start">
                <Link
                  to="/vacancies"
                  className={NAVY_BTN}
                  style={{ backgroundColor: BRAND_NAVY }}
                >
                  {t('home_cta_button')}
                </Link>
              </div>
            )}
          </DataFetchState>
        </div>
      </div>

      <Footer />
      
      {/* Map Modal */}
      {mapModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={() => setMapModalData(null)}>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900">{mapModalData.title}</h3>
                      <button onClick={() => setMapModalData(null)} className="text-gray-500 hover:text-gray-700">&times;</button>
                  </div>
                  <div className="aspect-video w-full bg-gray-100">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapModalData.lng-0.01},${mapModalData.lat-0.01},${mapModalData.lng+0.01},${mapModalData.lat+0.01}&layer=mapnik&marker=${mapModalData.lat},${mapModalData.lng}`} 
                        className="w-full h-full"
                      ></iframe>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
