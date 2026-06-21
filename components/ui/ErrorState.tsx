import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { BRAND_NAVY } from '../home/homeContent';

const NAVY_BTN =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-900 hover:opacity-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

function ErrorCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg ${className}`}
    >
      <div
        className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-[#003087] to-transparent opacity-50"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function ErrorState({
  title = 'Gagal memuat data',
  message,
  onRetry,
  retryLabel = 'Coba Lagi',
  className = '',
  compact = false,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <ErrorCard
      className={`${compact ? 'p-6' : 'p-7 text-center sm:p-8'} ${className}`}
      role="alert"
    >
      <div className={`flex flex-col items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        <div
          className={`flex items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100/80 ${
            compact ? 'h-14 w-14' : 'h-16 w-16'
          }`}
        >
          <ExclamationTriangleIcon
            className={`text-red-500 ${compact ? 'h-7 w-7' : 'h-8 w-8'}`}
            aria-hidden
          />
        </div>

        <div className={compact ? '' : 'max-w-sm'}>
          <h3
            className={`font-black text-slate-900 ${compact ? 'text-base' : 'text-lg'}`}
          >
            {title}
          </h3>
          <p
            className={`mt-2 leading-relaxed text-red-600/90 ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            {message}
          </p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`${NAVY_BTN} ${compact ? 'mt-1' : 'mt-2'}`}
            style={{ backgroundColor: BRAND_NAVY }}
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden />
            {retryLabel}
          </button>
        )}
      </div>
    </ErrorCard>
  );
}