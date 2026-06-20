import React from 'react';
import { Input, TextArea } from '../ui/Input';
import type { FormDataState } from '../../types/recruitment-form';
import type { FieldErrors } from '../../lib/recruitment-validation';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { StepHeader } from './recruitmentUi';

interface Props {
  formData: FormDataState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  fieldErrors?: FieldErrors;
}

export const StepContact: React.FC<Props> = ({ formData, onChange, setFormData, fieldErrors = {} }) => {
  const hasCoords = Boolean(formData.latitude && formData.longitude);

  const handleUseDefaultCoords = () => {
    setFormData((prev) => ({
      ...prev,
      latitude: prev.latitude || '-0.9489',
      longitude: prev.longitude || '119.8707',
    }));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <StepHeader
        step={2}
        title="Kontak & Alamat"
        subtitle="Pastikan email dan WhatsApp aktif — kami akan mengirim update status lamaran ke sini."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          required
          placeholder="nama@email.com"
          error={fieldErrors.email}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            WhatsApp <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              name="whatsappCountryCode"
              value={formData.whatsappCountryCode}
              onChange={onChange}
              className="mb-0 w-20"
              placeholder="+62"
              aria-label="Kode negara WhatsApp"
            />
            <Input
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={onChange}
              required
              inputMode="numeric"
              className="mb-0 flex-1"
              placeholder="8123456789"
              error={fieldErrors.whatsappNumber}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <h4 className="text-sm font-bold text-slate-800">Alamat Domisili</h4>
        <TextArea
          label="Alamat Lengkap"
          name="addressLine"
          value={formData.addressLine}
          onChange={onChange}
          required
          placeholder="Jalan, nomor rumah, patokan..."
          error={fieldErrors.addressLine}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Input
            label="Provinsi"
            name="provinsi"
            value={formData.provinsi}
            onChange={onChange}
            required
            error={fieldErrors.provinsi}
          />
          <Input
            label="Kabupaten/Kota"
            name="kabupaten"
            value={formData.kabupaten}
            onChange={onChange}
            required
            error={fieldErrors.kabupaten}
          />
          <Input
            label="Kecamatan"
            name="kecamatan"
            value={formData.kecamatan}
            onChange={onChange}
            required
            error={fieldErrors.kecamatan}
          />
          <Input
            label="Desa/Kelurahan"
            name="desa"
            value={formData.desa}
            onChange={onChange}
            required
            error={fieldErrors.desa}
          />
          <Input label="RT" name="rt" value={formData.rt} onChange={onChange} required placeholder="001" />
          <Input label="RW" name="rw" value={formData.rw} onChange={onChange} required placeholder="002" />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#003087]" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-800">Koordinat Lokasi (Opsional)</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {hasCoords
                  ? `Lat: ${formData.latitude}, Lng: ${formData.longitude}`
                  : 'Membantu tim HR memverifikasi domisili Anda.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUseDefaultCoords}
            className="shrink-0 rounded-lg border border-[#003087]/20 px-3 py-2 text-xs font-bold text-[#003087] transition hover:bg-blue-50"
          >
            {hasCoords ? 'Perbarui Koordinat' : 'Gunakan Lokasi Default'}
          </button>
        </div>
        {hasCoords && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              name="latitude"
              value={formData.latitude}
              onChange={onChange}
              className="mb-0"
            />
            <Input
              label="Longitude"
              name="longitude"
              value={formData.longitude}
              onChange={onChange}
              className="mb-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};