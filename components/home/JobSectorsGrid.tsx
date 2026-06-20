import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../services/i18n';
import { SectionHeader } from './SectionHeader';
import { JOB_SECTORS } from './homeContent';

interface JobSectorsGridProps {
  variant?: 'mobile' | 'desktop';
  showHeader?: boolean;
}

export const JobSectorsGrid: React.FC<JobSectorsGridProps> = ({
  variant = 'mobile',
  showHeader = true,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = variant === 'mobile';

  return (
    <div>
      {showHeader && (
        <SectionHeader
          compact={isMobile}
          title={t('home_sectors_section_title')}
          subtitle={t('home_sectors_section_sub')}
        />
      )}

      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
        {JOB_SECTORS.map((sector) => {
          const Icon = sector.icon;
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() =>
                navigate(`/vacancies?filter=${encodeURIComponent(sector.filter)}`)
              }
              className={`group flex w-full flex-col rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:border-blue-200 hover:shadow-md active:scale-[0.98] ${
                isMobile ? 'min-h-[108px] p-3.5' : 'min-h-[116px] p-4'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`flex shrink-0 items-center justify-center rounded-xl ${sector.iconBg} ${
                    isMobile ? 'h-10 w-10' : 'h-11 w-11'
                  }`}
                >
                  <Icon className={`${sector.iconColor} ${isMobile ? 'h-5 w-5' : 'h-5 w-5'}`} />
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#0056C6]" />
              </div>

              <p className={`mt-2.5 font-extrabold leading-tight text-slate-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {t(sector.titleKey)}
              </p>
              <p className={`mt-1 leading-snug text-slate-500 ${isMobile ? 'text-[10px] line-clamp-2' : 'text-xs line-clamp-2'}`}>
                {t(sector.descKey)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};