import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { COMPANY_LOGO_PNG } from '../../lib/brand-assets';
import { OptimizedImage } from '../ui/OptimizedImage';
const AUTH_BG_IMAGE = '/assets/hero/site_scaffolding.jpg';

interface AuthPageShellProps {
  children: React.ReactNode;
  companyName?: string;
}

export const AuthPageShell: React.FC<AuthPageShellProps> = ({
  children,
  companyName = 'PT Perdana Adi Yuda',
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 font-sans antialiased sm:py-10">
      <div className="absolute inset-0" aria-hidden>
        <OptimizedImage
          src={AUTH_BG_IMAGE}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#003087]/95 via-[#003087]/88 to-slate-950/80" />
      </div>

      <div className="relative z-10 w-full max-w-[22rem] sm:max-w-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-5 flex min-h-[44px] items-center gap-1.5 text-[11px] font-extrabold text-white/90 transition hover:text-white active:scale-95"
          id="btn-back-auth"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" aria-hidden />
          Kembali ke Beranda
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3.5 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl bg-white p-3.5 shadow-2xl ring-2 ring-white/40 sm:h-24 sm:w-24 sm:p-4">
            <OptimizedImage
              src={COMPANY_LOGO_PNG}
              alt={`Logo ${companyName}`}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <p className="text-sm font-bold text-white drop-shadow-md sm:text-base">{companyName}</p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-2xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};