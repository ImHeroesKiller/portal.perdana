import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronDown, Circle, Pencil } from 'lucide-react';
import type { NewEmployee } from '../../types';

const NAVY = '#003087';

/** Extended fields used during Sara chat extraction (not all on Employee type). */
export type SaraSyncData = Partial<NewEmployee> & {
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
  rt?: string;
  rw?: string;
  addressLine?: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  filled: (d: SaraSyncData) => boolean;
  display: (d: SaraSyncData) => string;
};

function formatSkills(skills: NewEmployee['skills'] | undefined): string {
  if (!skills) return '';
  if (Array.isArray(skills)) return skills.join(', ');
  return String(skills);
}

function formatAddress(d: SaraSyncData): string {
  const parts = [d.provinsi, d.kabupaten, d.kecamatan, d.desa].filter(Boolean);
  const rtRw =
    d.rt || d.rw ? `RT ${d.rt || '—'} / RW ${d.rw || '—'}` : '';
  const line = [...parts, rtRw].filter(Boolean).join(', ');
  return line || d.addressLine || d.domicileAddress || '';
}

export const RECRUITMENT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'fullName',
    label: 'Nama Lengkap',
    filled: (d) => Boolean(d.fullName?.trim()),
    display: (d) => d.fullName || '',
  },
  {
    id: 'nik',
    label: 'NIK',
    filled: (d) => Boolean(d.nik?.trim()),
    display: (d) => d.nik || '',
  },
  {
    id: 'kkNumber',
    label: 'Nomor KK',
    filled: (d) => Boolean(d.kkNumber?.trim()),
    display: (d) => d.kkNumber || '',
  },
  {
    id: 'email',
    label: 'Email',
    filled: (d) => Boolean(d.email?.trim()),
    display: (d) => d.email || '',
  },
  {
    id: 'whatsappNumber',
    label: 'Nomor WhatsApp',
    filled: (d) => Boolean(d.whatsappNumber?.trim()),
    display: (d) => d.whatsappNumber || '',
  },
  {
    id: 'address',
    label: 'Alamat Lengkap',
    filled: (d) =>
      Boolean(
        d.provinsi?.trim() &&
          d.kabupaten?.trim() &&
          d.kecamatan?.trim() &&
          d.desa?.trim()
      ),
    display: formatAddress,
  },
  {
    id: 'birth',
    label: 'Tempat & Tanggal Lahir',
    filled: (d) => Boolean(d.placeOfBirth?.trim() && d.dateOfBirth?.trim()),
    display: (d) =>
      d.placeOfBirth && d.dateOfBirth
        ? `${d.placeOfBirth}, ${d.dateOfBirth}`
        : d.placeOfBirth || d.dateOfBirth || '',
  },
  {
    id: 'gender',
    label: 'Gender',
    filled: (d) => Boolean(d.gender?.trim()),
    display: (d) => d.gender || '',
  },
  {
    id: 'religion',
    label: 'Agama',
    filled: (d) => Boolean(d.religion?.trim()),
    display: (d) => d.religion || '',
  },
  {
    id: 'maritalStatus',
    label: 'Status Pernikahan',
    filled: (d) => Boolean(d.maritalStatus?.trim()),
    display: (d) => d.maritalStatus || '',
  },
  {
    id: 'lastEducation',
    label: 'Pendidikan Terakhir',
    filled: (d) => Boolean(d.lastEducation?.trim()),
    display: (d) => d.lastEducation || '',
  },
  {
    id: 'major',
    label: 'Jurusan',
    filled: (d) => Boolean(d.major?.trim()),
    display: (d) => d.major || '',
  },
  {
    id: 'graduationYear',
    label: 'Tahun Lulus',
    filled: (d) => d.graduationYear != null && String(d.graduationYear).trim() !== '',
    display: (d) => (d.graduationYear != null ? String(d.graduationYear) : ''),
  },
  {
    id: 'bank',
    label: 'Bank & Rekening',
    filled: (d) => Boolean(d.bankName?.trim() && d.accountNumber?.trim()),
    display: (d) =>
      d.bankName && d.accountNumber ? `${d.bankName} · ${d.accountNumber}` : d.bankName || '',
  },
  {
    id: 'emergency',
    label: 'Kontak Darurat',
    filled: (d) =>
      Boolean(
        d.emergencyName?.trim() &&
          d.emergencyRelation?.trim() &&
          d.emergencyPhone?.trim()
      ),
    display: (d) =>
      d.emergencyName
        ? `${d.emergencyName} (${d.emergencyRelation || '—'}) · ${d.emergencyPhone || '—'}`
        : '',
  },
  {
    id: 'skills',
    label: 'Keahlian / Skills',
    filled: (d) => Boolean(formatSkills(d.skills).trim()),
    display: (d) => formatSkills(d.skills),
  },
  {
    id: 'workExperience',
    label: 'Pengalaman Kerja',
    filled: (d) => Boolean(d.workExperience?.trim()),
    display: (d) => d.workExperience || '',
  },
];

export function computeSyncProgress(data: SaraSyncData) {
  const done = RECRUITMENT_CHECKLIST.filter((item) => item.filled(data)).length;
  const total = RECRUITMENT_CHECKLIST.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

function ChecklistRow({
  item,
  data,
  showValue,
}: {
  item: ChecklistItem;
  data: SaraSyncData;
  showValue: boolean;
}) {
  const ok = item.filled(data);
  const value = ok ? item.display(data) : '';

  return (
    <li className="flex items-start gap-2 py-0.5">
      {ok ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
      ) : (
        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" strokeWidth={1.5} aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <span
          className={`block text-[10px] leading-tight ${ok ? 'font-medium text-slate-700' : 'text-slate-400'}`}
        >
          {item.label}
        </span>
        {showValue && ok && value && (
          <p className="mt-0.5 truncate text-[9px] leading-snug text-slate-500" title={value}>
            {value}
          </p>
        )}
      </div>
    </li>
  );
}

export interface SaraLiveDataSyncProps {
  data: SaraSyncData;
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

  const { done, total, pct } = useMemo(() => computeSyncProgress(data), [data]);

  const shellClass =
    variant === 'sidebar'
      ? 'flex max-h-[calc(100dvh-8rem)] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm'
      : variant === 'drawer'
        ? 'border-0 bg-transparent px-1 py-1 shadow-none'
        : 'rounded-lg border border-slate-100/90 bg-white/95 px-2.5 py-2 sm:px-3';

  const showValues = variant === 'sidebar';

  return (
    <div className={`${shellClass} ${className}`}>
      <div
        className={`flex shrink-0 items-center gap-2 ${
          variant === 'sidebar' ? 'border-b border-slate-100 p-3' : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-bold text-slate-800 ${variant === 'sidebar' ? 'text-xs' : 'text-[11px]'}`}>
              Checklist Data
            </span>
            <span className="text-[10px] font-semibold tabular-nums text-[#003087]">
              {done}/{total} · {pct}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: pct === 100 ? '#10b981' : NAVY }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>

        {variant !== 'drawer' && variant !== 'sidebar' && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Sembunyikan checklist' : 'Lihat checklist'}
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

      {(expanded || variant === 'drawer' || variant === 'sidebar') && (
        <ul
          className={`${
            variant === 'sidebar'
              ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 py-2'
              : variant === 'drawer'
                ? 'mt-1 max-h-36 overflow-y-auto overscroll-contain scroll-smooth'
                : 'mt-2 max-h-48 overflow-y-auto overscroll-contain border-t border-slate-100 pt-2'
          } space-y-0.5`}
        >
          {RECRUITMENT_CHECKLIST.map((item) => (
            <ChecklistRow key={item.id} item={item} data={data} showValue={showValues} />
          ))}
        </ul>
      )}

      {variant === 'sidebar' && onEdit && (
        <div className="shrink-0 border-t border-slate-100 p-2">
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-lg py-2 text-[11px] font-semibold text-white transition hover:opacity-95"
            style={{ backgroundColor: NAVY }}
          >
            Tinjau & Edit Data
          </button>
        </div>
      )}
    </div>
  );
}