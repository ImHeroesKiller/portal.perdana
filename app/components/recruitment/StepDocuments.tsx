
import React from 'react';
import { Input } from '../ui/Input';
import { FormDataState, FileState } from '../RecruitmentForm';

interface Props {
    formData: FormDataState;
    onChange: (e: React.ChangeEvent<any>) => void;
    files: FileState;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof FileState) => void;
}

export const StepDocuments: React.FC<Props> = ({ formData, onChange, files, onFileChange }) => (
    <div className="space-y-4 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Langkah 4: Data Pendukung & Dokumen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Bank" name="bankName" value={formData.bankName} onChange={onChange} required />
            <Input label="No. Rekening" name="accountNumber" value={formData.accountNumber} onChange={onChange} required />
        </div>
        
        <div className="border-t pt-4">
            <h4 className="font-bold text-gray-700 mb-2">Kontak Darurat</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Nama" name="emergencyName" value={formData.emergencyName} onChange={onChange} required />
                <Input label="Hubungan" name="emergencyRelation" value={formData.emergencyRelation} onChange={onChange} required />
                <Input label="No Telp" name="emergencyPhone" value={formData.emergencyPhone} onChange={onChange} required />
            </div>
        </div>

        <div className="border-t pt-4">
             <h4 className="font-bold text-gray-700 mb-2">Unggah Dokumen (Max 5MB)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileInput label="Surat Lamaran" onChange={e => onFileChange(e, 'applicationLetter')} required />
                <FileInput label="CV / Resume" onChange={e => onFileChange(e, 'cv')} required />
                <FileInput label="KTP" onChange={e => onFileChange(e, 'ktp')} required />
                <FileInput label="KK" onChange={e => onFileChange(e, 'kk')} required />
                <FileInput label="Ijazah" onChange={e => onFileChange(e, 'diploma')} required />
                <FileInput label="Foto Diri" onChange={e => onFileChange(e, 'photo')} required />
             </div>
        </div>
    </div>
);

const FileInput = ({ label, onChange, required }: any) => {
    const id = React.useId();
    return (
        <div className="border border-gray-300 rounded p-4">
            <label htmlFor={id} className="block text-sm font-medium mb-1">{label} {required && '*'}</label>
            <input id={id} type="file" onChange={onChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700" />
        </div>
    )
}
