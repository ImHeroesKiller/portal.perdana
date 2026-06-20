import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../services/i18n';
import { SectionHeader } from './SectionHeader';
import { BRAND_NAVY, HOME_H_SCROLL, JOB_SECTORS } from './homeContent';

interface JobSectorsGridProps {
  variant?: 'mobile' | 'desktop';
  showHeader?: boolean;
}

const SCROLL_ROW = `${HOME_H_SCROLL} snap-x snap-mandatory`;

export const JobSectorsGrid: React.FC<JobSectorsGridProps> = ({
  variant = 'mobile',
  showHeader = true,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = variant === 'mobile';

  const handleSectorClick = (filter: string, title: string) => {
    navigate(`/vacancies?filter=${encodeURIComponent(filter)}`, {
      state: { sectorLabel: title },
    });
  };

  return (
    <div>
      {showHeader && (
        <SectionHeader
          compact={isMobile}
          title={t('home_sectors_section_title')}
          subtitle={t('home_sectors_section_sub')}
        />
      )}

      <div className={`-mx-4 ${SCROLL_ROW} px-4 pb-1 pt-0.5`}>
        <div className={`flex w-max min-w-full ${isMobile ? 'gap-3' : 'gap-3.5'}`}>
          {JOB_SECTORS.map((sector) => {
            const Icon = sector.icon;
            const label = t(sector.titleKey);

            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => handleSectorClick(sector.filter, label)}
                aria-label={`${label} — ${t(sector.descKey)}`}
                className={`group inline-flex shrink-0 snap-start items-center rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:border-[#003087]/35 hover:bg-[#003087]/[0.05] hover:shadow-md active:scale-[0.97] active:border-[#003087]/50 active:bg-[#003087]/10 ${
                  isMobile
                    ? 'min-h-[44px] gap-2 px-3 py-2.5'
                    : 'min-h-[48px] gap-2.5 px-3.5 py-3'
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-[#003087]/10 transition-colors group-hover:bg-[#003087]/10 group-hover:ring-[#003087]/25 ${
                    isMobile ? 'h-8 w-8' : 'h-9 w-9'
                  }`}
                >
                  <Icon
                    className={isMobile ? 'h-4 w-4' : 'h-[1.125rem] w-[1.125rem]'}
                    style={{ color: BRAND_NAVY }}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={`whitespace-nowrap font-bold leading-none text-slate-900 ${
                    isMobile ? 'pr-0.5 text-xs' : 'text-sm'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};