import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DataFetchStateProps {
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  minHeight?: string;
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
}) => {
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-slate-500"
        style={{ minHeight }}
      >
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
        style={{ minHeight }}
      >
        <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
        <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
        <p className="text-xs text-red-600 max-w-md">{error.message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            Coba Lagi
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm font-medium text-slate-400"
        style={{ minHeight }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {isFetching && (
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-indigo-600">
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
          Memperbarui data...
        </div>
      )}
      {children}
    </>
  );
};