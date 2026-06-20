import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { BRAND_NAVY } from '../home/homeContent';

export const NAVY_BTN =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export const NAVY_BTN_OUTLINE =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#003087]/25 bg-white px-5 text-sm font-bold text-[#003087] transition hover:bg-blue-50/80 active:scale-[0.98]';

export function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-4">
      <span
        className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
        style={{ backgroundColor: BRAND_NAVY }}
      >
        Langkah {step}
      </span>
      <h3 className="mt-2 text-lg font-extrabold text-slate-900 sm:text-xl">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
      <p className="font-semibold leading-snug">{message}</p>
    </div>
  );
}

export function SaraPromoBanner({ onStart }: { onStart: () => void }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#003087]/15 bg-gradient-to-br from-blue-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-white shadow-sm"
          style={{ backgroundColor: BRAND_NAVY }}
        >
          ✨
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-slate-900">Isi lebih cepat dengan Sara</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            Asisten AI virtual akan memandu Anda mengisi data melalui percakapan natural.
          </p>
        </div>
      </div>
      <button type="button" onClick={onStart} className={NAVY_BTN} style={{ backgroundColor: BRAND_NAVY }}>
        Mulai Chat dengan Sara
      </button>
    </div>
  );
}

export function ChoicePill({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
        selected
          ? 'border-[#003087] bg-[#003087] text-white shadow-md'
          : 'border-slate-200 bg-white text-slate-700 hover:border-[#003087]/30'
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
          selected ? 'border-white bg-white' : 'border-slate-300'
        }`}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#003087]" />}
      </span>
      {label}
    </button>
  );
}

export function ApplySuccessView({
  submittedName,
  credentials,
  onLogin,
  onNewApplication,
}: {
  submittedName: string;
  credentials: { email: string; password: string; isNew: boolean } | null;
  onLogin: () => void;
  onNewApplication: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-lg sm:p-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircleIcon className="h-10 w-10 text-emerald-600" aria-hidden />
      </div>
      <h2 className="text-2xl font-black text-slate-900">Lamaran Terkirim!</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Terima kasih <strong>{submittedName}</strong>, data lamaran Anda telah tersimpan di sistem
        rekrutmen PT Perdana Adi Yuda.
      </p>

      {credentials && (
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#003087]">
            <InformationCircleIcon className="h-4 w-4" aria-hidden />
            Akun Portal Anda
          </div>
          <CredentialRow label="Email (username)" value={credentials.email} />
          <CredentialRow label="Password sementara" value={credentials.password} className="mt-2" />
          <p className="mt-3 text-[11px] font-medium text-amber-700">
            Simpan kredensial ini sekarang. Kami juga mengirimkannya ke email Anda jika tersedia.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onLogin}
          className={NAVY_BTN}
          style={{ backgroundColor: BRAND_NAVY }}
        >
          Lacak Progres Lamaran
        </button>
        <button type="button" onClick={onNewApplication} className={NAVY_BTN_OUTLINE}>
          Lamar Posisi Lain
        </button>
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <span className="truncate font-mono text-xs font-bold text-slate-800">{value}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
          }}
          className="shrink-0 text-[10px] font-bold text-[#003087] hover:underline"
        >
          Salin
        </button>
      </div>
    </div>
  );
}