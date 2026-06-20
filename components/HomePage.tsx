
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHomePageData } from '../hooks/useDbQueries';
import { useIsMobile } from '../hooks/useMediaQuery';
import { filterJobsBySearch } from '../lib/job-filters';
import type { JobDisplayFields } from '../lib/job-display';
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
    jobs: jobs.length,
    applicants: candidates.length,
    clients: clients.filter((c) => c.isActive !== false).length,
    projects: projects.filter((p) => p.isActive !== false).length,
  }), [jobs, candidates, clients, projects]);
  const [mapModalData, setMapModalData] = useState<{lat: number, lng: number, title: string} | null>(null);
  const [expandedRequirements, setExpandedRequirements] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();

  const filteredJobs = useMemo(
    () => filterJobsBySearch(jobs, searchQuery),
    [jobs, searchQuery]
  );

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
          alert('Koordinat lokasi tidak tersedia untuk lowongan ini.');
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
        jobs={jobs}
        filteredJobs={filteredJobs}
        clients={clients}
        projects={projects}
        stats={stats}
        loading={loading}
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
      <div className="relative z-10 -mt-12 max-w-7xl mx-auto space-y-10 px-4 pb-4 sm:px-6 lg:px-8">
        <StatsCards variant="desktop" stats={stats} loading={loading} />
        <QuickAccessGrid variant="desktop" stats={stats} />
        <JobSectorsGrid variant="desktop" />
      </div>

      {/* Job Listings Section */}
      <div id="vacancies" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">{t('home_vac_title')}</h2>
            <p className="mt-4 text-gray-600">{t('home_vac_desc')}</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder={t('home_search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>

          <DataFetchState
            isLoading={jobsLoading}
            error={fetchError}
            isEmpty={!jobsLoading && !fetchError && filteredJobs.length === 0}
            emptyMessage={
              jobs.length === 0
                ? 'Saat ini belum ada lowongan yang tersedia.'
                : t('home_empty_search')
            }
            onRetry={() => { void refetchJobs(); }}
          >
            <JobList
              source="HomePage"
              jobs={filteredJobs}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              renderItem={(job, display: JobDisplayFields) => {
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
                            <span className="mb-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
                                {display.department}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900">{display.title}</h3>
                            {job.clientId && (
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                    <BuildingOfficeIcon className="h-4 w-4" /> 
                                    {getClientName(job.clientId)}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4 space-y-2 text-sm text-gray-500">
                         <div className="flex items-center gap-2">
                             <MapPinIcon className="h-4 w-4 text-gray-400" />
                             <span>{display.location}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                             <span>{display.type}</span>
                         </div>
                    </div>

                    <div className="mt-4">
                        <p className="line-clamp-3 text-sm text-gray-600">{display.description}</p>
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
                        onClick={() => openMap(job.latitude, job.longitude, display.location)}
                        className="flex-1 text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded transition-colors text-sm"
                    >
                        {t('home_btn_location')}
                    </button>
                    <Link
                      to={`/apply?position=${encodeURIComponent(display.title)}`}
                      className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
                    >
                      {t('home_btn_apply')}
                    </Link>
                  </div>
                </div>
              )}}
            />
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
