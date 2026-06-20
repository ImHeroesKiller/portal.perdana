import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useJobs, useClients } from '../hooks/useDbQueries';
import { applyPublicJobFilter, applyVacancyFilters } from '../lib/job-filters';
import type { JobDisplayFields } from '../lib/job-display';
import { DataFetchState } from '../src/components/DataFetchState';
import { JobList } from './jobs/JobList';
import { VacancyFilterChips } from './jobs/VacancyFilterChips';
import { VacancyJobCard, resolveVacancyCardFields } from './jobs/VacancyJobCard';
import { buildJobApplyHref, buildJobDetailHref } from '../lib/job-display';
import { VACANCY_FILTER_OPTIONS, type VacancyFilter } from './home/homeContent';
import { setSeoOverride } from '../hooks/usePageSeo';
import {
  buildJobListJsonLd,
  getOrganizationJsonLd,
  getWebSiteJsonLd,
  resolvePageSeo,
} from '../lib/seo';
import { useLanguage } from '../services/i18n';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';

export const VacanciesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
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
    const locale = language === 'en' ? 'en' : 'id';
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

  useEffect(() => {
    console.log('[VacanciesPage] jobs state', {
      raw: rawJobs.length,
      public: publicJobs.length,
      uiFiltered: uiFilteredJobs.length,
      rendered: jobsToRender.length,
      showLoading,
      hasNoJobsAtAll,
      fetchInProgress,
      filterRelaxed,
      searchQuery,
      selectedFilter,
    });
  }, [
    rawJobs.length,
    publicJobs.length,
    uiFilteredJobs.length,
    jobsToRender.length,
    showLoading,
    hasNoJobsAtAll,
    fetchInProgress,
    filterRelaxed,
    searchQuery,
    selectedFilter,
  ]);

  const getClientName = (clientId?: string) => {
    return clients.find((c) => c.id === clientId)?.name || '';
  };

  const handleOpenMap = (lat?: number, lng?: number, title?: string) => {
    if (lat && lng) {
      setMapModalData({ lat, lng, title: title || 'Lokasi' });
    } else {
      setMapModalData({ lat: -2.6781, lng: 121.9315, title: title || 'Morowali' });
    }
  };

  return (
    <div className="min-h-screen select-none bg-slate-50 pb-24 font-sans antialiased text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#003087] px-4 pb-5 pt-6 text-white shadow-md">
        <div className="mx-auto flex max-w-xl items-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mr-2 flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95"
            id="btn-back-vacancies"
            aria-label="Kembali ke beranda"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black tracking-tight">Lowongan Tersedia</h1>
            <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-blue-200">
              PT Perdana Adi Yuda • Karir Alih Daya
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-5 max-w-xl px-4">
        {/* Search & Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              className="block w-full rounded-2xl border border-slate-100 bg-white py-3.5 pl-10 pr-4 text-sm font-medium text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#003087]/30 focus:outline-none focus:ring-2 focus:ring-[#003087]/25"
              placeholder="Cari lowongan berdasarkan judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari lowongan"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-2xl border border-slate-100 bg-white px-3.5 text-xs font-bold text-[#003087] shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
            aria-label="Buka filter sektor"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            <span>Filter</span>
          </button>
        </div>

        {/* Filter chips */}
        <VacancyFilterChips
          value={selectedFilter}
          onChange={setSelectedFilter}
          className="mt-4"
        />

        {filterRelaxed && jobsToRender.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] font-semibold text-amber-800">
            Filter terlalu ketat — menampilkan semua {jobsToRender.length} lowongan.
            <button type="button" onClick={resetFilters} className="ml-2 font-bold underline">
              Reset filter
            </button>
          </div>
        )}

        {hasJobsButFilteredEmpty && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada lowongan yang cocok
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Coba ubah kata kunci atau filter sektor pekerjaan.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 min-h-[48px] rounded-xl border border-[#003087]/20 bg-blue-50 px-5 text-xs font-bold text-[#003087] transition active:scale-[0.98]"
            >
              Reset pencarian & filter
            </button>
          </div>
        )}

        <DataFetchState
          isLoading={showLoading}
          isFetching={isFetching && rawJobs.length > 0}
          error={isError ? error : null}
          isEmpty={hasNoJobsAtAll}
          emptyMessage="Belum ada lowongan tersedia saat ini."
          onRetry={() => { void refetch(); }}
          minHeight="14rem"
        >
          {jobsToRender.length > 0 && (
            <div className="mt-4">
            <JobList
              source="VacanciesPage"
              jobs={jobsToRender}
              showCount
              className="space-y-3"
              pagination={{ page: currentPage, onPageChange: handlePageChange }}
              renderItem={(job, display: JobDisplayFields) => {
                const fields = resolveVacancyCardFields(job, display);
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
                    isBookmarked={bookmarkedJobs.includes(job.id)}
                    onToggleBookmark={() => toggleBookmark(job.id)}
                    onOpenMap={() => handleOpenMap(job.latitude, job.longitude, fields.location)}
                    detailHref={buildJobDetailHref(job)}
                    applyHref={buildJobApplyHref(job, fields.title)}
                    maxRequirements={2}
                  />
                );
              }}
            />
            </div>
          )}
        </DataFetchState>

        {/* CTA bantuan */}
        <div className="mb-6 mt-8 flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mt-0.5 shrink-0 rounded-xl bg-blue-50 p-2.5 text-[#003087]">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-[11px] font-bold leading-snug text-slate-800">
              Tidak menemukan lowongan yang cocok?
            </p>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Hubungi tim HR atau daftar agar CV Anda masuk ke arsip rekrutmen.
            </p>
            <Link
              to="/contact"
              className="mt-2.5 inline-flex min-h-[36px] items-center text-[11px] font-extrabold text-[#003087] transition hover:underline"
            >
              Beri tahu posisi yang Anda cari →
            </Link>
          </div>
        </div>
      </div>

      {/* Filter modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setShowFilterModal(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="filter-modal-title"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3
                id="filter-modal-title"
                className="text-xs font-black uppercase tracking-wider text-slate-900"
              >
                Filter Sektor
              </h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="text-sm font-bold text-slate-400 transition hover:text-slate-700"
              >
                Tutup
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
                      ? 'border-[#003087] bg-blue-50 text-[#003087]'
                      : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {f === 'Semua' ? 'Tampilkan Semua Kategori' : `Sektor ${f}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map modal */}
      {mapModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setMapModalData(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Peta lokasi ${mapModalData.title}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h3 className="text-xs font-extrabold text-slate-950">
                Lokasi: {mapModalData.title}
              </h3>
              <button
                type="button"
                onClick={() => setMapModalData(null)}
                className="text-base font-extrabold text-slate-400 hover:text-slate-700"
                aria-label="Tutup peta"
              >
                ×
              </button>
            </div>
            <div className="aspect-video w-full bg-slate-100">
              <iframe
                title={`Peta ${mapModalData.title}`}
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