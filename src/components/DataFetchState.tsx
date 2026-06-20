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
        className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-white p-8 text-slate-500 shadow-sm"
        style={{ minHeight }}
      >
        <ArrowPathIcon className="h-9 w-9 animate-spin text-[#003087]" />
        <div className="text-center">
          <p className="text-sm font-bold text-slate-700">Memuat lowongan...</p>
          <p className="mt-1 text-xs text-slate-400">Mohon tunggu sebentar</p>
        </div>
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
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm"
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
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
          Memperbarui data...
        </div>
      )}
      {children}
    </>
  );
};