import React from 'react';
import { BRAND_NAVY } from '../home/homeContent';
import { pickLocalized, useLanguage, type AppLanguage } from '../../services/i18n';
import {
  LIFECYCLE_STEPS,
  RECRUIT_FLOW_STEPS,
  SERVICE_PARTNERS,
  type LocalizedText,
  type PartnerBrand,
} from './servicesContent';

function localized(text: LocalizedText, lang: AppLanguage): string {
  return pickLocalized(text, lang);
}

/** Work scope — timeline ringkas dengan nomor navy */
export function WorkScopeTimeline({
  items,
  lang,
}: {
  items: { id: string; en: string }[];
  lang: AppLanguage;
}) {
  return (
    <ol className="relative space-y-3">
      {items.map((item, idx) => (
        <li key={idx} className="relative flex gap-3 sm:gap-4">
          {idx < items.length - 1 && (
            <span
              className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-[#003087]/15 sm:left-[17px]"
              aria-hidden
            />
          )}
          <span
            className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm sm:h-9 sm:w-9"
            style={{ backgroundColor: BRAND_NAVY }}
          >
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm transition hover:border-[#003087]/20 hover:shadow-md">
            <p className="text-xs font-semibold leading-snug text-slate-800 sm:text-sm">
              {pickLocalized(item, lang)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Recruitment flow — horizontal step cards (scroll di mobile) */
export function RecruitmentFlowTimeline({ lang }: { lang: AppLanguage }) {
  return (
    <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-0 px-1">
        {RECRUIT_FLOW_STEPS.map((flow, idx) => {
          const isLast = idx === RECRUIT_FLOW_STEPS.length - 1;
          return (
            <div key={flow.step} className="flex items-start">
              <div className="flex w-[9.5rem] flex-col items-center px-1 sm:w-[10.5rem]">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
                  style={{ backgroundColor: BRAND_NAVY }}
                >
                  {flow.step}
                </div>
                <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wide text-[#003087]">
                  {localized(flow.short, lang)}
                </p>
                <p className="mt-1.5 line-clamp-3 text-center text-[11px] font-semibold leading-snug text-slate-800">
                  {localized(flow.title, lang)}
                </p>
              </div>
              {!isLast && (
                <div className="mt-5 hidden h-0.5 w-6 shrink-0 bg-[#003087]/25 sm:block md:w-10" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Enterprise lifecycle — kartu step vertikal dengan connector */
export function EnterpriseLifecycleTimeline({ lang }: { lang: AppLanguage }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {LIFECYCLE_STEPS.map((step, idx) => (
        <div
          key={step.step}
          className="relative rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-blue-50/30 p-4 shadow-sm transition hover:border-[#003087]/25 hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
              style={{ backgroundColor: BRAND_NAVY }}
            >
              {step.step}
            </span>
            <span className="text-[10px] font-bold text-slate-300">
              {String(step.step).padStart(2, '0')}
            </span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-900">{localized(step.title, lang)}</h4>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{localized(step.detail, lang)}</p>
          {idx < LIFECYCLE_STEPS.length - 1 && (
            <span
              className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-[#003087]/30 lg:block"
              aria-hidden
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function PartnerCard({ partner, lang }: { partner: PartnerBrand; lang: AppLanguage }) {
  const featured = partner.featured;

  return (
    <div
      className={`flex flex-col items-center rounded-2xl border p-4 text-center transition hover:shadow-md ${
        featured
          ? 'col-span-2 border-[#003087]/25 bg-gradient-to-br from-blue-50/80 to-white shadow-sm sm:col-span-2 lg:col-span-1'
          : 'border-slate-100 bg-white shadow-sm hover:border-[#003087]/20'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-2xl font-black text-white shadow-sm ${partner.accentClass} ${
          featured ? 'h-16 w-full max-w-[12rem] px-4 py-3 text-lg tracking-wider' : 'h-12 w-12 text-xs'
        }`}
      >
        {partner.initials}
      </div>
      <p className={`mt-3 font-extrabold text-slate-900 ${featured ? 'text-sm' : 'text-xs'}`}>
        {partner.name}
      </p>
      {partner.fullName && (
        <p className="mt-1 text-[10px] font-medium leading-snug text-slate-500">
          {partner.fullName ? localized(partner.fullName, lang) : partner.name}
        </p>
      )}
      {partner.sector && (
        <span className="mt-2 inline-flex rounded-full border border-[#003087]/15 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#003087]">
          {partner.sector ? localized(partner.sector, lang) : ''}
        </span>
      )}
    </div>
  );
}

/** Partner & Experience — logo placeholder + IMIP featured */
export function PartnerExperienceSection({ lang }: { lang: AppLanguage }) {
  const { t } = useLanguage();
  const featured = SERVICE_PARTNERS.filter((p) => p.featured);
  const others = SERVICE_PARTNERS.filter((p) => !p.featured);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {featured.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} lang={lang} />
        ))}
        {others.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} lang={lang} />
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-[#003087]/20 bg-blue-50/40 px-4 py-3 text-center">
        <p className="text-[11px] font-semibold text-slate-600">{t('services_partners_footer')}</p>
      </div>
    </div>
  );
}