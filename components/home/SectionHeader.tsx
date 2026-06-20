import React from 'react';
import { BRAND_NAVY } from './homeContent';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  compact = false,
}) => (
  <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-3.5' : 'mb-5'}`}>
    <div className="min-w-0 border-l-[3px] pl-2.5" style={{ borderColor: BRAND_NAVY }}>
      <h2
        className={`font-black uppercase leading-tight text-slate-900 ${
          compact ? 'text-[11px] tracking-[0.16em]' : 'text-xs tracking-[0.18em] sm:text-sm'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-1.5 font-medium leading-snug text-slate-500 ${
            compact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {action}
  </div>
);