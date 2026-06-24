import React from 'react';
import { Input, Select, TextArea } from '../ui/Input';
import type { FormDataState } from '../../types/recruitment-form';
import type { FieldErrors } from '../../lib/recruitment-validation';
import { StepHeader } from './recruitmentUi';
import {
  BANK_OPTIONS,
  EDUCATION_OPTIONS,
  EMERGENCY_RELATION_OPTIONS,
} from '../../lib/recruitment-field-options';

interface Props {
  formData: FormDataState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  fieldErrors?: FieldErrors;
}

export const StepProfessional: React.FC<Props> = ({ formData, onChange, fieldErrors = {} }) => (
  <div className="animate-fade-in space-y-6">
    <StepHeader
      step={3}
      title="Profesional & Data Tambahan"
      subtitle="Riwayat pendidikan, keahlian, perbankan, dan kontak darurat."
    />

    <section>
      <h4 className="mb-3 text-sm font-black text-slate-900">Pendidikan Terakhir</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Jenjang"
          name="lastEducation"
          value={formData.lastEducation}
          onChange={onChange}
          required
          error={fieldErrors.lastEducation}
          options={EDUCATION_OPTIONS.map((j) => ({ value: j, label: j }))}
        />
        <Input
          label="Institusi"
          name="institutionName"
          value={formData.institutionName}
          onChange={onChange}
          required
          error={fieldErrors.institutionName}
        />
        <Input
          label="Jurusan"
          name="major"
          value={formData.major}
          onChange={onChange}
          required
          error={fieldErrors.major}
        />
        <Input
          label="Tahun Lulus"
          name="graduationYear"
          type="number"
          value={formData.graduationYear}
          onChange={onChange}
          required
          min={1960}
          max={new Date().getFullYear() + 5}
          error={fieldErrors.graduationYear}
        />
      </div>
    </section>

    <section className="border-t border-slate-100 pt-4">
      <h4 className="mb-3 text-sm font-black text-slate-900">Data Perbankan</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Bank Utama"
          name="bankName"
          value={formData.bankName}
          onChange={onChange}
          required
          error={fieldErrors.bankName}
          options={BANK_OPTIONS.map((b) => ({
            value: b,
            label: b === 'Lainnya' ? 'Lainnya (Ada Biaya Transfer)' : b,
          }))}
        />
        <Input
          label="Nomor Rekening"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={onChange}
          required
          inputMode="numeric"
          error={fieldErrors.accountNumber}
        />
      </div>
    </section>

    <section className="border-t border-slate-100 pt-4">
      <h4 className="mb-3 text-sm font-black text-slate-900">Kontak Darurat</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Nama Kontak"
          name="emergencyName"
          value={formData.emergencyName}
          onChange={onChange}
          required
          error={fieldErrors.emergencyName}
        />
        <Select
          label="Hubungan"
          name="emergencyRelation"
          value={formData.emergencyRelation}
          onChange={onChange}
          required
          error={fieldErrors.emergencyRelation}
          options={EMERGENCY_RELATION_OPTIONS.map((r) => ({ value: r, label: r }))}
        />
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nomor Telepon Darurat <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              name="emergencyCountryCode"
              value={formData.emergencyCountryCode}
              onChange={onChange}
              className="mb-0 w-20"
              placeholder="+62"
              aria-label="Kode negara kontak darurat"
            />
            <Input
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={onChange}
              required
              inputMode="numeric"
              className="mb-0 flex-1"
              placeholder="8123456789"
              error={fieldErrors.emergencyPhone}
            />
          </div>
        </div>
      </div>
    </section>

    <TextArea
      label="Keahlian (Skill)"
      name="skills"
      value={formData.skills}
      onChange={onChange}
      required
      placeholder="Contoh: Excel, mengemudi, operator alat berat..."
      error={fieldErrors.skills}
    />
    <TextArea
      label="Riwayat Kerja"
      name="workExperience"
      value={formData.workExperience}
      onChange={onChange}
      required
      rows={3}
      placeholder="Perusahaan — Posisi — Tahun"
    />
  </div>
);