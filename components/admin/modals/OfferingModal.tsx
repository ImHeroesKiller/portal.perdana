
import React, { useState } from 'react';
import { OfferingDetails } from '../../../types';
import { Input, TextArea } from '../../ui/Input';

interface Props {
    onSave: (data: OfferingDetails) => void;
    onCancel: () => void;
}

export const OfferingModal: React.FC<Props> = ({ onSave, onCancel }) => {
    const [data, setData] = useState<OfferingDetails>({
        salary: '',
        allowance: '',
        benefits: 'BPJS Kesehatan, BPJS Ketenagakerjaan',
        startDate: '',
        placementLocation: '',
        picPerdana: '',
        picClient: '',
        contractDuration: '12 Bulan',
        sentAt: new Date().toISOString(),
        status: 'PENDING'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b bg-orange-50">
                    <h2 className="text-xl font-bold text-orange-900">Buat Offering Letter</h2>
                    <p className="text-sm text-orange-700">Formulir ini akan dikirimkan sebagai email penawaran resmi.</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Gaji Pokok (Rp)" type="number" value={data.salary} onChange={e => setData({...data, salary: e.target.value})} required placeholder="Ex: 5000000" />
                        <Input label="Tunjangan Tetap (Rp)" type="number" value={data.allowance} onChange={e => setData({...data, allowance: e.target.value})} placeholder="Ex: 500000" />
                    </div>
                    <TextArea label="Benefit & Fasilitas" value={data.benefits} onChange={e => setData({...data, benefits: e.target.value})} required placeholder="BPJS, Asuransi, Laptop, dll" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Durasi Kontrak" value={data.contractDuration} onChange={e => setData({...data, contractDuration: e.target.value})} required />
                        <Input label="Tanggal Mulai (Onboard)" type="date" value={data.startDate} onChange={e => setData({...data, startDate: e.target.value})} required />
                    </div>
                    <Input label="Lokasi Penempatan" value={data.placementLocation} onChange={e => setData({...data, placementLocation: e.target.value})} required />
                    
                    <div className="border-t pt-4 mt-2">
                        <h4 className="font-bold mb-2 text-sm text-gray-700">Person In Charge (PIC)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="PIC Perdana" value={data.picPerdana} onChange={e => setData({...data, picPerdana: e.target.value})} required />
                            <Input label="PIC Klien (User)" value={data.picClient} onChange={e => setData({...data, picClient: e.target.value})} required />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">Batal</button>
                        <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Kirim Offering Letter</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
