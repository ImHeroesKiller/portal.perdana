import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getJobs, getClients } from '../services/db';
import { JobVacancy, Client } from '../types';
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
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobVacancy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, clientsData] = await Promise.all([
          getJobs(),
          getClients()
        ]);
        const activeJobs = jobsData.filter(j => j.isActive);
        setJobs(activeJobs);
        setFilteredJobs(activeJobs);
        setClients(clientsData);
      } catch (err) {
        console.error("Gagal memuat lowongan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter jobs dynamically whenever search query, filter tab or jobs change
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    
    let result = jobs.filter(job => 
      job.title.toLowerCase().includes(lowerQuery) || 
      job.description.toLowerCase().includes(lowerQuery) ||
      job.department.toLowerCase().includes(lowerQuery) ||
      job.location.toLowerCase().includes(lowerQuery)
    );

    // Apply pill filter
    if (selectedFilter !== 'Semua') {
      result = result.filter(job => {
        const dept = job.department.toLowerCase();
        if (selectedFilter === 'Operasional') {
          return dept.includes('oper') || dept.includes('pabrik') || dept.includes('lapangan') || dept.includes('crew');
        }
        if (selectedFilter === 'Administrasi') {
          return dept.includes('admin') || dept.includes('kantor') || dept.includes('finance') || dept.includes('hr');
        }
        if (selectedFilter === 'Teknis') {
          return dept.includes('teknis') || dept.includes('it') || dept.includes('system') || dept.includes('engineering') || dept.includes('mekanik');
        }
        if (selectedFilter === 'Lainnya') {
          // returns ones that are not categorized in the above
          const isOper = dept.includes('oper') || dept.includes('pabrik') || dept.includes('lapangan') || dept.includes('crew');
          const isAdmin = dept.includes('admin') || dept.includes('kantor') || dept.includes('finance') || dept.includes('hr');
          const isTeknis = dept.includes('teknis') || dept.includes('it') || dept.includes('system') || dept.includes('engineering') || dept.includes('mekanik');
          return !isOper && !isAdmin && !isTeknis;
        }
        return true;
      });
    }

    setFilteredJobs(result);
  }, [searchQuery, selectedFilter, jobs]);

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

        {/* 4. Active Job Vacancies output */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-900 mb-3"></div>
            <p className="text-[10px] text-slate-500 font-bold">Memuat daftar karir aktif...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-2xl border border-slate-100 shadow-xs mt-4">
            <p className="text-slate-500 text-xs font-semibold">
              Tidak ada lowongan yang cocok dengan kata kunci atau filter Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {filteredJobs.map((job) => {
              const isBookmarked = bookmarkedJobs.includes(job.id);
              const tagLabel = job.department ? job.department.toUpperCase() : 'OPERATOR';

              return (
                <div 
                  key={job.id} 
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 hover:shadow-md transition duration-240 relative overflow-hidden"
                >
                  
                  {/* Tag and Bookmark Row */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-800 text-[10px] font-black tracking-wider uppercase">
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
                    <h2 className="text-base font-black text-slate-900 leading-tight mb-1">{job.title}</h2>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      🏢 {getClientName(job.clientId)}
                    </p>
                  </div>

                  {/* High Quality Specification Pills */}
                  <div className="flex flex-wrap gap-2 mt-3.5 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-slate-100 rounded-xl text-[10px] text-slate-600 font-bold">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-slate-100 rounded-xl text-[10px] text-slate-600 font-bold">
                      <Briefcase className="h-3.5 w-3.5 text-orange-400" />
                      <span>{job.type}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {job.description && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      {job.description}
                    </p>
                  )}

                  {/* Qualifications */}
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mt-2.5 pt-3 border-t border-slate-150/50">
                      <p className="font-extrabold text-[11px] text-slate-800 mb-1.5">Kualifikasi:</p>
                      <ul className="text-xs text-slate-600 space-y-1 pl-1">
                        {job.requirements.map((req, idx) => (
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
                      onClick={() => handleOpenMap(job.latitude, job.longitude, job.location)}
                      className="flex-1 py-3 bg-[#EBF5FF] hover:bg-blue-100 active:scale-[0.98] text-blue-700 font-black rounded-2xl text-[11px] tracking-wide transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Map className="h-3.5 w-3.5" />
                      Lihat Peta
                    </button>

                    {/* Apply now */}
                    <Link
                      to={`/apply?position=${encodeURIComponent(job.title)}`}
                      className="flex-1.5 py-3 bg-[#0462E9] hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-2xl text-[11px] tracking-wide text-center transition duration-150 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Lamar & Kirim Berkas
                    </Link>

                  </div>

                </div>
              );
            })}
          </div>
        )}

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
