export type LocalizedText = { id: string; en: string };

export type PartnerBrand = {
  id: string;
  name: string;
  fullName?: LocalizedText;
  initials: string;
  accentClass: string;
  featured?: boolean;
  sector?: LocalizedText;
};

export const SERVICE_PARTNERS: PartnerBrand[] = [
  {
    id: 'imip',
    name: 'IMIP',
    fullName: {
      id: 'Indonesia Morowali Industrial Park',
      en: 'Indonesia Morowali Industrial Park',
    },
    initials: 'IMIP',
    accentClass: 'bg-[#003087]',
    featured: true,
    sector: { id: 'Smelter & Industri', en: 'Smelter & Industry' },
  },
  {
    id: 'indosat',
    name: 'Indosat Ooredoo',
    initials: 'IO',
    accentClass: 'bg-red-600',
    sector: { id: 'Telekomunikasi', en: 'Telecommunications' },
  },
  {
    id: 'lintasarta',
    name: 'Lintasarta',
    initials: 'LA',
    accentClass: 'bg-sky-700',
    sector: { id: 'Infrastruktur Digital', en: 'Digital Infrastructure' },
  },
  {
    id: 'transvision',
    name: 'Transvision',
    initials: 'TV',
    accentClass: 'bg-orange-600',
    sector: { id: 'Media & Siaran', en: 'Media & Broadcast' },
  },
  {
    id: 'tvs',
    name: 'TVS Supply Chain',
    initials: 'TVS',
    accentClass: 'bg-slate-700',
    sector: { id: 'Logistik', en: 'Logistics' },
  },
  {
    id: 'hkti',
    name: 'HKTI Sulawesi Tengah',
    initials: 'HK',
    accentClass: 'bg-emerald-700',
    sector: { id: 'Kamar Dagang', en: 'Chamber of Commerce' },
  },
  {
    id: 'dyandra',
    name: 'Dyandra',
    initials: 'DY',
    accentClass: 'bg-purple-700',
    sector: { id: 'Event & MICE', en: 'Events & MICE' },
  },
];

export const RECRUIT_FLOW_STEPS: { step: number; title: LocalizedText; short: LocalizedText }[] = [
  {
    step: 1,
    title: { id: 'Identifikasi kebutuhan posisi', en: 'Identify position needs' },
    short: { id: 'Analisis kebutuhan', en: 'Needs analysis' },
  },
  {
    step: 2,
    title: { id: 'Strategi perekrutan', en: 'Recruitment strategy' },
    short: { id: 'Rencana hiring', en: 'Hiring plan' },
  },
  {
    step: 3,
    title: { id: 'Publikasi lowongan', en: 'Publish vacancies' },
    short: { id: 'Go live', en: 'Go live' },
  },
  {
    step: 4,
    title: { id: 'Screening kandidat', en: 'Candidate screening' },
    short: { id: 'Filter awal', en: 'Initial filter' },
  },
  {
    step: 5,
    title: { id: 'Tes & wawancara', en: 'Test & interview' },
    short: { id: 'Assesmen', en: 'Assessment' },
  },
  {
    step: 6,
    title: { id: 'Referensi & verifikasi', en: 'Reference & verify' },
    short: { id: 'Validasi', en: 'Validation' },
  },
  {
    step: 7,
    title: { id: 'Shortlist & offering', en: 'Shortlist & offer' },
    short: { id: 'Penawaran', en: 'Offering' },
  },
  {
    step: 8,
    title: { id: 'Onboarding klien', en: 'Client onboarding' },
    short: { id: 'Penempatan', en: 'Placement' },
  },
];

export const LIFECYCLE_STEPS: { step: number; title: LocalizedText; detail: LocalizedText }[] = [
  {
    step: 1,
    title: { id: 'Rekrutmen', en: 'Recruitment' },
    detail: { id: 'Seleksi & asesmen kompetensi.', en: 'Selection & competency assessment.' },
  },
  {
    step: 2,
    title: { id: 'Pelatihan', en: 'Training' },
    detail: { id: 'Pembekalan skill & budaya kerja.', en: 'Skills & culture induction.' },
  },
  {
    step: 3,
    title: { id: 'Penempatan', en: 'Placement' },
    detail: { id: 'Koordinasi awal di lokasi kerja.', en: 'On-site coordination.' },
  },
  {
    step: 4,
    title: { id: 'Bimbingan', en: 'Mentoring' },
    detail: { id: 'Pendampingan berkelanjutan.', en: 'Ongoing support.' },
  },
  {
    step: 5,
    title: { id: 'Pengembangan', en: 'Development' },
    detail: { id: 'Up-skilling & karier.', en: 'Up-skilling & career growth.' },
  },
  {
    step: 6,
    title: { id: 'Evaluasi KPI', en: 'KPI Review' },
    detail: { id: 'Review kinerja berkala.', en: 'Periodic performance review.' },
  },
  {
    step: 7,
    title: { id: 'Perpanjangan', en: 'Renewal' },
    detail: { id: 'Manajemen akhir kontrak.', en: 'Contract renewal or exit.' },
  },
];