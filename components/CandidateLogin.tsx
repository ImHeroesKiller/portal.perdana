import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getClientAuth } from '../services/firebase';

export const CandidateLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getClientAuth(), provider);
      navigate('/candidate/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Gagal login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Portal Kandidat</h1>
        <p className="text-gray-500 text-sm mb-8">Masuk untuk melihat progres lamaran Anda.</p>
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
        >
          {loading ? 'Memproses...' : 'Masuk dengan Google'}
        </button>
      </div>
    </div>
  );
};
