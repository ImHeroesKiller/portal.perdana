import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/candidate/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Selamat Datang, {user?.profile?.fullName || user?.username}</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau progres pendaftaran rekrutmen Anda di sini.</p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-lg mb-4 text-gray-900">Progres Lamaran</h2>
        {/* Mock progress UI */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
             <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">1</div>
             <p className="text-gray-800 font-medium">Data Terkirim</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
             <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">2</div>
             <p>Seleksi Dokumentasi</p>
          </div>
        </div>
      </div>
    </div>
  );
};
