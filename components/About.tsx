import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Handshake,
  Star,
  Search,
  GraduationCap,
  UserCheck,
  Briefcase,
  Building2,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { SectionHeader } from './home/SectionHeader';
import {
  ContentCard,
  MarketingPageShell,
  NavyCtaBanner,
  PageHero,
  PageTopBar,
} from './layout/MarketingPageLayout';

const VALUES = [
  { icon: ShieldCheck, title: 'Integritas', desc: 'Menjunjung tinggi kejujuran dan tanggung jawab dalam setiap proses kerja.' },
  { icon: Users, title: 'Profesionalisme', desc: 'Bekerja secara kompeten, terukur, dan berorientasi pada hasil terbaik.' },
  { icon: Handshake, title: 'Kemitraan', desc: 'Membangun hubungan jangka panjang yang saling percaya dan menguntungkan.' },
  { icon: Star, title: 'Kualitas', desc: 'Mengutamakan mutu layanan dan kepuasan pelanggan secara berkelanjutan.' },
];

const SERVICES = [
  { icon: Search, title: 'Rekrutmen & Seleksi', desc: 'Proses rekrutmen profesional untuk mendapatkan talenta terbaik sesuai kebutuhan perusahaan.' },
  { icon: GraduationCap, title: 'Pelatihan Kerja', desc: 'Program pelatihan terstruktur untuk meningkatkan kompetensi dan produktivitas tenaga kerja.' },
  { icon: UserCheck, title: 'Penempatan Tenaga Kerja', desc: 'Penempatan tenaga kerja yang tepat, sesuai posisi dan budaya kerja perusahaan.' },
  { icon: FileSpreadsheet, title: 'Manajemen & Administrasi', desc: 'Pengelolaan administrasi ketenagakerjaan yang rapi, patuh regulasi, dan efisien.' },
];

const STATS = [
  { icon: Briefcase, value: '500+', label: 'Mitra Perusahaan' },
  { icon: Users, value: '10.000+', label: 'Tenaga Kerja Aktif' },
  { icon: Building2, value: '20+', label: 'Kota Operasional' },
  { icon: Handshake, value: '15+', label: 'Tahun Pengalaman' },
];

export const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <PageTopBar badge="Profil Perusahaan" />

      <MarketingPageShell>
        <PageHero
          eyebrow="Tentang Kami"
          title={
            <>
              Mitra Terpercaya dalam <span className="text-cyan-200">Solusi SDM</span>
            </>
          }
          subtitle="PT Perdana Adi Yuda berkomitmen menyediakan layanan alih daya terbaik melalui proses rekrutmen yang profesional, pelatihan berkualitas, dan penempatan tenaga kerja yang tepat."
          imageSrc="/assets/hero/site_workers.jpg"
          imageAlt="Tim lapangan Perdana"
        />

        <ContentCard>
          <SectionHeader
            compact
            title="Siapa Kami"
            subtitle="Profil singkat PT Perdana Adi Yuda (PERDANA)"
          />
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex-1 space-y-3.5 text-sm font-medium leading-relaxed text-slate-600">
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
            <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-xl border border-slate-100 md:w-64">
              <img
                src="/assets/hero/site_bricklaying.jpg"
                alt="Perwakilan lapangan Perdana"
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/10 bg-slate-900/80 p-3 text-center text-white backdrop-blur-sm">
                <span className="block text-[9px] font-black uppercase tracking-widest text-cyan-200">
                  Field Representative
                </span>
                <p className="mt-0.5 text-[10px] font-bold">PT Perdana Adi Yuda</p>
              </div>
            </div>
          </div>
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title="Komitmen & Nilai Utama"
            subtitle="Nilai yang menjadi dasar kami dalam setiap layanan dan tindakan"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#003087]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-500">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title="Layanan Kami"
            subtitle="Solusi alih daya untuk membantu pertumbuhan bisnis Anda"
          />
          <div className="space-y-3">
            {SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex min-h-[44px] items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition hover:bg-blue-50/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#003087]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-extrabold text-slate-900">{item.title}</h4>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                </div>
              );
            })}
          </div>
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title="Perdana Dalam Angka"
            subtitle="Capaian kami dalam mendukung berbagai perusahaan di Indonesia"
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"
                >
                  <Icon className="mb-1 h-5 w-5 text-[#003087]" aria-hidden />
                  <span className="text-xl font-black leading-none text-[#003087]">{stat.value}</span>
                  <span className="mt-2 text-[9px] font-bold uppercase leading-tight text-slate-500">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </ContentCard>

        <NavyCtaBanner
          title="Butuh bantuan atau informasi lebih lanjut?"
          subtitle="Tim kami siap melayani dan memberikan jawaban atas kebutuhan Anda."
          buttonLabel="Hubungi Kami"
          onClick={() => navigate('/contact')}
        />
      </MarketingPageShell>
    </div>
  );
};