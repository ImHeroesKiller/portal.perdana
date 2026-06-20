import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const btnBase =
    'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition active:scale-[0.98]';
  const btnEnabled = 'bg-[#003087] text-white shadow-sm hover:bg-blue-900';
  const btnDisabled = 'cursor-not-allowed bg-slate-100 text-slate-400';

  return (
    <nav
      className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
      aria-label="Navigasi halaman lowongan"
    >
      <p className="text-center text-[11px] font-semibold text-slate-500 sm:text-left">
        Menampilkan {start}–{end} dari {totalItems} lowongan
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Halaman sebelumnya"
          className={`${btnBase} ${canPrev ? btnEnabled : btnDisabled}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </button>

        <span className="min-w-[5.5rem] text-center text-xs font-bold text-[#003087]">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Halaman berikutnya"
          className={`${btnBase} ${canNext ? btnEnabled : btnDisabled}`}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
};