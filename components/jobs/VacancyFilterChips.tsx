import React from 'react';
import { LayoutGrid, HardHat, Building2, Wrench, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BRAND_NAVY, HOME_H_SCROLL, VACANCY_FILTER_OPTIONS, type VacancyFilter } from '../home/homeContent';

const FILTER_ICONS: Record<VacancyFilter, LucideIcon> = {
  Semua: LayoutGrid,
  Operasional: HardHat,
  Administrasi: Building2,
  Teknis: Wrench,
  Lainnya: MoreHorizontal,
};

interface VacancyFilterChipsProps {
  value: VacancyFilter;
  onChange: (filter: VacancyFilter) => void;
  className?: string;
}

const SCROLL_ROW = `${HOME_H_SCROLL} snap-x snap-mandatory`;

export const VacancyFilterChips: React.FC<VacancyFilterChipsProps> = ({
  value,
  onChange,
  className = '',
}) => (
  <div className={`-mx-4 ${SCROLL_ROW} px-4 pb-1 pt-0.5 ${className}`}>
    <div className="flex w-max min-w-full gap-2.5">
      {VACANCY_FILTER_OPTIONS.map((filter) => {
        const Icon = FILTER_ICONS[filter];
        const isActive = value === filter;

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            aria-pressed={isActive}
            className={`group inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-2xl border px-3 py-2.5 text-left shadow-sm transition-all duration-200 active:scale-[0.97] ${
              isActive
                ? 'border-[#003087] bg-[#003087] text-white shadow-md ring-1 ring-[#003087]/30'
                : 'border-slate-200 bg-white text-slate-800 hover:border-[#003087]/35 hover:bg-[#003087]/[0.05] hover:shadow-md active:bg-[#003087]/10'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${
                isActive
                  ? 'bg-white/15 ring-white/25'
                  : 'bg-blue-50 ring-[#003087]/10 group-hover:bg-[#003087]/10 group-hover:ring-[#003087]/25'
              }`}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: isActive ? '#ffffff' : BRAND_NAVY }}
                aria-hidden="true"
              />
            </span>
            <span className="whitespace-nowrap pr-0.5 text-xs font-bold leading-none">{filter}</span>
          </button>
        );
      })}
    </div>
  </div>
);