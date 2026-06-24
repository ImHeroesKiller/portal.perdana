import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { Input, TextArea } from './ui/Input';
import { useLanguage } from '../services/i18n';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { MarketingPageShell } from './layout/MarketingPageLayout';
import { BRAND_NAVY } from './home/homeContent';
import { loadLeaflet } from '../lib/loadLeaflet';
import {
  CardSectionHeader,
  NAVY_BTN,
  RecruitmentBackButton,
  WizardCard,
  WizardHero,
} from './recruitment/recruitmentUi';

const FIELD_CLASS =
  'rounded-2xl border-slate-100 bg-slate-50/80 py-3 text-sm font-medium text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#003087]/30 focus:bg-white focus:ring-2 focus:ring-[#003087]/20';

function ContactInfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ backgroundColor: BRAND_NAVY }}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        <div className="mt-1.5 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export const Contact: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<{ remove: () => void } | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const settings = useCompanySettings();

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const mainBranch = settings.branches[0] || { lat: -2.8227, lng: 122.1462 };

    void loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) return;

        const map = L.map(mapRef.current).setView([mainBranch.lat, mainBranch.lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        settings.branches.forEach((branch) => {
          L.marker([branch.lat, branch.lng])
            .addTo(map)
            .bindPopup(`<b>${settings.companyName}</b><br>${branch.name}`)
            .openPopup();
        });

        mapInstance.current = map;
      })
      .catch((err) => {
        console.error('Leaflet initialization error:', err);
      });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      alert(t('contact_sent_alert'));
    }, 1000);
  };

  const waDigits = settings.phone.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${waDigits}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans antialiased text-slate-800">
      <MarketingPageShell className="gap-5 px-6 pb-8 pt-6 sm:gap-6 sm:px-6 sm:py-8">
        <RecruitmentBackButton onClick={() => navigate('/')} label={t('nav_home')} />

        <WizardHero showLogo title={t('contact_title')} subtitle={t('contact_desc')} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Contact info + map */}
          <WizardCard className="p-5 sm:p-7">
            <CardSectionHeader
              label={t('contact_badge')}
              title={t('contact_office')}
              subtitle={t('contact_office_sub')}
            />

            <div className="space-y-6">
              <ContactInfoRow icon={MapPin} title={t('contact_address')}>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      {t('contact_head_office')}
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap">{settings.headOfficeAddress}</p>
                  </div>
                  {settings.branches.map((branch) => (
                    <div key={branch.id}>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                        {branch.name}
                      </h4>
                      <p className="mt-1 whitespace-pre-wrap">{branch.address}</p>
                    </div>
                  ))}
                </div>
              </ContactInfoRow>

              <ContactInfoRow icon={Phone} title={t('contact_phone')}>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, '')}`}
                  className="font-semibold text-[#003087] transition hover:underline"
                >
                  {settings.phone}
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t('contact_whatsapp')}
                </a>
              </ContactInfoRow>

              <ContactInfoRow icon={Mail} title={t('contact_email')}>
                <a
                  href={`mailto:${settings.email}`}
                  className="break-all font-semibold text-[#003087] transition hover:underline"
                >
                  {settings.email}
                </a>
                {settings.website && (
                  <p className="mt-2 text-xs text-slate-500">
                    {t('contact_website')}:{' '}
                    <a
                      href={settings.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#003087] hover:underline"
                    >
                      {settings.website}
                    </a>
                  </p>
                )}
              </ContactInfoRow>
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-slate-100 shadow-sm ring-1 ring-slate-100/80">
              <div ref={mapRef} className="h-56 w-full sm:h-64" aria-label="Peta lokasi kantor" />
            </div>
          </WizardCard>

          {/* Contact form */}
          <WizardCard className="p-5 sm:p-7">
            <CardSectionHeader
              title={t('contact_form_title')}
              subtitle={t('contact_form_desc')}
            />

            <form onSubmit={handleSubmit} className="space-y-1">
              <Input
                label={t('contact_field_name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={FIELD_CLASS}
                required
              />
              <Input
                label={t('contact_email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={FIELD_CLASS}
                required
              />
              <Input
                label={t('contact_field_subject')}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={FIELD_CLASS}
                required
              />
              <TextArea
                label={t('contact_field_msg')}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={FIELD_CLASS}
                required
                rows={5}
              />

              <button
                type="submit"
                className={`${NAVY_BTN} mt-2 w-full`}
                style={{ backgroundColor: BRAND_NAVY }}
              >
                {t('contact_btn_send')}
              </button>
            </form>
          </WizardCard>
        </div>
      </MarketingPageShell>
    </div>
  );
};