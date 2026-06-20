import React from 'react';

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
  <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-3' : 'mb-4'}`}>
    <div className="min-w-0">
      <h2
        className={`font-black uppercase tracking-widest text-slate-900 ${
          compact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-1 font-medium text-slate-500 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {subtitle}
        </p>
      )}
    </div>
    {action}
  </div>
);