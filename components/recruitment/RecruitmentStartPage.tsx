import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileText, MessageCircle, Sparkles } from 'lucide-react';
import { buildApplyFormHref } from '../../lib/job-display';
import { COMPANY_LOGO_PNG } from '../../lib/brand-assets';
import { BRAND_NAVY } from '../home/homeContent';
import { OptimizedImage } from '../ui/OptimizedImage';
import { MarketingPageShell } from '../layout/MarketingPageLayout';

type ApplyOption = {
  id: 'manual' | 'ai';
  title: string;
  subtitle: string;
  description: string;
  featured?: boolean;
};

const OPTIONS: ApplyOption[] = [
  {
    id: 'manual',
    title: 'Form Manual',
    subtitle: 'Wizard 4 langkah',
    description:
      'Isi identitas, kontak, profesional, dan upload dokumen secara terstruktur — cocok kalau kamu suka kontrol penuh.',
  },
  {
    id: 'ai',
    title: 'AI Sara',
    subtitle: 'Chat interaktif',
    description:
      'Ngobrol santai dengan Sara. Data lamaran terisi otomatis sambil chat — paling cepat dan mudah.',
    featured: true,
  },
];

function OptionIcon({ id, featured }: { id: ApplyOption['id']; featured?: boolean }) {
  if (id === 'ai') {
    return (
      <div
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md ring-2 ${
          featured
            ? 'bg-gradient-to-br from-cyan-500 to-[#003087] text-white ring-cyan-200/60'
            : 'bg-blue-50 text-[#003087] ring-blue-100'
        }`}
      >
        <MessageCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </div>
    );
  }

  return (
    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#003087] shadow-sm ring-2 ring-slate-100">
      <FileText className="h-6 w-6" strokeWidth={1.75} aria-hidden />
    </div>
  );
}

export const RecruitmentStartPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const position = searchParams.get('position') || '';
  const jobId = searchParams.get('jobId') || '';

  const backHref = jobId ? `/vacancies/${encodeURIComponent(jobId)}` : '/vacancies';

  const buildHref = (mode: 'manual' | 'ai') =>
    buildApplyFormHref({ position: position || undefined, jobId: jobId || undefined, mode });

  return (
    <MarketingPageShell className="px-4 pb-8 pt-4 sm:px-5 sm:py-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(backHref)}
        className="group mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#003087]/20 hover:text-[#003087] hover:shadow-md active:scale-[0.98]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-[#003087] transition group-hover:bg-blue-50">
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </span>
        Kembali
      </button>

      {/* Hero — gradient navy + logo */}
      <section className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-[#003087]/10">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#003087] via-[#00256a] to-slate-950"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(56,189,248,0.22),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent"
          aria-hidden
        />

        <div className="relative z-10 px-5 py-7 text-center sm:px-8 sm:py-9">
          <div className="mx-auto mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-white p-3 shadow-2xl ring-2 ring-white/40 sm:h-20 sm:w-20">
            <OptimizedImage
              src={COMPANY_LOGO_PNG}
              alt="Logo PT Perdana Adi Yuda"
              className="h-full w-full object-contain"
              priority
              width={160}
              height={160}
            />
          </div>

          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-200/95">
            PT Perdana Adi Yuda
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl">
            Pilih Cara Melamar
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-blue-100/90 sm:text-[15px]">
            Pilih metode yang paling nyaman — formulir manual atau chat dengan asisten AI Sara.
          </p>

          {position && (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="text-cyan-200/90">Posisi</span>
              {position}
            </span>
          )}
        </div>
      </section>

      {/* Cards */}
      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
        {OPTIONS.map((opt) => {
          const featured = opt.featured;

          return (
            <article
              key={opt.id}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] sm:p-6 ${
                featured
                  ? 'border-[#003087]/30 shadow-md ring-2 ring-[#003087]/10'
                  : 'border-slate-100 hover:border-[#003087]/25'
              }`}
            >
              {/* Accent top bar — StatsCards pattern */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent to-transparent opacity-70 ${
                  featured ? 'via-cyan-400' : 'via-[#003087]'
                }`}
                aria-hidden
              />

              <div className="flex items-start justify-between gap-3">
                <OptionIcon id={opt.id} featured={featured} />
                {featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-50 to-cyan-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                    <Sparkles className="h-3 w-3 text-cyan-600" aria-hidden />
                    Rekomendasi
                  </span>
                )}
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {opt.subtitle}
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">{opt.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{opt.description}</p>

              <Link
                to={buildHref(opt.id)}
                className={`mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] ${
                  featured ? 'shadow-lg shadow-[#003087]/20' : ''
                }`}
                style={{ backgroundColor: BRAND_NAVY }}
              >
                Pilih {opt.title}
                <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
              </Link>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
        Butuh bantuan melamar?{' '}
        <Link
          to="/contact"
          className="font-bold text-[#003087] underline-offset-2 transition hover:underline"
        >
          Hubungi tim rekrutmen
        </Link>
      </p>
    </MarketingPageShell>
  );
};