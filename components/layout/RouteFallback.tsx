import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const RouteFallback: React.FC = () => (
  <div
    className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-slate-50 px-4"
    role="status"
    aria-live="polite"
    aria-label="Memuat halaman"
  >
    <ArrowPathIcon className="h-8 w-8 animate-spin text-[#003087]" aria-hidden />
    <p className="text-sm font-semibold text-slate-600">Memuat halaman...</p>
  </div>
);