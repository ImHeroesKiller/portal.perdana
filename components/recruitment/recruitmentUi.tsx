import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { BRAND_NAVY } from '../home/homeContent';

export const NAVY_BTN =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-900 hover:opacity-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export const NAVY_BTN_OUTLINE =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#003087]/25 bg-white px-5 text-sm font-bold text-[#003087] transition hover:bg-blue-50/80 active:scale-[0.98]';

export const BACK_BTN =
  'group mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#003087]/20 hover:text-[#003087] hover:shadow-md active:scale-[0.98]';

export function RecruitmentBackButton({
  onClick,
  label = 'Kembali',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={BACK_BTN}>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-[#003087] transition group-hover:bg-blue-50">
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </span>
      {label}
    </button>
  );
}

export function WizardHero({
  title,
  subtitle,
  position,
}: {
  title: string;
  subtitle: string;
  position?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-[#003087]/15">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#003087] via-[#00256a] via-45% via-blue-900 via-75% to-blue-950"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(56,189,248,0.28),transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:20px_20px]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative z-10 px-7 py-8 text-center sm:px-10 sm:py-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-200/90">
          PT Perdana Adi Yuda
        </p>
        <h1 className="mt-2 text-xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-2xl">
          {title}
        </h1>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-300/95">{subtitle}</p>

        {position && (
          <div className="mt-4 flex justify-center sm:mt-5">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#003087]/40 bg-white/10 px-4 py-2 text-left text-xs font-semibold text-white shadow-[0_4px_24px_rgba(0,48,135,0.25)] backdrop-blur-md">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-cyan-200/90">
                Posisi
              </span>
              <span className="truncate">{position}</span>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export function WizardCard({
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

export function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <span
        className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
        style={{ backgroundColor: BRAND_NAVY }}
      >
        Langkah {step}
      </span>
      <h3 className="mt-2.5 text-lg font-black text-slate-900 sm:text-xl">{title}</h3>
      {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
      <p className="font-semibold leading-snug">{message}</p>
    </div>
  );
}

export function SaraPromoBanner({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#003087]/15 bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
        aria-hidden
      />
      <div className="flex gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-[#003087] text-lg text-white shadow-md shadow-cyan-500/20"
        >
          ✨
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900">Isi lebih cepat dengan Sara</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Asisten AI virtual memandu Anda mengisi data lewat percakapan.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className={`${NAVY_BTN} mt-3 w-full sm:mt-0 sm:w-auto`}
        style={{ backgroundColor: BRAND_NAVY }}
      >
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
    <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 text-center shadow-lg sm:p-8">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-70"
        aria-hidden
      />
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-2 ring-emerald-100">
        <CheckCircleIcon className="h-10 w-10 text-emerald-600" aria-hidden />
      </div>
      <h2 className="text-2xl font-black text-slate-900">Lamaran Terkirim!</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Terima kasih <strong className="text-slate-700">{submittedName}</strong>, data lamaran Anda
        telah tersimpan di sistem rekrutmen PT Perdana Adi Yuda.
      </p>

      {credentials && (
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
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