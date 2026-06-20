import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useJobs, useClients } from '../hooks/useDbQueries';
import { applyPublicJobFilter, applyVacancyFilters } from '../lib/job-filters';
import type { JobDisplayFields } from '../lib/job-display';
import { DataFetchState } from '../src/components/DataFetchState';
import { JobList } from './jobs/JobList';
import { useLanguage } from '../services/i18n';
import { 
  ChevronLeft, 
  Search, 
  SlidersHorizontal, 
  Bookmark, 
  MapPin, 
  Briefcase, 
  Map, 
  Send, 
  FileText,
  BookmarkCheck
} from 'lucide-react';

export const VacanciesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
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
  const [selectedFilter, setSelectedFilter] = useState<'Semua' | 'Operasional' | 'Administrasi' | 'Teknis' | 'Lainnya'>('Semua');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [mapModalData, setMapModalData] = useState<{lat: number, lng: number, title: string} | null>(null);

  // Load Bookmarks on mount
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
    let updated;
    if (bookmarkedJobs.includes(id)) {
      updated = bookmarkedJobs.filter(bId => bId !== id);
    } else {
      updated = [...bookmarkedJobs, id];
    }
    setBookmarkedJobs(updated);
    localStorage.setItem('bookmarked_jobs', JSON.stringify(updated));
  };

  const FILTER_OPTIONS = ['Semua', 'Operasional', 'Administrasi', 'Teknis', 'Lainnya'] as const;

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);

    const filter = searchParams.get('filter');
    if (filter && FILTER_OPTIONS.includes(filter as (typeof FILTER_OPTIONS)[number])) {
      setSelectedFilter(filter as (typeof FILTER_OPTIONS)[number]);
    }
  }, [searchParams]);

  /** Data mentah dari API (prioritas allJobs) */
  const rawJobs = useMemo(
    () => (allJobs.length > 0 ? allJobs : jobs),
    [allJobs, jobs]
  );

  /** Filter isActive longgar (!== false) + fallback ke raw jika kosong */
  const { jobs: publicJobs, filterRelaxed: publicFilterRelaxed } = useMemo(
    () => applyPublicJobFilter(rawJobs),
    [rawJobs]
  );

  const { jobs: uiFilteredJobs, filterRelaxed: uiFilterRelaxed } = useMemo(
    () => applyVacancyFilters(publicJobs, searchQuery, selectedFilter),
    [publicJobs, searchQuery, selectedFilter]
  );

  /** Job yang benar-benar di-render — fallback berlapis ke public/raw */
  const jobsToRender = useMemo(() => {
    if (uiFilteredJobs.length > 0) return uiFilteredJobs;
    if (publicJobs.length > 0) {
      console.warn('[VacanciesPage] filter UI kosong — fallback ke publicJobs', {
        count: publicJobs.length,
      });
      return publicJobs;
    }
    if (rawJobs.length > 0) {
      console.warn('[VacanciesPage] filter UI & public kosong — fallback ke rawJobs', {
        count: rawJobs.length,
      });
      return rawJobs;
    }
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
      publicFilterRelaxed,
      uiFilterRelaxed,
      searchQuery,
      selectedFilter,
      sample: jobsToRender.slice(0, 3).map((j) => ({
        id: j.id,
        title: j.title,
        isActive: (j as { isActive?: unknown }).isActive,
      })),
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
    publicFilterRelaxed,
    uiFilterRelaxed,
    searchQuery,
    selectedFilter,
    jobsToRender,
  ]);

  const getClientName = (clientId?: string) => {
    return clients.find(c => c.id === clientId)?.name || 'PT Indonesia Morowali Industrial Park (IMIP)';
  };

  const handleOpenMap = (lat?: number, lng?: number, title?: string) => {
    if (lat && lng) {
      setMapModalData({ lat, lng, title: title || 'Lokasi' });
    } else {
      // default coordinates matching reference map indicator (e.g. Morowali)
      setMapModalData({ lat: -2.6781, lng: 121.9315, title: title || 'Morowali' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans select-none antialiased text-slate-800">
      
      {/* 1. Dark/blue header of exact matching mockup */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white pt-6 pb-6 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-xl mx-auto flex items-center pr-3">
          <button 
            onClick={() => navigate('/')} 
            className="mr-3 p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center active:scale-95 cursor-pointer text-white"
            id="btn-back-vacancies"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black tracking-tight">Lowongan Tersedia</h1>
            <p className="text-[10px] text-blue-200 mt-0.5 tracking-wider font-semibold">PT Perdana Adi Yuda • Karir Alih Daya</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-5">
        
        {/* 2. Search & Filter Input Row */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl leading-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-xs shadow-xs transition"
              placeholder="Cari lowongan berdasarkan judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setShowFilterModal(!showFilterModal)}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-blue-600 shadow-xs cursor-pointer select-none shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span>Filter</span>
          </button>
        </div>

        {/* 3. Horizontal Pill Filter row */}
        <div className="flex gap-2 overflow-x-auto py-2.5 mt-3 scrollbar-none select-none">
          {['Semua', 'Operasional', 'Administrasi', 'Teknis', 'Lainnya'].map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter as any)}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-[#0056C6] text-white shadow-xs' 
                    : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-100'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {filterRelaxed && jobsToRender.length > 0 && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
            Filter terlalu ketat — menampilkan semua {jobsToRender.length} lowongan.
            <button type="button" onClick={resetFilters} className="ml-2 font-bold underline">
              Reset filter
            </button>
          </div>
        )}

        {/* 4. Active Job Vacancies output */}
        {hasJobsButFilteredEmpty && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Tidak ada lowongan yang cocok dengan kata kunci atau filter Anda.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700"
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
        >
          {jobsToRender.length > 0 && (
          <JobList
            source="VacanciesPage"
            jobs={jobsToRender}
            showCount
            className="mt-2 space-y-4"
            renderItem={(job, display: JobDisplayFields) => {
              const isBookmarked = bookmarkedJobs.includes(job.id);
              const title = display.title || job.title || 'Lowongan';
              const department = display.department || job.department || 'Umum';
              const location = display.location || job.location || 'Lokasi belum diisi';
              const jobType = display.type || job.type || 'Contract';
              const tagLabel = department.toUpperCase();

              return (
                <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-xs transition duration-240 hover:shadow-md">
                  
                  {/* Tag and Bookmark Row */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="job-card-dept inline-block rounded-lg px-3 py-1">
                      {tagLabel}
                    </span>
                    <button 
                      onClick={() => toggleBookmark(job.id)}
                      className="p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-5 w-5 text-blue-600 fill-blue-600" />
                      ) : (
                        <Bookmark className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Title and Client */}
                  <div className="mb-3.5">
                    <h2 className="job-card-title mb-1">{title}</h2>
                    <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      🏢 {getClientName(job.clientId)}
                    </p>
                  </div>

                  {/* High Quality Specification Pills */}
                  <div className="mb-4 mt-3.5 flex flex-wrap gap-2">
                    <div className="job-card-meta flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden />
                      <span>{location}</span>
                    </div>
                    <div className="job-card-meta flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden />
                      <span>{jobType}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {display.description && (
                    <p className="job-card-desc mb-4">
                      {display.description}
                    </p>
                  )}

                  {/* Qualifications */}
                  {display.requirements.length > 0 && (
                    <div className="mt-2.5 pt-3 border-t border-slate-150/50">
                      <p className="font-extrabold text-[11px] text-slate-800 mb-1.5">Kualifikasi:</p>
                      <ul className="text-xs text-slate-600 space-y-1 pl-1">
                        {display.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-1 leading-relaxed">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Card bottom CTA Actions matching mockup visually */}
                  <div className="flex gap-2.5 mt-5 border-t border-slate-50 pt-3.5">
                    
                    {/* Maps */}
                    <button
                      onClick={() => handleOpenMap(job.latitude, job.longitude, location)}
                      className="flex-1 py-3 bg-[#EBF5FF] hover:bg-blue-100 active:scale-[0.98] text-blue-700 font-black rounded-2xl text-[11px] tracking-wide transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Map className="h-3.5 w-3.5" />
                      Lihat Peta
                    </button>

                    {/* Apply now */}
                    <Link
                      to={`/apply?position=${encodeURIComponent(title)}`}
                      className="flex-1.5 py-3 bg-[#0462E9] hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-2xl text-[11px] tracking-wide text-center transition duration-150 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Lamar & Kirim Berkas
                    </Link>

                  </div>

                </div>
              );
            }}
          />
          )}
        </DataFetchState>

        {/* 5. Bottom document notification callout */}
        <div className="mt-8 mb-6 p-4 bg-white border border-slate-100 rounded-3xl flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-blue-50 text-[#0056C6] rounded-xl shrink-0 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-snug">
              Tidak menemukan lowongan yang cocok?
            </p>
            <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
              Klik hubungi untuk konsultasi karir, atau daftar terlebih dahulu agar CV Anda masuk kearsipan rekrutmen.
            </p>
            <Link 
              to="/contact" 
              className="text-[11px] font-extrabold text-[#0056C6] hover:underline mt-2.5 inline-block cursor-pointer"
            >
              Beri tahu kami posisi yang Anda cari ➔
            </Link>
          </div>
        </div>

      </div>

      {/* Filter modal drawer option helper */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowFilterModal(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-down" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">Filter Sektor Pekerjaan</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer text-sm">Tutup</button>
            </div>
            <div className="p-5 space-y-2.5">
              {['Semua', 'Operasional', 'Administrasi', 'Teknis', 'Lainnya'].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setSelectedFilter(f as any);
                    setShowFilterModal(false);
                  }}
                  className={`w-full p-3 text-left rounded-2xl text-xs font-bold border transition ${
                    selectedFilter === f 
                      ? 'border-[#0056C6] bg-blue-50/50 text-[#0056C6]' 
                      : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {f === 'Semua' ? 'Tampilkan Semua Kategori' : `Sektor ${f}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map modal visualization */}
      {mapModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setMapModalData(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in animate-duration-150" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="text-xs font-extrabold text-slate-950 flex items-center gap-1">
                📍 Lokasi Penempatan: {mapModalData.title}
              </h3>
              <button onClick={() => setMapModalData(null)} className="text-slate-400 hover:text-slate-700 text-base font-extrabold cursor-pointer">&times;</button>
            </div>
            <div className="aspect-video w-full bg-slate-100">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapModalData.lng-0.015},${mapModalData.lat-0.015},${mapModalData.lng+0.015},${mapModalData.lat+0.015}&layer=mapnik&marker=${mapModalData.lat},${mapModalData.lng}`} 
                className="w-full h-full border-0"
              ></iframe>
            </div>
            <div className="p-3.5 bg-slate-50 text-center border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Lokasi di atas disimulasikan sesuai titik koordinat penempatan resmi.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
