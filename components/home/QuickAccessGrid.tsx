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

      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {QUICK_ACCESS_ITEMS.map((item) => {
          const Icon = resolveQuickAccessIcon(item, loggedIn);
          const title = resolveQuickAccessTitle(item, loggedIn, t);
          const subtitle = resolveQuickAccessSubtitle(item, loggedIn, jobCount, t);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.getPath(loggedIn, isAdmin))}
              className={`relative flex w-full flex-col justify-between rounded-2xl border border-slate-100 border-l-4 bg-white text-left shadow-sm transition hover:shadow-md active:scale-[0.98] ${item.accent} ${
                isMobile ? 'min-h-[124px] p-3.5' : 'min-h-[132px] p-4'
              }`}
            >
              <div className={`flex items-center justify-center rounded-xl ${item.iconBg} ${isMobile ? 'h-9 w-9' : 'h-10 w-10'}`}>
                <Icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${item.iconColor}`} />
              </div>

              <div className="mt-2.5 pr-7">
                <span className={`block font-extrabold leading-tight text-slate-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {title}
                </span>
                <span className={`mt-1 block leading-snug text-slate-500 ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
                  {subtitle}
                </span>
              </div>

              <div
                className={`absolute bottom-3.5 right-3.5 flex items-center justify-center rounded-full ${item.iconBg} ${
                  isMobile ? 'h-7 w-7' : 'h-8 w-8'
                }`}
              >
                <ArrowRight className={`${item.iconColor} ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};