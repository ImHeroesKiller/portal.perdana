
import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export const Settings: React.FC = () => {
    const [emailNotif, setEmailNotif] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const pref = localStorage.getItem('pt_perdana_prefs');
        if (pref) {
            setEmailNotif(JSON.parse(pref).emailNotif);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('pt_perdana_prefs', JSON.stringify({ emailNotif }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex items-center gap-4 mb-6 border-b pb-4">
            <div className="bg-gray-100 p-3 rounded-full">
                <Cog6ToothIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
                <p className="text-gray-500">Kelola preferensi akun dan aplikasi Anda.</p>
            </div>
        </div>
        
        <div className="space-y-6">
            <div className="p-4 border border-gray-200 rounded bg-gray-50">
                <h3 className="font-medium text-gray-900">Notifikasi</h3>
                <p className="text-sm text-gray-500 mb-4">Atur bagaimana Anda menerima pembaruan tentang lamaran.</p>
                <div className="flex items-center gap-2">
                     <input 
                        type="checkbox" 
                        id="emailNotif"
                        checked={emailNotif} 
                        onChange={e => setEmailNotif(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded" 
                     />
                     <label htmlFor="emailNotif" className="text-sm text-gray-700 cursor-pointer">Terima notifikasi via Email</label>
                </div>
            </div>
            <div className="p-4 border border-gray-200 rounded bg-gray-50">
                <h3 className="font-medium text-gray-900">Keamanan</h3>
                <p className="text-sm text-gray-500 mb-4">Ubah kata sandi atau atur otentikasi dua faktor.</p>
                <button className="text-sm text-blue-600 hover:underline">Ubah Password</button>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                    {saved ? 'Tersimpan!' : 'Simpan Perubahan'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
