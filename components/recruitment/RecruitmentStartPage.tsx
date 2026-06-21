import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, FileText, MessageCircle, Sparkles } from 'lucide-react';
import { buildApplyFormHref } from '../../lib/job-display';
import { COMPANY_LOGO_PNG } from '../../lib/brand-assets';
import { BRAND_NAVY } from '../home/homeContent';
import { OptimizedImage } from '../ui/OptimizedImage';
import { MarketingPageShell } from '../layout/MarketingPageLayout';
import { NAVY_BTN, RecruitmentBackButton } from './recruitmentUi';

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
    subtitle: '4 langkah terstruktur',
    description: 'Identitas, kontak, profesional, dan dokumen — kamu yang pegang kendali.',
  },
  {
    id: 'ai',
    title: 'AI Sara',
    subtitle: 'Asisten AI interaktif',
    description: 'Ngobrol santai, data terisi otomatis. Paling cepat dan mudah.',
    featured: true,
  },
];

const ICON_BOX = 'h-14 w-14 sm:h-[3.5rem] sm:w-[3.5rem]';

function OptionIcon({ id, featured }: { id: ApplyOption['id']; featured?: boolean }) {
  if (id === 'ai') {
    return (
      <div className="relative">
        {featured && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-cyan-300 to-sky-500 text-white shadow-md shadow-cyan-400/40"
            aria-hidden
          >
            <Sparkles className="h-3 w-3" />
          </span>
        )}
        <div
          className={`inline-flex ${ICON_BOX} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-[#003087] text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300/60`}
        >
          <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.65} aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex ${ICON_BOX} shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[#003087] shadow-sm ring-2 ring-slate-100`}
    >
      <FileText className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.65} aria-hidden />
    </div>
  );
}

function RecommendBadge() {
  return (
    <span className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/90">
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
        aria-hidden
      />
      <Sparkles className="relative h-3.5 w-3.5 text-cyan-600" aria-hidden />
      <span className="relative bg-gradient-to-r from-emerald-700 to-cyan-700 bg-clip-text text-transparent">
        Rekomendasi
      </span>
    </span>
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
    <MarketingPageShell className="px-6 pb-10 pt-6 sm:px-6 sm:py-8">
      <RecruitmentBackButton onClick={() => navigate(backHref)} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-[#003087]/15">
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#003087] via-[#00256a] via-45% via-blue-900 via-75% to-blue-950"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(56,189,248,0.32),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_85%_95%,rgba(59,130,246,0.18),transparent_50%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.3] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:20px_20px]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-blue-950/10 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 px-7 py-10 text-center sm:px-10 sm:py-12">
          <div className="mx-auto mb-5 flex h-[6.25rem] w-[6.25rem] items-center justify-center rounded-3xl bg-white p-3.5 shadow-2xl ring-2 ring-white/50 sm:mb-6 sm:h-[7.25rem] sm:w-[7.25rem] sm:p-4">
            <OptimizedImage
              src={COMPANY_LOGO_PNG}
              alt="Logo PT Perdana Adi Yuda"
              className="h-full w-full object-contain"
              priority
              width={256}
              height={256}
            />
          </div>

          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-200/90">
            PT Perdana Adi Yuda
          </p>
          <h1 className="mt-2.5 text-2xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-[1.75rem]">
            Pilih Cara Melamar
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-300/95">
            Form manual atau chat AI Sara — pilih yang paling nyaman.
          </p>

          {position && (
            <div className="mt-5 flex justify-center sm:mt-6">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#003087]/40 bg-white/10 px-4 py-2.5 text-left text-xs font-semibold text-white shadow-[0_4px_24px_rgba(0,48,135,0.25)] backdrop-blur-md">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-cyan-200/90">
                  Posisi
                </span>
                <span className="truncate">{position}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Cards + divider */}
      <div className="mt-7 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg sm:mt-9">
        <div className="grid sm:grid-cols-2 sm:grid-rows-1 sm:divide-x sm:divide-slate-100/90">
          {OPTIONS.map((opt, index) => {
            const featured = opt.featured;

            return (
              <article
                key={opt.id}
                className={`group relative flex h-full flex-col p-7 transition duration-300 sm:p-8 ${
                  index === 0 ? 'border-b border-slate-100/90 sm:border-b-0' : ''
                } ${
                  featured
                    ? 'bg-gradient-to-br from-cyan-50/30 via-white to-blue-50/20 shadow-[0_8px_32px_-8px_rgba(0,48,135,0.28)] ring-2 ring-inset ring-cyan-400/30'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                {featured && (
                  <div
                    className="pointer-events-none absolute inset-0 border-2 border-[#003087]/20"
                    aria-hidden
                  />
                )}

                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent to-transparent ${
                    featured ? 'via-cyan-400 opacity-80' : 'via-[#003087] opacity-50'
                  }`}
                  aria-hidden
                />

                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <OptionIcon id={opt.id} featured={featured} />
                    {featured && <RecommendBadge />}
                  </div>

                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {opt.subtitle}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-[1.35rem]">
                    {opt.title}
                  </h2>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-500">
                    {opt.description}
                  </p>

                  <Link
                    to={buildHref(opt.id)}
                    className={`${NAVY_BTN} mt-6 w-full shadow-lg transition hover:bg-blue-900 hover:opacity-100 sm:mt-8`}
                    style={{ backgroundColor: BRAND_NAVY }}
                  >
                    Pilih {opt.title}
                    <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <p className="mt-8 px-1 text-center text-xs leading-relaxed text-slate-500">
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