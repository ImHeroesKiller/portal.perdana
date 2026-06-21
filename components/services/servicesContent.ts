export type LocalizedText = { id: string; en: string; zh?: string };

export type PartnerBrand = {
  id: string;
  name: string;
  fullName?: LocalizedText;
  logoUrl: string;
  websiteUrl: string;
  /** White/light logos need a navy or dark backdrop */
  logoDarkBg?: boolean;
  featured?: boolean;
  sector?: LocalizedText;
};

export const SERVICE_PARTNERS: PartnerBrand[] = [
  {
    id: 'indosat',
    name: 'Indosat Ooredoo Hutchison',
    fullName: {
      id: 'Indosat Ooredoo Hutchison',
      en: 'Indosat Ooredoo Hutchison',
      zh: 'Indosat Ooredoo Hutchison',
    },
    logoUrl: 'https://ioh.co.id/_nuxt/logo-ioh.BliL6vXr.svg',
    websiteUrl: 'https://ioh.co.id/',
    sector: { id: 'Telekomunikasi', en: 'Telecommunications', zh: '电信' },
  },
  {
    id: 'imip',
    name: 'IMIP',
    fullName: {
      id: 'Indonesia Morowali Industrial Park',
      en: 'Indonesia Morowali Industrial Park',
      zh: '印尼莫罗瓦利工业园',
    },
    logoUrl:
      'https://imip.co.id/wp-content/uploads/2024/06/cropped-IMIP_logo-removebg-preview-270x270.png',
    websiteUrl: 'https://imip.co.id/',
    featured: true,
    sector: { id: 'Smelter & Industri', en: 'Smelter & Industry', zh: '冶炼与工业' },
  },
  {
    id: 'lintasarta',
    name: 'Lintasarta',
    logoUrl: 'https://www.lintasarta.net/storage/2024/06/Logo-Lintasarta-new-300x132.png',
    websiteUrl: 'https://www.lintasarta.net/',
    sector: { id: 'Infrastruktur Digital', en: 'Digital Infrastructure', zh: '数字基础设施' },
  },
  {
    id: 'transvision',
    name: 'Transvision',
    logoUrl: 'https://www.transvision.co.id/img/icons/favico-64x64.png',
    websiteUrl: 'https://www.transvision.co.id/',
    sector: { id: 'Media & Siaran', en: 'Media & Broadcast', zh: '媒体与广播' },
  },
  {
    id: 'tvs',
    name: 'TVS Supply Chain',
    logoUrl:
      'https://www.tvsscs.com/wp-content/uploads/2025/01/TVS-SCS-logo-with-tagline-white-2.svg',
    websiteUrl: 'https://www.tvsscs.com/',
    logoDarkBg: true,
    sector: { id: 'Logistik', en: 'Logistics', zh: '供应链物流' },
  },
  {
    id: 'hkti',
    name: 'HKTI',
    fullName: {
      id: 'Himpunan Kerukunan Tani Indonesia',
      en: 'Indonesian Farmers Harmony Association',
      zh: '印尼农民和睦协会',
    },
    logoUrl: 'https://hkti.org/wp-content/uploads/2022/09/cropped-favicon-hkti-270x270.png',
    websiteUrl: 'https://hkti.org/',
    sector: { id: 'Kamar Dagang', en: 'Chamber of Commerce', zh: '商会' },
  },
  {
    id: 'dyandra',
    name: 'Dyandra',
    logoUrl: 'https://dyandramedia.com/image/logo.png',
    websiteUrl: 'https://dyandramedia.com/',
    sector: { id: 'Event & MICE', en: 'Events & MICE', zh: '会展与活动' },
  },
  {
    id: 'bintang-toedjoe',
    name: 'Bintang Toedjoe',
    logoUrl: 'https://bintang7.com/images/home/bintang-toejoe.png',
    websiteUrl: 'https://bintang7.com/',
    sector: { id: 'Farmasi & Kesehatan', en: 'Pharma & Health', zh: '医药健康' },
  },
];

export const RECRUIT_FLOW_STEPS: { step: number; title: LocalizedText; short: LocalizedText }[] = [
  {
    step: 1,
    title: { id: 'Identifikasi kebutuhan posisi', en: 'Define role requirements', zh: '明确岗位需求' },
    short: { id: 'Analisis', en: 'Analysis', zh: '需求分析' },
  },
  {
    step: 2,
    title: { id: 'Strategi perekrutan', en: 'Recruitment strategy', zh: '制定招聘方案' },
    short: { id: 'Strategi', en: 'Strategy', zh: '招聘策略' },
  },
  {
    step: 3,
    title: { id: 'Publikasi lowongan', en: 'Publish vacancies', zh: '发布招聘公告' },
    short: { id: 'Go live', en: 'Go live', zh: '职位上线' },
  },
  {
    step: 4,
    title: { id: 'Screening kandidat', en: 'Candidate screening', zh: '候选人初步筛选' },
    short: { id: 'Screening', en: 'Screening', zh: '简历筛选' },
  },
  {
    step: 5,
    title: { id: 'Tes & wawancara', en: 'Tests & interviews', zh: '测评与面试' },
    short: { id: 'Assesmen', en: 'Assessment', zh: '综合考核' },
  },
  {
    step: 6,
    title: { id: 'Referensi & verifikasi', en: 'Reference checks', zh: '背景与资质核实' },
    short: { id: 'Validasi', en: 'Validation', zh: '资格验证' },
  },
  {
    step: 7,
    title: { id: 'Shortlist & offering', en: 'Shortlist & offer', zh: '入围名单与录用' },
    short: { id: 'Offering', en: 'Offering', zh: '录用通知' },
  },
  {
    step: 8,
    title: { id: 'Onboarding klien', en: 'Client onboarding', zh: '客户现场入职' },
    short: { id: 'Penempatan', en: 'Placement', zh: '到岗安置' },
  },
];

export const LIFECYCLE_STEPS: { step: number; title: LocalizedText; detail: LocalizedText }[] = [
  {
    step: 1,
    title: { id: 'Rekrutmen', en: 'Recruitment', zh: '招聘甄选' },
    detail: { id: 'Seleksi & asesmen kompetensi.', en: 'Selection & skills assessment.', zh: '精准筛选，评估专业能力。' },
  },
  {
    step: 2,
    title: { id: 'Pelatihan', en: 'Training', zh: '入职培训' },
    detail: { id: 'Pembekalan skill & budaya kerja.', en: 'Skills & culture onboarding.', zh: '技能与文化适应性培训。' },
  },
  {
    step: 3,
    title: { id: 'Penempatan', en: 'Placement', zh: '现场安置' },
    detail: { id: 'Koordinasi awal di lokasi kerja.', en: 'On-site coordination.', zh: '工作现场对接与协调。' },
  },
  {
    step: 4,
    title: { id: 'Bimbingan', en: 'Mentoring', zh: '在岗辅导' },
    detail: { id: 'Pendampingan berkelanjutan.', en: 'Ongoing guidance.', zh: '持续跟进，及时解决问题。' },
  },
  {
    step: 5,
    title: { id: 'Pengembangan', en: 'Development', zh: '能力提升' },
    detail: { id: 'Up-skilling & karier.', en: 'Up-skilling & career growth.', zh: '技能升级与职业发展。' },
  },
  {
    step: 6,
    title: { id: 'Evaluasi KPI', en: 'KPI Review', zh: '绩效评估' },
    detail: { id: 'Review kinerja berkala.', en: 'Periodic performance review.', zh: '定期 KPI 考核与反馈。' },
  },
  {
    step: 7,
    title: { id: 'Perpanjangan', en: 'Renewal', zh: '续约管理' },
    detail: { id: 'Manajemen akhir kontrak.', en: 'Contract renewal or exit.', zh: '合同续签或有序离职。' },
  },
];