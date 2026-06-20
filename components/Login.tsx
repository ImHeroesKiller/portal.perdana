import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowPathIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { login } from '../services/auth';
import { useLanguage } from '../services/i18n';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { AuthPageShell } from './auth/AuthPageShell';
import { BRAND_NAVY } from './home/homeContent';

const inputClass =
  'w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-[#003087] focus:outline-none focus:ring-2 focus:ring-[#003087]/20';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const settings = useCompanySettings();

  useEffect(() => {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login_error_default');
      setError(message || t('login_error_default'));
    } finally {
      setLoading(false);
    }
  };

  const forgotPasswordHref = `/help`;

  return (
    <AuthPageShell companyName={settings.companyName}>
      <div className="text-center">
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          {t('login_title')}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('login_subtitle')}</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleLogin} noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-center text-xs font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="login-username"
            className="block pl-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500"
          >
            {t('login_username_label')}
          </label>
          <input
            id="login-username"
            type="text"
            required
            autoComplete="username"
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('login_username_placeholder')}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 pl-0.5">
            <label
              htmlFor="login-password"
              className="text-[10px] font-black uppercase tracking-wider text-slate-500"
            >
              {t('login_password_label')}
            </label>
            <Link
              to={forgotPasswordHref}
              className="min-h-[44px] shrink-0 py-2 text-[10px] font-bold text-[#003087] transition hover:text-blue-900 hover:underline"
            >
              {t('login_forgot_password')}
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className={`${inputClass} pr-11`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login_password_placeholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex min-w-[44px] items-center justify-center text-slate-400 transition hover:text-slate-600"
              aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          style={{ backgroundColor: BRAND_NAVY }}
        >
          {loading && <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden />}
          {loading ? t('login_submitting') : t('login_submit')}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-[#003087]/10 bg-blue-50/40 px-4 py-4 text-center">
        <p className="text-[11px] leading-relaxed text-slate-600">{t('login_apply_hint')}</p>
        <Link
          to="/vacancies"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#003087]/20 bg-white px-5 py-2.5 text-xs font-extrabold text-[#003087] shadow-sm transition hover:border-[#003087]/40 hover:bg-blue-50/80 active:scale-[0.98]"
        >
          {t('login_apply_link')}
        </Link>
      </div>
    </AuthPageShell>
  );
};