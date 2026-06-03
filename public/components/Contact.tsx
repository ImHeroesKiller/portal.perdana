
import React, { useEffect, useRef, useState } from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Input, TextArea } from './ui/Input';
import { useLanguage } from '../services/i18n';

// Declare Leaflet global
declare const L: any;

export const Contact: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const { t } = useLanguage();

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
        // Koordinat Palu, Sulawesi Tengah (Approximate)
        const lat = -0.900600;
        const lng = 119.830700;

        const map = L.map(mapRef.current).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lng]).addTo(map)
            .bindPopup('<b>PT Perdana Adi Yuda</b><br>Kantor Perwakilan Palu')
            .openPopup();

        mapInstance.current = map;
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending
    setTimeout(() => {
        setSent(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        alert(t('contact_sent_alert'));
    }, 1000);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-blue-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-extrabold text-white">{t('contact_title')}</h1>
              <p className="mt-4 text-xl text-blue-200">
                  {t('contact_desc')}
              </p>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            
            {/* Contact Info & Map */}
            <div className="p-8 bg-blue-50">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('contact_office')}</h2>
                
                <div className="space-y-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                            <MapPinIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">{t('contact_address')}</h3>
                            <div className="space-y-3 text-sm text-gray-600">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Kantor Pusat:</h4>
                                    <p>
                                        Plaza Summarecon Bekasi Lt. 7<br/>
                                        Jl. Bulevar Ahmad Yani, Marga Mulya<br/>
                                        Bekasi Utara, Kota Bekasi - 17142
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Kantor Cabang / Perwakilan Palu:</h4>
                                    <p>
                                        Jl. Wolter Monginsidi No. 45, Palu Selatan<br/>
                                        Kota Palu, Sulawesi Tengah - 94111
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                         <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                            <PhoneIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('contact_phone')}</h3>
                            <p className="text-gray-600 text-sm mt-1">0858 9366 1683</p>
                            <a href="https://wa.me/6285893661683" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1 mt-1">
                                <ChatBubbleLeftRightIcon className="h-4 w-4"/> Chat WhatsApp
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                         <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                            <EnvelopeIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Email</h3>
                            <p className="text-gray-600 text-sm mt-1">info@perada.net</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm h-64 w-full relative z-0">
                    <div ref={mapRef} className="h-full w-full"></div>
                </div>
            </div>

            {/* Contact Form */}
            <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('contact_form_title')}</h2>
                <p className="text-gray-500 mb-6">{t('contact_form_desc')}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label={t('contact_field_name')} 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        required 
                    />
                    <Input 
                        label="Email" 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    <Input 
                        label={t('contact_field_subject')} 
                        value={formData.subject} 
                        onChange={e => setFormData({...formData, subject: e.target.value})} 
                        required 
                    />
                    <TextArea 
                        label={t('contact_field_msg')} 
                        value={formData.message} 
                        onChange={e => setFormData({...formData, message: e.target.value})} 
                        required 
                        rows={5}
                    />
                    
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
                    >
                        {t('contact_btn_send')}
                    </button>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};
