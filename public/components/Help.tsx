
import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const Help: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white shadow rounded-lg p-8">
         <div className="flex items-center gap-4 mb-6 border-b pb-4">
            <div className="bg-blue-100 p-3 rounded-full">
                <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bantuan & Dukungan</h1>
                <p className="text-gray-500">Pusat bantuan PT Perdana Adi Yuda.</p>
            </div>
        </div>

        <div className="space-y-6">
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Bagaimana cara melamar?</h3>
                <p className="text-gray-600">
                    1. Buat akun atau masuk jika sudah mendaftar.<br/>
                    2. Lengkapi profil data diri Anda.<br/>
                    3. Pilih lowongan di halaman Beranda.<br/>
                    4. Klik "Lamar Sekarang" dan verifikasi data Anda.
                </p>
            </section>
             <section>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Lupa Password?</h3>
                <p className="text-gray-600">
                   Silakan hubungi admin HRD kami melalui WhatsApp di nomor 0858 9366 1683 untuk reset password manual.
                </p>
            </section>
        </div>
      </div>
    </div>
  );
};
