import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Target,
  Compass,
} from 'lucide-react';
import { MarketingPageShell } from './layout/MarketingPageLayout';
import { BRAND_NAVY } from './home/homeContent';
import { OptimizedImage } from './ui/OptimizedImage';
import { useLanguage } from '../services/i18n';
import {
  CardSectionHeader,
  NAVY_BTN,
  RecruitmentBackButton,
  WizardCard,
  WizardHero,
} from './recruitment/recruitmentUi';

const MISSION_KEYS = ['about_misi_1', 'about_misi_2', 'about_misi_3'] as const;

export const About: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const VALUES = [
    { icon: ShieldCheck, title: t('about_val_integrity'), desc: t('about_val_integrity_desc') },
    { icon: Users, title: t('about_val_pro'), desc: t('about_val_pro_desc') },
    { icon: Handshake, title: t('about_val_partnership'), desc: t('about_val_partnership_desc') },
    { icon: Star, title: t('about_val_quality'), desc: t('about_val_quality_desc') },
  ];

  const SERVICES = [
    {
      icon: Search,
      title: t('about_svc_recruitment'),
      desc: t('about_svc_recruitment_desc'),
      to: '/services#recruitment',
    },
    {
      icon: GraduationCap,
      title: t('about_svc_training'),
      desc: t('about_svc_training_desc'),
      to: '/services#training',
    },
    {
      icon: UserCheck,
      title: t('about_svc_placement'),
      desc: t('about_svc_placement_desc'),
      to: '/services#business-support',
    },
    {
      icon: FileSpreadsheet,
      title: t('about_svc_admin'),
      desc: t('about_svc_admin_desc'),
      to: '/services#business-support',
    },
  ];

  const STATS = [
    { icon: Briefcase, value: '500+', label: t('about_stat_partners') },
    { icon: Users, value: '10.000+', label: t('about_stat_workers') },
    { icon: Building2, value: '20+', label: t('about_stat_cities') },
    { icon: Handshake, value: '15+', label: t('about_stat_years') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans antialiased text-slate-800">
      <MarketingPageShell className="gap-5 px-6 pb-8 pt-6 sm:gap-6 sm:px-6 sm:py-8">
        <RecruitmentBackButton onClick={() => navigate('/')} label={t('nav_home')} />

        <WizardHero showLogo title={t('about_hero_title')} subtitle={t('about_hero_subtitle')} />

        {/* Who we are */}
        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            label={t('about_badge')}
            title={t('about_who_section')}
            subtitle={t('about_who_sub')}
          />
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              <p>{t('about_who_p1')}</p>
              <p>{t('about_who_p2')}</p>
              <p>{t('about_who_p3')}</p>
            </div>
            <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-100 shadow-sm lg:h-72 lg:w-72">
              <OptimizedImage
                src="/assets/hero/site_bricklaying.jpg"
                alt="Perwakilan lapangan Perdana"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-slate-900/80 p-3.5 text-center text-white backdrop-blur-md">
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                  {t('about_field_rep')}
                </span>
                <p className="mt-1 text-xs font-bold">PT Perdana Adi Yuda</p>
              </div>
            </div>
          </div>
        </WizardCard>

        {/* Vision & Mission */}
        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            title={t('about_visi_title')}
            subtitle={t('about_hero_desc')}
          />
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <article className="relative overflow-hidden rounded-2xl border border-[#003087]/10 bg-gradient-to-br from-blue-50/70 via-white to-cyan-50/20 p-5 shadow-sm">
              <div
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#003087] to-cyan-400/80"
                aria-hidden
              />
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: BRAND_NAVY }}>
                <Target className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-black text-slate-900">{t('about_visi_title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('about_visi_desc')}</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#003087] to-cyan-400/80"
                aria-hidden
              />
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#003087]">
                <Compass className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-black text-slate-900">{t('about_misi_title')}</h3>
              <ul className="mt-3 space-y-2.5">
                {MISSION_KEYS.map((key) => (
                  <li key={key} className="flex gap-2.5 text-sm text-slate-600">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: BRAND_NAVY }}
                      aria-hidden
                    />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </WizardCard>

        {/* Values */}
        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            title={t('about_values_title')}
            subtitle={t('about_values_sub')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-center transition hover:border-[#003087]/20 hover:bg-white hover:shadow-md"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#003087]/40 to-transparent opacity-0 transition group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#003087] shadow-sm ring-1 ring-slate-100">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </article>
              );
            })}
          </div>
        </WizardCard>

        {/* Services overview */}
        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            title={t('about_services_title')}
            subtitle={t('about_services_sub')}
          />
          <div className="space-y-3">
            {SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className="group flex min-h-[4.5rem] items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-[#003087]/20 hover:bg-white hover:shadow-md"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: BRAND_NAVY }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#003087]"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </WizardCard>

        {/* Stats */}
        <WizardCard className="p-5 sm:p-7">
          <CardSectionHeader
            title={t('about_stats_title')}
            subtitle={t('about_stats_sub')}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-2xl border border-slate-100 bg-gradient-to-b from-blue-50/40 to-white p-4 text-center shadow-sm"
                >
                  <Icon className="mb-2 h-5 w-5 text-[#003087]" aria-hidden />
                  <span className="text-2xl font-black leading-none text-[#003087]">{stat.value}</span>
                  <span className="mt-2 text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-500">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </WizardCard>

        {/* CTA */}
        <WizardCard className="overflow-hidden p-0">
          <div className="relative bg-gradient-to-br from-[#003087] via-[#00256a] to-blue-900 p-6 sm:p-8">
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(56,189,248,0.2),transparent_55%)]"
              aria-hidden
            />
            <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-black text-white sm:text-xl">{t('about_cta_title')}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                  {t('about_cta_sub')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className={`${NAVY_BTN} shrink-0 bg-white text-[#003087] shadow-xl hover:bg-slate-50 hover:opacity-100`}
              >
                {t('about_cta_btn')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </WizardCard>
      </MarketingPageShell>
    </div>
  );
};