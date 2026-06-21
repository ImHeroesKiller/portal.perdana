import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, MessageCircle, Sparkles } from 'lucide-react';
import { buildApplyFormHref } from '../../lib/job-display';
import { BRAND_NAVY } from '../home/homeContent';
import { MarketingPageShell } from '../layout/MarketingPageLayout';

const NAVY = BRAND_NAVY;

type ApplyOption = {
  id: 'manual' | 'ai';
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
};

const OPTIONS: ApplyOption[] = [
  {
    id: 'manual',
    title: 'Form Manual',
    description: 'Wizard 4 langkah — identitas, kontak, profesional, dan upload dokumen. Cocok kalau kamu mau isi sendiri step by step.',
    icon: <FileText className="h-7 w-7" strokeWidth={1.75} aria-hidden />,
  },
  {
    id: 'ai',
    title: 'AI Sara',
    description: 'Ngobrol santai dengan Sara — data lamaran terisi otomatis sambil chat. Paling cepat & gampang.',
    icon: <MessageCircle className="h-7 w-7" strokeWidth={1.75} aria-hidden />,
    badge: 'Rekomendasi',
  },
];

export const RecruitmentStartPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const position = searchParams.get('position') || '';
  const jobId = searchParams.get('jobId') || '';

  const backHref = jobId ? `/vacancies/${encodeURIComponent(jobId)}` : '/vacancies';

  const buildHref = (mode: 'manual' | 'ai') =>
    buildApplyFormHref({ position: position || undefined, jobId: jobId || undefined, mode });

  return (
    <MarketingPageShell className="px-4 py-5 sm:py-8">
      <button
        type="button"
        onClick={() => navigate(backHref)}
        className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#003087] transition hover:text-blue-900 active:scale-[0.98]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali
      </button>

      {/* Compact hero */}
      <div
        className="overflow-hidden rounded-2xl px-5 py-6 text-white shadow-md sm:px-6 sm:py-7"
        style={{ backgroundColor: NAVY }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">
          PT Perdana Adi Yuda
        </p>
        <h1 className="mt-1.5 text-xl font-black leading-tight sm:text-2xl">Pilih Cara Melamar</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100/95">
          Pilih metode yang paling nyaman untuk kamu — form manual atau chat dengan asisten AI Sara.
        </p>
        {position && (
          <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            Posisi: {position}
          </p>
        )}
      </div>

      {/* Option cards */}
      <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5">
        {OPTIONS.map((opt) => (
          <article
            key={opt.id}
            className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-[#003087]/20 hover:shadow-md sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: NAVY }}
              >
                {opt.icon}
              </div>
              {opt.badge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {opt.badge}
                </span>
              )}
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-slate-900">{opt.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{opt.description}</p>

            <Link
              to={buildHref(opt.id)}
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: NAVY }}
            >
              Pilih {opt.title}
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Butuh bantuan?{' '}
        <Link to="/contact" className="font-semibold text-[#003087] underline-offset-2 hover:underline">
          Hubungi kami
        </Link>
      </p>
    </MarketingPageShell>
  );
};