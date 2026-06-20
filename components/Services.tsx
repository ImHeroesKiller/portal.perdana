import React, { useState } from 'react';
import {
  BriefcaseIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../services/i18n';
import { SectionHeader } from './home/SectionHeader';
import {
  ContentCard,
  MarketingPageShell,
  PageHero,
  PageTopBar,
} from './layout/MarketingPageLayout';
import { HOME_H_SCROLL } from './home/homeContent';

interface ServiceDetail {
  id: string;
  title: { id: string; en: string };
  desc: { id: string; en: string };
  icon: React.ComponentType<{ className?: string }>;
  items: { id: string; en: string }[];
}

const SERVICES_DATA: ServiceDetail[] = [
  {
    id: 'business-support',
    title: { id: 'Business Support', en: 'Business Support' },
    desc: {
      id: 'Sumber Daya Manusia merupakan salah satu aspek penting dalam hal operasional perusahaan. Kami menyediakan SDM terbaik dan berpengalaman di bidangnya, melalui proses rekrutmen dan seleksi yang cepat kami dapat memberikan dukungan profesional dan kompetensi tinggi untuk kebutuhan bisnis Anda.',
      en: 'Human Resources is one of the important aspects of company operations. We provide the best and most experienced HR in their fields; through a fast recruitment and selection process, we can provide professional support and high competence for your business needs.',
    },
    icon: BriefcaseIcon,
    items: [
      { id: 'Komunikasi Pemasaran (Marketing Communication)', en: 'Marketing Communication' },
      { id: 'Sales Force / Tim Penjualan', en: 'Sales Force / Sales Team' },
      { id: 'Staff Perkantoran', en: 'Office Staff' },
      { id: 'Staff Forwarding / Logistik', en: 'Forwarding / Logistics Staff' },
      { id: 'Staff Administrasi', en: 'Administrative Staff' },
      { id: 'Receptionist / Resepsionis', en: 'Receptionist' },
      { id: 'Professional Driver / Pengemudi', en: 'Professional Driver' },
      { id: 'Dan posisi pendukung operasional lainnya', en: 'And other operational support positions' },
    ],
  },
  {
    id: 'recruitment',
    title: { id: 'Recruitment', en: 'Recruitment' },
    desc: {
      id: 'Kami fokus kepada pencarian karyawan untuk posisi-posisi non-management untuk membantu perusahaan Anda menjalankan aturan dan prosedur yang ada secara andal dan tepat sasaran.',
      en: 'We focus on searching for employees for non-management positions to help your company run the existing rules and procedures reliably and right on target.',
    },
    icon: UserGroupIcon,
    items: [
      { id: 'Pencarian Tenaga Kerja Non-Manajemen', en: 'Non-Management Talent Sourcing' },
      { id: 'Sistem Seleksi Terstandarisasi', en: 'Standardized Selection System' },
      { id: 'Pemeriksaan Referensi Lengkap', en: 'Comprehensive Reference Checks' },
      { id: 'Penilaian Kompetensi & Karakter', en: 'Competency & Character Evaluation' },
      { id: 'Pemenuhan Kebutuhan Skala Besar', en: 'High-Volume Staffing Solutions' },
    ],
  },
  {
    id: 'training',
    title: { id: 'Training & Development', en: 'Training & Development' },
    desc: {
      id: 'Kami menyediakan berbagai program pelatihan untuk membangun dan mengembangkan bakat tim Anda. Setiap program dipimpin oleh pelatih (trainer) yang kompeten yang dapat menciptakan pembelajaran yang nyaman untuk mendapatkan hasil yang maksimal bagi kemajuan perusahaan.',
      en: "We provide various training programs to build and develop your team's talent. Each program is led by a competent trainer who can create a comfortable learning environment to obtain maximum results for the company's progress.",
    },
    icon: AcademicCapIcon,
    items: [
      { id: 'Inhouse / Exhouse Training', en: 'In-house / Ex-house Training' },
      { id: 'Training Skill & Motivation (Keahlian & Motivasi)', en: 'Skill & Motivation Training' },
      { id: 'Supervisory Management (Manajemen Penyelia)', en: 'Supervisory Management' },
      { id: 'Outdoor Training: Outbond Training', en: 'Outdoor Training: Outbound Activities' },
      { id: 'Employee & Family Gathering', en: 'Employee & Family Gathering' },
    ],
  },
  {
    id: 'event-management',
    title: { id: 'Event Management', en: 'Event Management' },
    desc: {
      id: 'Kami merancang dan melaksanakan setiap Event Anda dengan keahlian dan penuh dedikasi, menciptakan pengalaman yang luar biasa bagi semua peserta untuk mendukung citra publik yang positif.',
      en: 'We design and execute each of your events with expertise and full dedication, creating outstanding experiences for all attendees to support a positive public image.',
    },
    icon: SparklesIcon,
    items: [
      { id: 'MICE (Meetings, Incentives, Conferences, Exhibitions)', en: 'MICE (Meetings, Incentives, Conferences, Exhibitions)' },
      { id: 'Brand Activation (Aktivasi Merek)', en: 'Brand Activation' },
      { id: 'Product Launching (Peluncuran Produk)', en: 'Product Launching' },
      { id: 'Corporation Gathering / Pertemuan Perusahaan', en: 'Corporate Gathering' },
      { id: 'FOB (Field / Festival of Business)', en: 'FOB (Field / Festival of Business)' },
      { id: 'Sales Promotion Girl/Boy (SPG/SPB) Sourcing', en: 'Sales Promotion Girl/Boy (SPG/SPB) Management' },
      { id: 'Penyelenggaraan Event Corporate & Public', en: 'Corporate & Public Event Organizing' },
    ],
  },
];

const RECRUIT_FLOW = [
  { title: { id: 'Identifikasi kebutuhan posisi', en: 'Identify position needs' }, step: 'Step 1' },
  { title: { id: 'Membuat strategi perekrutan', en: 'Create recruitment strategy' }, step: 'Step 2' },
  { title: { id: 'Publikasi lowongan pekerjaan', en: 'Publish job vacancies' }, step: 'Step 3' },
  { title: { id: 'Screening', en: 'Screening / Filtering' }, step: 'Step 4' },
  { title: { id: 'Test & Interview', en: 'Test & Interview' }, step: 'Step 5' },
  { title: { id: 'Asses, Reference check & Verify', en: 'Assess, Reference check & Verify' }, step: 'Step 6' },
  { title: { id: 'Shortlist & offering', en: 'Shortlist & offering' }, step: 'Step 7' },
  { title: { id: 'On boarding or client interview', en: 'Onboarding or client interview' }, step: 'Step 8' },
];

const PROCESS_STEPS = [
  { num: '1', title: { id: 'Recruitment & Assessment', en: 'Recruitment & Assessment' }, detail: { id: 'Seleksi ketat dan evaluasi kompetensi calon tenaga kerja.', en: 'Strict selection and evaluation of prospective workers competency.' } },
  { num: '2', title: { id: 'Training / Pelatihan', en: 'Training & Induction' }, detail: { id: 'Pembekalan keahlian kerja dan penyelarasan budaya kerja mitra.', en: 'Provision of work skills and alignment of partners work culture.' } },
  { num: '3', title: { id: 'Placement & Delivery', en: 'Placement & Delivery' }, detail: { id: 'Penempatan serta koordinasi operasional awal di lokasi kerja.', en: 'Placement and coordination of initials operation on site.' } },
  { num: '4', title: { id: 'Mentoring / Bimbingan', en: 'Ongoing Mentoring' }, detail: { id: 'Pendampingan berkelanjutan bagi karyawan untuk stabilitas kerja.', en: 'Continuous mentoring for employees to ensure work stability.' } },
  { num: '5', title: { id: 'Development / Pengembangan', en: 'Talent Development' }, detail: { id: 'Up-skilling dan pengembangan karir karyawan di lapangan.', en: 'Up-skilling and career development of field employees.' } },
  { num: '6', title: { id: 'Performance Evaluation', en: 'Performance Evaluation' }, detail: { id: 'Evaluasi kinerja berkala (KPI) bersama klien mitra resmi.', en: 'Periodic performance evaluation (KPI) with official partner client.' } },
  { num: '7', title: { id: 'Termination or Renewal', en: 'Termination or Renewal' }, detail: { id: 'Manajemen akhir kontrak kerja atau perpanjangan masa tugas.', en: 'Management of contract termination or service term renewal.' } },
];

export const Services: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('business-support');
  const lang = language === 'id' ? 'id' : 'en';

  const activeService = SERVICES_DATA.find((s) => s.id === activeTab) ?? SERVICES_DATA[0];
  const ActiveIcon = activeService.icon;

  return (
    <div id="services-page" className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <PageTopBar badge="Layanan Alih Daya" />

      <MarketingPageShell wide>
        <PageHero
          eyebrow="PT Perdana Adi Yuda"
          title={lang === 'id' ? 'Layanan Solusi Tenaga Kerja' : 'Manpower Solution Services'}
          subtitle={
            lang === 'id'
              ? 'Layanan pengelolaan tenaga kerja terintegrasi, profesional, dan andal untuk mendukung efisiensi operasional bisnis Anda.'
              : 'Integrated, professional, and reliable workforce management services to support your business operational efficiency.'
          }
          imageSrc="/assets/site_scaffolding.jpg"
          imageAlt="Layanan konstruksi"
        />

        <ContentCard>
          <SectionHeader
            compact
            title={lang === 'id' ? 'Solusi Layanan Terpadu' : 'Comprehensive Services'}
            subtitle={
              lang === 'id'
                ? 'Empat pilar utama layanan pendukung bisnis untuk mitra korporasi'
                : 'Four main pillars of business support services for corporate partners'
            }
          />

          <div className={`${HOME_H_SCROLL} -mx-2 mb-6 px-2 pb-1`}>
            <div className="flex w-max min-w-full gap-2.5">
              {SERVICES_DATA.map((service) => {
                const Icon = service.icon;
                const isActive = activeTab === service.id;
                const label = lang === 'id' ? service.title.id : service.title.en;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setActiveTab(service.id)}
                    className={`inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold shadow-sm transition active:scale-[0.97] ${
                      isActive
                        ? 'border-[#003087] bg-[#003087] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#003087]/30 hover:bg-blue-50/50'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isActive ? 'bg-white/15' : 'bg-blue-50 text-[#003087]'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#003087]">
                  <ActiveIcon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                  {lang === 'id' ? activeService.title.id : activeService.title.en}
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {lang === 'id' ? activeService.desc.id : activeService.desc.en}
              </p>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircleIcon className="h-5 w-5 text-[#003087]" aria-hidden />
                  {lang === 'id' ? 'Item Cakupan Kerja' : 'Work Scope Deliverables'}
                </h4>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {activeService.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <span className="font-bold text-[#003087]">✓</span>
                      <span className="text-xs leading-snug text-slate-700 sm:text-sm">
                        {lang === 'id' ? item.id : item.en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-blue-50/40 p-5 lg:col-span-5">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#003087]">
                {lang === 'id' ? 'Mengapa Memilih Kami?' : 'Why Choose Our Solutions?'}
              </h4>
              <div className="mt-4 space-y-4 text-sm">
                {[
                  {
                    title: lang === 'id' ? 'Kepatuhan Hukum Penuh' : 'Full Legal Compliance',
                    desc: lang === 'id' ? 'Menjunjung peraturan ketenagakerjaan resmi.' : 'Adhere with formal Indonesian labor laws.',
                  },
                  {
                    title: lang === 'id' ? 'Respon & Seleksi Cepat' : 'Rapid SLA Response',
                    desc: lang === 'id' ? 'Proses sourcing ringkas untuk minimalisasi downtime.' : 'Short sourcing process to minimize downtime.',
                  },
                  {
                    title: lang === 'id' ? 'Garansi Penggantian' : 'Replacement Guarantee',
                    desc: lang === 'id' ? 'Garansi penggantian personil jika tidak memenuhi kualifikasi.' : 'Replacement if personnel does not meet standards.',
                  },
                ].map((point) => (
                  <div key={point.title}>
                    <h5 className="font-bold text-slate-900">{point.title}</h5>
                    <p className="mt-1 text-xs text-slate-500">{point.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-slate-200/60 pt-5 text-center">
                <a
                  href="#/contact"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#003087] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-900 active:scale-[0.98]"
                >
                  {lang === 'id' ? 'Hubungi Admin' : 'Contact Admin'}
                  <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title={lang === 'id' ? 'Alur Perekrutan' : 'Recruitment Workflow'}
            subtitle={
              lang === 'id'
                ? 'Prosedur 8 langkah mengkurasi talenta non-manajemen berkualitas'
                : '8-step blueprint from identification to onboarding'
            }
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {RECRUIT_FLOW.map((flow, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-[#003087]/25 hover:shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#003087]">
                    {flow.step}
                  </span>
                  <span className="text-xs font-bold text-slate-300">0{idx + 1}</span>
                </div>
                <h4 className="text-xs font-bold leading-snug text-slate-900 sm:text-sm">
                  {lang === 'id' ? flow.title.id : flow.title.en}
                </h4>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title={lang === 'id' ? 'Siklus Manajemen Tenaga Kerja' : 'Enterprise Lifecycle'}
            subtitle={
              lang === 'id'
                ? 'Pengelolaan siklus hidup ketenagakerjaan untuk produktivitas konstan'
                : 'Complete manpower lifecycle for constant performance'
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:border-[#003087]/25"
              >
                <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#003087] text-xs font-bold text-white">
                  {step.num}
                </div>
                <h4 className="text-xs font-extrabold leading-snug text-slate-900">
                  {lang === 'id' ? step.title.id : step.title.en}
                </h4>
                <p className="mt-2 text-[10px] leading-snug text-slate-500">
                  {lang === 'id' ? step.detail.id : step.detail.en}
                </p>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard className="text-center">
          <SectionHeader
            compact
            title={lang === 'id' ? 'Mitra & Pengalaman Operasional' : 'Partners & Experience'}
            subtitle="Dipercaya berbagai perusahaan nasional"
          />
          <div className="flex flex-wrap items-center justify-center gap-4 opacity-70 sm:gap-8">
            {['INDOSAT OOREDOO', 'LINTASARTA', 'TRANSVISION', 'TVS SUPPLY CHAIN', 'HKTI SULTENG', 'DYANDRA'].map(
              (brand) => (
                <span key={brand} className="text-xs font-extrabold tracking-wider text-slate-700 sm:text-sm">
                  {brand}
                </span>
              )
            )}
          </div>
        </ContentCard>
      </MarketingPageShell>
    </div>
  );
};