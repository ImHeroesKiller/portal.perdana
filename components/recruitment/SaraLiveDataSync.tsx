import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, Pencil, ShieldCheck } from 'lucide-react';
import type { NewEmployee } from '../../types';

const NAVY = '#003087';

type SyncField = {
  key: keyof NewEmployee;
  label: string;
  filled: (d: Partial<NewEmployee>) => boolean;
  display: (d: Partial<NewEmployee>) => string;
};

type SyncStep = {
  id: number;
  title: string;
  fields: SyncField[];
};

const SYNC_STEPS: SyncStep[] = [
  {
    id: 1,
    title: 'Identitas',
    fields: [
      {
        key: 'positionApplied',
        label: 'Posisi',
        filled: (d) => Boolean(d.positionApplied),
        display: (d) => d.positionApplied || '—',
      },
      {
        key: 'fullName',
        label: 'Nama',
        filled: (d) => Boolean(d.fullName),
        display: (d) => d.fullName || '—',
      },
      {
        key: 'nik',
        label: 'NIK',
        filled: (d) => Boolean(d.nik),
        display: (d) => d.nik || '—',
      },
      {
        key: 'kkNumber',
        label: 'No. KK',
        filled: (d) => Boolean(d.kkNumber),
        display: (d) => d.kkNumber || '—',
      },
    ],
  },
  {
    id: 2,
    title: 'Kontak & Alamat',
    fields: [
      {
        key: 'email',
        label: 'Email',
        filled: (d) => Boolean(d.email),
        display: (d) => d.email || '—',
      },
      {
        key: 'whatsappNumber',
        label: 'WhatsApp',
        filled: (d) => Boolean(d.whatsappNumber),
        display: (d) => d.whatsappNumber || '—',
      },
      {
        key: 'desa',
        label: 'Domisili',
        filled: (d) => Boolean(d.provinsi || d.desa || d.addressLine),
        display: (d) =>
          d.desa ? `Desa ${d.desa}` : d.provinsi || d.addressLine || '—',
      },
    ],
  },
  {
    id: 3,
    title: 'Profesional',
    fields: [
      {
        key: 'lastEducation',
        label: 'Pendidikan',
        filled: (d) => Boolean(d.lastEducation),
        display: (d) => d.lastEducation || '—',
      },
      {
        key: 'bankName',
        label: 'Rekening',
        filled: (d) => Boolean(d.bankName && d.accountNumber),
        display: (d) =>
          d.bankName ? `${d.bankName} · ${d.accountNumber}` : '—',
      },
    ],
  },
];

function stepProgress(step: SyncStep, data: Partial<NewEmployee>) {
  const done = step.fields.filter((f) => f.filled(data)).length;
  return { done, total: step.fields.length };
}

export interface SaraLiveDataSyncProps {
  data: Partial<NewEmployee>;
  onEdit?: () => void;
}

export function SaraLiveDataSync({ data, onEdit }: SaraLiveDataSyncProps) {
  const [expanded, setExpanded] = useState(false);

  const { steps, overallDone, overallTotal } = useMemo(() => {
    const mapped = SYNC_STEPS.map((step) => {
      const { done, total } = stepProgress(step, data);
      return { ...step, done, total, complete: done === total };
    });
    const overallDone = mapped.reduce((n, s) => n + s.done, 0);
    const overallTotal = mapped.reduce((n, s) => n + s.total, 0);
    return { steps: mapped, overallDone, overallTotal };
  }, [data]);

  const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: NAVY }} aria-hidden />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-900">Live Data Sync</span>
            <span className="text-[10px] font-bold text-slate-500">
              {overallDone}/{overallTotal} · {overallPct}%
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: NAVY }}
              initial={false}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-[#003087]/15 px-2 py-1 text-[10px] font-bold text-[#003087] transition hover:bg-blue-50/80"
          aria-expanded={expanded}
        >
          {expanded ? 'Tutup' : 'Detail'}
          <ChevronDown
            className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-white transition hover:opacity-95"
            style={{ backgroundColor: NAVY }}
          >
            <Pencil className="h-3 w-3" aria-hidden />
            <span className="hidden sm:inline">Edit</span>
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
        {steps.map((step) => {
          const pct = step.total ? (step.done / step.total) * 100 : 0;
          return (
            <div
              key={step.id}
              className="rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1.5"
              title={step.title}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 truncate text-[10px] font-bold text-slate-700">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                      step.complete ? 'bg-emerald-500 text-white' : 'text-white'
                    }`}
                    style={step.complete ? undefined : { backgroundColor: NAVY }}
                  >
                    {step.complete ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : step.id}
                  </span>
                  <span className="truncate">{step.title}</span>
                </span>
                <span className="shrink-0 text-[9px] font-semibold text-slate-500">
                  {step.done}/{step.total}
                </span>
              </div>
              <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: step.complete ? '#10b981' : NAVY }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
              {steps.map((step) => (
                <div key={step.id} className="rounded-lg border border-slate-100 px-2 py-1.5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {step.title}
                  </p>
                  <ul className="space-y-0.5">
                    {step.fields.map((field) => {
                      const ok = field.filled(data);
                      return (
                        <li
                          key={String(field.key)}
                          className="flex items-center gap-2 text-[11px] text-slate-600"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          />
                          <span className="w-14 shrink-0 font-medium text-slate-500">{field.label}</span>
                          <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                            {field.display(data)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}