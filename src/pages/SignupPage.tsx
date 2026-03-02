import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { ApiError, apiJson } from '../utils/api';
import { navigateTo, redirectToRoleHome, saveAuthSession, type AuthRole } from '../utils/auth';

type RegisterResponse = {
  id: string;
  email: string | null;
  phone: string | null;
  role: AuthRole;
  status: string;
  created_at: string;
  updated_at: string;
};

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

function normalizePhone(phone: string): string {
  return phone.replace(/[\s()-]/g, '');
}

export default function SignupPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [role, setRole] = useState<'USER' | 'DOCTOR'>('USER');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    const email = formData.email.trim().toLowerCase();
    const phone = normalizePhone(formData.phone.trim());

    if (!email && !phone) {
      setIsSubmitting(false);
      setErrorMessage(isAr ? 'أدخل البريد الإلكتروني أو رقم الهاتف.' : 'Provide email or phone number.');
      return;
    }

    try {
      await apiJson<RegisterResponse>(
        '/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email || undefined,
            phone: phone || undefined,
            password: formData.password,
            role
          })
        },
        false,
        isAr ? 'فشل إنشاء الحساب' : 'Failed to create account'
      );

      const loginPayload = email
        ? { email, password: formData.password }
        : { phone, password: formData.password };

      const tokenPayload = await apiJson<TokenResponse>(
        '/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginPayload)
        },
        false,
        isAr ? 'فشل تسجيل الدخول' : 'Login failed'
      );

      const mePayload = await apiJson<MeResponse>(
        '/auth/me',
        {
          headers: {
            Authorization: `Bearer ${tokenPayload.access_token}`
          }
        },
        false,
        isAr ? 'تعذر تحميل بيانات المستخدم' : 'Unable to load user profile'
      );

      saveAuthSession({
        token: tokenPayload.access_token,
        role: mePayload.role,
        email: mePayload.email ?? email
      });

      setInfoMessage(isAr ? 'تم إنشاء الحساب بنجاح.' : 'Account created successfully.');
      redirectToRoleHome(mePayload.role);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrorMessage(isAr ? 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل.' : 'Email or phone is already registered.');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage(error instanceof Error ? error.message : isAr ? 'فشل إنشاء الحساب' : 'Signup failed');
      }
    } finally {
      setIsSubmitting(false);
    }
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
              {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              {isAr ? 'انضم إلى مجتمعنا الطبي اليوم' : 'Join our medical community today'}
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setRole('USER')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                role === 'USER' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isAr ? 'مريض' : 'Patient'}
            </button>
            <button
              onClick={() => setRole('DOCTOR')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                role === 'DOCTOR' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isAr ? 'طبيب' : 'Doctor'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email Address (optional)'}
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                {isAr ? 'رقم الهاتف (اختياري)' : 'Phone Number (optional)'}
              </label>
              <input
                type="tel"
                placeholder="+962790000000"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                minLength={8}
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
              {isSubmitting
                ? isAr
                  ? 'جاري إنشاء الحساب...'
                  : 'Creating account...'
                : isAr
                  ? 'إنشاء الحساب'
                  : 'Create Account'}
            </button>

            {errorMessage && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            {infoMessage && (
              <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {infoMessage}
              </p>
            )}
          </form>

          <p className="mt-10 text-center text-sm font-bold text-slate-500">
            {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <button onClick={() => navigateTo('/login')} className="text-primary hover:text-primaryDark transition-colors">
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
