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
  maxRequirements?: number;
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
  maxRequirements = 3,
}) => {
  const shownRequirements = requirements.slice(0, maxRequirements);
  const hasMoreRequirements = requirements.length > maxRequirements;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="job-card-dept inline-block rounded-lg px-2.5 py-1">
          {department}
        </span>
        {onToggleBookmark && (
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? 'Hapus bookmark' : 'Simpan lowongan'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 active:scale-95"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5 fill-[#003087] text-[#003087]" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      <h2 className="job-card-title text-base leading-snug sm:text-lg">{title}</h2>

      {clientName && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
          <span className="line-clamp-1">{clientName}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="job-card-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
          <span className="line-clamp-1">{location}</span>
        </span>
        <span className="job-card-meta inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#003087]" aria-hidden />
          <span>{jobType}</span>
        </span>
      </div>

      {description && (
        <p className="job-card-desc mt-3 line-clamp-2">{description}</p>
      )}

      {shownRequirements.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
            Kualifikasi
          </p>
          <ul className="mt-1.5 space-y-1 pl-0.5">
            {shownRequirements.map((req, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#003087]" aria-hidden />
                <span>{req}</span>
              </li>
            ))}
            {hasMoreRequirements && (
              <li className="text-[11px] font-medium text-slate-400">
                +{requirements.length - maxRequirements} lainnya
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2.5 border-t border-slate-50 pt-4">
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#003087]/15 bg-blue-50 text-[11px] font-bold text-[#003087] transition hover:bg-blue-100 active:scale-[0.98] sm:text-xs"
          >
            <Map className="h-4 w-4" aria-hidden />
            Peta
          </button>
        )}
        <Link
          to={applyHref}
          className="flex min-h-[44px] flex-[1.2] items-center justify-center gap-1.5 rounded-xl bg-[#003087] text-center text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-[0.98] sm:text-xs"
        >
          <Send className="h-4 w-4" aria-hidden />
          Lamar
        </Link>
      </div>
    </article>
  );
};

/** Resolve field tampilan dari JobDisplayFields + fallback job mentah */
export function resolveVacancyCardFields(
  job: { department?: string; location?: string; type?: string; clientId?: string },
  display: JobDisplayFields
) {
  return {
    title: display.title,
    department: display.department || job.department || 'Umum',
    location: display.location || job.location || 'Lokasi belum diisi',
    jobType: display.type || job.type || 'Contract',
    description: display.description,
    requirements: display.requirements,
  };
}