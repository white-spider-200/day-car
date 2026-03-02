import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { ApiError, apiJson } from '../utils/api';
import { navigateTo, redirectToRoleHome, saveAuthSession, type AuthRole } from '../utils/auth';

type TokenResponse = {
  access_token: string;
  token_type: string;
};

type MeResponse = {
  id: string;
  email: string | null;
  phone: string | null;
  role: AuthRole;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function LoginPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const loadProfileAndRedirect = async (token: string) => {
    const mePayload = await apiJson<MeResponse>(
      '/auth/me',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      false,
      isAr ? 'تعذر تحميل بيانات المستخدم' : 'Unable to load user profile after login'
    );

    saveAuthSession({
      token,
      role: mePayload.role,
      email: mePayload.email ?? formData.email.trim().toLowerCase()
    });

    redirectToRoleHome(mePayload.role);
  };

  const handlePasswordLogin = async () => {
    const tokenPayload = await apiJson<TokenResponse>(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), password: formData.password })
      },
      false,
      isAr ? 'فشل تسجيل الدخول' : 'Login failed'
    );

    await loadProfileAndRedirect(tokenPayload.access_token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!formData.email.trim()) {
      setErrorMessage(isAr ? 'أدخل البريد الإلكتروني.' : 'Enter your email address.');
      return;
    }

    if (!formData.password) {
      setErrorMessage(isAr ? 'أدخل كلمة المرور.' : 'Enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await handlePasswordLogin();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setErrorMessage(
            isAr
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
              : 'Invalid email or password'
          );
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage(error instanceof Error ? error.message : isAr ? 'فشل تسجيل الدخول' : 'Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setInfoMessage(
      isAr
        ? 'تسجيل الدخول عبر Google غير متاح حالياً. استخدم البريد الإلكتروني وكلمة المرور حالياً.'
        : 'Google sign-in is not available yet. Use email and password for now.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 sm:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'تسجيل الدخول' : 'Welcome Back'}
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              {isAr ? 'سجّل الدخول إلى حسابك' : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary hover:bg-primaryDark text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (isAr ? 'جاري تسجيل الدخول...' : 'Signing in...') : isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>

            {errorMessage && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            {infoMessage && (
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {infoMessage}
              </p>
            )}
          </form>

          <div className="relative my-10 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-4 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isAr ? 'أو' : 'Or continue with'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
            title={isAr ? 'قريباً' : 'Coming soon'}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <p className="mt-10 text-center text-sm font-bold text-slate-500">
            {isAr ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <button onClick={() => navigateTo('/signup')} className="text-primary hover:text-primaryDark transition-colors">
              {isAr ? 'سجل الآن' : 'Create Account'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
