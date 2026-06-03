
import React from 'react';
import { Input, Select, TextArea } from '../ui/Input';
import { FormDataState } from '../RecruitmentForm';

interface Props {
    formData: FormDataState;
    onChange: (e: React.ChangeEvent<any>) => void;
}

export const StepProfessional: React.FC<Props> = ({ formData, onChange }) => (
    <div className="space-y-4 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Langkah 3: Profesional & Data Tambahan</h3>
        
        <h4 className="font-bold text-gray-700">Pendidikan Terakhir</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Jenjang" name="lastEducation" value={formData.lastEducation} onChange={onChange} required options={['SMP', 'SMA/SMK', 'Diploma', 'D3', 'S1', 'S2', 'S3'].map(j => ({value: j, label: j}))} />
            <Input label="Institusi" name="institutionName" value={formData.institutionName} onChange={onChange} required />
            <Input label="Jurusan" name="major" value={formData.major} onChange={onChange} required />
            <Input label="Tahun Lulus" name="graduationYear" type="number" value={formData.graduationYear} onChange={onChange} required />
        </div>
        
        <h4 className="font-bold text-gray-700 pt-4 border-t">Data Perbankan</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Bank Utama" name="bankName" value={formData.bankName} onChange={onChange} required options={[{value:'Mandiri', label:'Mandiri'}, {value:'BCA', label:'BCA'}, {value:'Lainnya', label:'Lainnya (Ada Biaya Transfer)'}]} />
            <Input label="Nomor Rekening" name="accountNumber" value={formData.accountNumber} onChange={onChange} required />
        </div>

        <h4 className="font-bold text-gray-700 pt-4 border-t">Kontak Darurat</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Kontak" name="emergencyName" value={formData.emergencyName} onChange={onChange} required />
            <Select label="Hubungan" name="emergencyRelation" value={formData.emergencyRelation} onChange={onChange} required options={[{value:'Orang Tua', label:'Orang Tua'}, {value:'Pasangan', label:'Pasangan'}, {value:'Saudara', label:'Saudara'}, {value:'Teman', label:'Teman'}]} />
            <div className="flex gap-2">
                <Input name="emergencyCountryCode" value={formData.emergencyCountryCode} onChange={onChange} className="w-16" />
                <Input name="emergencyPhone" value={formData.emergencyPhone} onChange={onChange} required className="flex-1" />
            </div>
        </div>
        
        <TextArea label="Keahlian (Skill)" name="skills" value={formData.skills} onChange={onChange} required placeholder="Contoh: Excel, Menyetir, dll" />
        <TextArea label="Riwayat Kerja" name="workExperience" value={formData.workExperience} onChange={onChange} required rows={3} placeholder="Perusahaan - Posisi - Tahun" />
    </div>
);
