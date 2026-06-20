import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  MapPin,
  Briefcase,
  Map,
  Send,
  Building2,
} from 'lucide-react';
import type { JobDisplayFields } from '../../lib/job-display';

export interface VacancyJobCardProps {
  title: string;
  department: string;
  location: string;
  jobType: string;
  clientName?: string;
  description?: string;
  requirements?: string[];
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onOpenMap?: () => void;
  applyHref: string;
  detailHref?: string;
  maxRequirements?: number;
  /** Tampilan ringkas untuk daftar VacanciesPage */
  compact?: boolean;
}

export const VacancyJobCard: React.FC<VacancyJobCardProps> = ({
  title,
  department,
  location,
  jobType,
  clientName,
  description,
  requirements = [],
  isBookmarked = false,
  onToggleBookmark,
  onOpenMap,
  applyHref,
  detailHref,
  maxRequirements,
  compact = false,
}) => {
  const reqLimit = maxRequirements ?? (compact ? 2 : 3);
  const shownRequirements = requirements.slice(0, reqLimit);
  const hasMoreRequirements = requirements.length > reqLimit;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      <div className={`flex items-start justify-between gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
        <span className="job-card-dept inline-block rounded-lg px-2 py-0.5">
          {department}
        </span>
        {onToggleBookmark && (
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? 'Hapus bookmark' : 'Simpan lowongan'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 active:scale-95"
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
          className={`job-card-title block leading-snug transition hover:text-[#003087] ${
            compact ? 'text-sm' : 'text-base sm:text-lg'
          }`}
        >
          {title}
        </Link>
      ) : (
        <h2
          className={`job-card-title leading-snug ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}
        >
          {title}
        </h2>
      )}

      {clientName && !compact && (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
          <span className="line-clamp-1">{clientName}</span>
        </p>
      )}

      <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-2' : 'mt-2.5'}`}>
        <span
          className={`job-card-meta inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 text-[10px] ${
            compact ? 'px-2 py-1' : 'min-h-[32px] gap-1.5 rounded-xl px-2.5 py-1.5'
          }`}
        >
          <MapPin className="h-3 w-3 shrink-0 text-[#003087]" aria-hidden />
          <span className="line-clamp-1">{location}</span>
        </span>
        <span
          className={`job-card-meta inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 text-[10px] ${
            compact ? 'px-2 py-1' : 'min-h-[32px] gap-1.5 rounded-xl px-2.5 py-1.5'
          }`}
        >
          <Briefcase className="h-3 w-3 shrink-0 text-[#003087]" aria-hidden />
          <span>{jobType}</span>
        </span>
      </div>

      {!compact && description && (
        <p className="job-card-desc mt-2.5 line-clamp-2">{description}</p>
      )}

      {shownRequirements.length > 0 && (
        <div className={`border-t border-slate-100 ${compact ? 'mt-2.5 pt-2.5' : 'mt-3 pt-3'}`}>
          {!compact && (
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800">
              Kualifikasi
            </p>
          )}
          <ul className={`${compact ? 'space-y-0.5' : 'mt-1.5 space-y-1'} pl-0.5`}>
            {shownRequirements.map((req, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600"
              >
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#003087]"
                  aria-hidden
                />
                <span className="line-clamp-1">{req}</span>
              </li>
            ))}
            {hasMoreRequirements && (
              <li className="text-[10px] font-semibold text-[#003087]">
                +{requirements.length - reqLimit} lainnya
              </li>
            )}
          </ul>
        </div>
      )}

      <div
        className={`flex gap-2 border-t border-slate-50 ${compact ? 'mt-2.5 pt-2.5' : 'mt-3.5 pt-3.5'}`}
      >
        {detailHref && (
          <Link
            to={detailHref}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-700 transition hover:border-[#003087]/25 hover:bg-slate-50 active:scale-[0.98]"
          >
            Detail
          </Link>
        )}
        {onOpenMap && !compact && (
          <button
            type="button"
            onClick={onOpenMap}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-xl border border-[#003087]/15 bg-blue-50 text-[11px] font-bold text-[#003087] transition hover:bg-blue-100 active:scale-[0.98]"
          >
            <Map className="h-3.5 w-3.5" aria-hidden />
            Peta
          </button>
        )}
        <Link
          to={applyHref}
          className="flex min-h-[48px] flex-[1.15] items-center justify-center gap-1 rounded-xl bg-[#003087] text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-[0.98]"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Lamar
        </Link>
      </div>
    </article>
  );
};

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Resolve field tampilan — prioritas display, fallback ke field mentah job */
export function resolveVacancyCardFields(
  job: { title?: string; department?: string; location?: string; type?: string; clientId?: string },
  display: JobDisplayFields
) {
  const title = safeText(display.title) || safeText(job.title) || 'Lowongan';
  const department = safeText(display.department) || safeText(job.department) || 'Umum';
  const location = safeText(display.location) || safeText(job.location) || 'Lokasi belum diisi';
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