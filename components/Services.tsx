import React, { useState } from 'react';
import {
  BriefcaseIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { pickLocalized, useLanguage } from '../services/i18n';
import { SectionHeader } from './home/SectionHeader';
import {
  ContentCard,
  MarketingPageShell,
  PageHero,
  PageTopBar,
} from './layout/MarketingPageLayout';
import { HOME_H_SCROLL } from './home/homeContent';
import type { LocalizedText } from './services/servicesContent';
import {
  EnterpriseLifecycleTimeline,
  PartnerExperienceSection,
  RecruitmentFlowTimeline,
  WorkScopeTimeline,
} from './services/ServiceVisualSections';

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

export const Services: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('business-support');

  const activeService = SERVICES_DATA.find((s) => s.id === activeTab) ?? SERVICES_DATA[0];
  const ActiveIcon = activeService.icon;

  return (
    <div id="services-page" className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <PageTopBar badge={t('services_badge')} />

      <MarketingPageShell wide>
        <PageHero
          eyebrow="PT Perdana Adi Yuda"
          title={t('services_hero_title')}
          subtitle={t('services_hero_sub')}
          imageSrc="/assets/hero/site_scaffolding.jpg"
          imageAlt={t('services_hero_image_alt')}
        />

        <ContentCard>
          <SectionHeader
            compact
            title={t('services_section_title')}
            subtitle={t('services_section_sub')}
          />

          <div className={`${HOME_H_SCROLL} -mx-2 mb-6 px-2 pb-1`}>
            <div className="flex w-max min-w-full gap-2.5">
              {SERVICES_DATA.map((service) => {
                const Icon = service.icon;
                const isActive = activeTab === service.id;
                const label = pickLocalized(service.title, language);

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
                  {pickLocalized(activeService.title, language)}
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {pickLocalized(activeService.desc, language)}
              </p>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircleIcon className="h-5 w-5 text-[#003087]" aria-hidden />
                  {t('services_scope_title')}
                </h4>
                <WorkScopeTimeline items={activeService.items} lang={language} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-blue-50/40 p-5 lg:col-span-5">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#003087]">
                {t('services_why_title')}
              </h4>
              <div className="mt-4 space-y-4 text-sm">
                {[
                  { title: t('services_why_legal'), desc: t('services_why_legal_desc') },
                  { title: t('services_why_sla'), desc: t('services_why_sla_desc') },
                  { title: t('services_why_guarantee'), desc: t('services_why_guarantee_desc') },
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
                  className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-[#003087] px-5 text-xs font-bold text-white transition hover:bg-blue-900 active:scale-[0.98]"
                >
                  {t('services_contact_admin')}
                  <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title={t('services_flow_title')}
            subtitle={t('services_flow_sub')}
          />
          <RecruitmentFlowTimeline lang={language} />
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title={t('services_lifecycle_title')}
            subtitle={t('services_lifecycle_sub')}
          />
          <EnterpriseLifecycleTimeline lang={language} />
        </ContentCard>

        <ContentCard>
          <SectionHeader
            compact
            title={t('services_partners_title')}
            subtitle={t('services_partners_sub')}
          />
          <PartnerExperienceSection lang={language} />
        </ContentCard>
      </MarketingPageShell>
    </div>
  );
};