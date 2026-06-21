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

  const { steps, overallDone, overallTotal, activeStepId } = useMemo(() => {
    const mapped = SYNC_STEPS.map((step) => {
      const { done, total } = stepProgress(step, data);
      return { ...step, done, total, complete: done === total };
    });
    const overallDone = mapped.reduce((n, s) => n + s.done, 0);
    const overallTotal = mapped.reduce((n, s) => n + s.total, 0);
    const activeStepId = mapped.find((s) => !s.complete)?.id ?? mapped.length;
    return { steps: mapped, overallDone, overallTotal, activeStepId };
  }, [data]);

  const overallPct = overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4 lg:sticky lg:top-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
            <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: NAVY }} aria-hidden />
            Live Data Sync
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {overallDone}/{overallTotal} field · update otomatis dari chat
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: NAVY }}
        >
          {overallPct}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: NAVY }}
          initial={false}
          animate={{ width: `${overallPct}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      <div className="mt-3 space-y-2">
        {steps.map((step) => {
          const pct = step.total ? (step.done / step.total) * 100 : 0;
          const isActive = step.id === activeStepId;

          return (
            <div
              key={step.id}
              className={`rounded-xl border px-2.5 py-2 transition-colors ${
                isActive ? 'border-[#003087]/20 bg-blue-50/40' : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    step.complete ? 'bg-emerald-500 text-white' : 'text-white'
                  }`}
                  style={step.complete ? undefined : { backgroundColor: NAVY }}
                >
                  {step.complete ? <Check className="h-3 w-3" strokeWidth={3} /> : step.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-slate-800">{step.title}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                      {step.done}/{step.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: step.complete ? '#10b981' : NAVY }}
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {(expanded || isActive) && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 space-y-1 overflow-hidden border-t border-slate-100/80 pt-2"
                  >
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
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-lg border border-[#003087]/20 px-2 text-[11px] font-bold text-[#003087] transition hover:bg-blue-50/80 active:scale-[0.98]"
        >
          {expanded ? 'Ringkas' : 'Lihat Detail'}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg px-3 text-[11px] font-bold text-white transition hover:opacity-95 active:scale-[0.98]"
            style={{ backgroundColor: NAVY }}
          >
            <Pencil className="h-3 w-3" aria-hidden />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}