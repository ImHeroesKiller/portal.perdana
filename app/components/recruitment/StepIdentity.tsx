import React from 'react';
import { Input, Select } from '../ui/Input';
import { FormDataState } from '../RecruitmentForm';
import { JobVacancy } from '../../types';
import { LocationSearch } from '../admin/shared/LocationSearch';

interface Props {
  formData: FormDataState;
  onChange: (e: React.ChangeEvent<any>) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  jobs: JobVacancy[];
}

const CERTS_LIST = [
  'SIM BII Umum (Aktif)',
  'SIO Kemnaker RI (Operator Alat Berat)',
  'Sertifikat Ahli K3 Umum (AK3U)',
  'Sertifikat POP ESDM (Pengawas Operasional)',
  'Sertifikat Basic Mechanic Course (BMC)',
  'Sertifikat Gada Pratama (Satpam Resmi)'
];

export const StepIdentity: React.FC<Props> = ({ formData, onChange, setFormData, jobs }) => {
  const currentCerts = formData.certifications ? formData.certifications.split(', ') : [];

  const handleCertCheckboxChange = (cert: string, checked: boolean) => {
    let updatedCerts = [...currentCerts];
    if (checked) {
      if (!updatedCerts.includes(cert)) {
        updatedCerts.push(cert);
      }
    } else {
      updatedCerts = updatedCerts.filter(c => c !== cert);
    }
    
    const certString = updatedCerts.join(', ');
    setFormData(prev => ({
      ...prev,
      certifications: certString,
      // Automatically synchronise or append to general credentials
      skills: prev.skills 
        ? (prev.skills.includes(certString) ? prev.skills : `${prev.skills}, ${certString}`) 
        : certString
    }));
  };

  const handleCustomRadioSelect = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-850">
      <div className="border-b pb-3 mb-6">
        <h3 className="text-xl font-bold text-slate-800">Langkah 1: Identitas Diri</h3>
        <p className="text-sm text-gray-500">Silakan melengkapi form identitas dengan teliti untuk audit validasi rekrutmen.</p>
      </div>

      {/* 1. Drop Down Pilihan Posisi yang Dilamar */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <Select 
          label="Posisi yang Dilamar (Pilihan Dropdown)" 
          name="positionApplied" 
          value={formData.positionApplied} 
          onChange={onChange} 
          required 
          options={jobs.map(j => ({ value: j.title, label: `${j.title} - Penempatan ${j.location}` }))} 
        />
      </div>

      {/* Personal Identity Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nama Lengkap" name="fullName" value={formData.fullName} onChange={onChange} required placeholder="Sesuai KTP" />
        <Input label="NIK (Nomor Induk Kependudukan)" name="nik" value={formData.nik} onChange={onChange} required maxLength={16} placeholder="16 digit angka kartu identitas" />
        <Input label="Nomor Kartu Keluarga (KK)" name="kkNumber" value={formData.kkNumber} onChange={onChange} required maxLength={16} placeholder="16 digit angka KK" />
        <Input label="NPWP (Opsional)" name="npwp" value={formData.npwp} onChange={onChange} placeholder="Format: XX.XXX.XXX.X-XXX.XXX" />
        
        <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tempat Lahir</label>
            <LocationSearch 
                value={formData.placeOfBirth} 
                onChange={(val) => setFormData(prev => ({ ...prev, placeOfBirth: val }))} 
                placeholder="Cari Kota/Kabupaten Lahir..."
            />
        </div>

        <Input label="Tanggal Lahir" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={onChange} required />
      </div>


      {/* 3. Bullet List (Styled Radio Option Buttons) for Gender, Marital Status & Relocation */}
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-6">
        
        {/* Gender Bullet Choices */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Gender (Bullet List / Pilihan Tunggal)</label>
          <div className="flex flex-wrap gap-4">
            {['Laki-laki', 'Perempuan'].map((g) => {
              const selected = formData.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleCustomRadioSelect('gender', g)}
                  className={`flex items-center gap-3 px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                    selected 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selected ? 'border-white bg-white' : 'border-gray-400 bg-gray-100'}`}>
                    {selected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </span>
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Marital Status Bullet Choices */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Status Pernikahan (Bullet List / Pilihan Tunggal)</label>
          <div className="flex flex-wrap gap-4">
            {['Belum Menikah', 'Menikah', 'Cerai'].map((s) => {
              const selected = formData.maritalStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleCustomRadioSelect('maritalStatus', s)}
                  className={`flex items-center gap-3 px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                    selected 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selected ? 'border-white bg-white' : 'border-gray-400 bg-gray-100'}`}>
                    {selected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </span>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Religion Selection using Drop Down */}
        <div>
          <Select 
            label="Agama (Pilihan Dropdown)" 
            name="religion" 
            value={formData.religion} 
            onChange={onChange} 
            required 
            options={[
              { value: 'Islam', label: 'Islam' },
              { value: 'Kristen Protestan', label: 'Kristen Protestan' },
              { value: 'Katholik', label: 'Katholik' },
              { value: 'Hindu', label: 'Hindu' },
              { value: 'Buddha', label: 'Buddha' },
              { value: 'Konghucu', label: 'Konghucu' }
            ]} 
          />
        </div>

        {/* Relocation Preference Bullet Choices */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Apakah Anda bersedia diposisikan / dipindahtugaskan ke site proyek mana pun di Sulawesi Tengah? (Pilihan Bullet)
          </label>
          <div className="flex flex-wrap gap-4">
            {['Ya, saya bersedia penuh', 'Hanya site yang saya pilih', 'Tidak bersedia'].map((opt) => {
              const selected = formData.willingToRelocate === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleCustomRadioSelect('willingToRelocate', opt)}
                  className={`flex items-center gap-3 px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                    selected 
                      ? 'bg-blue-650 border-blue-600 bg-blue-700 text-white shadow-md' 
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selected ? 'border-white bg-white' : 'border-blue-650'}`}>
                    {selected && <span className="w-1.5 h-1.5 rounded-full bg-blue-650 bg-blue-800" />}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Check List (Multiple Choice Checkbox List) for Certifications & Licenses */}
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
        <label className="block text-sm font-bold text-slate-800 mb-1">
          Sertifikasi & Lisensi Resmi Khusus
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {CERTS_LIST.map((cert) => {
            const isChecked = currentCerts.includes(cert);
            return (
              <label 
                key={cert} 
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                  isChecked 
                    ? 'bg-green-50 border-green-500 text-green-900 shadow-sm' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCertCheckboxChange(cert, e.target.checked)}
                  className="rounded text-green-600 border-gray-300 focus:ring-green-500 h-4.5 w-4.5 mr-3"
                />
                <span className="text-xs font-semibold">{cert}</span>
              </label>
            );
          })}
        </div>
        <Input label="Sertifikasi Lainnya (Opsional)" name="customCertifications" value={formData.customCertifications} onChange={onChange} placeholder="Masukkan sertifikasi lainnya jika ada..." />
      </div>

    </div>
  );
};
