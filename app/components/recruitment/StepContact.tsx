
import React, { useState, useRef, useEffect } from 'react';
import { Input, TextArea } from '../ui/Input';
import { FormDataState } from '../RecruitmentForm';
import { ChatBubbleOvalLeftEllipsisIcon, MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { checkTelegramUpdatesForUser, getBotInfo } from '../../services/telegram';

// Declare Leaflet global
declare const L: any;

interface Props {
    formData: FormDataState;
    onChange: (e: React.ChangeEvent<any>) => void;
    setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
}

export const StepContact: React.FC<Props> = ({ formData, onChange, setFormData }) => {
    
    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Langkah 2: Kontak</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</label>
                    <Input name="email" value={formData.email} onChange={onChange} required />
                </div>

                <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">WhatsApp</label>
                    <div className="flex gap-2">
                        <Input name="whatsappCountryCode" value={formData.whatsappCountryCode} onChange={onChange} className="w-16" />
                        <Input name="whatsappNumber" value={formData.whatsappNumber} onChange={onChange} required className="flex-1" />
                    </div>
                </div>
            </div>

            <div className="space-y-2 border-t pt-4">
                <h4 className="font-bold text-sm text-gray-800">Alamat Domisili</h4>
                <TextArea label="Alamat Lengkap" name="addressLine" value={formData.addressLine} onChange={onChange} required />
                <div className="grid grid-cols-2 gap-2">
                    <Input label="Provinsi" name="provinsi" value={formData.provinsi} onChange={onChange} required />
                    <Input label="Kabupaten/Kota" name="kabupaten" value={formData.kabupaten} onChange={onChange} required />
                    <Input label="Kecamatan" name="kecamatan" value={formData.kecamatan} onChange={onChange} required />
                    <Input label="Desa/Kelurahan" name="desa" value={formData.desa} onChange={onChange} required />
                    <Input label="RT" name="rt" value={formData.rt} onChange={onChange} required />
                    <Input label="RW" name="rw" value={formData.rw} onChange={onChange} required />
                </div>
            </div>

            {/* Map Placeholder */}
            <button 
                type="button" 
                onClick={() => alert('Peta akan dibuka untuk memilih lokasi Anda.')}
                className="w-full bg-slate-100 h-40 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
             >
                <MapPinIcon className="h-8 w-8 text-slate-400" />
                <span className="text-sm text-slate-500 mt-2">Klik untuk atur koordinat lokasi di peta</span>
            </button>
        </div>
    );
};
