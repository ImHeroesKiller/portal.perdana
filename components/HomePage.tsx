
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobs, useCandidates, useClients, useProjects, useForceRefresh } from '../hooks/useDbQueries';
import { DataFetchState } from '../src/components/DataFetchState';
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
    data: jobs = [],
    isLoading: jobsLoading,
    isError: jobsError,
    error: jobsFetchError,
    refetch: refetchJobs,
  } = useJobs({ activeOnly: true });
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const forceRefresh = useForceRefresh();

  useEffect(() => {
    console.log('[HomePage] mount — force refresh jobs + candidates');
    void forceRefresh.both();
  }, []);
  const [filteredJobs, setFilteredJobs] = useState<JobVacancy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const loading = jobsLoading || candidatesLoading || clientsLoading || projectsLoading;
  const fetchError = jobsError ? jobsFetchError : null;

  const stats = useMemo(() => ({
    jobs: jobs.length,
    applicants: candidates.length,
    clients: clients.filter((c) => c.isActive !== false).length,
    projects: projects.filter((p) => p.isActive !== false).length,
  }), [jobs, candidates, clients, projects]);
  const [mapModalData, setMapModalData] = useState<{lat: number, lng: number, title: string} | null>(null);
  const [expandedRequirements, setExpandedRequirements] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(lowerQuery) || 
      job.description.toLowerCase().includes(lowerQuery)
    );
    setFilteredJobs(filtered);
  }, [searchQuery, jobs]);

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
            isLoading={loading}
            error={fetchError}
            isEmpty={!loading && !fetchError && filteredJobs.length === 0}
            emptyMessage={
              jobs.length === 0
                ? 'Saat ini belum ada lowongan yang tersedia.'
                : t('home_empty_search')
            }
            onRetry={() => { void refetchJobs(); }}
          >
          {filteredJobs.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
              {filteredJobs.map((job) => {
                const isExpanded = expandedRequirements[job.id];
                const displayedRequirements = isExpanded ? job.requirements : job.requirements.slice(0, 3);
                const hasMore = job.requirements.length > 3;

                return (
                <div key={job.id} className="flex flex-col bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
                                {job.department}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
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
                             <span>{job.location}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                             <span>{job.type}</span>
                         </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-gray-600 line-clamp-3 text-sm">{job.description}</p>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                             <p className="font-semibold text-sm text-gray-900">{t('home_qualifications')}</p>
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
                                <li className="list-none text-gray-400 text-xs italic mt-1">... +{job.requirements.length - 3} lainnya</li>
                            )}
                        </ul>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto flex gap-3">
                    <button
                        onClick={() => openMap(job.latitude, job.longitude, job.location)}
                        className="flex-1 text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded transition-colors text-sm"
                    >
                        {t('home_btn_location')}
                    </button>
                    <Link
                      to={`/apply?position=${encodeURIComponent(job.title)}`}
                      className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
                    >
                      {t('home_btn_apply')}
                    </Link>
                  </div>
                </div>
              )})}
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
