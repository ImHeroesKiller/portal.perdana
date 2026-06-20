import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useMediaQuery';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Users, 
  Handshake, 
  Star, 
  Search, 
  GraduationCap, 
  UserCheck, 
  Briefcase, 
  Building2, 
  Map, 
  Clock, 
  ChevronRight,
  PhoneCall,
  FileSpreadsheet
} from 'lucide-react';

export const About: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div id="about-us-container" className="bg-[#F8FAFC] min-h-screen pb-12 font-sans select-none antialiased text-slate-800">
      
      {/* 0. Small Elegant Back Button Bar at the very top */}
      <div className="bg-white border-b border-slate-100 py-3.5 px-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-2 cursor-pointer active:scale-95 transition-all text-[11px]"
            id="back-home-link"
          >
            <ArrowLeft className="w-4.5 h-4.5 stroke-[2.5]" />
            Kembali ke Beranda
          </button>
          
          <span className="text-[9px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Manpower Agency Profile
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">

        {/* 1. Header Hero Banner with Professional Team Image */}
        <div className="bg-gradient-to-br from-blue-900 to-[#0F172A] text-white rounded-3xl overflow-hidden shadow-xs relative">
          <div className="absolute inset-0 opacity-15 mix-blend-overlay">
            <img 
              src="/assets/site_shoveling.jpg" 
              alt="Site project background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-center gap-6">
            
            {/* Left Content column */}
            <div className="flex-1 text-left">
              <span className="text-[10px] font-black text-[#00E5FF] uppercase tracking-widest block mb-2">
                TENTANG KAMI
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                Mitra Terpercaya <br className="hidden md:block" />
                dalam <span className="text-[#00E5FF]">Solusi SDM</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-350 mt-4 leading-relaxed font-medium">
                PT Perdana Adi Yuda berkomitmen menyediakan layanan alih daya terbaik melalui proses rekrutmen yang profesional, pelatihan berkualitas, dan penempatan tenaga kerja yang tepat.
              </p>
            </div>

            {/* Right Team photo column */}
            <div className="w-full md:w-[280px] h-[180px] rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-xs relative">
              <img 
                src="/assets/site_workers.jpg" 
                alt="Representative Team" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

          </div>
        </div>

        {/* 2. SIAPA KAMI section with Female PERDANA Office Officer representation */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center gap-6">
          
          {/* Left Text */}
          <div className="flex-1 text-left">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">
              SIAPA KAMI
            </span>
            <h2 className="text-base md:text-lg font-black text-slate-950 mb-4 uppercase">
              PT Perdana Adi Yuda (PERDANA)
            </h2>
            <div className="text-xs md:text-sm text-slate-500 space-y-3.5 leading-relaxed font-semibold">
              <p>
                Didirikan dengan semangat untuk menjadi mitra strategis perusahaan dalam pengelolaan sumber daya manusia.
              </p>
              <p>
                Kami menghadirkan solusi alih daya yang fleksibel, efisien, dan berorientasi pada kualitas serta kepuasan pelanggan.
              </p>
              <p>
                Dengan pengalaman dan jaringan yang luas, kami siap mendukung berbagai kebutuhan tenaga kerja di berbagai sektor industri di seluruh Indonesia.
              </p>
            </div>
          </div>

          {/* Right Image representing Perdana Officer wearing Blue custom uniform with clip board */}
          <div className="w-full md:w-[280px] h-[310px] rounded-2xl overflow-hidden border border-slate-100 relative shrink-0">
            <img 
              src="/assets/site_bricklaying.jpg" 
              alt="Perdana Corporate Officer" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* PERDANA custom badge banner overlays the image bottom */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-white text-center">
              <span className="text-[9px] font-black tracking-widest text-blue-300 uppercase block">Field Representative</span>
              <p className="text-[10px] mt-0.5 font-bold">PT Perdana Adi Yuda</p>
            </div>
          </div>

        </div>

        {/* 3. KOMITMEN & NILAI-NILAI UTAMA (4 columns grid) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs text-center space-y-6">
          <div className="text-center">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">
              KOMITMEN & NILAI-NILAI UTAMA
            </span>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              Nilai yang menjadi dasar kami dalam setiap layanan dan tindakan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* 1. Integritas */}
            <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center border border-slate-100/50">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 mb-2">Integritas</h4>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center">
                Menjunjung tinggi kejujuran dan tanggung jawab dalam setiap proses kerja.
              </p>
            </div>

            {/* 2. Profesionalisme */}
            <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center border border-slate-100/50">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 mb-2">Profesionalisme</h4>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center">
                Bekerja secara kompeten, terukur, dan berorientasi pada hasil terbaik.
              </p>
            </div>

            {/* 3. Kemitraan */}
            <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center border border-slate-100/50">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <Handshake className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 mb-2">Kemitraan</h4>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center">
                Membangun hubungan jangka panjang yang saling percaya dan menguntungkan.
              </p>
            </div>

            {/* 4. Kualitas */}
            <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center border border-slate-100/50">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <Star className="w-5 h-5 stroke-[2]" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 mb-2">Kualitas</h4>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center">
                Mengutamakan mutu layanan dan kepuasan pelanggan secara berkelanjutan.
              </p>
            </div>

          </div>
        </div>

        {/* 4. LAYANAN KAMI - exact matching mockup list style with chevrons */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs text-left space-y-6">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">
              LAYANAN KAMI
            </span>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              Solusi alih daya yang kami sediakan untuk membantu pertumbuhan bisnis Anda.
            </p>
          </div>

          <div className="space-y-3">
            
            {/* item 1: Rekrutmen */}
            <div className="p-3.5 bg-slate-50 border border-slate-100/30 rounded-2xl flex items-center gap-4 hover:bg-slate-100/50 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Rekrutmen & Seleksi</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-snug">
                  Proses rekrutmen profesional untuk mendapatkan talenta terbaik sesuai kebutuhan perusahaan.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>

            {/* item 2: Pelatihan Kerja */}
            <div className="p-3.5 bg-slate-50 border border-slate-100/30 rounded-2xl flex items-center gap-4 hover:bg-slate-100/50 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-xs font-extrabold text-[#00897B]">Pelatihan Kerja</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-snug">
                  Program pelatihan terstruktur untuk meningkatkan kompetensi dan produktivitas tenaga kerja.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>

            {/* item 3: Penempatan */}
            <div className="p-3.5 bg-slate-50 border border-slate-100/30 rounded-2xl flex items-center gap-4 hover:bg-slate-100/50 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-xs font-extrabold text-[#7B1FA2]">Penempatan Tenaga Kerja</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-snug">
                  Penempatan tenaga kerja yang tepat, sesuai posisi dan budaya kerja perusahaan.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>

            {/* item 4: Manajemen Administrasi */}
            <div className="p-3.5 bg-slate-50 border border-slate-100/30 rounded-2xl flex items-center gap-4 hover:bg-slate-100/50 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-xs font-extrabold text-[#E65100]">Manajemen & Administrasi</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-snug">
                  Pengelolaan administrasi ketenagakerjaan yang rapi, patuh regulasi, dan efisien.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>

          </div>
        </div>

        {/* 5. PERDANA DALAM ANGKA metric counters */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs text-left space-y-6">
          <div className="text-center">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">
              PERDANA DALAM ANGKA
            </span>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              Capaian kami dalam mendukung berbagai perusahaan di Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* stat 1 */}
            <div className="bg-[#FAF9F6] border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Briefcase className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xl font-black text-blue-900 block leading-none">500+</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase mt-2 leading-tight">Mitra Perusahaan</span>
            </div>

            {/* stat 2 */}
            <div className="bg-[#FAF9F6] border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Users className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-xl font-black text-emerald-600 block leading-none">10.000+</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase mt-2 leading-tight">Tenaga Kerja Aktif</span>
            </div>

            {/* stat 3 */}
            <div className="bg-[#FAF9F6] border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Building2 className="w-5 h-5 text-purple-600 mb-1" />
              <span className="text-xl font-black text-purple-900 block leading-none">20+</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase mt-2 leading-tight">Kota Operasional</span>
            </div>

            {/* stat 4 */}
            <div className="bg-[#FAF9F6] border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <Handshake className="w-5 h-5 text-orange-500 mb-1" />
              <span className="text-xl font-black text-orange-600 block leading-none">15+</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase mt-2 leading-tight">Tahun Pengalaman</span>
            </div>

          </div>
        </div>

        {/* 6. CALLOUT QUESTION BANNER */}
        <div className="bg-gradient-to-r from-[#0052C8] to-[#0462E9] rounded-2xl text-white p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-extrabold leading-snug">Butuh bantuan atau informasi lebih lanjut?</p>
              <p className="text-[10px] text-blue-100 leading-snug mt-0.5">Tim kami siap melayani dan memberikan jawaban atas kebutuhan Anda.</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/contact')}
            className="bg-white hover:bg-slate-50 transition active:scale-95 text-[#0052C8] font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
          >
            Hubungi Kami
            <ChevronRight className="w-4 h-4 font-bold" />
          </button>
        </div>

        {/* 7. Brand Beautiful Cyan Footer */}
        {!isMobile && (
          <div className="bg-[#00B5F1] text-white py-5 px-6 rounded-3xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="bg-white px-2.5 py-1 rounded-xl flex items-center justify-center shadow-xs">
                <img 
                  src="/assets/logo.png" 
                  alt="PT Perdana" 
                  className="h-6 w-auto object-contain" 
                />
              </div>
              <div className="h-6 w-[1.5px] bg-white/30"></div>
              <span className="text-[10px] font-extrabold tracking-wider whitespace-nowrap">
                PT PERDANA ADI YUDA
              </span>
            </div>
            <p className="text-[9px] text-white/80 font-medium font-sans">
              © 2026 PT Perdana Adi Yuda. All rights reserved.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
