import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { register, loginWithGoogleMock } from '../services/auth';
import { saveRegistrationCandidate } from '../src/services/candidateService';
import { Input } from './ui/Input';
import { ArrowPathIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Google OAuth simulator states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Sandi konfirmasi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const user = await register({
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      await saveRegistrationCandidate(user.id, formData.email, formData.phone);
      navigate('/portal');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar akun baru.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelector = async (email: string) => {
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogleMock(email, formData.phone || '08123456789');
      await saveRegistrationCandidate(user.id, email, formData.phone || '08123456789');
      setShowGoogleModal(false);
      navigate('/portal');
    } catch (err) {
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 bg-[#F8FAFC] antialiased font-sans">
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-10 rounded-3xl shadow-xs border border-slate-100 flex flex-col relative">
        
        {/* Elegant Back button at top left */}
        <button 
          onClick={() => navigate('/')} 
          className="self-start text-[#0056C6] hover:text-blue-800 transition-colors flex items-center gap-1 text-[11px] font-black active:scale-95 cursor-pointer"
          id="btn-back-register"
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
            Daftar Akun Baru
          </h2>
          <p className="mt-2 text-[10px] text-slate-450 font-bold leading-normal">
            Sudah punya akun? <Link to="/login" className="font-extrabold text-[#0056C6] hover:underline">Masuk disini</Link>
          </p>
        </div>

        {/* Form Elements */}
        <form className="mt-4 space-y-4 text-left" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-[10px] font-bold text-center border border-red-150 animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 pl-1 tracking-wider">Alamat Email (Akun)</label>
              <input
                type="email"
                name="email"
                required
                className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama.anda@gmail.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 pl-1 tracking-wider font-sans">Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white font-mono"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08xxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 pl-1 tracking-wider">Kata Sandi (Password)</label>
              <input
                type="password"
                name="password"
                required
                className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ketik kata sandi minimal 6 karakter"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 pl-1 tracking-wider">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ketik ulang kata sandi Anda"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`w-full py-3.5 px-4 border border-transparent text-xs font-black rounded-2xl text-white bg-[#0056C6] hover:bg-blue-700 transition duration-150 shadow-sm flex justify-center items-center gap-2 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading && <ArrowPathIcon className="h-4 w-4 animate-spin text-white" />}
              {loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-4 select-none">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold">
            <span className="px-3.5 bg-white text-slate-400">Atau daftar instan</span>
          </div>
        </div>

        {/* Google Launcher option */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => setShowGoogleModal(true)}
            className={`w-full py-3.5 px-4 border border-slate-150 rounded-2xl text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-xs flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer ${googleLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {googleLoading ? (
              <ArrowPathIcon className="h-4.5 w-4.5 animate-spin text-slate-400" />
            ) : (
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? 'Menghubungkan Akun...' : 'Daftar / Masuk Instan dengan Akun Google'}
          </button>
        </div>

      </div>

      {/* REGISTRATION GOOGLE AUTH CHOOSER MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" id="google-modal-screen">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-fade-in-down">
            
            {/* Google Selector header */}
            <div className="p-6 text-center border-b border-slate-100 space-y-1 bg-[#F8FAFC]">
              <div className="flex justify-center gap-1 mb-1.5">
                <span className="text-2xl font-black font-sans text-[#4285F4]">G</span>
                <span className="text-2xl font-black font-sans text-[#EA4335]">o</span>
                <span className="text-2xl font-black font-sans text-[#FBBC05]">o</span>
                <span className="text-2xl font-black font-sans text-[#4285F4]">g</span>
                <span className="text-2xl font-black font-sans text-[#34A853]">l</span>
                <span className="text-2xl font-black font-sans text-[#EA4335]">e</span>
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Pilih akun Google Anda</h3>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                untuk mendaftar / masuk ke PT Perdana Adi Yuda Portal
              </p>
            </div>

            {/* Mock options */}
            <div className="p-4 space-y-2.5 max-h-60 overflow-y-auto">
              
              {/* Option 1: Andi Pratama */}
              <button 
                type="button"
                onClick={() => handleGoogleSelector('andi.pratama@gmail.com')}
                className="w-full p-3 rounded-2xl border border-slate-150 hover:bg-blue-50/20 hover:border-blue-500 transition-all flex items-center gap-3 text-left cursor-pointer"
              >
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" 
                  alt="Andi" 
                  className="h-10 w-10 rounded-full border border-slate-100 object-cover" 
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-900 leading-tight">Andi Pratama</h4>
                  <p className="text-[10px] text-slate-450 font-medium font-mono truncate">andi.pratama@gmail.com</p>
                  <span className="inline-block text-[8px] bg-green-150 text-green-800 font-bold px-2 py-0.5 rounded-md mt-1.5 uppercase tracking-wide">KARYAWAN AKTIF</span>
                </div>
              </button>

              {/* Option 2: Siti Aminah */}
              <button 
                type="button"
                onClick={() => handleGoogleSelector('siti.aminah@gmail.com')}
                className="w-full p-3 rounded-2xl border border-slate-150 hover:bg-blue-50/20 hover:border-blue-500 transition-all flex items-center gap-3 text-left cursor-pointer"
              >
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" 
                  alt="Siti" 
                  className="h-10 w-10 rounded-full border border-slate-100 object-cover" 
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-900 leading-tight">Siti Aminah</h4>
                  <p className="text-[10px] text-slate-450 font-medium font-mono truncate">siti.aminah@gmail.com</p>
                  <span className="inline-block text-[8px] bg-amber-150 text-amber-800 font-bold px-2 py-0.5 rounded-md mt-1.5 uppercase tracking-wide">KANDIDAT SELEKSI</span>
                </div>
              </button>

            </div>

            {/* Custom inputs */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2.5">
              <label className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Daftar dengan alamat Gmail Anda:</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="nama.anda@gmail.com"
                  className="flex-1 text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (customGoogleEmail && customGoogleEmail.includes('@')) {
                      handleGoogleSelector(customGoogleEmail);
                    } else {
                      alert('Masukkan alamat email Google yang valid!');
                    }
                  }}
                  className="px-4 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition active:scale-95 cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] text-right border-t border-slate-100">
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="text-xs font-extrabold text-slate-600 hover:text-slate-800 border border-slate-200 px-4 py-1.5 rounded-xl bg-white shadow-xs cursor-pointer"
              >
                Batal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
