import React, { useEffect, useRef, useState } from 'react';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { Input, TextArea } from './ui/Input';
import { useLanguage } from '../services/i18n';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { SectionHeader } from './home/SectionHeader';
import {
  ContentCard,
  MarketingPageShell,
  PageHero,
  PageTopBar,
} from './layout/MarketingPageLayout';

declare const L: {
  map: (el: HTMLElement) => {
    setView: (coords: [number, number], zoom: number) => unknown;
    remove: () => void;
  };
  tileLayer: (url: string, opts: { attribution: string }) => { addTo: (map: unknown) => unknown };
  marker: (coords: [number, number]) => {
    addTo: (map: unknown) => { bindPopup: (html: string) => { openPopup: () => void } };
  };
};

export const Contact: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<{ remove: () => void } | null>(null);
  const { t } = useLanguage();
  const settings = useCompanySettings();

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const mainBranch = settings.branches[0] || { lat: -2.8227, lng: 122.1462 };

    try {
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

      mapInstance.current = map as { remove: () => void };
    } catch (err) {
      console.error('Leaflet initialization error:', err);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      alert(t('contact_sent_alert'));
    }, 1000);
  };

  const waLink = `https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <PageTopBar badge="Kontak & Bantuan" />

      <MarketingPageShell wide>
        <PageHero
          eyebrow="Hubungi Kami"
          title={t('contact_title')}
          subtitle={t('contact_desc')}
          compact
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ContentCard>
            <SectionHeader compact title={t('contact_office')} subtitle="Alamat, telepon, dan peta lokasi" />

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#003087]">
                  <MapPinIcon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('contact_address')}</h3>
                  <div className="mt-2 space-y-3 text-sm text-slate-600">
                    <div>
                      <h4 className="font-semibold text-slate-800">Kantor Pusat</h4>
                      <p className="whitespace-pre-wrap leading-relaxed">{settings.headOfficeAddress}</p>
                    </div>
                    {settings.branches.map((branch) => (
                      <div key={branch.id}>
                        <h4 className="font-semibold text-slate-800">{branch.name}</h4>
                        <p className="whitespace-pre-wrap leading-relaxed">{branch.address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#003087]">
                  <PhoneIcon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('contact_phone')}</h3>
                  <p className="mt-1 text-sm text-slate-600">{settings.phone}</p>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-[#003087] transition hover:underline"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden />
                    Chat WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#003087]">
                  <EnvelopeIcon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Email</h3>
                  <p className="mt-1 text-sm text-slate-600">{settings.email}</p>
                  {settings.website && (
                    <p className="mt-1 text-xs text-slate-500">
                      Website:{' '}
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
                </div>
              </div>
            </div>

            <div className="mt-6 h-56 overflow-hidden rounded-xl border border-slate-100 shadow-sm sm:h-64">
              <div ref={mapRef} className="h-full w-full" />
            </div>
          </ContentCard>

          <ContentCard>
            <SectionHeader
              compact
              title={t('contact_form_title')}
              subtitle={t('contact_form_desc')}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('contact_field_name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label={t('contact_field_subject')}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
              <TextArea
                label={t('contact_field_msg')}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
              />

              <button
                type="submit"
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#003087] text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-[0.98]"
              >
                {t('contact_btn_send')}
              </button>
            </form>
          </ContentCard>
        </div>
      </MarketingPageShell>
    </div>
  );
};