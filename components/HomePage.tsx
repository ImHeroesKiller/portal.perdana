
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHomePageData } from '../hooks/useDbQueries';
import { useIsMobile } from '../hooks/useMediaQuery';
import { filterJobsBySearch, getLatestJobsForHome, HOME_PREVIEW_JOB_LIMIT } from '../lib/job-filters';
import { resolveJobTitle, type JobDisplayFields } from '../lib/job-display';
import { DataFetchState } from '../src/components/DataFetchState';
import { JobList } from './jobs/JobList';
import { JobVacancy } from '../types';
import { MapPinIcon, BriefcaseIcon, ClockIcon, MagnifyingGlassIcon, BuildingOfficeIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../services/i18n';
import { MobileHomePage } from './MobileHomePage';
import { HeroSection } from './home/HeroSection';
import { StatsCards } from './home/StatsCards';
import { QuickAccessGrid } from './home/QuickAccessGrid';
import { JobSectorsGrid } from './home/JobSectorsGrid';

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
  const [expandedRequirements, setExpandedRequirements] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const { t, tVars, tJobCountLabel, language } = useLanguage();

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
          setMapModalData({ lat, lng, title: title || 'Lokasi' });
      } else {
          alert(t('home_location_unavailable'));
      }
  }

  const toggleRequirements = (jobId: string) => {
    setExpandedRequirements(prev => ({
        ...prev,
        [jobId]: !prev[jobId]
    }));
  };

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
        t={t}
        language={language}
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
      <div id="vacancies" className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{t('home_vac_title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">{t('home_vac_desc')}</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 leading-5 placeholder-gray-500 transition duration-150 ease-in-out focus:border-[#003087] focus:outline-none focus:ring-2 focus:ring-[#003087]/30 sm:text-sm"
                    placeholder={t('home_search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>

          {hasSearchMiss && (
            <p className="mb-4 text-center text-sm font-medium text-slate-500">
              {t('home_empty_search')}
            </p>
          )}

          <DataFetchState
            isLoading={showJobsLoading}
            isFetching={jobsLoading && allJobs.length > 0}
            error={fetchError}
            isEmpty={hasNoJobs}
            emptyMessage="Saat ini belum ada lowongan yang tersedia."
            onRetry={() => { void refetchJobs(); }}
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
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              renderItem={(job, display: JobDisplayFields) => {
                const title = resolveJobTitle(job);
                const department = display.department || job.department || 'Umum';
                const location = display.location || job.location || 'Lokasi belum diisi';
                const jobType = display.type || job.type || 'Contract';
                const isExpanded = expandedRequirements[job.id];
                const displayedRequirements = isExpanded
                  ? display.requirements
                  : display.requirements.slice(0, 3);
                const hasMore = display.requirements.length > 3;

                return (
                <div className="flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-xl">
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="job-card-dept mb-2 inline-flex items-center rounded-full px-3 py-0.5 text-sm">
                                {department}
                            </span>
                            <h3 className="job-card-title text-xl">{title}</h3>
                            {job.clientId && (
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                    <BuildingOfficeIcon className="h-4 w-4" /> 
                                    {getClientName(job.clientId)}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4 space-y-2 text-sm">
                         <div className="job-card-meta flex items-center gap-2 text-sm">
                             <MapPinIcon className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
                             <span>{location}</span>
                         </div>
                         <div className="job-card-meta flex items-center gap-2 text-sm">
                             <BriefcaseIcon className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                             <span>{jobType}</span>
                         </div>
                    </div>

                    <div className="mt-4">
                        <p className="job-card-desc line-clamp-3">{display.description}</p>
                    </div>

                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                             <p className="text-sm font-semibold text-gray-900">{t('home_qualifications')}</p>
                             {hasMore && (
                                <button 
                                    onClick={() => toggleRequirements(job.id)}
                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                                    aria-expanded={isExpanded}
                                >
                                    {isExpanded ? (
                                        <>{t('home_hide')} <ChevronUpIcon className="h-3 w-3" /></>
                                    ) : (
                                        <>{t('home_read_more')} <ChevronDownIcon className="h-3 w-3" /></>
                                    )}
                                </button>
                             )}
                        </div>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 transition-all duration-300">
                            {displayedRequirements.map((req, idx) => (
                                <li key={idx}>{req}</li>
                            ))}
                            {!isExpanded && hasMore && (
                                <li className="mt-1 list-none text-xs italic text-gray-400">... +{display.requirements.length - 3} lainnya</li>
                            )}
                        </ul>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto flex gap-3">
                    <button
                        onClick={() => openMap(job.latitude, job.longitude, location)}
                        className="flex-1 text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded transition-colors text-sm"
                    >
                        {t('home_btn_location')}
                    </button>
                    <Link
                      to={`/apply?position=${encodeURIComponent(title)}`}
                      className="flex-1 rounded bg-[#003087] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-900"
                    >
                      {t('home_btn_apply')}
                    </Link>
                  </div>
                </div>
              )}}
            />

            {filteredJobs.length > 0 && (
              <div className="mt-10 text-center">
                <Link
                  to="/vacancies"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#003087] px-8 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-[0.98]"
                >
                  {t('home_cta_button')}
                </Link>
              </div>
            )}
          </DataFetchState>
        </div>
      </div>
      
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
