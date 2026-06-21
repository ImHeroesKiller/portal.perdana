import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  Briefcase,
  Map,
  ChevronRight,
  Building2,
} from 'lucide-react';
import type { JobDisplayFields } from '../../lib/job-display';
import { BRAND_NAVY } from '../home/homeContent';
import { useLanguage } from '../../services/i18n';
import { NAVY_BTN, NAVY_BTN_OUTLINE, WizardCard } from '../recruitment/recruitmentUi';

export interface VacancyJobCardProps {
  title: string;
  department: string;
  location: string;
  jobType: string;
  clientName?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onOpenMap?: () => void;
  applyHref: string;
  detailHref?: string;
  maxRequirements?: number;
  /** Tampilan ringkas untuk daftar VacanciesPage */
  compact?: boolean;
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#003087]/15 bg-gradient-to-r from-blue-50/90 to-cyan-50/50 px-3 py-1.5 text-[10px] font-bold text-[#003087] ring-1 ring-[#003087]/8 backdrop-blur-sm">
      <Icon className="h-3 w-3 shrink-0 text-cyan-700" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-full rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-50 to-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#003087] ring-1 ring-[#003087]/10">
      <span className="truncate">{label}</span>
    </span>
  );
}

export const VacancyJobCard: React.FC<VacancyJobCardProps> = ({
  title,
  department,
  location,
  jobType,
  clientName,
  description,
  requirements = [],
  skills = [],
  isBookmarked = false,
  onToggleBookmark,
  onOpenMap,
  applyHref,
  detailHref,
  maxRequirements,
  compact = false,
}) => {
  const { t, tVars } = useLanguage();
  const chipLimit = maxRequirements ?? (compact ? 3 : 4);
  const chipItems = [...skills, ...requirements].filter(Boolean).slice(0, chipLimit);
  const totalChips = skills.length + requirements.length;
  const hasMoreChips = totalChips > chipLimit;

  const padding = compact ? 'p-5 sm:p-6' : 'p-5 sm:p-7';

  return (
    <WizardCard className={padding}>
      <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-3' : 'mb-4'}`}>
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white"
          style={{ backgroundColor: BRAND_NAVY }}
        >
          {department}
        </span>
        {onToggleBookmark && (
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? t('job_bookmark_remove') : t('job_bookmark_save')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-sm transition hover:border-[#003087]/20 hover:text-[#003087] active:scale-95"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 fill-[#003087] text-[#003087]" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {detailHref ? (
        <Link
          to={detailHref}
          className={`block font-black leading-snug text-slate-900 transition hover:text-[#003087] ${
            compact ? 'text-base' : 'text-lg sm:text-xl'
          }`}
        >
          {title}
        </Link>
      ) : (
        <h2 className={`font-black leading-snug text-slate-900 ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
          {title}
        </h2>
      )}

      {clientName && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
          <span className="line-clamp-1">{clientName}</span>
        </p>
      )}

      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-3' : 'mt-3.5'}`}>
        <MetaChip icon={MapPin}>{location}</MetaChip>
        <MetaChip icon={Briefcase}>{jobType}</MetaChip>
      </div>

      {!compact && description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">{description}</p>
      )}

      {chipItems.length > 0 && (
        <div className={`border-t border-slate-100/90 ${compact ? 'mt-4 pt-4' : 'mt-4 pt-4'}`}>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            {t('home_qualifications')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chipItems.map((item, idx) => (
              <SkillChip key={`${item}-${idx}`} label={item} />
            ))}
            {hasMoreChips && (
              <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold text-[#003087]">
                {tVars('job_card_more_requirements', { count: totalChips - chipLimit })}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col gap-2.5 sm:flex-row ${compact ? 'mt-5' : 'mt-6'}`}
      >
        {detailHref && (
          <Link to={detailHref} className={`${NAVY_BTN_OUTLINE} flex-1`}>
            {t('job_card_detail')}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        {onOpenMap && !compact && (
          <button
            type="button"
            onClick={onOpenMap}
            className={`${NAVY_BTN_OUTLINE} flex-1`}
          >
            <Map className="h-4 w-4" aria-hidden />
            {t('home_btn_map')}
          </button>
        )}
        <Link
          to={applyHref}
          className={`${NAVY_BTN} flex-1`}
          style={{ backgroundColor: BRAND_NAVY }}
        >
          {t('home_btn_apply')}
        </Link>
      </div>
    </WizardCard>
  );
};

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

type TranslateFn = (key: string) => string;

/** Resolve field tampilan — prioritas display, fallback ke field mentah job */
export function resolveVacancyCardFields(
  job: { title?: string; department?: string; location?: string; type?: string; clientId?: string },
  display: JobDisplayFields,
  t?: TranslateFn
) {
  const fb = (key: string, fallback: string) => (t ? t(key) : fallback);

  const title =
    safeText(display.title) || safeText(job.title) || fb('job_default_title', 'Lowongan');
  const department =
    safeText(display.department) ||
    safeText(job.department) ||
    fb('job_default_department', 'Umum');
  const location =
    safeText(display.location) ||
    safeText(job.location) ||
    fb('job_default_location', 'Lokasi belum diisi');
  const jobType = safeText(display.type) || safeText(job.type) || 'Contract';

  return {
    title,
    department,
    location,
    jobType,
    description: display.description,
    requirements: display.requirements,
  };
}