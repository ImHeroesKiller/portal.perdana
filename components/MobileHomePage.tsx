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
import { resolveJobTitle } from '../lib/job-display';
import type { JobDisplayFields } from './jobs/JobList';
import { ArrowRight, Megaphone, Calendar, MapPin, Briefcase } from 'lucide-react';

interface MobileHomePageProps {
  jobs: any[];
  filteredJobs: any[];
  previewJobs: any[];
  totalFilteredJobs: number;
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
  previewJobs,
  totalFilteredJobs,
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

  const sectionLinkClass =
    'flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg px-1 text-[11px] font-bold text-[#003087] transition active:scale-[0.98]';

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 pb-10 font-sans antialiased text-slate-800">
      <HeroSection
        compact
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        jobCount={stats.jobs}
      />

      <main className="mt-8 flex flex-col gap-8 px-4">
        <section aria-label="Statistik">
          <StatsCards
            variant="mobile"
            stats={stats}
            loading={loading}
            onStatClick={handleStatClick}
          />
        </section>

        <section aria-label="Menu utama">
          <QuickAccessGrid variant="mobile" stats={stats} />
        </section>

        <section aria-label="Sektor alih daya">
          <JobSectorsGrid variant="mobile" />
        </section>

        {/* Daftar lowongan — mobile HomePage */}
        <section aria-label="Lowongan terbaru">
          <SectionHeader
            compact
            title={t('home_vac_title')}
            action={
              <Link to="/vacancies" className={sectionLinkClass}>
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
              jobs={previewJobs}
              showCount
              countLabel={(count) =>
                totalFilteredJobs > count
                  ? t('home_vac_preview_count', { shown: count, total: totalFilteredJobs })
                  : count === 1
                    ? t('home_jobs_found_one')
                    : t('home_jobs_found_many', { count })
              }
              className="space-y-3"
              renderItem={(job, display: JobDisplayFields) => {
                const title = resolveJobTitle(job);
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
                      className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-bold text-slate-700 transition active:scale-[0.98]"
                    >
                      Peta
                    </button>
                    <Link
                      to={`/apply?position=${encodeURIComponent(title)}`}
                      className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#003087] text-center text-[11px] font-bold text-white transition active:scale-[0.98]"
                    >
                      Lamar
                    </Link>
                  </div>
                </div>
              )}}
            />

            {totalFilteredJobs > 0 && (
              <Link
                to="/vacancies"
                className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#003087] text-center text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
              >
                {t('home_cta_button')}
              </Link>
            )}
          </DataFetchState>
        </section>

        {/* Informasi Terkini */}
        <section aria-label="Informasi terkini">
          <SectionHeader
            compact
            title={t('home_news_section_title')}
            action={
              <button
                type="button"
                onClick={() => navigate('/about')}
                className={sectionLinkClass}
              >
                {language === 'id' ? 'Lihat semua' : 'See all'}
                <ArrowRight className="h-3 w-3" />
              </button>
            }
          />

          <div className="flex items-start gap-3.5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#003087]">
              <Megaphone className="h-7 w-7 -rotate-12" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#003087]">
                {t('home_news_badge')}
              </span>
              <h4 className="mt-2 text-sm font-extrabold leading-snug text-slate-950">
                {t('home_news_title')}
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                {t('home_news_desc')}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-blue-100 bg-blue-50/90 px-2.5 py-2 text-[10px] font-bold text-[#003087]">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              <span>{newsDate}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};