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
import { useLanguage } from '../services/i18n';

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
    { icon: Search, title: t('about_svc_recruitment'), desc: t('about_svc_recruitment_desc') },
    { icon: GraduationCap, title: t('about_svc_training'), desc: t('about_svc_training_desc') },
    { icon: UserCheck, title: t('about_svc_placement'), desc: t('about_svc_placement_desc') },
    { icon: FileSpreadsheet, title: t('about_svc_admin'), desc: t('about_svc_admin_desc') },
  ];

  const STATS = [
    { icon: Briefcase, value: '500+', label: t('about_stat_partners') },
    { icon: Users, value: '10.000+', label: t('about_stat_workers') },
    { icon: Building2, value: '20+', label: t('about_stat_cities') },
    { icon: Handshake, value: '15+', label: t('about_stat_years') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <PageTopBar badge={t('about_badge')} />

      <MarketingPageShell>
        <PageHero
          eyebrow={t('about_eyebrow')}
          title={t('about_hero_title')}
          subtitle={t('about_hero_subtitle')}
          imageSrc="/assets/hero/site_workers.jpg"
          imageAlt="Tim lapangan Perdana"
        />

        <ContentCard>
          <SectionHeader compact title={t('about_who_section')} subtitle={t('about_who_sub')} />
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex-1 space-y-3.5 text-sm font-medium leading-relaxed text-slate-600">
              <p>{t('about_who_p1')}</p>
              <p>{t('about_who_p2')}</p>
              <p>{t('about_who_p3')}</p>
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
                  {t('about_field_rep')}
                </span>
                <p className="mt-0.5 text-[10px] font-bold">PT Perdana Adi Yuda</p>
              </div>
            </div>
          </div>
        </ContentCard>

        <ContentCard>
          <SectionHeader compact title={t('about_values_title')} subtitle={t('about_values_sub')} />
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
          <SectionHeader compact title={t('about_services_title')} subtitle={t('about_services_sub')} />
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
          <SectionHeader compact title={t('about_stats_title')} subtitle={t('about_stats_sub')} />
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
          title={t('about_cta_title')}
          subtitle={t('about_cta_sub')}
          buttonLabel={t('about_cta_btn')}
          onClick={() => navigate('/contact')}
        />
      </MarketingPageShell>
    </div>
  );
};