import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { login } from '../services/auth';
import { Input } from './ui/Input';
import { ArrowPathIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Autoprefs for role query
    const roleParam = searchParams.get('role');
    if (roleParam === 'admin') {
      setUsername('admin');
      setPassword('Perdana?2026');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(username, password);
      const redirectPath = searchParams.get('redirect');

      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/portal');
      }
    } catch (err: any) {
      setError(err.message || 'Username atau sandi Anda salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 bg-[#F8FAFC] antialiased font-sans">
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-10 rounded-3xl shadow-xs border border-slate-100 flex flex-col relative">
        
        {/* Elegant Back button at top left */}
        <button 
          onClick={() => navigate('/')} 
          className="self-start text-[#0056C6] hover:text-blue-800 transition-colors flex items-center gap-1 text-[11px] font-black active:scale-95 cursor-pointer"
          id="btn-back-login"
        >
          <ChevronLeftIcon className="h-4.5 w-4.5 stroke-[2.5]" />
          Kembali ke Beranda
        </button>

        <div className="text-center pt-2">
          {/* PT PAP Brand Icon placeholder */}
          <div className="flex justify-center mb-3">
            <img 
              src="/assets/logo.png" 
              alt="Perdana Logo" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Masuk ke Portal
          </h2>
          <p className="mt-2.5 text-[10px] text-slate-400 font-bold leading-relaxed max-w-sm mx-auto">
            Akses dashboard pelacakan lowongan kerja, riwayat absensi GPS, K3LH, slip gaji bulanan, dan tanda tangan kontrak digital.
          </p>
        </div>

        {/* Form elements */}
        <form className="mt-4 space-y-4 text-left" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-[10px] font-bold text-center border border-red-150 animate-pulse">
              {error}
            </div>
          )}
          
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 pl-1 tracking-wider">Username atau Email</label>
              <input
                type="text"
                required
                className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ketik email terdaftar atau 'admin'"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 pl-1 tracking-wider">Kata Sandi (Password)</label>
              <input
                type="password"
                required
                className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ketik sandi akun Anda"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 border border-transparent text-xs font-black rounded-2xl text-white bg-[#0056C6] hover:bg-blue-700 transition duration-150 shadow-sm flex justify-center items-center gap-2 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading && <ArrowPathIcon className="h-4 w-4 animate-spin text-white" />}
              {loading ? 'Sedang Memproses...' : 'Masuk dengan Sandi'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 font-bold leading-relaxed px-4">
          Jika ingin mendaftar, silakan pilih daftar lowongan kerja yang tersedia pada beranda.
        </p>

      </div>

        {/* DETAILED GOOGLE AUTH CHOOSER MODAL REMOVED */}

    </div>
  );
};
