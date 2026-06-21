import React, { useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
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
  items: LocalizedText[];
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
              {localized(item, lang)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Recruitment flow — compact responsive grid with navy connectors */
export function RecruitmentFlowTimeline({ lang }: { lang: AppLanguage }) {
  return (
    <div className="relative">
      <div className="hidden lg:absolute lg:inset-x-0 lg:top-[1.35rem] lg:block lg:h-0.5 lg:bg-gradient-to-r lg:from-transparent lg:via-[#003087]/20 lg:to-transparent" aria-hidden />

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {RECRUIT_FLOW_STEPS.map((flow) => (
          <li
            key={flow.step}
            className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#003087]/30 hover:shadow-md"
          >
            <div className="mb-2.5 flex items-center justify-between gap-1">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white shadow-sm ring-2 ring-white"
                style={{ backgroundColor: BRAND_NAVY }}
              >
                {flow.step}
              </span>
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 text-[#003087]/25 transition group-hover:text-[#003087]/60 lg:hidden"
                aria-hidden
              />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#003087]">
              {localized(flow.short, lang)}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-700">
              {localized(flow.title, lang)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Enterprise lifecycle — concise cards with navy accent bar */
export function EnterpriseLifecycleTimeline({ lang }: { lang: AppLanguage }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {LIFECYCLE_STEPS.map((step) => (
        <article
          key={step.step}
          className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#003087]/25 hover:shadow-md"
        >
          <div className="h-1 w-full bg-gradient-to-r from-[#003087] to-cyan-500/80" aria-hidden />
          <div className="p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black text-white"
                style={{ backgroundColor: BRAND_NAVY }}
              >
                {step.step}
              </span>
              <h4 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                {localized(step.title, lang)}
              </h4>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {localized(step.detail, lang)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function PartnerLogo({
  partner,
  className = '',
}: {
  partner: PartnerBrand;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-xl bg-[#003087] text-sm font-black tracking-wide text-white ${className}`}
      >
        {partner.name.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={partner.logoUrl}
      alt={partner.name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`max-h-full max-w-full object-contain ${className}`}
    />
  );
}

function PartnerCard({ partner, lang }: { partner: PartnerBrand; lang: AppLanguage }) {
  const { t } = useLanguage();

  return (
    <a
      href={partner.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('services_partner_visit', { name: partner.name })}
      className={`group flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#003087]/40 hover:shadow-lg ${
        partner.featured
          ? 'border-[#003087]/25 ring-1 ring-[#003087]/10 sm:col-span-2 lg:col-span-1'
          : 'border-slate-100'
      }`}
    >
      <div
        className={`relative flex h-[4.5rem] items-center justify-center overflow-hidden rounded-xl px-4 transition group-hover:bg-blue-50/60 sm:h-[5rem] ${
          partner.logoDarkBg
            ? 'bg-gradient-to-br from-[#003087] to-slate-800'
            : 'bg-slate-50/80'
        }`}
      >
        <PartnerLogo
          partner={partner}
          className={partner.logoDarkBg ? 'h-10 sm:h-11' : 'h-9 sm:h-10'}
        />
        <ExternalLink
          className="absolute right-2 top-2 h-3 w-3 text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-[#003087]"
          aria-hidden
        />
      </div>

      <p className="mt-3 text-center text-xs font-extrabold leading-snug text-slate-900 sm:text-sm">
        {partner.name}
      </p>

      {partner.fullName && (
        <p className="mt-1 line-clamp-2 text-center text-[10px] font-medium leading-snug text-slate-500">
          {localized(partner.fullName, lang)}
        </p>
      )}

      {partner.sector && (
        <span className="mx-auto mt-2.5 inline-flex rounded-full border border-[#003087]/15 bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#003087]">
          {localized(partner.sector, lang)}
        </span>
      )}
    </a>
  );
}

/** Partner & Experience — responsive logo grid with external links */
export function PartnerExperienceSection({ lang }: { lang: AppLanguage }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SERVICE_PARTNERS.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} lang={lang} />
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-[#003087]/20 bg-gradient-to-r from-blue-50/50 to-white px-4 py-3.5 text-center">
        <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
          {t('services_partners_footer')}
        </p>
      </div>
    </div>
  );
}