import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Client, Project } from '../types';
import { HeroSection } from './home/HeroSection';
import { StatsCards } from './home/StatsCards';
import { QuickAccessGrid } from './home/QuickAccessGrid';
import { JobSectorsGrid } from './home/JobSectorsGrid';
import { SectionHeader } from './home/SectionHeader';
import { JobList } from './jobs/JobList';
import { DataFetchState } from '../src/components/DataFetchState';
import type { JobDisplayFields } from './jobs/JobList';
import { ArrowRight, Megaphone, Calendar, MapPin, Briefcase } from 'lucide-react';

interface MobileHomePageProps {
  jobs: any[];
  filteredJobs: any[];
  clients: Client[];
  projects: Project[];
  stats: { jobs: number; applicants: number; clients: number; projects: number };
  loading: boolean;
  jobsLoading: boolean;
  fetchError: Error | null;
  refetchJobs: () => void;
  hasNoJobs: boolean;
  hasSearchMiss: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  openMap: (lat?: number, lng?: number, title?: string) => void;
  t: (key: string) => string;
  language: 'id' | 'en';
}

export const MobileHomePage: React.FC<MobileHomePageProps> = ({
  filteredJobs,
  stats,
  loading,
  jobsLoading,
  fetchError,
  refetchJobs,
  hasNoJobs,
  hasSearchMiss,
  searchQuery,
  setSearchQuery,
  openMap,
  t,
  language,
}) => {
  const navigate = useNavigate();

  const handleStatClick = (key: keyof typeof stats) => {
    if (key === 'jobs') {
      navigate('/vacancies');
      return;
    }
    if (key === 'projects' || key === 'clients') {
      navigate('/about');
      return;
    }
    navigate('/vacancies');
  };

  const newsDate = new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden pb-4 font-sans antialiased text-slate-800">
      <HeroSection
        compact
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        jobCount={stats.jobs}
      />

      <div className="mt-5 space-y-6 px-4">
        <StatsCards
          variant="mobile"
          stats={stats}
          loading={loading}
          onStatClick={handleStatClick}
        />

        <QuickAccessGrid variant="mobile" stats={stats} />

        <JobSectorsGrid variant="mobile" />

        {/* Daftar lowongan — mobile HomePage */}
        <div>
          <SectionHeader
            compact
            title={t('home_vac_title')}
            action={
              <Link
                to="/vacancies"
                className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#0056C6]"
              >
                {language === 'id' ? 'Lihat semua' : 'See all'}
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />

          {hasSearchMiss && (
            <p className="mb-3 text-center text-xs font-medium text-slate-500">
              {t('home_empty_search')}
            </p>
          )}

          <DataFetchState
            isLoading={jobsLoading}
            error={fetchError}
            isEmpty={hasNoJobs}
            emptyMessage="Saat ini belum ada lowongan yang tersedia."
            onRetry={() => { void refetchJobs(); }}
          >
            <JobList
              source="MobileHomePage"
              jobs={filteredJobs}
              showCount
              className="space-y-3"
              renderItem={(job, display: JobDisplayFields) => {
                const title = display.title || job.title || 'Lowongan';
                const department = display.department || job.department || 'Umum';
                const location = display.location || job.location || 'Lokasi belum diisi';
                const jobType = display.type || job.type || 'Contract';

                return (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className="job-card-dept inline-block rounded-lg px-2 py-0.5">
                    {department}
                  </span>
                  <h3 className="job-card-title mt-2 text-sm">{title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="job-card-meta inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-blue-500" aria-hidden />
                      {location}
                    </span>
                    <span className="job-card-meta inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3 shrink-0 text-orange-500" aria-hidden />
                      {jobType}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openMap(job.latitude, job.longitude, location)}
                      className="flex-1 rounded-xl bg-slate-100 py-2 text-[10px] font-bold text-slate-700"
                    >
                      Peta
                    </button>
                    <Link
                      to={`/apply?position=${encodeURIComponent(title)}`}
                      className="flex-1 rounded-xl bg-[#0056C6] py-2 text-center text-[10px] font-bold text-white"
                    >
                      Lamar
                    </Link>
                  </div>
                </div>
              )}}
            />
          </DataFetchState>
        </div>

        {/* Informasi Terkini */}
        <div>
          <SectionHeader
            compact
            title={t('home_news_section_title')}
            action={
              <button
                type="button"
                onClick={() => navigate('/about')}
                className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#0056C6]"
              >
                {language === 'id' ? 'Lihat semua' : 'See all'}
                <ArrowRight className="h-3 w-3" />
              </button>
            }
          />

          <div className="flex items-start gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-[#0056C6]">
              <Megaphone className="h-7 w-7 -rotate-12" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-800">
                {t('home_news_badge')}
              </span>
              <h4 className="mt-1.5 text-sm font-extrabold leading-snug text-slate-950">
                {t('home_news_title')}
              </h4>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {t('home_news_desc')}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-blue-100 bg-blue-50/80 px-2 py-2 text-[10px] font-bold text-blue-700">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>{newsDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};