import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function SignupPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  
  const [role, setRole] = useState<'USER' | 'DOCTOR'>('USER');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signing up as:', role, formData);
    // TODO: Call API
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

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
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
              className="w-full py-4 bg-primary hover:bg-primaryDark text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
            >
              {isAr ? 'إنشاء الحساب' : 'Create Account'}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-bold text-slate-500">
            {isAr ? 'لديك حساب بالفعل؟' : "Already have an account?"}{' '}
            <button 
              onClick={() => navigateTo('/login')}
              className="text-primary hover:text-primaryDark transition-colors"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
