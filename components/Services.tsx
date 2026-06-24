import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BriefcaseIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { pickLocalized, useLanguage } from '../services/i18n';
import { MarketingPageShell } from './layout/MarketingPageLayout';
import { BRAND_NAVY } from './home/homeContent';
import type { LocalizedText } from './services/servicesContent';
import {
  EnterpriseLifecycleTimeline,
  PartnerExperienceSection,
  RecruitmentFlowTimeline,
  WorkScopeTimeline,
} from './services/ServiceVisualSections';
import {
  CardSectionHeader,
  NAVY_BTN,
  RecruitmentBackButton,
  WizardCard,
  WizardHero,
} from './recruitment/recruitmentUi';

interface ServiceDetail {
  id: string;
  title: LocalizedText;
  desc: LocalizedText;
  icon: React.ComponentType<{ className?: string }>;
  items: LocalizedText[];
}

const SERVICES_DATA: ServiceDetail[] = [
  {
    id: 'business-support',
    title: { id: 'Business Support', en: 'Business Support', zh: '业务支持' },
    desc: {
      id: 'Sumber Daya Manusia merupakan salah satu aspek penting dalam hal operasional perusahaan. Kami menyediakan SDM terbaik dan berpengalaman di bidangnya, melalui proses rekrutmen dan seleksi yang cepat kami dapat memberikan dukungan profesional dan kompetensi tinggi untuk kebutuhan bisnis Anda.',
      en: 'Human Resources is one of the important aspects of company operations. We provide the best and most experienced HR in their fields; through a fast recruitment and selection process, we can provide professional support and high competence for your business needs.',
      zh: '人力资源是企业运营的核心要素之一。我们提供各领域的资深专业人才，通过高效的招聘与甄选流程，为您的业务需求提供专业、可靠的人力支持。',
    },
    icon: BriefcaseIcon,
    items: [
      { id: 'Komunikasi Pemasaran (Marketing Communication)', en: 'Marketing Communication', zh: '市场营销与品牌传播' },
      { id: 'Sales Force / Tim Penjualan', en: 'Sales Force / Sales Team', zh: '销售团队' },
      { id: 'Staff Perkantoran', en: 'Office Staff', zh: '办公室职员' },
      { id: 'Staff Forwarding / Logistik', en: 'Forwarding / Logistics Staff', zh: '货代与物流人员' },
      { id: 'Staff Administrasi', en: 'Administrative Staff', zh: '行政人员' },
      { id: 'Receptionist / Resepsionis', en: 'Receptionist', zh: '前台接待' },
      { id: 'Professional Driver / Pengemudi', en: 'Professional Driver', zh: '专业驾驶员' },
      { id: 'Dan posisi pendukung operasional lainnya', en: 'And other operational support positions', zh: '及其他运营支持岗位' },
    ],
  },
  {
    id: 'recruitment',
    title: { id: 'Recruitment', en: 'Recruitment', zh: '招聘服务' },
    desc: {
      id: 'Kami fokus kepada pencarian karyawan untuk posisi-posisi non-management untuk membantu perusahaan Anda menjalankan aturan dan prosedur yang ada secara andal dan tepat sasaran.',
      en: 'We focus on searching for employees for non-management positions to help your company run the existing rules and procedures reliably and right on target.',
      zh: '我们专注于非管理岗位的人才搜寻，帮助企业高效落实各项规章制度与业务流程，确保人岗匹配、执行到位。',
    },
    icon: UserGroupIcon,
    items: [
      { id: 'Pencarian Tenaga Kerja Non-Manajemen', en: 'Non-Management Talent Sourcing', zh: '非管理岗位人才搜寻' },
      { id: 'Sistem Seleksi Terstandarisasi', en: 'Standardized Selection System', zh: '标准化甄选体系' },
      { id: 'Pemeriksaan Referensi Lengkap', en: 'Comprehensive Reference Checks', zh: '全面背景调查' },
      { id: 'Penilaian Kompetensi & Karakter', en: 'Competency & Character Evaluation', zh: '能力与品格评估' },
      { id: 'Pemenuhan Kebutuhan Skala Besar', en: 'High-Volume Staffing Solutions', zh: '大批量用工解决方案' },
    ],
  },
  {
    id: 'training',
    title: { id: 'Training & Development', en: 'Training & Development', zh: '培训与发展' },
    desc: {
      id: 'Kami menyediakan berbagai program pelatihan untuk membangun dan mengembangkan bakat tim Anda. Setiap program dipimpin oleh pelatih (trainer) yang kompeten yang dapat menciptakan pembelajaran yang nyaman untuk mendapatkan hasil yang maksimal bagi kemajuan perusahaan.',
      en: "We provide various training programs to build and develop your team's talent. Each program is led by a competent trainer who can create a comfortable learning environment to obtain maximum results for the company's progress.",
      zh: '我们提供多样化培训项目，助力团队能力提升。每门课程均由资深讲师授课，营造高效、舒适的学习环境，为企业发展创造最大价值。',
    },
    icon: AcademicCapIcon,
    items: [
      { id: 'Inhouse / Exhouse Training', en: 'In-house / Ex-house Training', zh: '内训 / 外训' },
      { id: 'Training Skill & Motivation (Keahlian & Motivasi)', en: 'Skill & Motivation Training', zh: '技能与激励培训' },
      { id: 'Supervisory Management (Manajemen Penyelia)', en: 'Supervisory Management', zh: '督导管理培训' },
      { id: 'Outdoor Training: Outbond Training', en: 'Outdoor Training: Outbound Activities', zh: '户外拓展培训' },
      { id: 'Employee & Family Gathering', en: 'Employee & Family Gathering', zh: '员工及家庭联谊活动' },
    ],
  },
  {
    id: 'event-management',
    title: { id: 'Event Management', en: 'Event Management', zh: '活动管理' },
    desc: {
      id: 'Kami merancang dan melaksanakan setiap Event Anda dengan keahlian dan penuh dedikasi, menciptakan pengalaman yang luar biasa bagi semua peserta untuk mendukung citra publik yang positif.',
      en: 'We design and execute each of your events with expertise and full dedication, creating outstanding experiences for all attendees to support a positive public image.',
      zh: '我们以专业团队和全程贴心服务，策划并执行各类活动，为参与者打造卓越体验，助力企业树立良好品牌形象。',
    },
    icon: SparklesIcon,
    items: [
      { id: 'MICE (Meetings, Incentives, Conferences, Exhibitions)', en: 'MICE (Meetings, Incentives, Conferences, Exhibitions)', zh: 'MICE（会议、奖励、会议、展览）' },
      { id: 'Brand Activation (Aktivasi Merek)', en: 'Brand Activation', zh: '品牌激活' },
      { id: 'Product Launching (Peluncuran Produk)', en: 'Product Launching', zh: '产品发布会' },
      { id: 'Corporation Gathering / Pertemuan Perusahaan', en: 'Corporate Gathering', zh: '企业年会与团建' },
      { id: 'FOB (Field / Festival of Business)', en: 'FOB (Field / Festival of Business)', zh: 'FOB 商业活动' },
      { id: 'Sales Promotion Girl/Boy (SPG/SPB) Sourcing', en: 'Sales Promotion Girl/Boy (SPG/SPB) Management', zh: '促销人员（SPG/SPB）管理' },
      { id: 'Penyelenggaraan Event Corporate & Public', en: 'Corporate & Public Event Organizing', zh: '企业与公共活动承办' },
    ],
  },
];

const SERVICE_TAB_IDS = new Set(SERVICES_DATA.map((s) => s.id));

const WHY_POINTS = [
  { titleKey: 'services_why_legal', descKey: 'services_why_legal_desc' },
  { titleKey: 'services_why_sla', descKey: 'services_why_sla_desc' },
  { titleKey: 'services_why_guarantee', descKey: 'services_why_guarantee_desc' },
] as const;

export const Services: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('business-support');

  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    if (SERVICE_TAB_IDS.has(hash)) {
      setActiveTab(hash);
      requestAnimationFrame(() => {
        document.getElementById('service-detail')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }, [location.hash]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    navigate({ pathname: '/services', hash: id }, { replace: true });
  };

  const activeService = SERVICES_DATA.find((s) => s.id === activeTab) ?? SERVICES_DATA[0];
  const ActiveIcon = activeService.icon;

  return (
    <div
      id="services-page"
      className="min-h-screen bg-slate-50 pb-24 font-sans antialiased text-slate-800"
    >
      <MarketingPageShell className="gap-5 px-6 pb-8 pt-6 sm:gap-6 sm:px-6 sm:py-8">
        <RecruitmentBackButton onClick={() => navigate('/')} label={t('nav_home')} />

        <WizardHero showLogo title={t('services_hero_title')} subtitle={t('services_hero_sub')} />

        {/* Service tabs */}
        <WizardCard className="p-5 sm:p-6">
          <CardSectionHeader
            label={t('services_badge')}
            title={t('services_section_title')}
            subtitle={t('services_section_sub')}
          />

          <div
            className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
            role="tablist"
            aria-label={t('services_section_title')}
          >
            {SERVICES_DATA.map((service) => {
              const Icon = service.icon;
              const isActive = activeTab === service.id;
              const label = pickLocalized(service.title, language);

              return (
                <button
                  key={service.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="service-detail"
                  onClick={() => handleTabChange(service.id)}
                  className={`group relative flex min-h-[5.5rem] flex-col items-start gap-2.5 rounded-2xl border p-3.5 text-left transition duration-200 active:scale-[0.98] sm:min-h-[6rem] sm:p-4 ${
                    isActive
                      ? 'border-[#003087]/25 bg-gradient-to-br from-[#003087] via-[#00256a] to-blue-900 text-white shadow-lg shadow-[#003087]/25 ring-2 ring-[#003087]/15'
                      : 'border-slate-100 bg-slate-50/60 hover:border-[#003087]/20 hover:bg-white hover:shadow-md'
                  }`}
                >
                  {isActive && (
                    <div
                      className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90"
                      aria-hidden
                    />
                  )}

                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition sm:h-10 sm:w-10 ${
                      isActive
                        ? 'bg-white/15 text-white ring-1 ring-white/20'
                        : 'bg-white text-[#003087] shadow-sm ring-1 ring-slate-100 group-hover:ring-[#003087]/15'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </span>

                  <span
                    className={`text-xs font-extrabold leading-snug sm:text-sm ${
                      isActive ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </WizardCard>

        {/* Active service detail */}
        <div id="service-detail" role="tabpanel">
        <WizardCard className="p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <div className="mb-5 flex items-start gap-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-[#003087]/20"
                  style={{ backgroundColor: BRAND_NAVY }}
                >
                  <ActiveIcon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#003087]">
                    {t('services_badge')}
                  </p>
                  <h2 className="mt-1 text-xl font-black leading-tight text-slate-900 sm:text-2xl">
                    {pickLocalized(activeService.title, language)}
                  </h2>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {pickLocalized(activeService.desc, language)}
              </p>

              <div className="mt-8 border-t border-slate-100 pt-7">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-black text-slate-900 sm:text-base">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-[#003087]" aria-hidden />
                  {t('services_scope_title')}
                </h3>
                <WorkScopeTimeline items={activeService.items} lang={language} />
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-[#003087]/10 bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/25 p-5 shadow-sm sm:p-6">
                <div
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#003087] to-cyan-400/80"
                  aria-hidden
                />
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#003087]">
                  {t('services_why_title')}
                </h3>
                <ul className="mt-5 space-y-4">
                  {WHY_POINTS.map((point) => (
                    <li key={point.titleKey} className="flex gap-3">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: BRAND_NAVY }}
                        aria-hidden
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{t(point.titleKey)}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {t(point.descKey)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 border-t border-slate-200/70 pt-5">
                  <Link
                    to="/contact"
                    className={`${NAVY_BTN} w-full`}
                    style={{ backgroundColor: BRAND_NAVY }}
                  >
                    {t('services_contact_admin')}
                    <ArrowRightIcon className="h-4 w-4 opacity-90" aria-hidden />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </WizardCard>
        </div>

        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            title={t('services_flow_title')}
            subtitle={t('services_flow_sub')}
          />
          <RecruitmentFlowTimeline lang={language} />
        </WizardCard>

        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            title={t('services_lifecycle_title')}
            subtitle={t('services_lifecycle_sub')}
          />
          <EnterpriseLifecycleTimeline lang={language} />
        </WizardCard>

        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            title={t('services_partners_title')}
            subtitle={t('services_partners_sub')}
          />
          <PartnerExperienceSection lang={language} />
        </WizardCard>

        <p className="px-1 text-center text-xs leading-relaxed text-slate-500">
          {t('services_partners_footer')}{' '}
          <Link
            to="/contact"
            className="font-bold text-[#003087] underline-offset-2 transition hover:underline"
          >
            {t('nav_contact')}
          </Link>
        </p>
      </MarketingPageShell>
    </div>
  );
};