import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { COMPANY_LOGO_PNG } from '../../lib/brand-assets';
import { BRAND_NAVY } from '../home/homeContent';
import { OptimizedImage } from '../ui/OptimizedImage';
import { useLanguage } from '../../services/i18n';
import { useCompanySettings } from '../../hooks/useCompanySettings';

const FOOTER_BG = '#001a4d';

const NAV_LINKS = [
  { to: '/', labelKey: 'nav_home' },
  { to: '/vacancies', labelKey: 'nav_vacancies' },
  { to: '/services', labelKey: 'nav_services' },
  { to: '/about', labelKey: 'nav_about' },
  { to: '/contact', labelKey: 'nav_contact' },
] as const;

const SERVICE_LINKS = [
  { to: '/services#business-support', id: 'Business Support', en: 'Business Support', zh: '业务支持' },
  { to: '/services#recruitment', id: 'Recruitment', en: 'Recruitment', zh: '招聘服务' },
  { to: '/services#training', id: 'Training & Development', en: 'Training & Development', zh: '培训与发展' },
  { to: '/services#event-management', id: 'Event Management', en: 'Event Management', zh: '活动管理' },
] as const;

const SOCIAL_LINKS = [
  { label: 'LinkedIn', icon: ExternalLink, href: 'https://www.linkedin.com/company/pt-perdana-adi-yuda' },
  { label: 'Instagram', icon: Share2, href: 'https://www.instagram.com/peradaadiyuda' },
  { label: 'Facebook', icon: Share2, href: 'https://www.facebook.com/peradaadiyuda' },
  { label: 'YouTube', icon: Share2, href: 'https://www.youtube.com/@peradaadiyuda' },
] as const;

const FOOTER_COPY = {
  id: {
    navigation: 'Navigasi',
    services: 'Layanan',
    contact: 'Hubungi Kami',
    headOffice: 'Kantor Pusat',
    branch: 'Kantor Cabang',
    whatsapp: 'WhatsApp',
    privacy: 'Kebijakan Privasi',
    terms: 'Syarat & Ketentuan',
    rights: 'Seluruh hak cipta dilindungi.',
  },
  en: {
    navigation: 'Navigation',
    services: 'Services',
    contact: 'Contact Us',
    headOffice: 'Head Office',
    branch: 'Branch Office',
    whatsapp: 'WhatsApp',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    rights: 'All rights reserved.',
  },
  zh: {
    navigation: '导航',
    services: '服务',
    contact: '联系我们',
    headOffice: '总部',
    branch: '分支机构',
    whatsapp: 'WhatsApp',
    privacy: '隐私政策',
    terms: '服务条款',
    rights: '版权所有。',
  },
} as const;

const linkClass =
  'text-sm text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#001a4d]';

const headingClass = 'text-xs font-black uppercase tracking-[0.18em] text-cyan-300/90';

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const settings = useCompanySettings();
  const copy = FOOTER_COPY[language] ?? FOOTER_COPY.id;
  const year = new Date().getFullYear();

  const waDigits = settings.phone.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${waDigits}`;
  const branch = settings.branches[0];

  return (
    <footer
      className="border-t border-white/10 text-slate-200"
      style={{ backgroundColor: FOOTER_BG }}
      aria-label="Footer situs"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-lg ring-1 ring-white/20">
                <OptimizedImage
                  src={COMPANY_LOGO_PNG}
                  alt="Logo PT Perdana Adi Yuda"
                  className="h-full w-full object-contain"
                  width={112}
                  height={112}
                />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-black leading-snug text-white sm:text-base">
                  {settings.companyName}
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-cyan-200/90">
                  {t('nav_tagline')}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              {t('home_hero_tagline')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label={copy.navigation}>
            <h2 className={headingClass}>{copy.navigation}</h2>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map(({ to, labelKey }) => (
                <li key={to}>
                  <Link to={to} className={linkClass}>
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <nav aria-label={copy.services}>
            <h2 className={headingClass}>{copy.services}</h2>
            <ul className="mt-4 space-y-2.5">
              {SERVICE_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass}>
                    {item[language] ?? item.id}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className={headingClass}>{copy.contact}</h2>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
                  aria-hidden
                />
                <div className="min-w-0 text-sm text-slate-300">
                  <p className="font-semibold text-white">{copy.headOffice}</p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-400">
                    {settings.headOfficeAddress}
                  </p>
                  {branch && (
                    <div className="mt-3 hidden sm:block">
                      <p className="font-semibold text-white">{copy.branch}</p>
                      <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-400">
                        {branch.address}
                      </p>
                    </div>
                  )}
                </div>
              </li>

              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className={linkClass}>
                  {settings.phone}
                </a>
              </li>

              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                <a href={`mailto:${settings.email}`} className={`${linkClass} break-all`}>
                  {settings.email}
                </a>
              </li>

              <li className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {copy.whatsapp}: {settings.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center"
          style={{ borderTopColor: `${BRAND_NAVY}55` }}
        >
          <p className="text-center text-xs text-slate-500 sm:text-left">
            &copy; {year} {settings.companyName}. {copy.rights}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link
              to="/help"
              className="font-semibold text-slate-400 transition hover:text-white"
            >
              {copy.privacy}
            </Link>
            <span className="hidden text-slate-600 sm:inline" aria-hidden>
              |
            </span>
            <Link
              to="/help"
              className="font-semibold text-slate-400 transition hover:text-white"
            >
              {copy.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};