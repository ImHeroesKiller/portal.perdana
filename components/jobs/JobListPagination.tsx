import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../services/i18n';
import { BRAND_NAVY } from '../home/homeContent';
import { NAVY_BTN, NAVY_BTN_OUTLINE } from '../recruitment/recruitmentUi';

export const VACANCIES_PAGE_SIZE = 10;

interface JobListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const JobListPagination: React.FC<JobListPaginationProps> = ({
  page,
  pageSize,
  totalItems,
  onPageChange,
}) => {
  const { t, tVars } = useLanguage();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav
      className="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
      aria-label={t('vacancies_pagination_aria')}
    >
      <p className="text-center text-[11px] font-semibold text-slate-500 sm:text-left">
        {tVars('vacancies_pagination_range', { start, end, total: totalItems })}
      </p>

      <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label={t('vacancies_pagination_prev_aria')}
          className={`${canPrev ? NAVY_BTN : NAVY_BTN_OUTLINE} min-w-[7.5rem] opacity-100 disabled:cursor-not-allowed disabled:opacity-50`}
          style={canPrev ? { backgroundColor: BRAND_NAVY } : undefined}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t('vacancies_pagination_prev')}
        </button>

        <span className="inline-flex min-h-[48px] min-w-[5.5rem] items-center justify-center rounded-xl border border-[#003087]/15 bg-gradient-to-r from-blue-50 to-cyan-50/60 px-3 text-xs font-black text-[#003087] ring-1 ring-cyan-400/25">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label={t('vacancies_pagination_next_aria')}
          className={`${canNext ? NAVY_BTN : NAVY_BTN_OUTLINE} min-w-[7.5rem] opacity-100 disabled:cursor-not-allowed disabled:opacity-50`}
          style={canNext ? { backgroundColor: BRAND_NAVY } : undefined}
        >
          {t('vacancies_pagination_next')}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
};