import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { fetchFirstReachable } from '../utils/api';

type AuthRole = 'ADMIN' | 'DOCTOR' | 'USER';

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

type OfflineUser = {
  email: string;
  phone: string;
  password: string;
  role: AuthRole;
};

const OFFLINE_USERS: OfflineUser[] = [
  { email: 'admin.test@sabina.local', phone: '+962790000001', password: 'Admin12345!', role: 'ADMIN' },
  { email: 'doctor.test@sabina.local', phone: '+962790000002', password: 'Doctor12345!', role: 'DOCTOR' },
  { email: 'user.test@sabina.local', phone: '+962790000003', password: 'User12345!', role: 'USER' }
];

export default function LoginPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const completeLogin = (role: AuthRole, email: string) => {
    localStorage.setItem('auth_role', role);
    localStorage.setItem('auth_email', email);
    window.dispatchEvent(new Event('auth-changed'));

    if (role === 'ADMIN') {
      navigateTo('/admin');
      return;
    }
    if (role === 'DOCTOR') {
      navigateTo('/dashboard');
      return;
    }
    navigateTo('/home');
  };

  const tryOfflineLogin = (): boolean => {
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;
    const match = OFFLINE_USERS.find((user) => {
      const identifierMatches = loginMethod === 'email' ? user.email === email : user.phone === phone;
      return identifierMatches && user.password === password;
    });
    if (!match) {
      return false;
    }
    localStorage.removeItem('auth_token');
    setInfoMessage(isAr ? 'تم تسجيل الدخول بوضع تجريبي (بدون API).' : 'Logged in using demo mode (API offline).');
    completeLogin(match.role, match.email);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      const payload =
        loginMethod === 'email'
          ? { email: formData.email.trim().toLowerCase(), password: formData.password }
          : { phone: formData.phone.trim(), password: formData.password };

      const loginResponse = await fetchFirstReachable('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!loginResponse.ok) {
        const responseBody = await loginResponse.json().catch(() => null);
        const detail = typeof responseBody?.detail === 'string' ? responseBody.detail : null;
        throw new Error(detail ?? `Login failed (${loginResponse.status})`);
      }

      const tokenPayload = (await loginResponse.json()) as TokenResponse;
      const token = tokenPayload.access_token;
      localStorage.setItem('auth_token', token);

      const meResponse = await fetchFirstReachable('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meResponse.ok) {
        throw new Error('Unable to load user profile after login');
      }

      const mePayload = (await meResponse.json()) as MeResponse;
      completeLogin(mePayload.role, mePayload.email ?? '');
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && /failed to fetch|network|failed to reach api/i.test(error.message));
      if (isNetworkError && tryOfflineLogin()) {
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google Login Clicked');
    // TODO: Implement Google OAuth
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
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
              {isAr ? 'اختر طريقة تسجيل الدخول المفضلة لديك' : 'Choose your preferred login method'}
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                loginMethod === 'email' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isAr ? 'البريد الإلكتروني' : 'Email'}
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                loginMethod === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isAr ? 'رقم الهاتف' : 'Phone'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMethod === 'email' ? (
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
            ) : (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                  {isAr ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+962 7X XXX XXXX"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primaryDark">
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot?'}
                </button>
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
              className="w-full py-4 bg-primary hover:bg-primaryDark text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
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
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-50"
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
            <button 
              onClick={() => navigateTo('/signup')}
              className="text-primary hover:text-primaryDark transition-colors"
            >
              {isAr ? 'سجل الآن' : 'Create Account'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
