import React from 'react';

const BONE =
  'rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/90 to-slate-100 animate-pulse';

function SkeletonCard({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg ${className}`}
      {...props}
    >
      <div
        className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-[#003087] to-transparent opacity-50"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function SkeletonBone({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`${BONE} ${className}`} style={style} aria-hidden />;
}

export function WizardHeroSkeleton({ showLogo = false }: { showLogo?: boolean }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-[#003087]/15"
      aria-busy
      aria-label="Memuat hero..."
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#003087]/40 via-[#00256a]/50 to-blue-950/60 animate-pulse"
        aria-hidden
      />
      <div className="relative z-10 px-7 py-8 text-center sm:px-10 sm:py-10">
        {showLogo && (
          <SkeletonBone className="mx-auto mb-4 h-20 w-20 rounded-3xl sm:mb-5 sm:h-24 sm:w-24" />
        )}
        <SkeletonBone className="mx-auto h-2.5 w-36 rounded-full opacity-70" />
        <SkeletonBone className="mx-auto mt-4 h-7 w-56 max-w-full rounded-xl" />
        <SkeletonBone className="mx-auto mt-3 h-4 w-72 max-w-full rounded-lg opacity-80" />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <SkeletonBone className="h-9 w-36 rounded-full opacity-60" />
          <SkeletonBone className="h-9 w-32 rounded-full opacity-60" />
        </div>
      </div>
    </section>
  );
}

export function WizardCardSkeleton({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <SkeletonCard className={`p-7 sm:p-8 ${className}`} aria-busy aria-label="Memuat konten...">
      {children ?? (
        <div className="space-y-4">
          <SkeletonBone className="h-3 w-20 rounded-full" />
          <SkeletonBone className="h-6 w-2/3 max-w-xs rounded-xl" />
          <SkeletonBone className="h-4 w-full max-w-md rounded-lg" />
          <SkeletonBone className="h-4 w-5/6 max-w-sm rounded-lg" />
        </div>
      )}
    </SkeletonCard>
  );
}

export function LoadingCardSkeleton({ message = 'Memuat data...' }: { message?: string }) {
  return (
    <SkeletonCard className="flex min-h-[14rem] flex-col items-center justify-center gap-5 p-8" aria-busy>
      <div className="w-full max-w-xs space-y-3">
        <SkeletonBone className="mx-auto h-10 w-10 rounded-2xl" />
        <SkeletonBone className="mx-auto h-4 w-40 rounded-lg" />
        <SkeletonBone className="mx-auto h-3 w-52 rounded-lg opacity-70" />
      </div>
      <p className="sr-only">{message}</p>
    </SkeletonCard>
  );
}

export function JobCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <SkeletonCard className={`${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-7'}`} aria-busy>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBone className="h-5 w-3/4 max-w-[16rem] rounded-lg" />
          <div className="flex flex-wrap gap-2">
            <SkeletonBone className="h-7 w-24 rounded-full" />
            <SkeletonBone className="h-7 w-28 rounded-full" />
            <SkeletonBone className="h-7 w-20 rounded-full" />
          </div>
          {!compact && (
            <>
              <SkeletonBone className="h-3.5 w-full rounded-md" />
              <SkeletonBone className="h-3.5 w-11/12 rounded-md" />
            </>
          )}
        </div>
        <SkeletonBone className="h-9 w-9 shrink-0 rounded-xl" />
      </div>
      {compact && (
        <div className="mt-4 space-y-2">
          <SkeletonBone className="h-3 w-full rounded-md" />
          <SkeletonBone className="h-3 w-4/5 rounded-md" />
        </div>
      )}
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonBone className="h-11 w-full rounded-xl sm:w-36" />
        <SkeletonBone className="h-11 w-full rounded-xl sm:w-32" />
      </div>
    </SkeletonCard>
  );
}

export function FormFieldSkeleton({ fullWidth = true }: { fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'w-full' : ''} aria-hidden>
      <SkeletonBone className="mb-2 h-3.5 w-28 rounded-md" />
      <SkeletonBone className="h-12 w-full rounded-2xl" />
    </div>
  );
}

export function FormStepSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6" aria-busy aria-label="Memuat formulir...">
      <div>
        <SkeletonBone className="h-5 w-24 rounded-full" />
        <SkeletonBone className="mt-3 h-7 w-56 max-w-full rounded-xl" />
        <SkeletonBone className="mt-2 h-4 w-72 max-w-full rounded-lg opacity-80" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <FormFieldSkeleton key={i} fullWidth />
        ))}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <SkeletonBone className="h-10 w-28 rounded-full" />
        <SkeletonBone className="h-10 w-24 rounded-full" />
        <SkeletonBone className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}

export function VacanciesListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy aria-label="Memuat lowongan...">
      {Array.from({ length: count }, (_, i) => (
        <JobCardSkeleton key={i} compact />
      ))}
    </div>
  );
}

export function VacanciesPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6" aria-busy aria-label="Memuat halaman lowongan...">
      <WizardHeroSkeleton showLogo />
      <WizardCardSkeleton>
        <div className="space-y-4">
          <SkeletonBone className="h-5 w-24 rounded-full" />
          <SkeletonBone className="h-6 w-48 rounded-xl" />
          <SkeletonBone className="h-12 w-full rounded-2xl" />
        </div>
      </WizardCardSkeleton>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonBone key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <VacanciesListSkeleton count={3} />
    </div>
  );
}

export function JobDetailPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6" aria-busy aria-label="Memuat detail lowongan...">
      <SkeletonBone className="h-10 w-28 rounded-full opacity-60" />
      <WizardHeroSkeleton showLogo />
      <WizardCardSkeleton>
        <div className="space-y-4">
          <SkeletonBone className="h-5 w-28 rounded-full" />
          <SkeletonBone className="h-6 w-40 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonBone key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonBone key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      </WizardCardSkeleton>
      <WizardCardSkeleton>
        <div className="space-y-3">
          <SkeletonBone className="h-6 w-36 rounded-xl" />
          <SkeletonBone className="h-3.5 w-full rounded-md" />
          <SkeletonBone className="h-3.5 w-full rounded-md" />
          <SkeletonBone className="h-3.5 w-4/5 rounded-md" />
        </div>
      </WizardCardSkeleton>
      <SkeletonBone className="mx-auto hidden h-12 w-64 rounded-xl md:block" />
    </div>
  );
}