import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, Project } from '../types';
import { getCurrentUser } from '../services/auth';
import { 
  Briefcase, 
  Users, 
  Handshake, 
  Folder, 
  Search, 
  ArrowRight, 
  Sparkles, 
  LogIn, 
  UserCheck, 
  Info, 
  Phone, 
  Factory, 
  Building2, 
  ShieldCheck, 
  Brush, 
  Utensils, 
  Megaphone, 
  Calendar,
  Construction
} from 'lucide-react';

interface MobileHomePageProps {
  jobs: any[];
  filteredJobs: any[];
  clients: Client[];
  projects: Project[];
  stats: { jobs: number; applicants: number; clients: number; projects: number };
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  openMap: (lat?: number, lng?: number, title?: string) => void;
  t: (key: string) => string;
  language: 'id' | 'en';
}

export const MobileHomePage: React.FC<MobileHomePageProps> = ({
  stats,
  language,
  t
}) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const slideshowImages = [
    "/assets/site_workers.jpg",
    "/assets/site_bricklaying.jpg",
    "/assets/site_shoveling.jpg"
  ];
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % slideshowImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-6 font-sans antialiased text-slate-800">
      
      {/* 1. Hero / Header Area matching visual reference */}
      <div className="px-4 pt-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 to-blue-950 text-white min-h-[190px] p-5 flex items-center justify-between shadow-xs">
          
          {/* Background subtle light effects */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
          
          {/* Left Text Column */}
          <div className="flex-1 pr-4 z-10">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-1">
              SELAMAT DATANG
            </span>
            <h2 className="text-xl font-extrabold text-white leading-tight">
              {currentUser ? `Halo, ${currentUser.username}` : (language === 'id' ? 'Pengunjung' : 'Guest')}
            </h2>
            <h2 className="text-xl font-extrabold text-[#00E5FF] leading-tight">
              Perdana Adi Yuda
            </h2>
            <p className="text-[10px] text-slate-300 mt-2 leading-relaxed max-w-[200px]">
              Satu pintu rekrutmen profesional, pelatihan kerja, dan penempatan alih daya.
            </p>
            
            {/* Search Trigger Button inside Hero */}
            <button 
              onClick={() => navigate('/vacancies')}
              className="mt-4 inline-flex items-center gap-2 bg-[#0056C6] hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition duration-150 active:scale-[0.98] shadow-sm cursor-pointer"
            >
              Cari Lowongan
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Building Image Column with smooth slide/fade transition */}
          <div className="w-[120px] h-[140px] rounded-2xl overflow-hidden relative border border-white/10 shrink-0 shadow-sm bg-blue-950">
            {slideshowImages.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={`Office PT PAP ${idx + 1}`} 
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
                  activeImageIdx === idx ? 'opacity-100' : 'opacity-0'
                }`}
                referrerPolicy="no-referrer"
              />
            ))}
          </div>

        </div>
      </div>

      {/* 2. Balanced Simple Statistics Cards (Row layout) */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs grid grid-cols-4 gap-1 antialiased">
          
          {/* Card 1: Posisi */}
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-[#0056C6] leading-none mt-1">{stats.jobs}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Posisi</span>
          </div>

          {/* Card 2: Pelamar */}
          <div className="flex flex-col items-center text-center border-l border-slate-100">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-emerald-600 leading-none mt-1">{stats.applicants}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Pelamar</span>
          </div>

          {/* Card 3: Mitra */}
          <div className="flex flex-col items-center text-center border-l border-slate-100">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-1">
              <Handshake className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-amber-600 leading-none mt-1">{stats.clients}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Mitra Bisnis</span>
          </div>

          {/* Card 4: Proyek */}
          <div className="flex flex-col items-center text-center border-l border-slate-100">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-1">
              <Folder className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-purple-600 leading-none mt-1">{stats.projects}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Proyek</span>
          </div>

        </div>
      </div>

      {/* 3. LAYANAN & MENU UTAMA Grid layout */}
      <div className="px-4 mt-6">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-1 mb-3">
          LAYANAN & MENU UTAMA
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card: Lihat Lowongan */}
          <button 
            onClick={() => navigate('/vacancies')}
            className="bg-white border border-slate-100 hover:bg-blue-50/10 active:scale-[0.98] transition-all p-3.5 rounded-2xl shadow-xs flex flex-col justify-between items-start text-left h-[110px] w-full relative"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0056C6] flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 pr-6">
              <span className="text-xs font-extrabold text-slate-900 block leading-tight">Lihat Lowongan</span>
              <span className="text-[9px] text-slate-400 mt-1 block leading-snug">Cari kerja sesuai minat dan keahlian Anda</span>
            </div>
            <div className="absolute bottom-3.5 right-3.5 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[#0462E9]">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card: Masuk / Portal */}
          <button 
            onClick={() => navigate(currentUser ? (currentUser.role === 'admin' ? '/admin' : '/portal') : '/login')}
            className="bg-white border border-slate-100 hover:bg-blue-50/10 active:scale-[0.98] transition-all p-3.5 rounded-2xl shadow-xs flex flex-col justify-between items-start text-left h-[110px] w-full relative"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0462E9] flex items-center justify-center">
              {currentUser ? <UserCheck className="w-4.5 h-4.5" /> : <LogIn className="w-4.5 h-4.5" />}
            </div>
            <div className="mt-2 pr-6">
              <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                {currentUser ? 'Portal Saya' : 'Masuk'}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 block leading-snug">
                {currentUser ? 'Kelola Pekerjaan Anda' : 'Masuk Ke Portal'}
              </span>
            </div>
            <div className="absolute bottom-3.5 right-3.5 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[#0462E9]">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card: Tentang Kami */}
          <button 
            onClick={() => navigate('/about')}
            className="bg-white border border-slate-100 hover:bg-blue-50/10 active:scale-[0.98] transition-all p-3.5 rounded-2xl shadow-xs flex flex-col justify-between items-start text-left h-[110px] w-full relative"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
              <Info className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 pr-6">
              <span className="text-xs font-extrabold text-slate-900 block leading-tight">Tentang Kami</span>
              <span className="text-[9px] text-slate-400 mt-1 block leading-snug">Visi, misi & informasi perusahaan</span>
            </div>
            <div className="absolute bottom-3.5 right-3.5 w-6 h-6 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card: Kontak Kami */}
          <button 
            onClick={() => navigate('/contact')}
            className="bg-white border border-slate-100 hover:bg-blue-50/10 active:scale-[0.98] transition-all p-3.5 rounded-2xl shadow-xs flex flex-col justify-between items-start text-left h-[110px] w-full relative"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <div className="mt-2 pr-6">
              <span className="text-xs font-extrabold text-slate-900 block leading-tight">Kontak Kami</span>
              <span className="text-[9px] text-slate-400 mt-1 block leading-snug">Telegram & Bantuan langsung</span>
            </div>
            <div className="absolute bottom-3.5 right-3.5 w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>
      </div>

      {/* 4. SEKTOR ALIH DAYA quick selection */}
      <div className="px-4 mt-6">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-1 mb-3">
          SEKTOR ALIH DAYA
        </h3>
        
        <div className="grid grid-cols-3 gap-2">
          
          {/* Manufaktur */}
          <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
              <Factory className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-900">Manufaktur</span>
          </div>

          {/* Perkantoran */}
          <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-900">Perkantoran</span>
          </div>

          {/* Logistik */}
          <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
              <Construction className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-900">Logistik</span>
          </div>

          {/* Keamanan */}
          <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-900">Keamanan</span>
          </div>

          {/* Kebersihan */}
          <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
              <Brush className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-900">Kebersihan</span>
          </div>

          {/* F&B */}
          <div className="bg-white border border-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 mb-2">
              <Utensils className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-900">F&B / Catering</span>
          </div>

        </div>
      </div>

      {/* 5. INFORMASI TERKINI card matching visual design */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-1 mb-0">
            INFORMASI TERKINI
          </h3>
          <button 
            onClick={() => navigate('/about')}
            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Lihat semua <ArrowRight className="w-3 h-3 inline" />
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs flex items-center gap-3">
          
          {/* Megaphone image container */}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Megaphone className="w-8 h-8 -rotate-12" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <span className="bg-blue-100 text-blue-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              PENGUMUMAN
            </span>
            <h4 className="text-xs font-extrabold text-slate-950 mt-1.5">
              Informasi Rekrutmen Terbaru
            </h4>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
              Dapatkan update lowongan dan informasi penting lainnya dari PT Perdana Adi Yuda.
            </p>
          </div>

          {/* Date Stamp */}
          <div className="bg-blue-50/75 border border-blue-100 rounded-xl px-2.5 py-2 shrink-0 flex items-center gap-1 text-[9px] font-bold text-blue-700">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>20 Mei 2025</span>
          </div>

        </div>
      </div>

    </div>
  );
};
