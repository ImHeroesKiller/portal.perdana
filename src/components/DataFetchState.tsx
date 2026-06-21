import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingCardSkeleton } from '../../components/ui/LoadingSkeleton';

interface DataFetchStateProps {
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  minHeight?: string;
  skeleton?: React.ReactNode;
  loadingMessage?: string;
}

export const DataFetchState: React.FC<DataFetchStateProps> = ({
  isLoading = false,
  isFetching = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'Data tidak ditemukan.',
  onRetry,
  children,
  minHeight = '12rem',
  skeleton,
  loadingMessage,
}) => {
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;

    return (
      <div style={{ minHeight }}>
        <LoadingCardSkeleton message={loadingMessage} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight }}>
        <ErrorState message={error.message} onRetry={onRetry} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm"
        style={{ minHeight }}
      >
        <p className="text-sm font-bold text-slate-700">{emptyMessage}</p>
        <p className="mt-1.5 text-xs text-slate-400">
          Silakan cek kembali nanti atau hubungi tim HR.
        </p>
      </div>
    );
  }

  return (
    <>
      {isFetching && (
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#003087]">
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Memperbarui data...
        </div>
      )}
      {children}
    </>
  );
};