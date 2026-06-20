import React from 'react';
import { Input, Select } from '../ui/Input';
import type { FormDataState } from '../../types/recruitment-form';
import type { FieldErrors } from '../../lib/recruitment-validation';
import { JobVacancy } from '../../types';
import { LocationSearch } from '../admin/shared/LocationSearch';
import { ChoicePill, StepHeader } from './recruitmentUi';

interface Props {
  formData: FormDataState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  jobs: JobVacancy[];
  fieldErrors?: FieldErrors;
}

const CERTS_LIST = [
  'SIM BII Umum (Aktif)',
  'SIO Kemnaker RI (Operator Alat Berat)',
  'Sertifikat Ahli K3 Umum (AK3U)',
  'Sertifikat POP ESDM (Pengawas Operasional)',
  'Sertifikat Basic Mechanic Course (BMC)',
  'Sertifikat Gada Pratama (Satpam Resmi)',
];

function FieldHint({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs font-medium text-red-500" role="alert">{error}</p>;
}

export const StepIdentity: React.FC<Props> = ({ formData, onChange, setFormData, jobs, fieldErrors = {} }) => {
  const currentCerts = formData.certifications ? formData.certifications.split(', ') : [];

  const handleCertCheckboxChange = (cert: string, checked: boolean) => {
    let updatedCerts = [...currentCerts];
    if (checked) {
      if (!updatedCerts.includes(cert)) updatedCerts.push(cert);
    } else {
      updatedCerts = updatedCerts.filter((c) => c !== cert);
    }

    const certString = updatedCerts.join(', ');
    setFormData((prev) => ({
      ...prev,
      certifications: certString,
      skills: prev.skills
        ? prev.skills.includes(certString)
          ? prev.skills
          : `${prev.skills}, ${certString}`
        : certString,
    }));
  };

  const handleCustomRadioSelect = (name: keyof FormDataState, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="animate-fade-in space-y-6 text-slate-800">
      <StepHeader
        step={1}
        title="Identitas Diri"
        subtitle="Lengkapi data identitas sesuai KTP untuk proses validasi rekrutmen."
      />

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <Select
          label="Posisi yang Dilamar"
          name="positionApplied"
          value={formData.positionApplied}
          onChange={onChange}
          required
          error={fieldErrors.positionApplied}
          options={jobs.map((j) => ({
            value: j.title,
            label: `${j.title} — ${j.location}`,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Nama Lengkap"
          name="fullName"
          value={formData.fullName}
          onChange={onChange}
          required
          placeholder="Sesuai KTP"
          error={fieldErrors.fullName}
        />
        <Input
          label="NIK (Nomor Induk Kependudukan)"
          name="nik"
          value={formData.nik}
          onChange={onChange}
          required
          maxLength={16}
          inputMode="numeric"
          placeholder="16 digit angka"
          error={fieldErrors.nik}
        />
        <Input
          label="Nomor Kartu Keluarga (KK)"
          name="kkNumber"
          value={formData.kkNumber}
          onChange={onChange}
          required
          maxLength={16}
          inputMode="numeric"
          placeholder="16 digit angka"
          error={fieldErrors.kkNumber}
        />
        <Input
          label="NPWP (Opsional)"
          name="npwp"
          value={formData.npwp}
          onChange={onChange}
          placeholder="XX.XXX.XXX.X-XXX.XXX"
          error={fieldErrors.npwp}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Tempat Lahir <span className="text-red-500">*</span>
          </label>
          <LocationSearch
            value={formData.placeOfBirth}
            onChange={(val) => setFormData((prev) => ({ ...prev, placeOfBirth: val }))}
            placeholder="Cari kota/kabupaten lahir..."
          />
          <FieldHint error={fieldErrors.placeOfBirth} />
        </div>

        <Input
          label="Tanggal Lahir"
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={onChange}
          required
          error={fieldErrors.dateOfBirth}
        />
      </div>

      <div className="space-y-6 rounded-xl border border-slate-100 bg-slate-50/80 p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Jenis Kelamin</label>
          <div className="flex flex-wrap gap-3">
            {['Laki-laki', 'Perempuan'].map((g) => (
              <ChoicePill
                key={g}
                label={g}
                selected={formData.gender === g}
                onClick={() => handleCustomRadioSelect('gender', g)}
              />
            ))}
          </div>
          <FieldHint error={fieldErrors.gender} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Status Pernikahan</label>
          <div className="flex flex-wrap gap-3">
            {['Belum Menikah', 'Menikah', 'Cerai'].map((s) => (
              <ChoicePill
                key={s}
                label={s}
                selected={formData.maritalStatus === s}
                onClick={() => handleCustomRadioSelect('maritalStatus', s)}
              />
            ))}
          </div>
          <FieldHint error={fieldErrors.maritalStatus} />
        </div>

        <Select
          label="Agama"
          name="religion"
          value={formData.religion}
          onChange={onChange}
          required
          error={fieldErrors.religion}
          options={[
            { value: 'Islam', label: 'Islam' },
            { value: 'Kristen Protestan', label: 'Kristen Protestan' },
            { value: 'Katholik', label: 'Katholik' },
            { value: 'Hindu', label: 'Hindu' },
            { value: 'Buddha', label: 'Buddha' },
            { value: 'Konghucu', label: 'Konghucu' },
          ]}
        />

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Bersedia diposisikan ke site proyek di Sulawesi Tengah?
          </label>
          <div className="flex flex-wrap gap-3">
            {['Ya, saya bersedia penuh', 'Hanya site yang saya pilih', 'Tidak bersedia'].map((opt) => (
              <ChoicePill
                key={opt}
                label={opt}
                selected={formData.willingToRelocate === opt}
                onClick={() => handleCustomRadioSelect('willingToRelocate', opt)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-5">
        <label className="mb-3 block text-sm font-bold text-slate-800">Sertifikasi & Lisensi Resmi</label>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {CERTS_LIST.map((cert) => {
            const isChecked = currentCerts.includes(cert);
            return (
              <label
                key={cert}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition ${
                  isChecked
                    ? 'border-[#003087]/30 bg-blue-50/60 text-[#003087] shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCertCheckboxChange(cert, e.target.checked)}
                  className="mr-3 h-4 w-4 rounded border-slate-300 text-[#003087] focus:ring-[#003087]"
                />
                <span className="text-xs font-semibold">{cert}</span>
              </label>
            );
          })}
        </div>
        <Input
          label="Sertifikasi Lainnya (Opsional)"
          name="customCertifications"
          value={formData.customCertifications}
          onChange={onChange}
          placeholder="Masukkan sertifikasi lain jika ada..."
        />
      </div>
    </div>
  );
};