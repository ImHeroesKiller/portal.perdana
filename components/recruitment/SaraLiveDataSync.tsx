import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Pencil } from 'lucide-react';
import type { NewEmployee } from '../../types';

const NAVY = '#003087';

type SyncField = {
  key: keyof NewEmployee;
  label: string;
  short: string;
  filled: (d: Partial<NewEmployee>) => boolean;
  display: (d: Partial<NewEmployee>) => string;
};

type SyncStep = {
  id: number;
  short: string;
  fields: SyncField[];
};

const SYNC_STEPS: SyncStep[] = [
  {
    id: 1,
    short: 'Id',
    fields: [
      { key: 'positionApplied', label: 'Posisi', short: 'Pos', filled: (d) => Boolean(d.positionApplied), display: (d) => d.positionApplied || '—' },
      { key: 'fullName', label: 'Nama', short: 'Nama', filled: (d) => Boolean(d.fullName), display: (d) => d.fullName || '—' },
      { key: 'nik', label: 'NIK', short: 'NIK', filled: (d) => Boolean(d.nik), display: (d) => d.nik || '—' },
      { key: 'kkNumber', label: 'No. KK', short: 'KK', filled: (d) => Boolean(d.kkNumber), display: (d) => d.kkNumber || '—' },
    ],
  },
  {
    id: 2,
    short: 'Kontak',
    fields: [
      { key: 'email', label: 'Email', short: 'Email', filled: (d) => Boolean(d.email), display: (d) => d.email || '—' },
      { key: 'whatsappNumber', label: 'WhatsApp', short: 'WA', filled: (d) => Boolean(d.whatsappNumber), display: (d) => d.whatsappNumber || '—' },
      { key: 'desa', label: 'Domisili', short: 'Dom', filled: (d) => Boolean(d.provinsi || d.desa || d.addressLine), display: (d) => d.desa ? `Desa ${d.desa}` : d.provinsi || d.addressLine || '—' },
    ],
  },
  {
    id: 3,
    short: 'Pro',
    fields: [
      { key: 'lastEducation', label: 'Pendidikan', short: 'Edu', filled: (d) => Boolean(d.lastEducation), display: (d) => d.lastEducation || '—' },
      { key: 'bankName', label: 'Rekening', short: 'Bank', filled: (d) => Boolean(d.bankName && d.accountNumber), display: (d) => d.bankName ? `${d.bankName} · ${d.accountNumber}` : '—' },
    ],
  },
];

export interface SaraLiveDataSyncProps {
  data: Partial<NewEmployee>;
  onEdit?: () => void;
  variant?: 'default' | 'sidebar' | 'drawer';
  className?: string;
  defaultExpanded?: boolean;
}

export function SaraLiveDataSync({
  data,
  onEdit,
  variant = 'default',
  className = '',
  defaultExpanded = false,
}: SaraLiveDataSyncProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || variant === 'sidebar');

  const { steps, overallPct } = useMemo(() => {
    const mapped = SYNC_STEPS.map((step) => {
      const done = step.fields.filter((f) => f.filled(data)).length;
      return { ...step, done, total: step.fields.length };
    });
    const overallDone = mapped.reduce((n, s) => n + s.done, 0);
    const overallTotal = mapped.reduce((n, s) => n + s.total, 0);
    const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;
    return { steps: mapped, overallPct };
  }, [data]);

  const stepSummary = steps.map((s) => `${s.short} ${s.done}/${s.total}`).join(' · ');

  const shellClass =
    variant === 'sidebar'
      ? 'rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm'
      : variant === 'drawer'
        ? 'border-0 bg-transparent px-1 py-1 shadow-none'
        : 'rounded-lg border border-slate-100/90 bg-white/95 px-2.5 py-2 sm:px-3';

  return (
    <div className={`${shellClass} ${className}`}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-bold text-slate-800 ${variant === 'sidebar' ? 'text-xs' : 'text-[11px]'}`}>
              Progress data
            </span>
            <span className="text-[10px] font-semibold tabular-nums text-[#003087]">{overallPct}%</span>
          </div>
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
            {steps.map((step) => {
              const pct = step.total ? (step.done / step.total) * 100 : 0;
              return (
                <div key={step.id} className="h-full flex-1 border-r border-white/80 last:border-0">
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: step.done === step.total ? '#10b981' : NAVY }}
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-1 truncate text-[9px] text-slate-500" title={stepSummary}>
            {stepSummary}
          </p>
        </div>

        {variant !== 'drawer' && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Sembunyikan detail' : 'Lihat detail'}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#003087]/15 text-[#003087] transition hover:bg-blue-50/80"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Tinjau data"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white transition hover:opacity-95"
            style={{ backgroundColor: NAVY }}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {(expanded || variant === 'drawer') && (
        <ul
          className={`grid gap-x-2 gap-y-1.5 ${
            variant === 'drawer' ? 'mt-1 grid-cols-2' : 'mt-2 border-t border-slate-100 pt-2'
          } ${variant === 'sidebar' ? 'grid-cols-1' : variant === 'drawer' ? '' : 'grid-cols-2 sm:grid-cols-3'}`}
        >
          {steps.flatMap((step) =>
            step.fields.map((field) => {
              const ok = field.filled(data);
              return (
                <li key={String(field.key)} className="flex min-w-0 items-center gap-1.5 text-[10px]">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="shrink-0 text-slate-500">{field.label}</span>
                  <span className={`truncate font-medium ${ok ? 'text-slate-800' : 'text-slate-400'}`}>
                    {ok ? field.display(data) : '—'}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}