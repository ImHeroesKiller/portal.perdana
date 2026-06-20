import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getCurrentUser } from '../../services/auth';
import { useLanguage } from '../../services/i18n';
import { SectionHeader } from './SectionHeader';
import {
  QUICK_ACCESS_ITEMS,
  resolveQuickAccessIcon,
  resolveQuickAccessSubtitle,
  resolveQuickAccessTitle,
  type HomeStats,
} from './homeContent';

interface QuickAccessGridProps {
  stats?: Pick<HomeStats, 'jobs'>;
  variant?: 'mobile' | 'desktop';
  showHeader?: boolean;
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({
  stats,
  variant = 'mobile',
  showHeader = true,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const loggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin';
  const isMobile = variant === 'mobile';
  const jobCount = stats?.jobs ?? 0;

  return (
    <div>
      {showHeader && (
        <SectionHeader
          compact={isMobile}
          title={t('home_quick_section_title')}
          subtitle={t('home_quick_section_sub')}
        />
      )}

      <div
        className={`grid ${isMobile ? 'grid-cols-2 gap-3.5' : 'grid-cols-2 gap-4 lg:grid-cols-4'}`}
      >
        {QUICK_ACCESS_ITEMS.map((item) => {
          const Icon = resolveQuickAccessIcon(item, loggedIn);
          const title = resolveQuickAccessTitle(item, loggedIn, t);
          const subtitle = resolveQuickAccessSubtitle(item, loggedIn, jobCount, t);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.getPath(loggedIn, isAdmin))}
              className={`group relative flex w-full flex-col justify-between rounded-2xl border border-slate-100 border-l-4 bg-white text-left shadow-sm transition-all duration-200 hover:border-[#003087]/30 hover:bg-[#003087]/[0.04] hover:shadow-md active:scale-[0.98] active:bg-[#003087]/[0.08] ${item.accent} ${
                isMobile ? 'min-h-[132px] p-4' : 'min-h-[148px] p-5'
              }`}
            >
              <div
                className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-[#003087]/10 transition-colors group-hover:bg-[#003087]/10 group-hover:ring-[#003087]/20 ${
                  isMobile ? 'h-11 w-11' : 'h-12 w-12'
                }`}
              >
                <Icon
                  className={`${item.iconColor} transition-colors group-hover:text-blue-900 ${
                    isMobile ? 'h-5 w-5' : 'h-6 w-6'
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className={`mt-3 ${isMobile ? 'pr-8' : 'pr-10'}`}>
                <span
                  className={`block font-extrabold leading-tight text-slate-900 ${
                    isMobile ? 'text-sm' : 'text-base'
                  }`}
                >
                  {title}
                </span>
                <span
                  className={`mt-1.5 block leading-snug text-slate-500 ${
                    isMobile ? 'line-clamp-2 text-[11px]' : 'line-clamp-2 text-xs'
                  }`}
                >
                  {subtitle}
                </span>
              </div>

              <div
                className={`absolute flex items-center justify-center rounded-full bg-blue-50 text-[#003087] ring-1 ring-[#003087]/15 transition-all duration-200 group-hover:bg-[#003087] group-hover:text-white group-hover:ring-[#003087] group-active:scale-95 ${
                  isMobile ? 'bottom-4 right-4 h-8 w-8' : 'bottom-5 right-5 h-9 w-9'
                }`}
                aria-hidden="true"
              >
                <ArrowRight className={isMobile ? 'h-4 w-4' : 'h-[1.125rem] w-[1.125rem]'} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};